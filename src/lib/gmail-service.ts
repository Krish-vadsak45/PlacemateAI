import { google } from "googleapis"

export interface GmailAttachmentMeta {
  filename: string
  mimeType: string
  size: number
  attachmentId: string
}

export interface GmailMessage {
  id: string
  from: string
  subject: string
  body: string
  to?: string[]
  date: Date
  attachments?: GmailAttachmentMeta[]
}

export class GmailService {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
      const to = this.getHeader(headers, "To")?.split(",").map((t: string) => t.trim())
      const date = new Date(parseInt(message.internalDate || Date.now()))

      // Extract email body
      const body = this.extractBody(message.payload)

      // Extract attachment metadata
      const attachments = this.extractAttachments(message.payload)

      return {
        id: message.id || "",
        from,
        subject,
        body,
        to,
        date,
        attachments,
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
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private getHeader(headers: any[], name: string): string | null {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const header = headers.find((h: any) => h.name.toLowerCase() === name.toLowerCase())
    return header?.value || null
  }

  /**
   * Extract email body from message payload
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
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

  /**
   * Traverse email payload to discover all attached files
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private extractAttachments(payload: any): GmailAttachmentMeta[] {
    const attachments: GmailAttachmentMeta[] = []
    if (!payload) return attachments

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const traverse = (part: any) => {
      if (part.filename && part.body?.attachmentId) {
        attachments.push({
          filename: part.filename,
          mimeType: part.mimeType || "application/octet-stream",
          size: part.body.size || 0,
          attachmentId: part.body.attachmentId,
        })
      }
      if (part.parts && Array.isArray(part.parts)) {
        part.parts.forEach(traverse)
      }
    }

    traverse(payload)
    return attachments
  }

  /**
   * Download a specific attachment's binary buffer from Gmail
   */
  async getAttachment(messageId: string, attachmentId: string): Promise<Buffer> {
    try {
      const response = await this.gmail.users.messages.attachments.get({
        userId: "me",
        messageId,
        id: attachmentId,
      })

      const base64Data = response.data.data
      if (!base64Data) {
        throw new Error("No data returned for attachment from Gmail")
      }

      return Buffer.from(base64Data, "base64url")
    } catch (error) {
      console.error(`Error downloading attachment ${attachmentId}:`, error)
      throw error
    }
  }
}

/**
 * Factory function to create Gmail service
 */
export function createGmailService(accessToken: string): GmailService {
  return new GmailService(accessToken)
}
