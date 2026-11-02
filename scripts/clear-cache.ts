import 'dotenv/config'
import Redis from 'ioredis'
import { Client } from '@elastic/elasticsearch'
import connectDB from '../src/lib/mongodb'

async function clearCache() {
  let redis: Redis | null = null
  let esClient: Client | null = null

  try {
    console.log('🗑️  Clearing Redis Cache and Elasticsearch Data...\n')

    // Connect to Redis
    console.log('📡 Connecting to Redis...')
    const redisUrl = process.env.REDIS_URL || `redis://${process.env.REDIS_HOST || 'localhost'}:${process.env.REDIS_PORT || 6379}`
    redis = new Redis(redisUrl)
    await redis.ping()
    console.log('✅ Redis connected')

    // Clear Redis cache
    console.log('\n🧹 Clearing Redis cache...')
    const dbSize = await redis.dbsize()
    await redis.flushdb()
    console.log(`✅ Cleared ${dbSize} keys from Redis`)

    // Close Redis connection
    await redis.quit()
    redis = null

    // Connect to Elasticsearch
    console.log('\n📡 Connecting to Elasticsearch...')
    const esUrl = process.env.ELASTICSEARCH_URL || 'http://localhost:9200'
    esClient = new Client({
      node: esUrl,
      auth: process.env.ELASTICSEARCH_USERNAME && process.env.ELASTICSEARCH_PASSWORD
        ? {
            username: process.env.ELASTICSEARCH_USERNAME,
            password: process.env.ELASTICSEARCH_PASSWORD,
          }
        : undefined,
    })

    await esClient.ping()
    console.log('✅ Elasticsearch connected')

    // Get all indices
    console.log('\n🔍 Listing Elasticsearch indices...')
    const indicesResponse = await esClient.cat.indices({ format: 'json' })
    const indexNames = (indicesResponse as any[]).map((idx: any) => idx.index)

    if (indexNames.length === 0) {
      console.log('ℹ️  No indices found in Elasticsearch')
    } else {
      console.log(`Found ${indexNames.length} indices: ${indexNames.join(', ')}`)

      // Clear all indices (delete and recreate)
      console.log('\n🧹 Clearing Elasticsearch indices...')
      for (const indexName of indexNames) {
        await esClient.indices.delete({ index: indexName })
        console.log(`  ✅ Deleted index: ${indexName}`)
      }
    }

    // Close Elasticsearch connection
    await esClient.close()
    esClient = null

    console.log('\n✨ Cache clearing completed successfully!')
    console.log('\n📝 Next steps:')
    console.log('   1. Your server will now fetch fresh data from MongoDB')
    console.log('   2. Run "npm run init-elasticsearch" to reindex Elasticsearch data')
    console.log('   3. Restart your server if needed')

    process.exit(0)
  } catch (error) {
    console.error('\n❌ Error clearing cache:', error)

    // Cleanup connections
    if (redis) {
      try {
        await redis.quit()
      } catch (e) {
        console.error('Error closing Redis:', e)
      }
    }
    if (esClient) {
      try {
        await esClient.close()
      } catch (e) {
        console.error('Error closing Elasticsearch:', e)
      }
    }

    process.exit(1)
  }
}

clearCache()
