import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { syncAllPlacements } from '@/lib/elasticsearch-sync'
import { checkElasticsearchHealth, createPlacementsIndex } from '@/lib/elasticsearch'

/**
 * POST /api/admin/elasticsearch/sync
 * Manually trigger a full sync of all placements to Elasticsearch
 */
export async function POST(request: Request) {
  try {
    const session = await auth()

    // Check if user is authenticated (you may want to add admin role check)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check Elasticsearch health
    const isHealthy = await checkElasticsearchHealth()
    if (!isHealthy) {
      return NextResponse.json(
        { error: 'Elasticsearch is not available' },
        { status: 503 }
      )
    }

    // Parse request body for optional userId
    const body = await request.json().catch(() => ({}))
    const userId = body.userId

    // Ensure index exists
    await createPlacementsIndex()

    // Perform sync
    const result = await syncAllPlacements(userId)

    return NextResponse.json({
      success: true,
      message: 'Sync completed successfully',
      ...result,
    })
  } catch (error) {
    console.error('Error in sync endpoint:', error)
    return NextResponse.json(
      {
        error: 'Sync failed',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

/**
 * GET /api/admin/elasticsearch/sync
 * Get sync status (health check)
 */
export async function GET() {
  try {
    const isHealthy = await checkElasticsearchHealth()

    return NextResponse.json({
      healthy: isHealthy,
      status: isHealthy ? 'Elasticsearch is available' : 'Elasticsearch is not available',
    })
  } catch (error) {
    console.error('Error in health check endpoint:', error)
    return NextResponse.json(
      {
        healthy: false,
        status: 'Failed to check Elasticsearch health',
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
