"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Calendar, Clock, Edit, Trash2, AlertTriangle, CheckCircle2, XCircle, RefreshCw } from "lucide-react"
import { toast } from "sonner"
import { format } from "date-fns"
import CalendarEventEditModal from "./CalendarEventEditModal"

interface CalendarEvent {
  id: string
  eventType: 'deadline' | 'assessment' | 'interview'
  summary?: string
  description?: string
  start?: { dateTime?: string; date?: string }
  end?: { dateTime?: string; date?: string }
  reminders?: { useDefault: boolean; overrides?: Array<{ method: string; minutes: number }> }
  synced: boolean
  lastSynced?: string
  error?: string
}

interface CalendarEventsListProps {
  placementId: string
  onEventUpdated?: () => void
}

export default function CalendarEventsList({ placementId, onEventUpdated }: CalendarEventsListProps) {
  const [events, setEvents] = useState<CalendarEvent[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isDeleting, setIsDeleting] = useState<string | null>(null)
  const [showEditModal, setShowEditModal] = useState(false)
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null)

  const fetchEvents = async () => {
    try {
      setIsLoading(true)
      const response = await fetch(`/api/placements/${placementId}/calendar`)
      const data = await response.json()

      if (response.ok) {
        setEvents(data.events || [])
      } else {
        toast.error("Failed to fetch calendar events")
      }
    } catch (error) {
      console.error("Error fetching calendar events:", error)
      toast.error("Failed to fetch calendar events")
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchEvents()
  }, [placementId, fetchEvents])

  const handleDelete = async (eventId: string, eventType: string) => {
    if (!confirm("Are you sure you want to delete this calendar event?")) return

    try {
      setIsDeleting(eventId)
      const response = await fetch(`/api/placements/${placementId}/calendar`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ eventType }),
      })

      if (response.ok) {
        setEvents(events.filter(e => e.id !== eventId))
        toast.success("Calendar event deleted successfully")
        onEventUpdated?.()
      } else {
        toast.error("Failed to delete calendar event")
      }
    } catch (error) {
      console.error("Error deleting calendar event:", error)
      toast.error("Failed to delete calendar event")
    } finally {
      setIsDeleting(null)
    }
  }

  const handleEdit = (event: CalendarEvent) => {
    setSelectedEvent(event)
    setShowEditModal(true)
  }

  const getEventTypeLabel = (eventType: string) => {
    switch (eventType) {
      case 'deadline': return 'Application Deadline'
      case 'assessment': return 'Online Assessment'
      case 'interview': return 'Interview Round'
      default: return eventType
    }
  }

  const getEventTypeIcon = (eventType: string) => {
    switch (eventType) {
      case 'deadline': return Clock
      case 'assessment': return Calendar
      case 'interview': return Calendar
      default: return Calendar
    }
  }

  const formatDate = (dateObj?: { dateTime?: string; date?: string }) => {
    if (!dateObj) return "Not specified"
    const dateStr = dateObj.dateTime || dateObj.date
    if (!dateStr) return "Not specified"
    return format(new Date(dateStr), "PPP p")
  }

  const getSyncStatus = (event: CalendarEvent) => {
    if (event.error) {
      return (
        <div className="flex items-center gap-1.5 text-red-600 dark:text-red-400">
          <XCircle className="h-3.5 w-3.5" />
          <span className="text-[10px] font-medium">Sync Error</span>
        </div>
      )
    }
    if (event.synced) {
      return (
        <div className="flex items-center gap-1.5 text-green-600 dark:text-green-400">
          <CheckCircle2 className="h-3.5 w-3.5" />
          <span className="text-[10px] font-medium">Synced</span>
        </div>
      )
    }
    return (
      <div className="flex items-center gap-1.5 text-amber-600 dark:text-amber-400">
        <AlertTriangle className="h-3.5 w-3.5" />
        <span className="text-[10px] font-medium">Not Synced</span>
      </div>
    )
  }

  if (isLoading) {
    return (
      <Card className="glass-panel border border-border">
        <CardHeader>
          <CardTitle className="text-sm font-bold">Calendar Events</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="p-4 rounded-xl bg-muted/30 border border-border animate-pulse" />
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  if (events.length === 0) {
    return (
      <Card className="glass-panel border border-border">
        <CardHeader>
          <CardTitle className="text-sm font-bold">Calendar Events</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">No calendar events created yet</p>
            <p className="text-xs text-muted-foreground mt-1">Sync events from the placement details to get started</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      <Card className="glass-panel border border-border">
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <CardTitle className="text-sm font-bold">Calendar Events</CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={fetchEvents}
            className="h-7 text-xs gap-1"
          >
            <RefreshCw className="h-3 w-3" />
            Refresh
          </Button>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {events.map((event) => {
              const Icon = getEventTypeIcon(event.eventType)
              return (
                <div
                  key={event.id}
                  className="p-4 rounded-xl bg-muted/30 border border-border space-y-3"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      <div className="p-2 rounded-lg bg-card border border-border shrink-0">
                        <Icon className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <div className="flex-1 min-w-0 space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="text-sm font-semibold text-foreground">
                            {getEventTypeLabel(event.eventType)}
                          </h4>
                          {getSyncStatus(event)}
                        </div>
                        {event.summary && (
                          <p className="text-xs text-muted-foreground truncate">
                            {event.summary}
                          </p>
                        )}
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          <span>{formatDate(event.start)}</span>
                        </div>
                        {event.lastSynced && (
                          <div className="text-[10px] text-muted-foreground">
                            Last synced: {format(new Date(event.lastSynced), "PPp")}
                          </div>
                        )}
                        {event.error && (
                          <div className="text-[10px] text-red-600 dark:text-red-400">
                            {event.error}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(event)}
                        className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground"
                        title="Edit event"
                      >
                        <Edit className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(event.id, event.eventType)}
                        disabled={isDeleting === event.id}
                        className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
                        title="Delete event"
                      >
                        {isDeleting === event.id ? (
                          <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <Trash2 className="h-3.5 w-3.5" />
                        )}
                      </Button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      <CalendarEventEditModal
        open={showEditModal}
        onOpenChange={setShowEditModal}
        event={selectedEvent}
        placementId={placementId}
        onEventUpdated={() => {
          fetchEvents()
          onEventUpdated?.()
        }}
      />
    </>
  )
}
