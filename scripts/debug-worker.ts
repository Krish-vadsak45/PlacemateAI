import 'dotenv/config'
import { Worker } from 'bullmq'
import { redisConnection } from '../src/lib/queue'

async function debugWorker() {
  console.log('Creating debug worker to check queue connection...\n')
  
  const worker = new Worker(
    'email-processing',
    async (job) => {
      console.log(`Debug worker received job: ${job.id}`, job.data)
      await job.moveToCompleted('debug', 'test')
    },
    {
      connection: redisConnection,
      concurrency: 1,
    }
  )
  
  worker.on('ready', () => {
    console.log('Debug worker is ready')
  })
  
  worker.on('active', (job) => {
    console.log(`Debug worker processing job: ${job.id}`)
  })
  
  worker.on('completed', (job) => {
    console.log(`Debug worker completed job: ${job.id}`)
  })
  
  worker.on('error', (err) => {
    console.error('Debug worker error:', err)
  })
  
  // Wait a bit to see if any jobs are picked up
  setTimeout(async () => {
    console.log('\nClosing debug worker...')
    await worker.close()
    process.exit(0)
  }, 5000)
}

debugWorker().catch(console.error)
