import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import connectDB from "@/lib/mongodb"
import Placement from "@/models/Placement"
import { invalidateAnalyticsCache } from "@/lib/analytics-cache"
import { checkSharedAccess } from "@/lib/shared-access"
import { getCachedPlacement, cachePlacement, invalidatePlacementCache, invalidateUserCache } from "@/lib/search-cache"

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params

    const cachedPlacement = await getCachedPlacement(id)
    if (cachedPlacement) {
      return NextResponse.json(cachedPlacement, {
        headers: {
          'Cache-Control': 'private, max-age=60, stale-while-revalidate=300'
        }
      })
    }

    await connectDB()

    const placement = await Placement.findById(id)
    if (!placement) {
      return NextResponse.json({ error: "Placement not found" }, { status: 404 })
    }

    const access = await checkSharedAccess(
      session.user.id,
      placement.userId.toString(),
      'viewer'
    )

    if (!access.allowed) {
      return NextResponse.json(
        { error: "You don't have access to this placement" },
        { status: 403 }
      )
    }

    await cachePlacement(id, placement, 300)

    return NextResponse.json(placement, {
      headers: {
        'Cache-Control': 'private, max-age=60, stale-while-revalidate=300'
      }
    })
  } catch (error) {
    console.error("Error fetching placement:", error)
    return NextResponse.json({ 
      error: "Failed to fetch placement",
      details: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 })
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { 
      status, 
      companyName, 
      jobRole, 
      package: pkg, 
      location, 
      applicationDeadline, 
      applicationLink,
      notes,
      aiSummary,
      assessmentDate,
      interviewDate,
      attachments,
      applicationHistory,
      calendarEventId,
      tags
    } = body

    await connectDB()

    const { id } = await params

    // First, find the placement to determine its owner
    const existingPlacement = await Placement.findById(id)
    if (!existingPlacement) {
      return NextResponse.json({ error: "Placement not found" }, { status: 404 })
    }

    // Check shared access (need 'editor' permission to modify)
    const access = await checkSharedAccess(
      session.user.id,
      existingPlacement.userId.toString(),
      'editor'
    )

    if (!access.allowed) {
      return NextResponse.json(
        { error: "You don't have edit permission for this placement" },
        { status: 403 }
      )
    }

    const placement = await Placement.findOneAndUpdate(
      { 
        _id: id,
        userId: access.effectiveUserId 
      },
      {
        ...(status !== undefined && { status }),
        ...(companyName !== undefined && { companyName }),
        ...(jobRole !== undefined && { jobRole }),
        ...(pkg !== undefined && { package: pkg }),
        ...(location !== undefined && { location }),
        ...(applicationDeadline !== undefined && { applicationDeadline }),
        ...(applicationLink !== undefined && { applicationLink }),
        ...(notes !== undefined && { notes }),
        ...(aiSummary !== undefined && { aiSummary }),
        ...(assessmentDate !== undefined && { assessmentDate }),
        ...(interviewDate !== undefined && { interviewDate }),
        ...(attachments !== undefined && { attachments }),
        ...(applicationHistory !== undefined && { applicationHistory }),
        ...(calendarEventId !== undefined && { calendarEventId }),
        ...(tags !== undefined && { tags }),
      },
      { returnDocument: 'after' }
    )

    if (!placement) {
      return NextResponse.json({ error: "Placement not found" }, { status: 404 })
    }

    await Promise.all([
      invalidateAnalyticsCache(access.effectiveUserId),
      invalidatePlacementCache(id),
      invalidateUserCache(access.effectiveUserId),
    ])

    return NextResponse.json({ 
      success: true, 
      placement 
    })
  } catch (error) {
    console.error("Error updating placement:", error)
    return NextResponse.json({ 
      error: "Failed to update placement",
      details: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 })
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    await connectDB()

    const { id } = await params

    const placement = await Placement.findOneAndDelete({
      _id: id,
      userId: session.user.id
    })

    if (!placement) {
      return NextResponse.json({ error: "Placement not found" }, { status: 404 })
    }

    await Promise.all([
      invalidateAnalyticsCache(session.user.id),
      invalidatePlacementCache(id),
      invalidateUserCache(session.user.id),
    ])

    return NextResponse.json({ 
      success: true, 
      message: "Placement deleted successfully"
    })
  } catch (error) {
    console.error("Error deleting placement:", error)
    return NextResponse.json({ 
      error: "Failed to delete placement",
      details: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 })
  }
}
