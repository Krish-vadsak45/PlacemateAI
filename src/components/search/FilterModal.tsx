"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { 
  Calendar as CalendarIcon, 
  X, 
  Filter, 
  Sparkles, 
  GraduationCap, 
  Briefcase, 
  Paperclip, 
  CalendarCheck,
  RotateCcw,
  Check
} from "lucide-react"
import { format, addDays } from "date-fns"
import { cn } from "@/lib/utils"

interface FilterModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  filters: any
  onFiltersChange: (filters: any) => void
  aggregations?: {
    status?: { [key: string]: number }
    company?: { [key: string]: number }
    location?: { [key: string]: number }
  }
}

const STATUS_OPTIONS = [
  { value: "NEW", label: "New", dotColor: "bg-zinc-400" },
  { value: "INTERESTED", label: "Interested", dotColor: "bg-zinc-400" },
  { value: "APPLIED", label: "Applied", dotColor: "bg-zinc-500" },
  { value: "ASSESSMENT_SCHEDULED", label: "Assessment", dotColor: "bg-amber-500" },
  { value: "INTERVIEW_SCHEDULED", label: "Interview", dotColor: "bg-amber-500" },
  { value: "SELECTED", label: "Selected", dotColor: "bg-emerald-500" },
  { value: "REJECTED", label: "Rejected", dotColor: "bg-rose-500" },
  { value: "NOT_INTERESTED", label: "Not Interested", dotColor: "bg-zinc-400" },
  { value: "EXPIRED", label: "Expired", dotColor: "bg-zinc-400" },
]

export default function FilterModal({
  open,
  onOpenChange,
  filters,
  onFiltersChange,
  aggregations,
}: FilterModalProps) {
  const [localFilters, setLocalFilters] = useState(filters)
  const [deadlineFrom, setDeadlineFrom] = useState<Date | undefined>(
    filters.deadlineFrom ? new Date(filters.deadlineFrom) : undefined
  )
  const [deadlineTo, setDeadlineTo] = useState<Date | undefined>(
    filters.deadlineTo ? new Date(filters.deadlineTo) : undefined
  )

  // Sync internal state when filters prop changes or modal opens
  useEffect(() => {
    if (open) {
      setLocalFilters(filters)
      setDeadlineFrom(filters.deadlineFrom ? new Date(filters.deadlineFrom) : undefined)
      setDeadlineTo(filters.deadlineTo ? new Date(filters.deadlineTo) : undefined)
    }
  }, [open, filters])

  const handleStatusToggle = (status: string) => {
    const currentStatuses = localFilters.status || []
    const exists = currentStatuses.includes(status)
    const newStatuses = exists
      ? currentStatuses.filter((s: string) => s !== status)
      : [...currentStatuses, status]
    setLocalFilters({ ...localFilters, status: newStatuses })
  }

  const handleSelectAllStatuses = () => {
    setLocalFilters({ ...localFilters, status: STATUS_OPTIONS.map(s => s.value) })
  }

  const handleClearStatuses = () => {
    setLocalFilters({ ...localFilters, status: [] })
  }

  const handleApply = () => {
    onFiltersChange({
      ...localFilters,
      deadlineFrom: deadlineFrom?.toISOString(),
      deadlineTo: deadlineTo?.toISOString(),
    })
    onOpenChange(false)
  }

  const handleReset = () => {
    const resetFilters = {
      status: [],
      company: [],
      location: [],
      cgpaMin: undefined,
      cgpaMax: undefined,
      matchScoreMin: undefined,
      matchScoreMax: undefined,
      deadlineFrom: undefined,
      deadlineTo: undefined,
      hasAttachments: undefined,
      hasCalendarEvent: undefined,
    }
    setLocalFilters(resetFilters)
    setDeadlineFrom(undefined)
    setDeadlineTo(undefined)
  }

  const handleDatePreset = (days: number) => {
    const now = new Date()
    setDeadlineFrom(now)
    setDeadlineTo(addDays(now, days))
  }

  const activeFilterCount = Object.keys(localFilters).filter(
    (key) =>
      key !== "q" &&
      key !== "sortBy" &&
      key !== "sortOrder" &&
      key !== "page" &&
      key !== "limit" &&
      localFilters[key as keyof typeof localFilters] !== undefined &&
      localFilters[key as keyof typeof localFilters] !== "" &&
      (Array.isArray(localFilters[key as keyof typeof localFilters])
        ? (localFilters[key as keyof typeof localFilters] as any[]).length > 0
        : true)
  ).length + (deadlineFrom || deadlineTo ? 1 : 0)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent 
        className="w-[95vw] sm:max-w-2xl max-h-[88vh] p-0 gap-0 overflow-hidden flex flex-col rounded-2xl bg-card border border-border shadow-2xl"
      >
        {/* MODAL HEADER */}
        <DialogHeader className="px-6 py-4 border-b border-border flex flex-row items-center justify-between gap-3 bg-muted/20">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-foreground flex items-center justify-center border border-border">
              <Filter className="h-4 w-4" />
            </div>
            <div>
              <DialogTitle className="text-base font-bold text-foreground tracking-tight">
                Advanced Filters
              </DialogTitle>
              <p className="text-xs text-muted-foreground">
                Refine drives by recruitment status, eligibility, and timelines
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 pr-6">
            {activeFilterCount > 0 && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-950">
                {activeFilterCount} active
              </span>
            )}
          </div>
        </DialogHeader>

        {/* MODAL BODY (SCROLLABLE) */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">
          
          {/* 1. APPLICATION STATUS FILTER */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                <Briefcase className="h-3.5 w-3.5" />
                <span>Application Status</span>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <button
                  type="button"
                  onClick={handleSelectAllStatuses}
                  className="text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                >
                  Select all
                </button>
                <span className="text-muted-foreground/40">•</span>
                <button
                  type="button"
                  onClick={handleClearStatuses}
                  className="text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                >
                  Clear
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {STATUS_OPTIONS.map((status) => {
                const isSelected = (localFilters.status || []).includes(status.value)
                const count = aggregations?.status?.[status.value]

                return (
                  <button
                    key={status.value}
                    type="button"
                    onClick={() => handleStatusToggle(status.value)}
                    className={cn(
                      "flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium border transition-all text-left cursor-pointer",
                      isSelected
                        ? "bg-zinc-900 text-white border-zinc-900 dark:bg-zinc-100 dark:text-zinc-950 dark:border-zinc-100 shadow-sm"
                        : "bg-muted/40 hover:bg-muted/80 text-foreground border-border"
                    )}
                  >
                    <div className="flex items-center gap-2 truncate">
                      <span className={cn("h-1.5 w-1.5 rounded-full shrink-0", isSelected ? "bg-white dark:bg-zinc-950" : status.dotColor)} />
                      <span className="truncate">{status.label}</span>
                    </div>
                    {count !== undefined && count > 0 && (
                      <span className={cn(
                        "text-[10px] px-1.5 py-0.5 rounded-md shrink-0 ml-1 font-mono",
                        isSelected ? "bg-white/20 text-white dark:bg-zinc-950/20 dark:text-zinc-950" : "bg-muted text-muted-foreground"
                      )}>
                        {count}
                      </span>
                    )}
                  </button>
                )
              })}
            </div>
          </div>

          <div className="h-px bg-border" />

          {/* 2. CRITERIA & SLIDERS (2-COLUMN GRID) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {/* CGPA Slider */}
            <div className="space-y-3 p-4 rounded-xl border border-border bg-muted/20">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
                  <GraduationCap className="h-4 w-4 text-muted-foreground" />
                  <span>Minimum CGPA</span>
                </div>
                <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-md bg-zinc-100 dark:bg-zinc-800 border border-border text-foreground">
                  {localFilters.cgpaMin ? `≥ ${localFilters.cgpaMin}` : "Any"}
                </span>
              </div>

              <Slider
                value={[localFilters.cgpaMin || 0]}
                onValueChange={(val) => {
                  const num = Array.isArray(val) ? val[0] : val
                  setLocalFilters({ ...localFilters, cgpaMin: num === 0 ? undefined : num })
                }}
                min={0}
                max={10}
                step={0.1}
                className="py-2 cursor-pointer"
              />

              {/* Preset buttons */}
              <div className="flex items-center gap-1.5 pt-1">
                {[
                  { label: "Any", val: undefined },
                  { label: "6.0+", val: 6.0 },
                  { label: "7.0+", val: 7.0 },
                  { label: "7.5+", val: 7.5 },
                  { label: "8.0+", val: 8.0 },
                ].map((preset) => {
                  const isActive = localFilters.cgpaMin === preset.val
                  return (
                    <button
                      key={preset.label}
                      type="button"
                      onClick={() => setLocalFilters({ ...localFilters, cgpaMin: preset.val })}
                      className={cn(
                        "flex-1 text-[11px] py-1 rounded-lg border transition-all cursor-pointer font-medium text-center",
                        isActive
                          ? "bg-zinc-900 text-white border-zinc-900 dark:bg-zinc-100 dark:text-zinc-950 dark:border-zinc-100 font-semibold"
                          : "bg-card hover:bg-muted text-muted-foreground hover:text-foreground border-border"
                      )}
                    >
                      {preset.label}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Match Score Slider */}
            <div className="space-y-3 p-4 rounded-xl border border-border bg-muted/20">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
                  <Sparkles className="h-4 w-4 text-muted-foreground" />
                  <span>Min AI Match Score</span>
                </div>
                <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-md bg-zinc-100 dark:bg-zinc-800 border border-border text-foreground">
                  {localFilters.matchScoreMin ? `≥ ${localFilters.matchScoreMin}%` : "Any"}
                </span>
              </div>

              <Slider
                value={[localFilters.matchScoreMin || 0]}
                onValueChange={(val) => {
                  const num = Array.isArray(val) ? val[0] : val
                  setLocalFilters({ ...localFilters, matchScoreMin: num === 0 ? undefined : num })
                }}
                min={0}
                max={100}
                step={5}
                className="py-2 cursor-pointer"
              />

              {/* Preset buttons */}
              <div className="flex items-center gap-1.5 pt-1">
                {[
                  { label: "Any", val: undefined },
                  { label: "50%+", val: 50 },
                  { label: "70%+", val: 70 },
                  { label: "80%+", val: 80 },
                  { label: "90%+", val: 90 },
                ].map((preset) => {
                  const isActive = localFilters.matchScoreMin === preset.val
                  return (
                    <button
                      key={preset.label}
                      type="button"
                      onClick={() => setLocalFilters({ ...localFilters, matchScoreMin: preset.val })}
                      className={cn(
                        "flex-1 text-[11px] py-1 rounded-lg border transition-all cursor-pointer font-medium text-center",
                        isActive
                          ? "bg-zinc-900 text-white border-zinc-900 dark:bg-zinc-100 dark:text-zinc-950 dark:border-zinc-100 font-semibold"
                          : "bg-card hover:bg-muted text-muted-foreground hover:text-foreground border-border"
                      )}
                    >
                      {preset.label}
                    </button>
                  )
                })}
              </div>
            </div>
          </div>

          <div className="h-px bg-border" />

          {/* 3. APPLICATION DEADLINE RANGE */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                <CalendarIcon className="h-3.5 w-3.5" />
                <span>Application Deadline Range</span>
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => handleDatePreset(7)}
                  className="text-xs px-2 py-0.5 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                >
                  Next 7 days
                </button>
                <button
                  type="button"
                  onClick={() => handleDatePreset(30)}
                  className="text-xs px-2 py-0.5 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                >
                  Next 30 days
                </button>
                {(deadlineFrom || deadlineTo) && (
                  <button
                    type="button"
                    onClick={() => {
                      setDeadlineFrom(undefined)
                      setDeadlineTo(undefined)
                    }}
                    className="text-xs px-2 py-0.5 rounded-md text-destructive hover:bg-destructive/10 transition-colors cursor-pointer"
                  >
                    Clear dates
                  </button>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* From Date */}
              <Popover>
                <PopoverTrigger
                  className={cn(
                    "flex items-center justify-between px-3.5 py-2.5 rounded-xl border text-xs font-medium transition-colors cursor-pointer bg-card hover:bg-muted/50",
                    deadlineFrom ? "border-zinc-900 dark:border-zinc-100 text-foreground" : "border-border text-muted-foreground"
                  )}
                >
                  <div className="flex items-center gap-2">
                    <CalendarIcon className="h-3.5 w-3.5 text-muted-foreground" />
                    <span>{deadlineFrom ? format(deadlineFrom, "PPP") : "Earliest deadline (From)"}</span>
                  </div>
                  {deadlineFrom && (
                    <span 
                      onClick={(e) => {
                        e.stopPropagation()
                        setDeadlineFrom(undefined)
                      }}
                      className="p-0.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground cursor-pointer"
                    >
                      <X className="h-3 w-3" />
                    </span>
                  )}
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={deadlineFrom}
                    onSelect={setDeadlineFrom}
                  />
                </PopoverContent>
              </Popover>

              {/* To Date */}
              <Popover>
                <PopoverTrigger
                  className={cn(
                    "flex items-center justify-between px-3.5 py-2.5 rounded-xl border text-xs font-medium transition-colors cursor-pointer bg-card hover:bg-muted/50",
                    deadlineTo ? "border-zinc-900 dark:border-zinc-100 text-foreground" : "border-border text-muted-foreground"
                  )}
                >
                  <div className="flex items-center gap-2">
                    <CalendarIcon className="h-3.5 w-3.5 text-muted-foreground" />
                    <span>{deadlineTo ? format(deadlineTo, "PPP") : "Latest deadline (To)"}</span>
                  </div>
                  {deadlineTo && (
                    <span 
                      onClick={(e) => {
                        e.stopPropagation()
                        setDeadlineTo(undefined)
                      }}
                      className="p-0.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground cursor-pointer"
                    >
                      <X className="h-3 w-3" />
                    </span>
                  )}
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={deadlineTo}
                    onSelect={setDeadlineTo}
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          <div className="h-px bg-border" />

          {/* 4. TOGGLE CARDS (ATTACHMENTS & CALENDAR) */}
          <div className="space-y-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Additional Criteria
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setLocalFilters({ ...localFilters, hasAttachments: !localFilters.hasAttachments })}
                className={cn(
                  "flex items-center gap-3 p-3.5 rounded-xl border text-left transition-all cursor-pointer",
                  localFilters.hasAttachments
                    ? "border-zinc-900 bg-zinc-100/70 dark:border-zinc-100 dark:bg-zinc-800/80"
                    : "border-border bg-card hover:bg-muted/40"
                )}
              >
                <div className={cn(
                  "h-8 w-8 rounded-lg flex items-center justify-center shrink-0 border",
                  localFilters.hasAttachments
                    ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-950 border-transparent"
                    : "bg-muted text-muted-foreground border-border"
                )}>
                  <Paperclip className="h-4 w-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-bold text-foreground">Has Attachment Files</div>
                  <div className="text-[11px] text-muted-foreground truncate">Includes job description or brochures</div>
                </div>
                {localFilters.hasAttachments && (
                  <Check className="h-4 w-4 text-foreground shrink-0" />
                )}
              </button>

              <button
                type="button"
                onClick={() => setLocalFilters({ ...localFilters, hasCalendarEvent: !localFilters.hasCalendarEvent })}
                className={cn(
                  "flex items-center gap-3 p-3.5 rounded-xl border text-left transition-all cursor-pointer",
                  localFilters.hasCalendarEvent
                    ? "border-zinc-900 bg-zinc-100/70 dark:border-zinc-100 dark:bg-zinc-800/80"
                    : "border-border bg-card hover:bg-muted/40"
                )}
              >
                <div className={cn(
                  "h-8 w-8 rounded-lg flex items-center justify-center shrink-0 border",
                  localFilters.hasCalendarEvent
                    ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-950 border-transparent"
                    : "bg-muted text-muted-foreground border-border"
                )}>
                  <CalendarCheck className="h-4 w-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-bold text-foreground">Calendar Event Synced</div>
                  <div className="text-[11px] text-muted-foreground truncate">Saved to Google Calendar</div>
                </div>
                {localFilters.hasCalendarEvent && (
                  <Check className="h-4 w-4 text-foreground shrink-0" />
                )}
              </button>
            </div>
          </div>

        </div>

        {/* MODAL FOOTER */}
        <DialogFooter className="px-6 py-3.5 border-t border-border bg-muted/20 flex flex-row items-center justify-between gap-3">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleReset}
            className="text-xs text-muted-foreground hover:text-foreground gap-1.5 h-9 rounded-xl cursor-pointer"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Reset all
          </Button>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onOpenChange(false)}
              className="text-xs h-9 rounded-xl border-border cursor-pointer px-4"
            >
              Cancel
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={handleApply}
              className="text-xs font-semibold h-9 rounded-xl bg-zinc-900 text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-950 dark:hover:bg-zinc-200 cursor-pointer px-5 shadow-sm"
            >
              Apply Filters
              {activeFilterCount > 0 && ` (${activeFilterCount})`}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
