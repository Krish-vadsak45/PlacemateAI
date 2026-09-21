import { Queue, Worker, Job, QueueOptions } from 'bullmq'
import Redis from 'ioredis'

// Redis connection configuration
const redisConfig = {
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  password: process.env.REDIS_PASSWORD || undefined,
  maxRetriesPerRequest: null, // Required for BullMQ Workers (blocking commands)
  retryStrategy: (times: number) => {
    if (times > 3) {
      return null
    }
    return Math.min(times * 200, 1000)
  }
}

// Create Redis connection
export const redisConnection = new Redis(redisConfig)

redisConnection.on('error', (err) => {
  console.error('Redis connection error:', err)
})

redisConnection.on('connect', () => {
  console.log('Redis connected successfully')
})

// Queue configuration
const queueOptions: QueueOptions = {
  connection: redisConnection,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 2000,
    },
    removeOnComplete: {
      count: 1000,
      age: 3600, // Keep completed jobs for 1 hour
    },
    removeOnFail: {
      count: 5000,
      age: 86400, // Keep failed jobs for 24 hours
    },
  },
}

// Create email processing queue
export const emailQueue = new Queue('email-processing', queueOptions)

// Create dead letter queue for failed jobs
export const deadLetterQueue = new Queue('email-processing-dlq', {
  ...queueOptions,
  defaultJobOptions: {
    ...queueOptions.defaultJobOptions,
    attempts: 1, // Don't retry in DLQ
  },
})

// Email processing job data interface
export interface EmailProcessingJob {
  userId: string
  emailId: string
  historyId?: string
  messageId?: string
}

// Worker configuration
export const workerOptions = {
  connection: redisConnection,
  concurrency: 5, // Process 5 jobs concurrently
  limiter: {
    max: 10,
    duration: 1000, // Rate limit: 10 jobs per second
  },
}

// Create email processing worker
export function createEmailProcessorWorker(processor: (job: Job<EmailProcessingJob>) => Promise<void>) {
  const worker = new Worker<EmailProcessingJob>(
    'email-processing',
    processor,
    workerOptions
  )

  worker.on('completed', (job) => {
    console.log(`Job ${job.id} completed successfully`)
  })

  worker.on('failed', (job, err) => {
    console.error(`Job ${job?.id} failed:`, err)
    
    // Move to dead letter queue if max attempts reached
    if (job && job.attemptsMade >= (job.opts.attempts || 3)) {
      deadLetterQueue.add('failed-email', job.data, {
        jobId: job.id,
        ...job.opts,
      }).catch(err => {
        console.error('Failed to add to DLQ:', err)
      })
    }
  })

  worker.on('error', (err) => {
    console.error('Worker error:', err)
  })

  return worker
}

// Monitoring functions
export async function getQueueStats() {
  const waiting = await emailQueue.getWaitingCount()
  const active = await emailQueue.getActiveCount()
  const completed = await emailQueue.getCompletedCount()
  const failed = await emailQueue.getFailedCount()
  const delayed = await emailQueue.getDelayedCount()

  return {
    waiting,
    active,
    completed,
    failed,
    delayed,
  }
}

export async function getDeadLetterQueueStats() {
  const waiting = await deadLetterQueue.getWaitingCount()
  const completed = await deadLetterQueue.getCompletedCount()
  const failed = await deadLetterQueue.getFailedCount()

  return {
    waiting,
    completed,
    failed,
  }
}

// Cleanup function
export async function closeQueues() {
  await emailQueue.close()
  await deadLetterQueue.close()
  await redisConnection.quit()
}
