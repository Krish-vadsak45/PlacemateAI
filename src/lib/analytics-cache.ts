import { getRedisClient } from './search-cache'

const ANALYTICS_CACHE_TTL = 300 // 5 minutes

export async function getCachedAnalytics<T>(userId: string, cacheKey: string): Promise<T | null> {
  try {
    const client = getRedisClient()
    if (!client || !client.isOpen) return null

    const key = `analytics:${userId}:${cacheKey}`
    const cachedData = await client.get(key)
    if (!cachedData) return null

    return JSON.parse(cachedData) as T
  } catch (err) {
    console.warn('[AnalyticsCache] Failed to get cache:', err)
    return null
  }
}

export async function setCachedAnalytics(
  userId: string,
  cacheKey: string,
  data: unknown,
  ttl: number = ANALYTICS_CACHE_TTL
): Promise<void> {
  try {
    const client = getRedisClient()
    if (!client || !client.isOpen) return

    const key = `analytics:${userId}:${cacheKey}`
    await client.setEx(key, ttl, JSON.stringify(data))
  } catch (err) {
    console.warn('[AnalyticsCache] Failed to set cache:', err)
  }
}

export async function invalidateAnalyticsCache(userId: string): Promise<void> {
  try {
    const client = getRedisClient()
    if (!client || !client.isOpen) return

    const pattern = `analytics:${userId}:*`
    const keys = await client.keys(pattern)
    if (keys && keys.length > 0) {
      await client.del(keys)
    }
  } catch (err) {
    console.warn('[AnalyticsCache] Failed to invalidate cache:', err)
  }
}
