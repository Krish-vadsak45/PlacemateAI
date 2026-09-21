import { createGmailService, GmailMessage } from "./gmail-service"
import { createEmailDetectionService, EmailData } from "./email-detection"
import { emailQueue, EmailProcessingJob } from "./queue"
import connectDB from "./mongodb"
import User from "@/models/User"
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
   * Poll Gmail for new emails
   */
  private async poll() {
    try {
      console.log('Starting Gmail poll...')
      await connectDB()

      // Get all users with Gmail watch enabled
      const users = await User.find({
        'googleTokens.gmailWatchEnabled': true,
        'googleTokens.accessToken': { $exists: true },
      })

      console.log(`Found ${users.length} users with Gmail watch enabled`)

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
  private async pollUser(user: any) {
    try {
      const accessToken = user.googleTokens?.accessToken
      const placementCellEmail = user.profile?.placementCellEmail

      if (!accessToken || !placementCellEmail) {
        console.log(`User ${user.email} missing access token or placement cell email`)
        return
      }

      console.log(`Polling emails for user: ${user.email}`)

      // Get Gmail service
      const gmailService = createGmailService(accessToken)

      // Fetch recent emails
      const emails = await gmailService.getRecentEmails(this.config.batchSize)
      console.log(`Fetched ${emails.length} recent emails for user ${user.email}`)

      // Get already processed emailIds for this user
      const processedEmails = await Placement.find({
        userId: user._id,
        emailId: { $exists: true },
      }).select('emailId')

      const processedEmailIds = new Set(processedEmails.map((p) => p.emailId))
      console.log(`Found ${processedEmailIds.size} already processed emails`)

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
          console.log(`Detected new placement email: ${email.id} - ${email.subject}`)

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
            console.log(`Added email ${email.id} to processing queue`)
          } catch (error) {
            console.error(`Error adding email ${email.id} to queue:`, error)
          }
        }
      }

      console.log(`Polling completed for user ${user.email}`)
    } catch (error) {
      console.error(`Error polling user ${user.email}:`, error)
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
