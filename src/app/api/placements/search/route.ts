import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { searchPlacements, SearchFilters } from '@/lib/search-builder'
import SearchLog from '@/models/SearchLog'
import connectDB from '@/lib/mongodb'
import { generateCacheKey, getCachedSearch, cacheSearch } from '@/lib/search-cache'

/**
 * GET /api/placements/search
 * Search placements with filters and pagination
 */
export async function GET(request: Request) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)

    // Build filters from query parameters
    const filters: SearchFilters = {
      q: searchParams.get('q') || undefined,
      status: searchParams.get('status')?.split(',').filter(Boolean),
      company: searchParams.get('company')?.split(',').filter(Boolean),
      location: searchParams.get('location')?.split(',').filter(Boolean),
      cgpaMin: searchParams.get('cgpaMin') ? parseFloat(searchParams.get('cgpaMin')!) : undefined,
      cgpaMax: searchParams.get('cgpaMax') ? parseFloat(searchParams.get('cgpaMax')!) : undefined,
      matchScoreMin: searchParams.get('matchScoreMin') ? parseInt(searchParams.get('matchScoreMin')!) : undefined,
      matchScoreMax: searchParams.get('matchScoreMax') ? parseInt(searchParams.get('matchScoreMax')!) : undefined,
      deadlineFrom: searchParams.get('deadlineFrom') || undefined,
      deadlineTo: searchParams.get('deadlineTo') || undefined,
      hasAttachments: searchParams.get('hasAttachments') === 'true' ? true : searchParams.get('hasAttachments') === 'false' ? false : undefined,
      hasCalendarEvent: searchParams.get('hasCalendarEvent') === 'true' ? true : searchParams.get('hasCalendarEvent') === 'false' ? false : undefined,
      sortBy: searchParams.get('sortBy') || undefined,
      sortOrder: (searchParams.get('sortOrder') as 'asc' | 'desc') || 'desc',
      page: searchParams.get('page') ? parseInt(searchParams.get('page')!) : 1,
      limit: searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : 20,
    }

    // Check cache first
    const cacheKey = generateCacheKey(session.user.id, filters)
    const cachedResult = await getCachedSearch(cacheKey)
    
    if (cachedResult) {
      console.log('Cache hit for search:', cacheKey)
      return NextResponse.json({
        success: true,
        ...cachedResult,
        cached: true,
      })
    }

    // Perform search
    const result = await searchPlacements(filters, session.user.id)

    // Cache the result (5 minutes TTL)
    cacheSearch(cacheKey, result, 300).catch(err => {
      console.error('Error caching search result:', err)
    })

    // Log search asynchronously (don't block response)
    logSearch(session.user.id, filters, result.total).catch(err => {
      console.error('Error logging search:', err)
    })

    return NextResponse.json({
      success: true,
      ...result,
      cached: false,
    })
  } catch (error) {
    console.error('Error in search endpoint:', error)
    return NextResponse.json(
      {
        error: 'Search failed',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

/**
 * Log search to database for analytics
 */
async function logSearch(userId: string, filters: SearchFilters, resultsCount: number): Promise<void> {
  try {
    await connectDB()
    
    await SearchLog.create({
      userId,
      query: filters.q || '',
      filters: {
        status: filters.status,
        company: filters.company,
        location: filters.location,
        cgpaMin: filters.cgpaMin,
        cgpaMax: filters.cgpaMax,
        matchScoreMin: filters.matchScoreMin,
        matchScoreMax: filters.matchScoreMax,
        deadlineFrom: filters.deadlineFrom,
        deadlineTo: filters.deadlineTo,
        hasAttachments: filters.hasAttachments,
        hasCalendarEvent: filters.hasCalendarEvent,
      },
      resultsCount,
    })
  } catch (error) {
    console.error('Error creating search log:', error)
  }
}
