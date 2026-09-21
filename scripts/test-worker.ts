import 'dotenv/config'
import { createEmailProcessorWorker, emailQueue } from '../src/lib/queue'

console.log('Creating worker...')

try {
  const worker = createEmailProcessorWorker(async (job) => {
    console.log(`Test worker processing job: ${job.id}`, job.data)
    await job.updateProgress(50)
    console.log(`Test worker completed job: ${job.id}`)
  })
  
  console.log('Worker created successfully')
  
  worker.on('ready', async () => {
    console.log('Worker is ready')
    const waiting = await emailQueue.getWaitingCount()
    console.log(`Jobs waiting: ${waiting}`)
  })
  
  worker.on('error', (err) => {
    console.error('Worker error:', err)
  })
  
  setTimeout(async () => {
    console.log('Closing test worker...')
    await worker.close()
    process.exit(0)
  }, 5000)
} catch (error) {
  console.error('Error creating worker:', error)
  process.exit(1)
}
