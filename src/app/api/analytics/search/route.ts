import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import SearchLog from '@/models/SearchLog'
import connectDB from '@/lib/mongodb'

/**
 * GET /api/analytics/search
 * Get search analytics data
 */
export async function GET(request: Request) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await connectDB()

    const { searchParams } = new URL(request.url)
    const days = parseInt(searchParams.get('days') || '30')

    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)

    // Get search logs for the user
    const searchLogs = await SearchLog.find({
      userId: session.user.id,
      timestamp: { $gte: startDate },
    }).sort({ timestamp: -1 })

    // Calculate analytics
    const totalSearches = searchLogs.length
    const uniqueQueries = [...new Set(searchLogs.map(log => log.query).filter(q => q))]
    const zeroResultSearches = searchLogs.filter(log => log.resultsCount === 0).length

    // Popular queries
    const queryCounts: { [key: string]: number } = {}
    searchLogs.forEach(log => {
      if (log.query) {
        queryCounts[log.query] = (queryCounts[log.query] || 0) + 1
      }
    })
    const popularQueries = Object.entries(queryCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([query, count]) => ({ query, count }))

    // Most used filters
    const filterUsage: { [key: string]: number } = {}
    searchLogs.forEach(log => {
      if (log.filters.status?.length) filterUsage['status'] = (filterUsage['status'] || 0) + 1
      if (log.filters.company?.length) filterUsage['company'] = (filterUsage['company'] || 0) + 1
      if (log.filters.location?.length) filterUsage['location'] = (filterUsage['location'] || 0) + 1
      if (log.filters.cgpaMin !== undefined || log.filters.cgpaMax !== undefined) filterUsage['cgpa'] = (filterUsage['cgpa'] || 0) + 1
      if (log.filters.matchScoreMin !== undefined || log.filters.matchScoreMax !== undefined) filterUsage['matchScore'] = (filterUsage['matchScore'] || 0) + 1
      if (log.filters.deadlineFrom || log.filters.deadlineTo) filterUsage['deadline'] = (filterUsage['deadline'] || 0) + 1
    })
    const mostUsedFilters = Object.entries(filterUsage)
      .sort((a, b) => b[1] - a[1])
      .map(([filter, count]) => ({ filter, count }))

    // Search volume over time (daily)
    const searchVolume: { date: string; count: number }[] = []
    const dailyCounts: { [key: string]: number } = {}
    searchLogs.forEach(log => {
      const date = new Date(log.timestamp).toISOString().split('T')[0]
      dailyCounts[date] = (dailyCounts[date] || 0) + 1
    })
    Object.entries(dailyCounts).forEach(([date, count]) => {
      searchVolume.push({ date, count })
    })
    searchVolume.sort((a, b) => a.date.localeCompare(b.date))

    return NextResponse.json({
      success: true,
      analytics: {
        totalSearches,
        uniqueQueries: uniqueQueries.length,
        zeroResultSearches,
        zeroResultRate: totalSearches > 0 ? (zeroResultSearches / totalSearches * 100).toFixed(1) : 0,
        popularQueries,
        mostUsedFilters,
        searchVolume,
      },
    })
  } catch (error) {
    console.error('Error in search analytics endpoint:', error)
    return NextResponse.json(
      {
        error: 'Failed to fetch analytics',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
