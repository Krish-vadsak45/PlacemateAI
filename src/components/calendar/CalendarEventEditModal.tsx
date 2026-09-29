"use client"

import { useState, useEffect, useMemo } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Checkbox } from "@/components/ui/checkbox"
import { Calendar as CalendarIcon, Clock, AlertTriangle, Loader2, CheckCircle2 } from "lucide-react"
import { format } from "date-fns"
import { toast } from "sonner"

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

interface CalendarEventEditModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  event: CalendarEvent | null
  placementId: string
  onEventUpdated?: () => void
}

export default function CalendarEventEditModal({
  open,
  onOpenChange,
  event,
  placementId,
  onEventUpdated
}: CalendarEventEditModalProps) {
  const [summary, setSummary] = useState("")
  const [description, setDescription] = useState("")
  const [startDate, setStartDate] = useState<Date | undefined>(undefined)
  const [startTime, setStartTime] = useState("")
  const [endDate, setEndDate] = useState<Date | undefined>(undefined)
  const [endTime, setEndTime] = useState("")
  const [reminderEmail, setReminderEmail] = useState(true)
  const [reminderPopup, setReminderPopup] = useState(true)
  const [reminderMinutes, setReminderMinutes] = useState("1440")
  const [isSaving, setIsSaving] = useState(false)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [conflicts, setConflicts] = useState<any[]>([])
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [isCheckingConflicts, setIsCheckingConflicts] = useState(false)

  // Initialize state from event prop when it changes
  const summaryValue = useMemo(() => event?.summary || "", [event])
  const descriptionValue = useMemo(() => event?.description || "", [event])
  const startDateTimeValue = useMemo(() => event?.start?.dateTime ? new Date(event.start.dateTime) : null, [event])
  const startDateValue = useMemo(() => event?.start?.date ? new Date(event.start.date) : null, [event])
  const endDateTimeValue = useMemo(() => event?.end?.dateTime ? new Date(event.end.dateTime) : null, [event])
  const endDateValue = useMemo(() => event?.end?.date ? new Date(event.end.date) : null, [event])

  useEffect(() => {
    if (event) {
      setSummary(summaryValue)
      setDescription(descriptionValue)
      
      if (startDateTimeValue) {
        setStartDate(startDateTimeValue)
        setStartTime(format(startDateTimeValue, "HH:mm"))
      } else if (startDateValue) {
        setStartDate(startDateValue)
      }

      if (endDateTimeValue) {
        setEndDate(endDateTimeValue)
        setEndTime(format(endDateTimeValue, "HH:mm"))
      } else if (endDateValue) {
        setEndDate(endDateValue)
      }

      if (event?.reminders?.useDefault) {
        setReminderEmail(true)
        setReminderPopup(true)
        setReminderMinutes("1440")
      } else if (event?.reminders?.overrides?.[0]) {
        setReminderEmail(event.reminders.overrides[0].method === "email")
        setReminderPopup(event.reminders.overrides[0].method === "popup")
        setReminderMinutes(event.reminders.overrides[0].minutes.toString())
      }
    }
  }, [summaryValue, descriptionValue, startDateTimeValue, startDateValue, endDateTimeValue, endDateValue, event])

  const checkConflicts = async () => {
    if (!startDate || !startTime || !endDate || !endTime) return

    try {
      setIsCheckingConflicts(true)
      const startDateTime = new Date(startDate)
      const [hours, minutes] = startTime.split(':').map(Number)
      startDateTime.setHours(hours, minutes, 0, 0)

      const endDateTime = new Date(endDate)
      const [endHours, endMinutes] = endTime.split(':').map(Number)
      endDateTime.setHours(endHours, endMinutes, 0, 0)

      const response = await fetch(`/api/placements/${placementId}/calendar/conflicts`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          eventType: event?.eventType,
          start: startDateTime.toISOString(),
          end: endDateTime.toISOString(),
        }),
      })

      const data = await response.json()
      if (response.ok) {
        setConflicts(data.conflicts || [])
      }
    } catch (error) {
      console.error("Error checking conflicts:", error)
    } finally {
      setIsCheckingConflicts(false)
    }
  }

  useEffect(() => {
    if (open && event) {
      checkConflicts()
    }
  }, [open, startDate, startTime, endDate, endTime, event, checkConflicts])

  const handleSave = async () => {
    if (!event) return

    try {
      setIsSaving(true)

      const startDateTime = new Date(startDate!)
      const [hours, minutes] = startTime.split(':').map(Number)
      startDateTime.setHours(hours, minutes, 0, 0)

      const endDateTime = new Date(endDate!)
      const [endHours, endMinutes] = endTime.split(':').map(Number)
      endDateTime.setHours(endHours, endMinutes, 0, 0)

      const reminders: { useDefault: boolean; overrides?: Array<{ method: string; minutes: number }> } = {
        useDefault: false,
      }

      if (reminderEmail || reminderPopup) {
        reminders.overrides = []
        if (reminderEmail) {
          reminders.overrides.push({ method: 'email', minutes: parseInt(reminderMinutes) })
        }
        if (reminderPopup) {
          reminders.overrides.push({ method: 'popup', minutes: parseInt(reminderMinutes) })
        }
      }

      const response = await fetch(`/api/placements/${placementId}/calendar`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          eventType: event.eventType,
          summary,
          description,
          start: { dateTime: startDateTime.toISOString() },
          end: { dateTime: endDateTime.toISOString() },
          reminders,
        }),
      })

      if (response.ok) {
        toast.success("Calendar event updated successfully")
        onOpenChange(false)
        onEventUpdated?.()
      } else {
        const data = await response.json()
        toast.error(data.error || "Failed to update calendar event")
      }
    } catch (error) {
      console.error("Error updating calendar event:", error)
      toast.error("Failed to update calendar event")
    } finally {
      setIsSaving(false)
    }
  }

  const getEventTypeLabel = (eventType: string) => {
    switch (eventType) {
      case 'deadline': return 'Application Deadline'
      case 'assessment': return 'Online Assessment'
      case 'interview': return 'Interview Round'
      default: return eventType
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CalendarIcon className="h-5 w-5" />
            <span>Edit {event ? getEventTypeLabel(event.eventType) : 'Calendar Event'}</span>
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-6 py-4">
          {/* Conflict Warning */}
          {conflicts.length > 0 && (
            <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800">
              <div className="flex items-start gap-2">
                <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                <div className="flex-1">
                  <h4 className="text-sm font-semibold text-amber-900 dark:text-amber-100 mb-2">
                    Scheduling Conflicts Detected
                  </h4>
                  <div className="space-y-2">
                    {conflicts.map((conflict) => (
                      <div key={conflict.id} className="text-xs text-amber-800 dark:text-amber-200">
                        <span className="font-medium">{conflict.summary}</span>
                        <span className="ml-2">
                          {conflict.start?.dateTime 
                            ? format(new Date(conflict.start.dateTime), "PPP p")
                            : conflict.start?.date ? format(new Date(conflict.start.date), "PPP") : 'No date'
                          }
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Event Title */}
          <div className="space-y-2">
            <Label className="text-sm font-semibold">Event Title</Label>
            <Input
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              placeholder="Event title"
              className="rounded-xl"
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label className="text-sm font-semibold">Description</Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Event description"
              rows={3}
              className="rounded-xl resize-none"
            />
          </div>

          {/* Date and Time */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-sm font-semibold">Start Date</Label>
              <Popover>
                <PopoverTrigger>
                  <Button
                    variant="outline"
                    className="w-full justify-start text-left rounded-xl"
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {startDate ? format(startDate, "PPP") : "Pick a date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={startDate}
                    onSelect={setStartDate}
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-semibold">Start Time</Label>
              <Input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="rounded-xl"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-semibold">End Date</Label>
              <Popover>
                <PopoverTrigger>
                  <Button
                    variant="outline"
                    className="w-full justify-start text-left rounded-xl"
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {endDate ? format(endDate, "PPP") : "Pick a date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={endDate}
                    onSelect={setEndDate}
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-semibold">End Time</Label>
              <Input
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="rounded-xl"
              />
            </div>
          </div>

          {/* Reminders */}
          <div className="space-y-3">
            <Label className="text-sm font-semibold flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Reminders
            </Label>
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <Checkbox
                  id="reminder-email"
                  checked={reminderEmail}
                  onCheckedChange={(checked) => setReminderEmail(checked as boolean)}
                />
                <Label htmlFor="reminder-email" className="text-sm cursor-pointer">
                  Email reminder
                </Label>
              </div>
              <div className="flex items-center gap-3">
                <Checkbox
                  id="reminder-popup"
                  checked={reminderPopup}
                  onCheckedChange={(checked) => setReminderPopup(checked as boolean)}
                />
                <Label htmlFor="reminder-popup" className="text-sm cursor-pointer">
                  Popup notification
                </Label>
              </div>
              <div className="flex items-center gap-2">
                <Label className="text-sm">Remind me</Label>
                <select
                  value={reminderMinutes}
                  onChange={(e) => setReminderMinutes(e.target.value)}
                  className="px-3 py-1.5 rounded-lg border border-border bg-background text-sm"
                >
                  <option value="5">5 minutes before</option>
                  <option value="15">15 minutes before</option>
                  <option value="30">30 minutes before</option>
                  <option value="60">1 hour before</option>
                  <option value="1440">1 day before</option>
                  <option value="2880">2 days before</option>
                </select>
              </div>
            </div>
          </div>

          {/* Sync Status */}
          {event && (
            <div className="p-3 rounded-lg bg-muted/50 border border-border">
              <div className="flex items-center gap-2 text-xs">
                {event.synced ? (
                  <>
                    <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
                    <span className="text-green-600 dark:text-green-400 font-medium">
                      Synced with Google Calendar
                    </span>
                  </>
                ) : (
                  <>
                    <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                    <span className="text-amber-600 dark:text-amber-400 font-medium">
                      Not synced
                    </span>
                  </>
                )}
                {event.lastSynced && (
                  <span className="text-muted-foreground ml-2">
                    Last synced: {format(new Date(event.lastSynced), "PPp")}
                  </span>
                )}
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="pt-4 border-t">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSaving}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={isSaving || !startDate || !startTime || !endDate || !endTime}
          >
            {isSaving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              "Save Changes"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
