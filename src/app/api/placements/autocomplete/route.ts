import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { getAutocompleteSuggestions } from '@/lib/search-builder'

/**
 * GET /api/placements/autocomplete
 * Get autocomplete suggestions for a field
 */
export async function GET(request: Request) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const query = searchParams.get('q')
    const field = searchParams.get('field') || 'companyName'

    if (!query) {
      return NextResponse.json({ error: 'Query parameter "q" is required' }, { status: 400 })
    }

    const suggestions = await getAutocompleteSuggestions(query, field, session.user.id)

    return NextResponse.json({
      success: true,
      suggestions,
    })
  } catch (error) {
    console.error('Error in autocomplete endpoint:', error)
    return NextResponse.json(
      {
        error: 'Autocomplete failed',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
