import { createClient } from 'redis'

type RedisClient = ReturnType<typeof createClient>

declare global {
  // eslint-disable-next-line no-var
  var redisCacheClient: RedisClient | undefined
  // eslint-disable-next-line no-var
  var redisConnectPromise: Promise<RedisClient | null> | undefined
}

/**
 * Get or create Redis client singleton
 */
export function getRedisClient(): RedisClient {
  if (!global.redisCacheClient) {
    const redisUrl = process.env.REDIS_URL
    const redisHost = process.env.REDIS_HOST || 'localhost'
    const redisPort = process.env.REDIS_PORT || 6379
    const redisPassword = process.env.REDIS_PASSWORD

    global.redisCacheClient = createClient({
      url: redisUrl || undefined,
      socket: {
        host: !redisUrl ? redisHost : undefined,
        port: !redisUrl ? parseInt(redisPort.toString()) : undefined,
        reconnectStrategy: (retries) => {
          return Math.min(retries * 500, 3000)
        },
      },
      password: redisPassword || undefined,
    })

    global.redisCacheClient.on('error', () => {
      // Gracefully handle offline Redis without crashing process
    })
  }

  return global.redisCacheClient
}

/**
 * Ensure Redis client is connected before running operations
 */
export async function getConnectedRedisClient(): Promise<RedisClient | null> {
  const client = getRedisClient()
  if (!client) return null

  if (client.isOpen && client.isReady) {
    return client
  }

  if (global.redisConnectPromise) {
    try {
      await global.redisConnectPromise
      if (client.isOpen) return client
    } catch {
      return null
    }
  }

  if (!client.isOpen) {
    global.redisConnectPromise = client.connect()
      .then(() => client)
      .catch(() => null)
      .finally(() => {
        global.redisConnectPromise = undefined
      })

    return await global.redisConnectPromise
  }

  return client.isOpen ? client : null
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
    filters.saved ? `saved:${filters.savedIds?.sort().join(',') || 'empty'}` : '',
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
    const client = await getConnectedRedisClient()
    if (!client || !client.isOpen) {
      return null
    }

    const cached = await client.get(key)
    if (cached) {
      return JSON.parse(cached)
    }
    
    return null
  } catch (error) {
    console.warn('Error getting cached search:', error)
    return null
  }
}

/**
 * Cache search results
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function cacheSearch(key: string, data: any, ttl: number = 3600): Promise<void> {
  try {
    const client = await getConnectedRedisClient()
    if (!client || !client.isOpen) {
      return
    }

    await client.setEx(key, ttl, JSON.stringify(data))
  } catch (error) {
    console.warn('Error caching search:', error)
  }
}

/**
 * Get cached placement by ID
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function getCachedPlacement(placementId: string): Promise<any | null> {
  try {
    const client = await getConnectedRedisClient()
    if (!client || !client.isOpen) {
      return null
    }

    const cached = await client.get(`placement:${placementId}`)
    if (cached) {
      return JSON.parse(cached)
    }
    return null
  } catch (error) {
    console.warn('Error getting cached placement:', error)
    return null
  }
}

/**
 * Cache single placement by ID
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function cachePlacement(placementId: string, data: any, ttl: number = 3600): Promise<void> {
  try {
    const client = await getConnectedRedisClient()
    if (!client || !client.isOpen) {
      return
    }

    await client.setEx(`placement:${placementId}`, ttl, JSON.stringify(data))
  } catch (error) {
    console.warn('Error caching placement:', error)
  }
}

/**
 * Invalidate cache for a user's searches and tags
 */
export async function invalidateUserCache(userId: string): Promise<void> {
  try {
    const client = await getConnectedRedisClient()
    if (!client || !client.isOpen) {
      return
    }

    const pattern = `search:${userId}:*`
    for await (const key of client.scanIterator({ MATCH: pattern })) {
      await client.del(key)
    }
    await client.del(`tags:${userId}`)
  } catch (error) {
    console.warn('Error invalidating user cache:', error)
  }
}

/**
 * Invalidate cache for a specific placement
 */
export async function invalidatePlacementCache(placementId: string): Promise<void> {
  try {
    const client = await getConnectedRedisClient()
    if (!client || !client.isOpen) {
      return
    }

    await client.del(`placement:${placementId}`)
    const pattern = 'search:*'
    for await (const key of client.scanIterator({ MATCH: pattern })) {
      await client.del(key)
    }
  } catch (error) {
    console.warn('Error invalidating placement cache:', error)
  }
}
