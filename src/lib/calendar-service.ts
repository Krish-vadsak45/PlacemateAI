import { google } from 'googleapis'

export interface CalendarEvent {
  summary: string
  description?: string
  start: {
    dateTime?: string
    date?: string
  }
  end?: {
    dateTime?: string
    date?: string
  }
  reminders?: {
    useDefault: boolean
    overrides?: Array<{ method: string; minutes: number }>
  }
}

export class CalendarService {
  private accessToken: string

  constructor(accessToken: string) {
    this.accessToken = accessToken
  }

  async createCalendarEvent(event: CalendarEvent): Promise<string> {
    try {
      const auth = new google.auth.OAuth2()
      auth.setCredentials({ access_token: this.accessToken })
      
      const calendar = google.calendar({ version: 'v3', auth })
      
      const response = await calendar.events.insert({
        calendarId: 'primary',
        requestBody: event,
      })

      return response.data.id || ''
    } catch (error) {
      console.error('Error creating calendar event:', error)
      throw new Error('Failed to create calendar event')
    }
  }

  async updateCalendarEvent(eventId: string, event: CalendarEvent): Promise<void> {
    try {
      const auth = new google.auth.OAuth2()
      auth.setCredentials({ access_token: this.accessToken })
      
      const calendar = google.calendar({ version: 'v3', auth })
      
      await calendar.events.update({
        calendarId: 'primary',
        eventId: eventId,
        requestBody: event,
      })
    } catch (error) {
      console.error('Error updating calendar event:', error)
      throw new Error('Failed to update calendar event')
    }
  }

  async deleteCalendarEvent(eventId: string): Promise<void> {
    try {
      const auth = new google.auth.OAuth2()
      auth.setCredentials({ access_token: this.accessToken })
      
      const calendar = google.calendar({ version: 'v3', auth })
      
      await calendar.events.delete({
        calendarId: 'primary',
        eventId: eventId,
      })
    } catch (error) {
      console.error('Error deleting calendar event:', error)
      throw new Error('Failed to delete calendar event')
    }
  }

  createPlacementEvent(
    companyName: string,
    jobRole: string,
    date: Date,
    eventType: 'deadline' | 'assessment' | 'interview'
  ): CalendarEvent {
    const eventTitle = {
      deadline: `Application Deadline: ${companyName} - ${jobRole}`,
      assessment: `Assessment: ${companyName} - ${jobRole}`,
      interview: `Interview: ${companyName} - ${jobRole}`
    }[eventType]

    const description = `Placement opportunity for ${jobRole} at ${companyName}\n\nManage this placement in PlacemateAI`

    // Set reminder based on event type
    const reminderMinutes = {
      deadline: 1440, // 1 day before
      assessment: 60, // 1 hour before
      interview: 1440 // 1 day before
    }[eventType]

    return {
      summary: eventTitle,
      description,
      start: {
        dateTime: date.toISOString(),
      },
      end: {
        dateTime: new Date(date.getTime() + 60 * 60 * 1000).toISOString(), // 1 hour duration
      },
      reminders: {
        useDefault: false,
        overrides: [
          { method: 'email', minutes: reminderMinutes },
          { method: 'popup', minutes: reminderMinutes }
        ]
      }
    }
  }
}

export function createCalendarService(accessToken: string): CalendarService {
  return new CalendarService(accessToken)
}
