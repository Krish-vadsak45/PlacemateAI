import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import connectDB from '@/lib/mongodb'
import Placement from '@/models/Placement'
import { companyResearch } from '@/lib/company-research'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    await connectDB()

    const placement = await Placement.findOne({
      _id: id,
      userId: session.user.id,
    })

    if (!placement) {
      return NextResponse.json({ error: 'Placement not found' }, { status: 404 })
    }

    const { searchParams } = new URL(request.url)
    const forceRefresh = searchParams.get('refresh') === 'true'

    const data = await companyResearch.getCompanyResearch(
      placement.companyName,
      placement.jobRole,
      forceRefresh
    )

    return NextResponse.json({
      success: true,
      research: data,
    })
  } catch (error) {
    console.error('Error fetching company research:', error)
    return NextResponse.json(
      { error: 'Failed to fetch company research' },
      { status: 500 }
    )
  }
}
