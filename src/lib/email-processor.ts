import { createGmailService, GmailMessage } from "./gmail-service"
import { createEmailDetectionService, EmailData } from "./email-detection"
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
   * Extract company name and job role from email subject
   */
  private extractFromSubject(subject: string): { companyName: string; jobRole: string } {
    // Common patterns for placement cell emails
    const patterns = [
      // Pattern: (BTech/MTech/MCA - Role) Company Name
      /\([^)]+\)\s*(.+)$/,
      // Pattern: Company Name - Role
      /^(.+)\s*-\s*(.+)$/,
      // Pattern: Role at Company Name
      /^(.+)\s+at\s+(.+)$/i,
    ]

    for (const pattern of patterns) {
      const match = subject.match(pattern)
      if (match) {
        // Try to identify which part is company name vs job role
        const parts = match.slice(1)
        const companyPart = parts.find(p => 
          p.includes('Pvt') || p.includes('Ltd') || p.includes('Inc') || 
          p.includes('Technologies') || p.includes('Solutions') || 
          p.includes('Company') || p.includes('Corp')
        )
        
        if (companyPart) {
          const jobRolePart = parts.find(p => p !== companyPart)
          return {
            companyName: companyPart.trim(),
            jobRole: jobRolePart?.trim() || 'Internship'
          }
        }
      }
    }

    // Fallback: if subject contains parentheses, extract content after parentheses
    const parenMatch = subject.match(/\([^)]+\)\s*(.+)$/)
    if (parenMatch) {
      return {
        companyName: parenMatch[1].trim(),
        jobRole: 'Internship'
      }
    }

    return { companyName: "Unknown", jobRole: "To be determined" }
  }

  /**
   * Save placement email to database
   */
  private async savePlacementEmail(email: GmailMessage, confidence: number, reason: string): Promise<void> {
    try {
      // Check if placement already exists
      const existingPlacement = await Placement.findOne({ emailId: email.id })
      
      if (existingPlacement) {
        console.log(`Placement email already exists: ${email.id}`)
        return
      }

      // Extract basic info from subject
      const { companyName, jobRole } = this.extractFromSubject(email.subject)

      // Create new placement entry
      await Placement.create({
        userId: this.userId,
        emailId: email.id,
        companyName,
        jobRole,
        extractedByAI: false,
        extractionConfidence: confidence,
        emailFrom: email.from,
        emailSubject: email.subject,
        emailBody: email.body,
        emailDate: email.date,
        detectionReason: reason,
        status: "NEW",
      })

      console.log(`Saved placement email: ${email.subject} (confidence: ${confidence})`)
    } catch (error) {
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
