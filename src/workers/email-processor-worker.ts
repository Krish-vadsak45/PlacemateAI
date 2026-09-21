import 'dotenv/config'
import { Job } from 'bullmq'
import { createEmailProcessorWorker, EmailProcessingJob, emailQueue } from '@/lib/queue'
import { createEmailProcessor } from '@/lib/email-processor'
import connectDB from '@/lib/mongodb'
import Placement from '@/models/Placement'

// Email processing job handler
async function emailProcessorHandler(job: Job<EmailProcessingJob>) {
  const { userId, emailId, historyId } = job.data
  
  console.log(`Processing email job ${job.id}: userId=${userId}, emailId=${emailId}`)
  
  try {
    await connectDB()
    
    // Update processing status to PROCESSING
    await Placement.findOneAndUpdate(
      { emailId: emailId },
      {
        $set: {
          processingStatus: 'PROCESSING',
          lastProcessedAt: new Date(),
        },
        $inc: { processingAttempts: 1 },
      },
      { upsert: false }
    )
    
    // Process the email
    const processor = createEmailProcessor(userId)
    const result = await processor.processEmail(emailId)
    
    // Update processing status to COMPLETED
    await Placement.findOneAndUpdate(
      { emailId: emailId },
      {
        $set: {
          processingStatus: 'COMPLETED',
          lastProcessedAt: new Date(),
          processingError: null,
        },
      }
    )
    
    console.log(`Email processing completed for job ${job.id}:`, result)
    // Don't return result - worker handlers should return void
  } catch (error) {
    console.error(`Error processing email job ${job.id}:`, error)
    
    // Update processing status to FAILED
    await Placement.findOneAndUpdate(
      { emailId: emailId },
      {
        $set: {
          processingStatus: 'FAILED',
          lastProcessedAt: new Date(),
          processingError: error instanceof Error ? error.message : 'Unknown error',
        },
      }
    )
    
    throw error // Re-throw to trigger BullMQ retry logic
  }
}

// Create and start the worker
const worker = createEmailProcessorWorker(emailProcessorHandler)

console.log('Email processor worker started')

// Add more worker event listeners for debugging
worker.on('ready', async () => {
  console.log('Worker is ready and connected to queue')
  const waitingCount = await emailQueue.getWaitingCount()
  console.log(`Jobs waiting in queue: ${waitingCount}`)
})

worker.on('active', (job) => {
  console.log(`Worker started processing job ${job.id}`)
})

worker.on('error', (err) => {
  console.error('Worker error:', err)
})

worker.on('waiting', (job) => {
  console.log(`Job ${job.id} is waiting`)
})

worker.on('completed', (job) => {
  console.log(`Job ${job.id} completed successfully`)
})

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, closing worker...')
  await worker.close()
  process.exit(0)
})

process.on('SIGINT', async () => {
  console.log('SIGINT received, closing worker...')
  await worker.close()
  process.exit(0)
})

export default worker
