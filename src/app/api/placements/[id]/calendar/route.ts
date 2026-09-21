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
    const { eventType } = body as { eventType: 'deadline' | 'assessment' | 'interview' }
    
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

    // Helper function to refresh access token
    const refreshAccessToken = async (): Promise<string> => {
      const refreshToken = user.googleTokens?.refreshToken
      if (!refreshToken) {
        throw new Error('No refresh token available')
      }

      const response = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          client_id: process.env.GOOGLE_CLIENT_ID!,
          client_secret: process.env.GOOGLE_CLIENT_SECRET!,
          refresh_token: refreshToken,
          grant_type: 'refresh_token',
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to refresh access token')
      }

      const data = await response.json()
      const newAccessToken = data.access_token

      // Update user's access token in database
      await User.findByIdAndUpdate(session.user.id, {
        "googleTokens.accessToken": newAccessToken,
      })

      return newAccessToken
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

    let accessToken = user.googleTokens.accessToken
    let calendarService = createCalendarService(accessToken)
    const event = calendarService.createPlacementEvent(
      placement.companyName,
      placement.jobRole,
      eventDate,
      eventType
    )

    let eventId: string
    try {
      eventId = await calendarService.createCalendarEvent(event)
    } catch (error: any) {
      // If error is due to insufficient scopes or expired token, try refreshing
      if (error.message === 'INSUFFICIENT_SCOPES' || error?.code === 401) {
        try {
          accessToken = await refreshAccessToken()
          calendarService = createCalendarService(accessToken)
          eventId = await calendarService.createCalendarEvent(event)
        } catch (refreshError) {
          console.error('Token refresh failed:', refreshError)
          return NextResponse.json({ 
            error: "Insufficient Google Calendar permissions",
            details: "Please sign out and sign in again to grant calendar access permissions",
            requiresReauth: true
          }, { status: 403 })
        }
      } else {
        throw error
      }
    }

    // Update placement with calendar event ID based on event type
    const updateField = {
      deadline: 'deadlineCalendarEventId',
      assessment: 'assessmentCalendarEventId',
      interview: 'interviewCalendarEventId'
    }[eventType]

    await Placement.findByIdAndUpdate(id, { [updateField]: eventId })

    return NextResponse.json({ 
      success: true, 
      eventId,
      message: "Calendar event created successfully"
    })
  } catch (error) {
    console.error("Error creating calendar event:", error)
    
    // Check for insufficient scopes error
    if (error instanceof Error && error.message === 'INSUFFICIENT_SCOPES') {
      return NextResponse.json({ 
        error: "Insufficient Google Calendar permissions",
        details: "Please re-authenticate with Google to grant calendar access permissions",
        requiresReauth: true
      }, { status: 403 })
    }
    
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
    const body = await request.json()
    const { eventType } = body as { eventType: 'deadline' | 'assessment' | 'interview' }
    
    await connectDB()
    
    const placement = await Placement.findOne({
      _id: id,
      userId: session.user.id
    })

    if (!placement) {
      return NextResponse.json({ error: "Placement not found" }, { status: 404 })
    }

    const eventField = {
      deadline: 'deadlineCalendarEventId',
      assessment: 'assessmentCalendarEventId',
      interview: 'interviewCalendarEventId'
    }[eventType]

    const eventId = placement[eventField as keyof typeof placement] as string | undefined

    if (!eventId) {
      return NextResponse.json({ error: "No calendar event to delete" }, { status: 400 })
    }

    const user = await User.findById(session.user.id)
    if (!user?.googleTokens?.accessToken) {
      return NextResponse.json({ error: "Google Calendar access not authorized" }, { status: 400 })
    }

    // Helper function to refresh access token
    const refreshAccessToken = async (): Promise<string> => {
      const refreshToken = user.googleTokens?.refreshToken
      if (!refreshToken) {
        throw new Error('No refresh token available')
      }

      const response = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          client_id: process.env.GOOGLE_CLIENT_ID!,
          client_secret: process.env.GOOGLE_CLIENT_SECRET!,
          refresh_token: refreshToken,
          grant_type: 'refresh_token',
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to refresh access token')
      }

      const data = await response.json()
      const newAccessToken = data.access_token

      // Update user's access token in database
      await User.findByIdAndUpdate(session.user.id, {
        "googleTokens.accessToken": newAccessToken,
      })

      return newAccessToken
    }

    let accessToken = user.googleTokens.accessToken
    let calendarService = createCalendarService(accessToken)

    try {
      await calendarService.deleteCalendarEvent(eventId)
    } catch (error: any) {
      // If error is due to insufficient scopes or expired token, try refreshing
      if (error.message === 'INSUFFICIENT_SCOPES' || error?.code === 401) {
        try {
          accessToken = await refreshAccessToken()
          calendarService = createCalendarService(accessToken)
          await calendarService.deleteCalendarEvent(eventId)
        } catch (refreshError) {
          console.error('Token refresh failed:', refreshError)
          return NextResponse.json({
            error: "Insufficient Google Calendar permissions",
            details: "Please sign out and sign in again to grant calendar access permissions",
            requiresReauth: true
          }, { status: 403 })
        }
      } else {
        throw error
      }
    }

    // Remove calendar event ID from placement
    await Placement.findByIdAndUpdate(id, { [eventField]: undefined })

    return NextResponse.json({ 
      success: true, 
      message: "Calendar event deleted successfully"
    })
  } catch (error) {
    console.error("Error deleting calendar event:", error)
    
    // Check for insufficient scopes error
    if (error instanceof Error && error.message === 'INSUFFICIENT_SCOPES') {
      return NextResponse.json({ 
        error: "Insufficient Google Calendar permissions",
        details: "Please re-authenticate with Google to grant calendar access permissions",
        requiresReauth: true
      }, { status: 403 })
    }
    
    return NextResponse.json({ 
      error: "Failed to delete calendar event",
      details: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 })
  }
}
