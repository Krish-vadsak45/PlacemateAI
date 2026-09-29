import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import connectDB from "@/lib/mongodb"
import Placement from "@/models/Placement"
import User from "@/models/User"
import { createCalendarService } from "@/lib/calendar-service"
import { google } from 'googleapis'

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

    const accessToken = user.googleTokens.accessToken
    const oauth2Client = new google.auth.OAuth2()
    oauth2Client.setCredentials({ access_token: accessToken })
    
    const calendar = google.calendar({ version: 'v3', auth: oauth2Client })

    // Fetch all calendar events for this placement
    const eventTypes = ['deadline', 'assessment', 'interview']
    const events = []

    for (const eventType of eventTypes) {
      const eventField = {
        deadline: 'deadlineCalendarEventId',
        assessment: 'assessmentCalendarEventId',
        interview: 'interviewCalendarEventId'
      }[eventType] as keyof typeof placement

      const eventId = placement[eventField] as string | undefined

      if (eventId) {
        try {
          const response = await calendar.events.get({
            calendarId: 'primary',
            eventId: eventId,
          })

          const event = response.data
          events.push({
            id: event.id,
            eventType,
            summary: event.summary,
            description: event.description,
            start: event.start,
            end: event.end,
            reminders: event.reminders,
            synced: true,
            lastSynced: placement.updatedAt,
          })
        } catch (error: unknown) {
          // Event might have been deleted in Google Calendar
          events.push({
            id: eventId,
            eventType,
            synced: false,
            error: 'Event not found in Google Calendar',
          })
        }
      }
    }

    return NextResponse.json({ 
      events,
      syncStatus: placement.calendarSyncStatus || {}
    })
  } catch (error) {
    console.error("Error fetching calendar events:", error)
    return NextResponse.json({ 
      error: "Failed to fetch calendar events",
      details: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 })
  }
}

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
    } catch (error: unknown) {
      // If error is due to insufficient scopes or expired token, try refreshing
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      if ((error as any).message === 'INSUFFICIENT_SCOPES' || (error as any)?.code === 401) {
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

    // Update sync status
    const syncStatus = placement.calendarSyncStatus || {}
    syncStatus[eventType] = {
      synced: true,
      lastSynced: new Date()
    }

    await Placement.findByIdAndUpdate(id, { 
      [updateField]: eventId,
      calendarSyncStatus: syncStatus
    })

    return NextResponse.json({ 
      success: true, 
      eventId,
      message: "Calendar event created successfully",
      syncStatus: syncStatus[eventType]
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

export async function PUT(
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
    const { eventType, summary, description, start, end, reminders } = body as {
      eventType: 'deadline' | 'assessment' | 'interview'
      summary?: string
      description?: string
      start: { dateTime?: string; date?: string }
      end: { dateTime?: string; date?: string }
      reminders?: { useDefault: boolean; overrides?: Array<{ method: string; minutes: number }> }
    }
    
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

    const eventField = {
      deadline: 'deadlineCalendarEventId',
      assessment: 'assessmentCalendarEventId',
      interview: 'interviewCalendarEventId'
    }[eventType]

    const eventId = placement[eventField as keyof typeof placement] as string | undefined

    if (!eventId) {
      return NextResponse.json({ error: "No calendar event to update" }, { status: 400 })
    }

    let accessToken = user.googleTokens.accessToken
    let calendarService = createCalendarService(accessToken)

    try {
      await calendarService.updateCalendarEvent(eventId, {
        summary: summary || calendarService.createPlacementEvent(
          placement.companyName,
          placement.jobRole,
          new Date(start.dateTime || start.date!),
          eventType
        ).summary,
        description,
        start,
        end,
        reminders
      })
    } catch (error: unknown) {
      // If error is due to insufficient scopes or expired token, try refreshing
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      if ((error as any).message === 'INSUFFICIENT_SCOPES' || (error as any)?.code === 401) {
        try {
          accessToken = await refreshAccessToken()
          calendarService = createCalendarService(accessToken)
          await calendarService.updateCalendarEvent(eventId, {
            summary: summary || calendarService.createPlacementEvent(
              placement.companyName,
              placement.jobRole,
              new Date(start.dateTime || start.date!),
              eventType
            ).summary,
            description,
            start,
            end,
            reminders
          })
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

    // Update sync status
    const syncStatus = placement.calendarSyncStatus || {}
    syncStatus[eventType] = {
      synced: true,
      lastSynced: new Date()
    }

    await Placement.findByIdAndUpdate(id, { 
      calendarSyncStatus: syncStatus
    })

    return NextResponse.json({ 
      success: true, 
      message: "Calendar event updated successfully",
      syncStatus: syncStatus[eventType]
    })
  } catch (error) {
    console.error("Error updating calendar event:", error)
    
    // Check for insufficient scopes error
    if (error instanceof Error && error.message === 'INSUFFICIENT_SCOPES') {
      return NextResponse.json({ 
        error: "Insufficient Google Calendar permissions",
        details: "Please re-authenticate with Google to grant calendar access permissions",
        requiresReauth: true
      }, { status: 403 })
    }
    
    return NextResponse.json({ 
      error: "Failed to update calendar event",
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
    } catch (error: unknown) {
      // If error is due to insufficient scopes or expired token, try refreshing
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      if ((error as any).message === 'INSUFFICIENT_SCOPES' || (error as any)?.code === 401) {
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

    // Remove calendar event ID from placement and update sync status
    const syncStatus = placement.calendarSyncStatus || {}
    syncStatus[eventType] = {
      synced: false,
      lastSynced: new Date()
    }

    await Placement.findByIdAndUpdate(id, { 
      [eventField]: undefined,
      calendarSyncStatus: syncStatus
    })

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
