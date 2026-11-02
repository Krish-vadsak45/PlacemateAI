import { createGmailService } from "./gmail-service"
import { createEmailDetectionService, EmailData } from "./email-detection"
import { emailQueue, EmailProcessingJob } from "./queue"
import connectDB from "./mongodb"
import User, { IUser } from "@/models/User"
import Placement from "@/models/Placement"

interface PollingConfig {
  intervalMinutes: number
  batchSize: number
  enabled: boolean
}

const DEFAULT_CONFIG: PollingConfig = {
  intervalMinutes: 5, // Poll every 5 minutes
  batchSize: 50, // Fetch 50 emails at a time
  enabled: process.env.GMAIL_POLLING_ENABLED === 'true',
}

export class GmailPoller {
  private config: PollingConfig
  private intervalId: NodeJS.Timeout | null = null
  private isRunning = false

  constructor(config: Partial<PollingConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config }
  }

  /**
   * Start the polling service
   */
  start() {
    if (this.isRunning) {
      console.log('Gmail poller is already running')
      return
    }

    if (!this.config.enabled) {
      console.log('Gmail polling is disabled')
      return
    }

    console.log(`Starting Gmail poller with interval: ${this.config.intervalMinutes} minutes`)
    this.isRunning = true

    // Run immediately on start
    this.poll()

    // Set up interval
    this.intervalId = setInterval(() => {
      this.poll()
    }, this.config.intervalMinutes * 60 * 1000)
  }

  /**
   * Stop the polling service
   */
  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId)
      this.intervalId = null
    }
    this.isRunning = false
    console.log('Gmail poller stopped')
  }

  /**
   * Ensure user has a valid access token, auto-refreshing if expired
   */
  private async getValidAccessToken(user: IUser): Promise<string | null> {
    const accessToken = user.googleTokens?.accessToken
    const refreshToken = user.googleTokens?.refreshToken

    if (!refreshToken && !accessToken) {
      return null
    }

    if (refreshToken && process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
      try {
        // Quick validation check
        if (accessToken) {
          const testRes = await fetch(`https://www.googleapis.com/oauth2/v1/tokeninfo?access_token=${accessToken}`)
          if (testRes.ok) {
            return accessToken
          }
        }

        // Token is expired, refresh it
        console.log(`[GmailPoller] Access token expired for ${user.email}, refreshing via OAuth...`)
        const refreshRes = await fetch('https://oauth2.googleapis.com/token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: new URLSearchParams({
            client_id: process.env.GOOGLE_CLIENT_ID,
            client_secret: process.env.GOOGLE_CLIENT_SECRET,
            refresh_token: refreshToken,
            grant_type: 'refresh_token',
          }),
        })

        if (refreshRes.ok) {
          const data = await refreshRes.json()
          if (data.access_token) {
            await User.findByIdAndUpdate(user._id, {
              'googleTokens.accessToken': data.access_token,
            })
            console.log(`[GmailPoller] Successfully refreshed access token for ${user.email}`)
            return data.access_token
          }
        } else {
          console.error(`[GmailPoller] Failed to refresh token for ${user.email}:`, await refreshRes.text())
        }
      } catch (err) {
        console.error(`[GmailPoller] Error in token refresh for ${user.email}:`, err)
      }
    }

    return accessToken || null
  }

  /**
   * Poll Gmail for new emails
   */
  private async poll() {
    try {
      console.log('Starting Gmail poll...')
      await connectDB()

      // Get users who have placementCellEmail or Gmail watch enabled with Google tokens
      const users = await User.find({
        $and: [
          {
            $or: [
              { "googleTokens.gmailWatchEnabled": true },
              { "profile.placementCellEmail": { $exists: true, $ne: "" } },
            ],
          },
          {
            $or: [
              { "googleTokens.accessToken": { $exists: true } },
              { "googleTokens.refreshToken": { $exists: true } },
            ],
          },
        ],
      })

      console.log(`Found ${users.length} candidate user(s) to poll for placement emails`)

      for (const user of users) {
        await this.pollUser(user)
      }

      console.log('Gmail poll completed')
    } catch (error) {
      console.error('Error in Gmail poll:', error)
    }
  }

  /**
   * Poll emails for a specific user
   */
  private async pollUser(user: IUser) {
    try {
      const placementCellEmail = user.profile?.placementCellEmail

      if (!placementCellEmail) {
        console.log(`[GmailPoller] User ${user.email} has no placement cell email configured in profile`)
        return
      }

      const accessToken = await this.getValidAccessToken(user)
      if (!accessToken) {
        console.log(`[GmailPoller] User ${user.email} missing valid Google access token / refresh token`)
        return
      }

      console.log(`[GmailPoller] Polling emails for user: ${user.email} (filtering sender: "${placementCellEmail}")`)

      // Get Gmail service
      const gmailService = createGmailService(accessToken)

      // Fetch recent emails
      const emails = await gmailService.getRecentEmails(this.config.batchSize)
      console.log(`[GmailPoller] Fetched ${emails.length} recent emails from INBOX for ${user.email}`)

      // Get already processed emailIds for this user
      const processedEmails = await Placement.find({
        userId: user._id,
        emailId: { $exists: true },
      }).select('emailId')

      const processedEmailIds = new Set(processedEmails.map((p) => p.emailId))

      // Detect placement emails
      const detectionService = createEmailDetectionService(placementCellEmail)

      for (const email of emails) {
        // Skip if already processed
        if (processedEmailIds.has(email.id)) {
          continue
        }

        // Check if it's a placement email
        const emailData: EmailData = {
          from: email.from,
          subject: email.subject,
          body: email.body,
          to: email.to,
        }

        const detectionResult = detectionService.isPlacementEmail(emailData)

        if (detectionResult.isPlacementEmail) {
          console.log(`[GmailPoller] ✅ MATCHED: ${email.id} | From: "${email.from}" | Subject: "${email.subject}" (${detectionResult.reason})`)

          // Add to queue for processing
          const jobData: EmailProcessingJob = {
            userId: user._id.toString(),
            emailId: email.id,
          }

          try {
            await emailQueue.add('process-email', jobData, {
              jobId: `${user._id.toString()}-${email.id}`,
              removeOnComplete: false,
              removeOnFail: false,
            })
            console.log(`[GmailPoller] Successfully queued email ${email.id} for AI extraction`)
          } catch (error) {
            console.error(`[GmailPoller] Error adding email ${email.id} to queue:`, error)
          }
        }
      }

      console.log(`[GmailPoller] Polling completed for user ${user.email}`)
    } catch (error) {
      console.error(`[GmailPoller] Error polling user ${user.email}:`, error)
    }
  }
}

// Singleton instance
let pollerInstance: GmailPoller | null = null

export function getGmailPoller(): GmailPoller {
  if (!pollerInstance) {
    pollerInstance = new GmailPoller()
  }
  return pollerInstance
}

export function startGmailPoller() {
  const poller = getGmailPoller()
  poller.start()
}

export function stopGmailPoller() {
  const poller = getGmailPoller()
  poller.stop()
}
