import mongoose from "mongoose"
import { createGmailService, GmailMessage } from "./gmail-service"
import { createEmailDetectionService, EmailData } from "./email-detection"
import { createAIExtractionService, ExtractionResult } from "./ai-extraction"
import { createAISummaryService } from "./ai-summary"
import { createJobMatcher } from "./job-matcher"
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
        await this.savePlacementEmail(email, detectionResult.confidence, detectionResult.reason)
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
  private async savePlacementEmail(email: GmailMessage, confidence: number, reason: string): Promise<void> {
    try {
      // Extract details using AI with fallback chain
      const aiExtractionService = createAIExtractionService()
      const extractionResult: ExtractionResult = await aiExtractionService.extractDetails({
        subject: email.subject,
        body: email.body,
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
          body: email.body,
          from: email.from
        })
        aiSummary = summaryResult.summary
        console.log(`AI Summary generated successfully, length: ${aiSummary?.length || 0} characters`)
      } catch (summaryError) {
        console.error("Failed to auto-generate AI summary:", summaryError)
        // Don't fail the entire process if summary generation fails
      }

      // Build update document - only update AI-extracted fields and email content
      // Preserve user-modified fields: status, notes, attachments, applicationHistory, calendarEventId
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
          googleFormLink: extractionResult.googleFormLink,
          placementCellFormLink: extractionResult.placementCellFormLink,
          companyFormLink: extractionResult.companyFormLink,
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
          attachments: [],
          applicationHistory: [],
          calendarEventId: null,
          reminderSettings: {
            deadlineReminder: true,
            interviewReminder: true
          },
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
      console.log(`Placement ${isNew ? 'created' : 'updated'} with aiSummary: ${!!(placement as any).aiSummary}`)
      if ((placement as any).aiSummary) {
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
