import 'dotenv/config'
import { createPlacementsIndex, checkElasticsearchHealth } from '../src/lib/elasticsearch'
import { syncAllPlacements } from '../src/lib/elasticsearch-sync'
import connectDB from '../src/lib/mongodb'

async function main() {
  try {
    console.log('Connecting to MongoDB...')
    await connectDB()

    console.log('Checking Elasticsearch health...')
    const isHealthy = await checkElasticsearchHealth()
    if (!isHealthy) {
      console.error('Elasticsearch is not healthy. Please check if it is running.')
      process.exit(1)
    }
    console.log('Elasticsearch is healthy')

    console.log('Creating placements index...')
    await createPlacementsIndex()
    console.log('Index created successfully')

    console.log('Syncing all placements to Elasticsearch...')
    const result = await syncAllPlacements()
    console.log('Sync completed:', result)

    console.log('Done!')
    process.exit(0)
  } catch (error) {
    console.error('Error initializing Elasticsearch:', error)
    process.exit(1)
  }
}

main()
