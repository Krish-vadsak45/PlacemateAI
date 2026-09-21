import 'dotenv/config'
import connectDB from '../src/lib/mongodb'
import Placement from '../src/models/Placement'
import User from '../src/models/User'
import { createJobMatcher } from '../src/lib/job-matcher'

async function backfillMatchScores() {
  try {
    console.log('Connecting to database...')
    await connectDB()
    console.log('Database connected successfully')

    // Get all placements without match scores
    const placementsWithoutScores = await Placement.find({
      $or: [
        { matchScore: { $exists: false } },
        { matchScore: null }
      ]
    })

    console.log(`Found ${placementsWithoutScores.length} placements without match scores`)

    const jobMatcher = createJobMatcher()
    let successCount = 0
    let errorCount = 0

    for (const placement of placementsWithoutScores) {
      try {
        console.log(`Processing placement: ${placement.companyName} - ${placement.jobRole}`)

        const matchResult = await jobMatcher.calculateMatchScore(
          placement.userId,
          placement
        )

        await Placement.findByIdAndUpdate(
          placement._id,
          {
            $set: {
              matchScore: matchResult.score,
              matchBreakdown: matchResult.breakdown
            }
          }
        )

        console.log(`✓ Match score calculated: ${matchResult.score}/100`)
        successCount++
      } catch (error) {
        console.error(`✗ Failed to calculate match score for placement ${placement._id}:`, error)
        errorCount++
      }
    }

    console.log('\n=== Summary ===')
    console.log(`Successfully processed: ${successCount}`)
    console.log(`Failed: ${errorCount}`)
    console.log(`Total: ${placementsWithoutScores.length}`)

    process.exit(0)
  } catch (error) {
    console.error('Error in backfill script:', error)
    process.exit(1)
  }
}

backfillMatchScores()
