import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { computeDashboardAnalytics } from '@/lib/analytics-service'
import { getCachedAnalytics, setCachedAnalytics } from '@/lib/analytics-cache'

export async function GET(request: Request) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const range = searchParams.get('range') || '90d'
    const customStart = searchParams.get('startDate') || undefined
    const customEnd = searchParams.get('endDate') || undefined
    const refresh = searchParams.get('refresh') === 'true'

    const cacheKey = `dashboard:${range}:${customStart || ''}:${customEnd || ''}`

    if (!refresh) {
      const cached = await getCachedAnalytics(session.user.id, cacheKey)
      if (cached) {
        return NextResponse.json({ success: true, data: cached, cached: true })
      }
    }

    const data = await computeDashboardAnalytics(session.user.id, range, customStart, customEnd)

    await setCachedAnalytics(session.user.id, cacheKey, data, 300)

    return NextResponse.json({ success: true, data, cached: false })
  } catch (error) {
    console.error('[Analytics Dashboard API] Error:', error)
    return NextResponse.json(
      {
        error: 'Failed to fetch analytics data',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
