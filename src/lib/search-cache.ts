import { createClient } from 'redis'

let redisClient: ReturnType<typeof createClient> | null = null

/**
 * Get or create Redis client singleton
 */
export function getRedisClient() {
  if (!redisClient) {
    const redisHost = process.env.REDIS_HOST || 'localhost'
    const redisPort = process.env.REDIS_PORT || 6379
    const redisPassword = process.env.REDIS_PASSWORD
    
    redisClient = createClient({
      socket: {
        host: redisHost,
        port: parseInt(redisPort.toString()),
      },
      password: redisPassword || undefined,
    })

    redisClient.on('error', (err) => console.error('Redis Client Error:', err))
    
    redisClient.connect().catch(err => {
      console.error('Failed to connect to Redis:', err)
    })
  }

  return redisClient
}

/**
 * Generate cache key from search parameters
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function generateCacheKey(userId: string, filters: any): string {
  const keyParts = [
    'search',
    userId,
    filters.q || '',
    filters.status?.join(',') || '',
    filters.company?.join(',') || '',
    filters.location?.join(',') || '',
    filters.cgpaMin || '',
    filters.cgpaMax || '',
    filters.matchScoreMin || '',
    filters.matchScoreMax || '',
    filters.deadlineFrom || '',
    filters.deadlineTo || '',
    filters.hasAttachments || '',
    filters.hasCalendarEvent || '',
    filters.sortBy || '',
    filters.sortOrder || '',
    filters.page || '1',
    filters.limit || '20',
  ]
  
  return keyParts.join(':')
}

/**
 * Get cached search results
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function getCachedSearch(key: string): Promise<any | null> {
  try {
    const client = getRedisClient()
    const cached = await client.get(key)
    
    if (cached) {
      return JSON.parse(cached)
    }
    
    return null
  } catch (error) {
    console.error('Error getting cached search:', error)
    return null
  }
}

/**
 * Cache search results
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function cacheSearch(key: string, data: any, ttl: number = 3600): Promise<void> {
  try {
    const client = getRedisClient()
    await client.setEx(key, ttl, JSON.stringify(data))
  } catch (error) {
    console.error('Error caching search:', error)
  }
}

/**
 * Invalidate cache for a user's searches
 */
export async function invalidateUserCache(userId: string): Promise<void> {
  try {
    const client = getRedisClient()
    const pattern = `search:${userId}:*`
    
    for await (const key of client.scanIterator({ MATCH: pattern })) {
      await client.del(key)
    }
  } catch (error) {
    console.error('Error invalidating user cache:', error)
  }
}

/**
 * Invalidate cache for a specific placement
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function invalidatePlacementCache(placementId: string): Promise<void> {
  try {
    // This is a simplified approach - in production, you might want to track which searches include a placement
    // For now, we'll invalidate all search caches
    const client = getRedisClient()
    const pattern = 'search:*'
    
    for await (const key of client.scanIterator({ MATCH: pattern })) {
      await client.del(key)
    }
  } catch (error) {
    console.error('Error invalidating placement cache:', error)
  }
}
