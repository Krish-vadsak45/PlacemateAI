import 'dotenv/config'
import connectDB from '../src/lib/mongodb'
import Placement from '../src/models/Placement'
import { emailQueue } from '../src/lib/queue'

async function requeueJobs() {
  await connectDB()
  
  console.log('Finding placements that need processing...\n')
  
  const placements = await Placement.find({
    $or: [
      { processingStatus: { $in: [null, 'RECEIVED'] } },
      { processingStatus: { $exists: false } }
    ]
  })
  
  console.log(`Found ${placements.length} placements to requeue`)
  
  let requeued = 0
  for (const placement of placements) {
    if (!placement.emailId) {
      console.log(`Skipping placement without emailId: ${placement.companyName}`)
      continue
    }
    
    await emailQueue.add(
      'process-email',
      {
        userId: placement.userId.toString(),
        emailId: placement.emailId,
      },
      {
        jobId: `${placement.userId.toString()}-${placement.emailId}`,
      }
    )
    
    requeued++
    console.log(`Requeued: ${placement.companyName} (${placement.emailId})`)
  }
  
  console.log(`\nRequeued ${requeued} jobs to the queue`)
  
  const waitingCount = await emailQueue.getWaitingCount()
  console.log(`Jobs now waiting in queue: ${waitingCount}`)
  
  process.exit(0)
}

requeueJobs().catch(console.error)
