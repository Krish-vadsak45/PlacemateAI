"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { History, ChevronDown, ChevronUp, Clock, Plus, Edit, Trash2 } from "lucide-react"
import { format } from "date-fns"

interface HistoryEntry {
  _id: string
  eventType: 'deadline' | 'assessment' | 'interview'
  operation: 'create' | 'update' | 'delete'
  eventData: {
    summary?: string
    description?: string
    start?: { dateTime?: string; date?: string }
    end?: { dateTime?: string; date?: string }
    reminders?: { useDefault: boolean; overrides?: Array<{ method: string; minutes: number }> }
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  changes?: {
    field: string
    oldValue: any
    newValue: any
  }[]
  timestamp: string
}

interface EventHistoryProps {
  placementId: string
}

export default function EventHistory({ placementId }: EventHistoryProps) {
  const [history, setHistory] = useState<HistoryEntry[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [expandedEntries, setExpandedEntries] = useState<Set<string>>(new Set())
  const [filter, setFilter] = useState<'all' | 'create' | 'update' | 'delete'>('all')

  const fetchHistory = useCallback(async () => {
    try {
      setIsLoading(true)
      const url = filter === 'all'
        ? `/api/placements/${placementId}/calendar/history`
        : `/api/placements/${placementId}/calendar/history?operation=${filter}`

      const response = await fetch(url)
      const data = await response.json()

      if (response.ok) {
        setHistory(data.history || [])
      }
    } catch (error) {
      console.error("Error fetching event history:", error)
    } finally {
      setIsLoading(false)
    }
  }, [placementId, filter])

  useEffect(() => {
    fetchHistory()
  }, [placementId, filter, fetchHistory])

  const toggleEntry = (id: string) => {
    const newExpanded = new Set(expandedEntries)
    if (newExpanded.has(id)) {
      newExpanded.delete(id)
    } else {
      newExpanded.add(id)
    }
    setExpandedEntries(newExpanded)
  }

  const getOperationIcon = (operation: string) => {
    switch (operation) {
      case 'create': return Plus
      case 'update': return Edit
      case 'delete': return Trash2
      default: return Clock
    }
  }

  const getOperationColor = (operation: string) => {
    switch (operation) {
      case 'create': return 'text-green-600 dark:text-green-400'
      case 'update': return 'text-blue-600 dark:text-blue-400'
      case 'delete': return 'text-red-600 dark:text-red-400'
      default: return 'text-muted-foreground'
    }
  }

  const getOperationLabel = (operation: string) => {
    switch (operation) {
      case 'create': return 'Created'
      case 'update': return 'Updated'
      case 'delete': return 'Deleted'
      default: return operation
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

  if (isLoading) {
    return (
      <Card className="glass-panel border border-border">
        <CardHeader>
          <CardTitle className="text-sm font-bold flex items-center gap-2">
            <History className="h-4 w-4" />
            Event History
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="p-3 rounded-lg bg-muted/30 animate-pulse" />
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="glass-panel border border-border">
      <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <History className="h-4 w-4" />
              Event History
            </CardTitle>
            <div className="flex gap-1 bg-muted/50 p-1 rounded-lg">
              {(['all', 'create', 'update', 'delete'] as const).map((op) => (
                <Button
                  key={op}
                  variant={filter === op ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setFilter(op)}
                  className={`h-7 text-xs capitalize ${
                    filter === op 
                      ? "bg-background shadow-sm" 
                      : "hover:bg-background/50"
                  }`}
                >
                  {op}
                </Button>
              ))}
            </div>
          </div>
      </CardHeader>
      <CardContent>
        {history.length === 0 ? (
          <div className="text-center py-8">
            <History className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">No history yet</p>
          </div>
        ) : (
          <div className="space-y-2">
            {history.map((entry) => {
              const Icon = getOperationIcon(entry.operation)
              const isExpanded = expandedEntries.has(entry._id)
              
              return (
                <div
                  key={entry._id}
                  className="p-3 rounded-lg bg-muted/30 border border-border hover:bg-muted/50 transition-colors"
                >
                  <div
                    className="flex items-center justify-between gap-3 cursor-pointer"
                    onClick={() => toggleEntry(entry._id)}
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className={`p-1.5 rounded-lg bg-background border border-border ${getOperationColor(entry.operation)}`}>
                        <Icon className="h-3.5 w-3.5" />
                      </div>
                      <div className="flex-1 min-w-0 space-y-0.5">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={`text-xs font-semibold ${getOperationColor(entry.operation)}`}>
                            {getOperationLabel(entry.operation)}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {getEventTypeLabel(entry.eventType)}
                          </span>
                        </div>
                        <p className="text-[10px] text-muted-foreground">
                          {format(new Date(entry.timestamp), "PPp")}
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0 shrink-0"
                    >
                      {isExpanded ? (
                        <ChevronUp className="h-3.5 w-3.5" />
                      ) : (
                        <ChevronDown className="h-3.5 w-3.5" />
                      )}
                    </Button>
                  </div>

                  {isExpanded && (
                    <div className="mt-3 pt-3 border-t border-border space-y-2">
                      {entry.eventData.summary && (
                        <div className="text-xs">
                          <span className="font-medium text-muted-foreground">Title: </span>
                          <span className="text-foreground">{entry.eventData.summary}</span>
                        </div>
                      )}
                      {entry.eventData.start && (
                        <div className="text-xs">
                          <span className="font-medium text-muted-foreground">Start: </span>
                          <span className="text-foreground">
                            {entry.eventData.start.dateTime
                              ? format(new Date(entry.eventData.start.dateTime), "PPP p")
                              : format(new Date(entry.eventData.start.date!), "PPP")
                            }
                          </span>
                        </div>
                      )}
                      {entry.changes && entry.changes.length > 0 && (
                        <div className="space-y-1">
                          <p className="text-xs font-medium text-muted-foreground">Changes:</p>
                          {entry.changes.map((change, idx) => (
                            <div key={idx} className="text-xs p-2 rounded bg-background border border-border">
                              <span className="font-medium">{change.field}:</span>
                              <span className="text-red-600 dark:text-red-400 ml-2">
                                {JSON.stringify(change.oldValue)}
                              </span>
                              <span className="mx-2">→</span>
                              <span className="text-green-600 dark:text-green-400">
                                {JSON.stringify(change.newValue)}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
