import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import connectDB from "@/lib/mongodb"
import Placement from "@/models/Placement"
import User from "@/models/User"
import { google } from 'googleapis'

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
    const { eventType, start, end } = body as {
      eventType: 'deadline' | 'assessment' | 'interview'
      start: string
      end: string
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

    let accessToken = user.googleTokens.accessToken
    const oauth2Client = new google.auth.OAuth2()
    oauth2Client.setCredentials({ access_token: accessToken })
    
    const calendar = google.calendar({ version: 'v3', auth: oauth2Client })

    // Query Google Calendar for events in the time range
    const timeMin = new Date(start).toISOString()
    const timeMax = new Date(end).toISOString()

    try {
      const response = await calendar.events.list({
        calendarId: 'primary',
        timeMin,
        timeMax,
        singleEvents: true,
        orderBy: 'startTime',
      })

      const events = response.data.items || []
      
      // Filter out the current event if it already exists
      const eventField = {
        deadline: 'deadlineCalendarEventId',
        assessment: 'assessmentCalendarEventId',
        interview: 'interviewCalendarEventId'
      }[eventType] as keyof typeof placement

      const currentEventId = placement[eventField] as string | undefined

      // Deduplicate events by ID and filter out current event
      const uniqueEvents = new Map()
      for (const event of events) {
        if (event.id && event.id !== currentEventId) {
          uniqueEvents.set(event.id, event)
        }
      }

      const conflicts = Array.from(uniqueEvents.values())
        .map(event => ({
          id: event.id,
          summary: event.summary,
          start: event.start,
          end: event.end,
          description: event.description,
        }))

      return NextResponse.json({ 
        conflicts,
        hasConflicts: conflicts.length > 0
      })
    } catch (error: unknown) {
      // If error is due to insufficient scopes or expired token, try refreshing
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      if ((error as any).message === 'INSUFFICIENT_SCOPES' || (error as any)?.code === 401) {
        try {
          accessToken = await refreshAccessToken()
          const oauth2Client = new google.auth.OAuth2()
          oauth2Client.setCredentials({ access_token: accessToken })
          const calendar = google.calendar({ version: 'v3', auth: oauth2Client })

          const response = await calendar.events.list({
            calendarId: 'primary',
            timeMin,
            timeMax,
            singleEvents: true,
            orderBy: 'startTime',
          })

          const events = response.data.items || []
          
          const eventField = {
            deadline: 'deadlineCalendarEventId',
            assessment: 'assessmentCalendarEventId',
            interview: 'interviewCalendarEventId'
          }[eventType] as keyof typeof placement

          const currentEventId = placement[eventField] as string | undefined

          // Deduplicate events by ID and filter out current event
          const uniqueEvents = new Map()
          for (const event of events) {
            if (event.id && event.id !== currentEventId) {
              uniqueEvents.set(event.id, event)
            }
          }

          const conflicts = Array.from(uniqueEvents.values())
            .map(event => ({
              id: event.id,
              summary: event.summary,
              start: event.start,
              end: event.end,
              description: event.description,
            }))

          return NextResponse.json({ 
            conflicts,
            hasConflicts: conflicts.length > 0
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
  } catch (error) {
    console.error("Error detecting conflicts:", error)
    return NextResponse.json({ 
      error: "Failed to detect conflicts",
      details: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 })
  }
}
