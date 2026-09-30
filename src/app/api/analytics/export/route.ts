import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import connectDB from '@/lib/mongodb'
import Placement from '@/models/Placement'
import { getDateFilter } from '@/lib/analytics-service'
import mongoose from 'mongoose'

function escapeCsvField(val: unknown): string {
  if (val === null || val === undefined) return '""'
  const str = String(val).replace(/"/g, '""')
  return `"${str}"`
}

export async function GET(request: Request) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const range = searchParams.get('range') || 'all'
    const customStart = searchParams.get('startDate') || undefined
    const customEnd = searchParams.get('endDate') || undefined
    const format = searchParams.get('format') || 'csv'

    await connectDB()

    const userObjectId = new mongoose.Types.ObjectId(session.user.id)
    const dateQuery = getDateFilter(range, customStart, customEnd)

    const placements = await Placement.find({
      userId: userObjectId,
      ...dateQuery,
    })
      .sort({ createdAt: -1 })
      .lean()

    if (format === 'json') {
      return NextResponse.json({ success: true, placements })
    }

    // CSV Format
    const headers = [
      'Company Name',
      'Job Role',
      'Status',
      'Package',
      'Location',
      'Match Score (%)',
      'Min CGPA',
      'Allowed Branches',
      'Application Deadline',
      'Assessment Date',
      'Interview Date',
      'Notes Count',
      'Extracted by AI',
      'Created Date',
    ]

    const rows = placements.map((p) => {
      return [
        escapeCsvField(p.companyName),
        escapeCsvField(p.jobRole),
        escapeCsvField(p.status),
        escapeCsvField(p.package || 'N/A'),
        escapeCsvField(p.location || 'N/A'),
        escapeCsvField(p.matchScore ?? 'N/A'),
        escapeCsvField(p.eligibility?.minimumCGPA ?? 'N/A'),
        escapeCsvField((p.eligibility?.allowedBranches || []).join(', ')),
        escapeCsvField(p.applicationDeadline ? new Date(p.applicationDeadline).toLocaleDateString() : 'N/A'),
        escapeCsvField(p.assessmentDate ? new Date(p.assessmentDate).toLocaleDateString() : 'N/A'),
        escapeCsvField(p.interviewDate ? new Date(p.interviewDate).toLocaleDateString() : 'N/A'),
        escapeCsvField(p.notes?.length || 0),
        escapeCsvField(p.extractedByAI ? 'Yes' : 'No'),
        escapeCsvField(p.createdAt ? new Date(p.createdAt).toLocaleDateString() : 'N/A'),
      ].join(',')
    })

    const csvContent = [headers.join(','), ...rows].join('\n')
    const fileName = `placemate-report-${new Date().toISOString().slice(0, 10)}.csv`

    return new Response(csvContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${fileName}"`,
      },
    })
  } catch (error) {
    console.error('[Analytics Export API] Error:', error)
    return NextResponse.json(
      {
        error: 'Failed to export analytics data',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
