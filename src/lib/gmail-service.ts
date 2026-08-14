import { google } from "googleapis"

export interface GmailMessage {
  id: string
  from: string
  subject: string
  body: string
  to?: string[]
  date: Date
}

export class GmailService {
  private gmail: any

  constructor(accessToken: string) {
    const auth = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET
    )
    auth.setCredentials({ access_token: accessToken })
    this.gmail = google.gmail({ version: "v1", auth })
  }

  /**
   * Fetch a specific email by ID
   */
  async getEmail(messageId: string): Promise<GmailMessage | null> {
    try {
      const response = await this.gmail.users.messages.get({
        userId: "me",
        id: messageId,
        format: "full",
      })

      const message = response.data
      const headers = message.payload?.headers || []

      const from = this.getHeader(headers, "From") || ""
      const subject = this.getHeader(headers, "Subject") || ""
      const to = this.getHeader(headers, "To")?.split(",").map(t => t.trim())
      const date = new Date(parseInt(message.internalDate || Date.now()))

      // Extract email body
      const body = this.extractBody(message.payload)

      return {
        id: message.id || "",
        from,
        subject,
        body,
        to,
        date,
      }
    } catch (error) {
      console.error("Error fetching email:", error)
      return null
    }
  }

  /**
   * Fetch recent emails from inbox
   */
  async getRecentEmails(maxResults: number = 10): Promise<GmailMessage[]> {
    try {
      const response = await this.gmail.users.messages.list({
        userId: "me",
        maxResults,
        labelIds: ["INBOX"],
      })

      const messages = response.data.messages || []
      const emails: GmailMessage[] = []

      for (const message of messages) {
        const email = await this.getEmail(message.id || "")
        if (email) {
          emails.push(email)
        }
      }

      return emails
    } catch (error) {
      console.error("Error fetching recent emails:", error)
      return []
    }
  }

  /**
   * Watch for Gmail push notifications
   */
  async watchGmail(topic: string): Promise<boolean> {
    try {
      await this.gmail.users.watch({
        userId: "me",
        requestBody: {
          topicName: topic,
          labelIds: ["INBOX"],
        },
      })
      return true
    } catch (error) {
      console.error("Error setting up Gmail watch:", error)
      return false
    }
  }

  /**
   * Stop watching for Gmail notifications
   */
  async stopWatching(): Promise<boolean> {
    try {
      await this.gmail.users.stop({
        userId: "me",
      })
      return true
    } catch (error) {
      console.error("Error stopping Gmail watch:", error)
      return false
    }
  }

  /**
   * Extract header value from email headers
   */
  private getHeader(headers: any[], name: string): string | null {
    const header = headers.find((h: any) => h.name.toLowerCase() === name.toLowerCase())
    return header?.value || null
  }

  /**
   * Extract email body from message payload
   */
  private extractBody(payload: any): string {
    if (!payload) return ""

    // If body is directly in payload
    if (payload.body?.data) {
      return this.decodeBase64(payload.body.data)
    }

    // If body is in parts (multipart)
    if (payload.parts) {
      let body = ""
      for (const part of payload.parts) {
        if (part.mimeType === "text/plain" || part.mimeType === "text/html") {
          body += this.decodeBase64(part.body?.data || "") + "\n"
        } else if (part.parts) {
          body += this.extractBody(part)
        }
      }
      return body
    }

    return ""
  }

  /**
   * Decode base64 encoded string
   */
  private decodeBase64(data: string): string {
    const decoded = Buffer.from(data, "base64url").toString("utf-8")
    return decoded
  }
}

/**
 * Factory function to create Gmail service
 */
export function createGmailService(accessToken: string): GmailService {
  return new GmailService(accessToken)
}
