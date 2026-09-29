"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Calendar, Clock, Loader2, CheckCircle2, XCircle, AlertTriangle } from "lucide-react"
import { toast } from "sonner"

interface Placement {
  _id: string
  companyName: string
  jobRole: string
  applicationDeadline?: Date
  assessmentDate?: Date
  interviewDate?: Date
}

interface BulkCalendarCreationProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  placements: Placement[]
  onCompleted?: () => void
}

export default function BulkCalendarCreation({
  open,
  onOpenChange,
  placements,
  onCompleted
}: BulkCalendarCreationProps) {
  const [eventType, setEventType] = useState<'deadline' | 'assessment' | 'interview'>('deadline')
  const [isCreating, setIsCreating] = useState(false)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [results, setResults] = useState<any[]>([])
  const [showResults, setShowResults] = useState(false)

  const handleCreate = async () => {
    if (placements.length === 0) {
      toast.error("No placements selected")
      return
    }

    try {
      setIsCreating(true)
      const response = await fetch('/api/placements/bulk/calendar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          placementIds: placements.map(p => p._id),
          eventType
        })
      })

      const data = await response.json()

      if (response.ok) {
        setResults(data.results)
        setShowResults(true)
        
        const { successful, failed } = data.summary
        if (failed === 0) {
          toast.success(`Successfully created ${successful} calendar events`)
        } else {
          toast.warning(`Created ${successful} events, ${failed} failed`)
        }
        
        onCompleted?.()
      } else {
        toast.error(data.error || "Failed to create calendar events")
      }
    } catch (error) {
      console.error("Error creating bulk calendar events:", error)
      toast.error("Failed to create calendar events")
    } finally {
      setIsCreating(false)
    }
  }

  const getEventTypeLabel = (type: string) => {
    switch (type) {
      case 'deadline': return 'Application Deadline'
      case 'assessment': return 'Online Assessment'
      case 'interview': return 'Interview Round'
      default: return type
    }
  }

  const getEventTypeIcon = (type: string) => {
    switch (type) {
      case 'deadline': return Clock
      case 'assessment': return Calendar
      case 'interview': return Calendar
      default: return Calendar
    }
  }

  const getPlacementsWithDate = () => {
    return placements.filter(p => {
      switch (eventType) {
        case 'deadline': return p.applicationDeadline
        case 'assessment': return p.assessmentDate
        case 'interview': return p.interviewDate
        default: return false
      }
    })
  }

  const validPlacements = getPlacementsWithDate()
  const Icon = getEventTypeIcon(eventType)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Bulk Calendar Event Creation
          </DialogTitle>
        </DialogHeader>

        {!showResults ? (
          <div className="flex-1 overflow-y-auto space-y-6 py-4">
            {/* Event Type Selection */}
            <div className="space-y-3">
              <Label className="text-sm font-semibold">Event Type</Label>
              <div className="grid grid-cols-3 gap-3">
                {(['deadline', 'assessment', 'interview'] as const).map((type) => {
                  const TypeIcon = getEventTypeIcon(type)
                  return (
                    <button
                      key={type}
                      onClick={() => setEventType(type)}
                      className={`p-4 rounded-xl border-2 transition-all ${
                        eventType === type
                          ? 'border-primary bg-primary/10'
                          : 'border-border hover:border-border/80 bg-muted/30'
                      }`}
                    >
                      <div className="flex flex-col items-center gap-2">
                        <TypeIcon className="h-5 w-5" />
                        <span className="text-xs font-medium">{getEventTypeLabel(type)}</span>
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Preview */}
            <div className="space-y-3">
              <Label className="text-sm font-semibold">
                Preview ({validPlacements.length} of {placements.length} placements have dates)
              </Label>
              <div className="max-h-60 overflow-y-auto space-y-2">
                {validPlacements.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground text-sm">
                    No placements have dates for this event type
                  </div>
                ) : (
                  validPlacements.map((placement) => (
                    <div
                      key={placement._id}
                      className="p-3 rounded-lg bg-muted/30 border border-border flex items-center gap-3"
                    >
                      <Icon className="h-4 w-4 text-muted-foreground shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{placement.companyName}</p>
                        <p className="text-xs text-muted-foreground truncate">{placement.jobRole}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {placements.length > validPlacements.length && (
              <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                  <p className="text-xs text-amber-800 dark:text-amber-200">
                    {placements.length - validPlacements.length} placement(s) will be skipped because they don&apos;t have a date for this event type.
                  </p>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto py-4">
            <div className="space-y-3">
              {results.map((result) => (
                <div
                  key={result.placementId}
                  className={`p-3 rounded-lg border flex items-center gap-3 ${
                    result.success
                      ? 'bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800'
                      : 'bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-800'
                  }`}
                >
                  {result.success ? (
                    <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400 shrink-0" />
                  ) : (
                    <XCircle className="h-4 w-4 text-red-600 dark:text-red-400 shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{result.companyName}</p>
                    {result.error && (
                      <p className="text-xs text-red-600 dark:text-red-400">{result.error}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <DialogFooter className="pt-4 border-t">
          {!showResults ? (
            <>
              <Button
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isCreating}
              >
                Cancel
              </Button>
              <Button
                onClick={handleCreate}
                disabled={isCreating || validPlacements.length === 0}
              >
                {isCreating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating Events...
                  </>
                ) : (
                  `Create ${validPlacements.length} Events`
                )}
              </Button>
            </>
          ) : (
            <Button onClick={() => onOpenChange(false)}>
              Done
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
