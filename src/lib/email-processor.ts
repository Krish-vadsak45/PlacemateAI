import mongoose from "mongoose"
import { createGmailService, GmailMessage, GmailService } from "./gmail-service"
import { createEmailDetectionService, EmailData } from "./email-detection"
import { createAIExtractionService, ExtractionResult } from "./ai-extraction"
import { createAISummaryService } from "./ai-summary"
import { createJobMatcher } from "./job-matcher"
import { uploadAttachmentToGridFS } from "./gridfs"
import { attachmentParser } from "./attachment-parser"
import connectDB from "./mongodb"
import User from "@/models/User"
import Placement from "@/models/Placement"

export interface ProcessingResult {
  success: boolean
  isPlacementEmail: boolean
  confidence: number
  reason: string
  error?: string
}

/**
 * Email processing pipeline
 * Fetches email, detects if it's placement-related, and processes accordingly
 */
export class EmailProcessor {
  private userId: string

  constructor(userId: string) {
    this.userId = userId
  }

  /**
   * Process an email from Gmail
   */
  async processEmail(emailId: string): Promise<ProcessingResult> {
    try {
      await connectDB()

      // Fetch user to get access token and placement cell email
      const user = await User.findById(this.userId)
      if (!user) {
        return {
          success: false,
          isPlacementEmail: false,
          confidence: 0,
          reason: "User not found",
          error: "User not found",
        }
      }

      const accessToken = user.googleTokens?.accessToken
      const placementCellEmail = user.profile?.placementCellEmail

      if (!accessToken) {
        return {
          success: false,
          isPlacementEmail: false,
          confidence: 0,
          reason: "No Gmail access token",
          error: "No Gmail access token",
        }
      }

      if (!placementCellEmail) {
        return {
          success: false,
          isPlacementEmail: false,
          confidence: 0,
          reason: "Placement cell email not configured",
          error: "Placement cell email not configured",
        }
      }

      // Fetch email from Gmail
      const gmailService = createGmailService(accessToken)
      const email = await gmailService.getEmail(emailId)

      if (!email) {
        return {
          success: false,
          isPlacementEmail: false,
          confidence: 0,
          reason: "Failed to fetch email",
          error: "Failed to fetch email",
        }
      }

      // Detect if it's a placement email
      const detectionService = createEmailDetectionService(placementCellEmail)
      const emailData: EmailData = {
        from: email.from,
        subject: email.subject,
        body: email.body,
        to: email.to,
      }

      const detectionResult = detectionService.isPlacementEmail(emailData)

      // If it's a placement email, save it to database
      if (detectionResult.isPlacementEmail) {
        await this.savePlacementEmail(email, detectionResult.confidence, detectionResult.reason, gmailService)
      }

      return {
        success: true,
        isPlacementEmail: detectionResult.isPlacementEmail,
        confidence: detectionResult.confidence,
        reason: detectionResult.reason,
      }
    } catch (error) {
      console.error("Error processing email:", error)
      return {
        success: false,
        isPlacementEmail: false,
        confidence: 0,
        reason: "Processing error",
        error: error instanceof Error ? error.message : "Unknown error",
      }
    }
  }

  /**
   * Save placement email to database using upsert to handle duplicates
   */
  private async savePlacementEmail(
    email: GmailMessage,
    confidence: number,
    reason: string,
    gmailService: GmailService
  ): Promise<void> {
    try {
      // Process email attachments if any
      const savedAttachments: Array<{
        id: string
        name: string
        url: string
        type: string
      }> = []
      let combinedContent = email.body

      if (email.attachments && email.attachments.length > 0) {
        console.log(`Processing ${email.attachments.length} attachment(s) for email ${email.id}...`)
        for (const att of email.attachments) {
          try {
            // Filter out tiny tracker icons (< 2KB unless document)
            if (att.size < 2048 && !att.filename.match(/\.(pdf|docx|doc|xlsx|xls|csv|txt)$/i)) {
              continue
            }
            // Skip excessively large files (> 25MB)
            if (att.size > 25 * 1024 * 1024) {
              console.log(`Skipping attachment ${att.filename} exceeding size limit (${att.size} bytes)`)
              continue
            }

            console.log(`Downloading attachment: ${att.filename} (${att.mimeType}, ${att.size} bytes)`)
            const buffer = await gmailService.getAttachment(email.id, att.attachmentId)

            // 1. Upload to MongoDB GridFS
            const gridFsId = await uploadAttachmentToGridFS(
              buffer,
              att.filename,
              att.mimeType,
              {
                emailId: email.id,
                userId: this.userId,
              }
            )

            savedAttachments.push({
              id: gridFsId,
              name: att.filename,
              url: `/api/placements/attachments/${gridFsId}`,
              type: att.mimeType,
            })

            // 2. Extract text from PDF, DOCX, XLSX, etc.
            const parsedDoc = await attachmentParser.extractText(
              buffer,
              att.mimeType,
              att.filename
            )

            if (parsedDoc.text && parsedDoc.text.trim()) {
              console.log(
                `Extracted ${parsedDoc.text.length} chars from ${att.filename} (${parsedDoc.fileType})`
              )
              combinedContent += `\n\n=== ATTACHMENT [${att.filename}] CONTENT ===\n${parsedDoc.text.slice(0, 15000)}`
            }
          } catch (attError) {
            console.error(`Failed to process attachment ${att.filename}:`, attError)
          }
        }
      }

      // Extract details using AI with fallback chain (using enriched content including attachments)
      const aiExtractionService = createAIExtractionService()
      const extractionResult: ExtractionResult = await aiExtractionService.extractDetails({
        subject: email.subject,
        body: combinedContent,
        from: email.from
      })

      console.log(`AI Extraction Result:`, {
        provider: extractionResult.provider,
        confidence: extractionResult.confidence,
        companyName: extractionResult.companyName,
        jobRole: extractionResult.jobRole
      })

      // Auto-generate AI summary for the placement
      let aiSummary: string | undefined = undefined
      try {
        const aiSummaryService = createAISummaryService()
        const summaryResult = await aiSummaryService.generateSummary({
          subject: email.subject,
          body: combinedContent,
          from: email.from
        })
        aiSummary = summaryResult.summary
        console.log(`AI Summary generated successfully, length: ${aiSummary?.length || 0} characters`)
      } catch (summaryError) {
        console.error("Failed to auto-generate AI summary:", summaryError)
        // Don't fail the entire process if summary generation fails
      }

      // Build update document - only update AI-extracted fields and email content
      // Preserve user-modified fields: status, notes, applicationHistory, calendarEventId
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const updateDoc: any = {
        $set: {
          companyName: extractionResult.companyName,
          jobRole: extractionResult.jobRole,
          package: extractionResult.package,
          location: extractionResult.location,
          applicationDeadline: extractionResult.applicationDeadline,
          assessmentDate: extractionResult.assessmentDate,
          interviewDate: extractionResult.interviewDate,
          applicationLink: extractionResult.applicationLink,
          extractedByAI: extractionResult.provider !== "regex",
          extractionProvider: extractionResult.provider,
          extractionConfidence: extractionResult.confidence,
          emailFrom: email.from,
          emailSubject: email.subject,
          emailBody: email.body,
          emailDate: email.date,
          detectionReason: reason,
          updatedAt: new Date(),
        },
        $setOnInsert: {
          userId: this.userId,
          emailId: email.id,
          status: "NEW",
          notes: [],
          attachments: savedAttachments,
          applicationHistory: [],
          calendarEventId: null,
          reminderSettings: {
            deadlineReminder: true,
            interviewReminder: true
          },
        }
      }

      // Merge new attachments into existing placement
      if (savedAttachments.length > 0) {
        updateDoc.$addToSet = {
          attachments: { $each: savedAttachments }
        }
      }

      // Only update AI summary if it was generated successfully
      if (aiSummary) {
        updateDoc.$set.aiSummary = aiSummary
      }

      // Add job requirements if extracted
      if (extractionResult.jobRequirements) {
        updateDoc.$set.jobRequirements = extractionResult.jobRequirements
      }

      // Perform upsert operation
      const placement = await Placement.findOneAndUpdate(
        { emailId: email.id },
        updateDoc,
        {
          upsert: true,
          new: true,
          runValidators: true
        }
      )

      const isNew = !placement.createdAt || placement.createdAt.getTime() === placement.updatedAt.getTime()

      console.log(`${isNew ? 'Created new' : 'Updated existing'} placement email: ${email.subject} (provider: ${extractionResult.provider}, confidence: ${extractionResult.confidence})`)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      console.log(`Placement ${isNew ? 'created' : 'updated'} with aiSummary: ${!!(placement as any).aiSummary}`)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      if ((placement as any).aiSummary) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        console.log(`Summary length in DB: ${(placement as any).aiSummary.length} characters`)
      }

      // Calculate and save match score
      try {
        const jobMatcher = createJobMatcher()
        const matchResult = await jobMatcher.calculateMatchScore(
          new mongoose.Types.ObjectId(this.userId),
          placement
        )

        await Placement.findByIdAndUpdate(
          placement._id,
          {
            $set: {
              matchScore: matchResult.score,
              matchBreakdown: matchResult.breakdown
            }
          }
        )

        console.log(`Match score calculated: ${matchResult.score}/100`)
      } catch (matchError) {
        console.error("Failed to calculate match score:", matchError)
        // Don't fail the entire process if matching fails
      }
    } catch (error) {
      // Handle duplicate key error (MongoDB error code 11000)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      if (error instanceof Error && 'code' in error && (error as any).code === 11000) {
        console.log(`Duplicate email detected: ${email.id}, skipping...`)
        return
      }
      console.error("Error saving placement email:", error)
      throw error
    }
  }
}

/**
 * Factory function to create email processor
 */
export function createEmailProcessor(userId: string): EmailProcessor {
  return new EmailProcessor(userId)
}
