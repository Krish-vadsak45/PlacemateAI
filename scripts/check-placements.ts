import 'dotenv/config'
import connectDB from '../src/lib/mongodb'
import Placement from '../src/models/Placement'

async function checkPlacements() {
  await connectDB()
  
  console.log('Checking recent placements in database...\n')
  
  const total = await Placement.countDocuments()
  console.log(`Total placements: ${total}`)
  
  const recent = await Placement.find()
    .sort({ createdAt: -1 })
    .limit(10)
    .select('companyName jobRole emailId processingStatus processingAttempts lastProcessedAt createdAt')
  
  console.log('\nRecent 10 placements:')
  recent.forEach(p => {
    console.log(`- ${p.companyName} | ${p.jobRole}`)
    console.log(`  Email ID: ${p.emailId}`)
    console.log(`  Processing Status: ${p.processingStatus}`)
    console.log(`  Processing Attempts: ${p.processingAttempts}`)
    console.log(`  Last Processed: ${p.lastProcessedAt}`)
    console.log(`  Created: ${p.createdAt}`)
    console.log()
  })
  
  const byStatus = await Placement.aggregate([
    { $group: { _id: '$processingStatus', count: { $sum: 1 } } }
  ])
  
  console.log('Placements by processing status:')
  byStatus.forEach(s => {
    console.log(`  ${s._id}: ${s.count}`)
  })
  
  process.exit(0)
}

checkPlacements().catch(console.error)
