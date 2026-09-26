export interface EmailDetectionResult {
  isPlacementEmail: boolean
  confidence: number
  reason: string
}

export interface EmailData {
  from: string
  subject: string
  body: string
  to?: string[]
}

/**
 * Zero-cost email detection service
 * Uses simple string matching and keyword filtering
 */
export class EmailDetectionService {
  private placementCellEmail: string
  private placementKeywords: string[]

  constructor(placementCellEmail: string) {
    this.placementCellEmail = placementCellEmail.toLowerCase()
    this.placementKeywords = [
      "placement",
      "job",
      "opportunity",
      "recruitment",
      "hiring",
      "career",
      "internship",
      "apply",
      "application",
      "interview",
      "campus",
      "drive",
      "position",
      "opening",
      "vacancy",
    ]
  }

  /**
   * Check if an email is a placement notification
   * Primary filter: Sender matches placement cell email
   * Secondary filter: Domain match (same domain as placement cell)
   * Tertiary filter: Keyword matching in subject/body
   */
  isPlacementEmail(email: EmailData): EmailDetectionResult {
    const fromEmail = this.extractEmail(email.from).toLowerCase()
    
    // Exclude Google Calendar notifications
    if (fromEmail.includes('calendar-notification@google.com') || 
        fromEmail.includes('calendar.google.com') ||
        email.from.toLowerCase().includes('google calendar')) {
      return {
        isPlacementEmail: false,
        confidence: 0,
        reason: "Google Calendar notification excluded",
      }
    }
    
    // Primary filter: Direct match with placement cell email
    if (fromEmail === this.placementCellEmail) {
      return {
        isPlacementEmail: true,
        confidence: 1.0,
        reason: "Sender matches placement cell email",
      }
    }

    // Secondary filter: Domain match (same domain as placement cell)
    const placementDomain = this.extractDomain(this.placementCellEmail)
    const senderDomain = this.extractDomain(fromEmail)
    
    if (placementDomain && senderDomain && placementDomain === senderDomain) {
      // Check for placement keywords if same domain
      const keywordScore = this.checkKeywords(email.subject + " " + email.body)
      if (keywordScore > 0.3) {
        return {
          isPlacementEmail: true,
          confidence: 0.8 + (keywordScore * 0.2),
          reason: "Same domain as placement cell with placement keywords",
        }
      }
    }

    // Tertiary filter: Keyword matching only (lower confidence)
    const keywordScore = this.checkKeywords(email.subject + " " + email.body)
    if (keywordScore > 0.5) {
      return {
        isPlacementEmail: true,
        confidence: keywordScore,
        reason: "Contains placement-related keywords",
      }
    }

    return {
      isPlacementEmail: false,
      confidence: 0,
      reason: "Does not match placement email criteria",
    }
  }

  /**
   * Check for placement keywords in text
   * Returns confidence score (0-1)
   */
  private checkKeywords(text: string): number {
    const lowerText = text.toLowerCase()
    let matchCount = 0

    for (const keyword of this.placementKeywords) {
      if (lowerText.includes(keyword)) {
        matchCount++
      }
    }

    // Calculate confidence based on keyword matches
    const confidence = matchCount / this.placementKeywords.length
    return Math.min(confidence * 2, 1) // Boost confidence slightly
  }

  /**
   * Extract email address from a string (handles "Name <email>" format)
   */
  private extractEmail(from: string): string {
    const emailMatch = from.match(/<([^>]+)>/) || from.match(/([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/)
    return emailMatch ? emailMatch[1] : from
  }

  /**
   * Extract domain from email address
   */
  private extractDomain(email: string): string | null {
    const match = email.match(/@([^@]+)$/)
    return match ? match[1] : null
  }
}

/**
 * Factory function to create email detection service
 */
export function createEmailDetectionService(placementCellEmail: string): EmailDetectionService {
  return new EmailDetectionService(placementCellEmail)
}
