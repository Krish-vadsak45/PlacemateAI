import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import connectDB from "@/lib/mongodb"
import Placement from "@/models/Placement"
import User from "@/models/User"
import { createCalendarService } from "@/lib/calendar-service"

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params
    const body = await request.json()
    const { eventType } = body // 'deadline', 'assessment', or 'interview'
    
    await connectDB()
    
    const placement = await Placement.findOne({
      _id: id,
      userId: session.user.id
    })

    if (!placement) {
      return NextResponse.json({ error: "Placement not found" }, { status: 404 })
    }

    const user = await User.findById(session.user.id)
    if (!user?.googleTokens?.accessToken) {
      return NextResponse.json({ error: "Google Calendar access not authorized" }, { status: 400 })
    }

    // Determine date based on event type
    let eventDate: Date | undefined
    switch (eventType) {
      case 'deadline':
        eventDate = placement.applicationDeadline ? new Date(placement.applicationDeadline) : undefined
        break
      case 'assessment':
        eventDate = placement.assessmentDate ? new Date(placement.assessmentDate) : undefined
        break
      case 'interview':
        eventDate = placement.interviewDate ? new Date(placement.interviewDate) : undefined
        break
    }

    if (!eventDate) {
      return NextResponse.json({ error: "No date available for this event type" }, { status: 400 })
    }

    const calendarService = createCalendarService(user.googleTokens.accessToken)
    const event = calendarService.createPlacementEvent(
      placement.companyName,
      placement.jobRole,
      eventDate,
      eventType
    )

    const eventId = await calendarService.createCalendarEvent(event)

    // Update placement with calendar event ID
    await Placement.findByIdAndUpdate(id, { calendarEventId: eventId })

    return NextResponse.json({ 
      success: true, 
      eventId,
      message: "Calendar event created successfully"
    })
  } catch (error) {
    console.error("Error creating calendar event:", error)
    return NextResponse.json({ 
      error: "Failed to create calendar event",
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

    const { id } = await params
    
    await connectDB()
    
    const placement = await Placement.findOne({
      _id: id,
      userId: session.user.id
    })

    if (!placement) {
      return NextResponse.json({ error: "Placement not found" }, { status: 404 })
    }

    if (!placement.calendarEventId) {
      return NextResponse.json({ error: "No calendar event to delete" }, { status: 400 })
    }

    const user = await User.findById(session.user.id)
    if (!user?.googleTokens?.accessToken) {
      return NextResponse.json({ error: "Google Calendar access not authorized" }, { status: 400 })
    }

    const calendarService = createCalendarService(user.googleTokens.accessToken)
    await calendarService.deleteCalendarEvent(placement.calendarEventId)

    // Remove calendar event ID from placement
    await Placement.findByIdAndUpdate(id, { calendarEventId: undefined })

    return NextResponse.json({ 
      success: true, 
      message: "Calendar event deleted successfully"
    })
  } catch (error) {
    console.error("Error deleting calendar event:", error)
    return NextResponse.json({ 
      error: "Failed to delete calendar event",
      details: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 })
  }
}
