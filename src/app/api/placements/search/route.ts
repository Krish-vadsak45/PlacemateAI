import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { searchPlacements, SearchFilters } from '@/lib/search-builder'
import SearchLog from '@/models/SearchLog'
import Placement from '@/models/Placement'
import connectDB from '@/lib/mongodb'
import { generateCacheKey, getCachedSearch, cacheSearch } from '@/lib/search-cache'
import { checkSharedAccess, resolveOwnerId } from '@/lib/shared-access'

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

    // Check shared access
    const targetOwnerId = resolveOwnerId(request)
    const access = await checkSharedAccess(session.user.id, targetOwnerId, 'viewer')

    if (!access.allowed) {
      return NextResponse.json({ error: "You don't have access to this dashboard" }, { status: 403 })
    }

    const effectiveUserId = access.effectiveUserId

    const { searchParams } = new URL(request.url)

    // Build filters from query parameters
    const filters: SearchFilters = {
      q: searchParams.get('q') || undefined,
      status: searchParams.get('status')?.split(',').filter(Boolean),
      company: searchParams.get('company')?.split(',').filter(Boolean),
      location: searchParams.get('location')?.split(',').filter(Boolean),
      tags: searchParams.get('tags')?.split(',').filter(Boolean),
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
    const cacheKey = generateCacheKey(effectiveUserId, filters)
    const cachedResult = await getCachedSearch(cacheKey)
    
    if (cachedResult) {
      console.log('Cache hit for search:', cacheKey)
      return NextResponse.json({
        success: true,
        ...cachedResult,
        cached: true,
        sharedAccess: access.permission !== 'owner' ? { permission: access.permission } : undefined,
      })
    }

    // Perform search with MongoDB fallback
    let result
    try {
      result = await searchPlacements(filters, effectiveUserId)
    } catch (esErr) {
      console.warn('Elasticsearch query failed, falling back to MongoDB:', esErr)
      await connectDB()
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const query: any = { userId: effectiveUserId }
      if (filters.status?.length) query.status = { $in: filters.status }
      if (filters.tags?.length) query.tags = { $in: filters.tags }
      if (filters.company?.length) query.companyName = { $in: filters.company }
      if (filters.location?.length) query.location = { $in: filters.location }
      if (filters.q) {
        query.$or = [
          { companyName: { $regex: filters.q, $options: 'i' } },
          { jobRole: { $regex: filters.q, $options: 'i' } },
          { location: { $regex: filters.q, $options: 'i' } },
          { 'notes.content': { $regex: filters.q, $options: 'i' } },
          { tags: { $regex: filters.q, $options: 'i' } },
        ]
      }
      if (filters.cgpaMin !== undefined || filters.cgpaMax !== undefined) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const cgpaQ: any = {}
        if (filters.cgpaMin !== undefined) cgpaQ.$gte = filters.cgpaMin
        if (filters.cgpaMax !== undefined) cgpaQ.$lte = filters.cgpaMax
        query['eligibility.minimumCGPA'] = cgpaQ
      }
      if (filters.matchScoreMin !== undefined || filters.matchScoreMax !== undefined) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const matchQ: any = {}
        if (filters.matchScoreMin !== undefined) matchQ.$gte = filters.matchScoreMin
        if (filters.matchScoreMax !== undefined) matchQ.$lte = filters.matchScoreMax
        query.matchScore = matchQ
      }
      if (filters.deadlineFrom || filters.deadlineTo) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const deadlineQ: any = {}
        if (filters.deadlineFrom) deadlineQ.$gte = new Date(filters.deadlineFrom)
        if (filters.deadlineTo) deadlineQ.$lte = new Date(filters.deadlineTo)
        query.applicationDeadline = deadlineQ
      }
      if (filters.hasAttachments !== undefined) {
        query.hasAttachments = filters.hasAttachments
      }
      if (filters.hasCalendarEvent !== undefined) {
        query.hasCalendarEvent = filters.hasCalendarEvent
      }

      const pageNum = filters.page || 1
      const limitNum = filters.limit || 20
      const skip = (pageNum - 1) * limitNum

      const [placements, total] = await Promise.all([
        Placement.find(query).sort({ createdAt: -1 }).skip(skip).limit(limitNum).lean(),
        Placement.countDocuments(query),
      ])

      result = {
        placements,
        total,
        page: pageNum,
        limit: limitNum,
      }
    }

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
      sharedAccess: access.permission !== 'owner' ? { permission: access.permission } : undefined,
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
