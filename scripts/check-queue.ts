import 'dotenv/config'
import { getQueueStats, getDeadLetterQueueStats } from '../src/lib/queue'

async function checkQueue() {
  console.log('Checking email processing queue status...\n')
  
  const stats = await getQueueStats()
  console.log('Main Queue Stats:')
  console.log(`  Waiting: ${stats.waiting}`)
  console.log(`  Active: ${stats.active}`)
  console.log(`  Completed: ${stats.completed}`)
  console.log(`  Failed: ${stats.failed}`)
  console.log(`  Delayed: ${stats.delayed}`)
  
  const dlqStats = await getDeadLetterQueueStats()
  console.log('\nDead Letter Queue Stats:')
  console.log(`  Waiting: ${dlqStats.waiting}`)
  console.log(`  Completed: ${dlqStats.completed}`)
  console.log(`  Failed: ${dlqStats.failed}`)
  
  process.exit(0)
}

checkQueue().catch(console.error)
