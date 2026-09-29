import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import connectDB from "@/lib/mongodb"
import Placement from "@/models/Placement"
import User from "@/models/User"
import { createCalendarService } from "@/lib/calendar-service"

export async function POST(request: Request) {
  try {
    const session = await auth()
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { placementIds, eventType } = body as {
      placementIds: string[]
      eventType: 'deadline' | 'assessment' | 'interview'
    }

    if (!placementIds || placementIds.length === 0) {
      return NextResponse.json({ error: "No placement IDs provided" }, { status: 400 })
    }

    if (!eventType) {
      return NextResponse.json({ error: "Event type is required" }, { status: 400 })
    }

    await connectDB()

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

    // Fetch all placements
    const placements = await Placement.find({
      _id: { $in: placementIds },
      userId: session.user.id
    })

    if (placements.length === 0) {
      return NextResponse.json({ error: "No placements found" }, { status: 404 })
    }

    const results = []
    let accessToken = user.googleTokens.accessToken

    for (const placement of placements) {
      try {
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
          results.push({
            placementId: placement._id,
            companyName: placement.companyName,
            success: false,
            error: "No date available for this event type"
          })
          continue
        }

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
              results.push({
                placementId: placement._id,
                companyName: placement.companyName,
                success: false,
                error: "Insufficient Google Calendar permissions"
              })
              continue
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

        await Placement.findByIdAndUpdate(placement._id, { 
          [updateField]: eventId,
          calendarSyncStatus: syncStatus
        })

        results.push({
          placementId: placement._id,
          companyName: placement.companyName,
          success: true,
          eventId
        })
      } catch (error) {
        console.error(`Error creating calendar event for placement ${placement._id}:`, error)
        results.push({
          placementId: placement._id,
          companyName: placement.companyName,
          success: false,
          error: error instanceof Error ? error.message : "Unknown error"
        })
      }
    }

    const successCount = results.filter(r => r.success).length
    const failureCount = results.filter(r => !r.success).length

    return NextResponse.json({ 
      success: true,
      results,
      summary: {
        total: results.length,
        successful: successCount,
        failed: failureCount
      }
    })
  } catch (error) {
    console.error("Error in bulk calendar creation:", error)
    return NextResponse.json({ 
      error: "Failed to create calendar events in bulk",
      details: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 })
  }
}
