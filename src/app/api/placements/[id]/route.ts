import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import connectDB from "@/lib/mongodb"
import Placement from "@/models/Placement"

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
      googleFormLink,
      attachments,
      applicationHistory,
      calendarEventId
    } = body

    await connectDB()

    const { id } = await params

    const placement = await Placement.findOneAndUpdate(
      { 
        _id: id,
        userId: session.user.id 
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
        ...(googleFormLink !== undefined && { googleFormLink }),
        ...(attachments !== undefined && { attachments }),
        ...(applicationHistory !== undefined && { applicationHistory }),
        ...(calendarEventId !== undefined && { calendarEventId }),
      },
      { returnDocument: 'after' }
    )

    if (!placement) {
      return NextResponse.json({ error: "Placement not found" }, { status: 404 })
    }

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
