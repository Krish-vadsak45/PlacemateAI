"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Slider } from "@/components/ui/slider"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar as CalendarIcon, X, Filter, Sparkles, Target, Briefcase } from "lucide-react"
import { format } from "date-fns"
import { cn } from "cn"

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
  { value: "NEW", label: "New", color: "bg-blue-500" },
  { value: "INTERESTED", label: "Interested", color: "bg-purple-500" },
  { value: "APPLIED", label: "Applied", color: "bg-green-500" },
  { value: "ASSESSMENT_SCHEDULED", label: "Assessment", color: "bg-orange-500" },
  { value: "INTERVIEW_SCHEDULED", label: "Interview", color: "bg-yellow-500" },
  { value: "REJECTED", label: "Rejected", color: "bg-red-500" },
  { value: "SELECTED", label: "Selected", color: "bg-emerald-500" },
  { value: "NOT_INTERESTED", label: "Not Interested", color: "bg-gray-500" },
  { value: "EXPIRED", label: "Expired", color: "bg-slate-500" },
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

  const handleStatusChange = (status: string, checked: boolean) => {
    const currentStatuses = localFilters.status || []
    const newStatuses = checked
      ? [...currentStatuses, status]
      : currentStatuses.filter((s: string) => s !== status)
    setLocalFilters({ ...localFilters, status: newStatuses })
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
  ).length

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-hidden flex flex-col" style={{ maxWidth: '1400px', width: '1400px' }}>
        <DialogHeader className="pb-4 border-b">
          <DialogTitle className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800">
              <Filter className="h-5 w-5 text-gray-700 dark:text-gray-300" />
            </div>
            <div className="flex-1">
              <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                Filter Placements
              </div>
              {activeFilterCount > 0 && (
                <div className="text-sm text-muted-foreground">
                  {activeFilterCount} active filter{activeFilterCount !== 1 ? 's' : ''}
                </div>
              )}
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto py-6 space-y-8">
          {/* Status Filter */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Briefcase className="h-5 w-5 text-gray-500" />
              <Label className="text-base font-semibold">Application Status</Label>
            </div>
            <div className="grid grid-cols-3 gap-3">
              {STATUS_OPTIONS.map((status) => (
                <div
                  key={status.value}
                  className={cn(
                    "relative flex items-center gap-3 p-3 rounded-lg border-2 cursor-pointer transition-all hover:shadow-md",
                    (localFilters.status || []).includes(status.value)
                      ? "border-gray-900 bg-gray-50 dark:border-gray-100 dark:bg-gray-800"
                      : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600"
                  )}
                  onClick={() => handleStatusChange(status.value, !(localFilters.status || []).includes(status.value))}
                >
                  <Checkbox
                    id={`status-${status.value}`}
                    checked={(localFilters.status || []).includes(status.value)}
                    onCheckedChange={(checked) => handleStatusChange(status.value, checked as boolean)}
                    className="pointer-events-none"
                  />
                  <div className="flex-1">
                    <Label
                      htmlFor={`status-${status.value}`}
                      className="text-sm font-medium cursor-pointer pointer-events-none"
                    >
                      {status.label}
                    </Label>
                  </div>
                  <div className={cn("w-2 h-2 rounded-full", status.color)} />
                </div>
              ))}
            </div>
          </div>

          {/* CGPA Range */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Target className="h-5 w-5 text-gray-500" />
              <Label className="text-base font-semibold">CGPA Range</Label>
            </div>
            <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
              <div className="flex justify-between mb-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                    {localFilters.cgpaMin || 0}
                  </div>
                  <div className="text-xs text-muted-foreground uppercase tracking-wide">Min</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                    {localFilters.cgpaMax || 10}
                  </div>
                  <div className="text-xs text-muted-foreground uppercase tracking-wide">Max</div>
                </div>
              </div>
              <Slider
                value={[localFilters.cgpaMin || 0, localFilters.cgpaMax || 10] as [number, number]}
                onValueChange={(value: number | readonly number[]) => {
                  const arr = Array.isArray(value) ? value : [value]
                  setLocalFilters({ ...localFilters, cgpaMin: arr[0], cgpaMax: arr[1] })
                }}
                min={0}
                max={10}
                step={0.1}
                className="py-4"
              />
            </div>
          </div>

          {/* Match Score Range */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-gray-500" />
              <Label className="text-base font-semibold">Match Score Range</Label>
            </div>
            <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
              <div className="flex justify-between mb-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                    {localFilters.matchScoreMin || 0}%
                  </div>
                  <div className="text-xs text-muted-foreground uppercase tracking-wide">Min</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                    {localFilters.matchScoreMax || 100}%
                  </div>
                  <div className="text-xs text-muted-foreground uppercase tracking-wide">Max</div>
                </div>
              </div>
              <Slider
                value={[localFilters.matchScoreMin || 0, localFilters.matchScoreMax || 100] as [number, number]}
                onValueChange={(value: number | readonly number[]) => {
                  const arr = Array.isArray(value) ? value : [value]
                  setLocalFilters({ ...localFilters, matchScoreMin: arr[0], matchScoreMax: arr[1] })
                }}
                min={0}
                max={100}
                step={5}
                className="py-4"
              />
            </div>
          </div>

          {/* Deadline Range */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <CalendarIcon className="h-5 w-5 text-gray-500" />
              <Label className="text-base font-semibold">Application Deadline Range</Label>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Popover>
                <PopoverTrigger className={cn(
                  "inline-flex items-center justify-center rounded-xl border-2 px-4 py-3 text-sm font-medium transition-all hover:shadow-md flex-1",
                  deadlineFrom
                    ? "border-gray-900 bg-gray-50 dark:border-gray-100 dark:bg-gray-800"
                    : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600"
                )}>
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {deadlineFrom ? format(deadlineFrom, "PPP") : "From Date"}
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={deadlineFrom}
                    onSelect={setDeadlineFrom}
                  />
                </PopoverContent>
              </Popover>
              <Popover>
                <PopoverTrigger className={cn(
                  "inline-flex items-center justify-center rounded-xl border-2 px-4 py-3 text-sm font-medium transition-all hover:shadow-md flex-1",
                  deadlineTo
                    ? "border-gray-900 bg-gray-50 dark:border-gray-100 dark:bg-gray-800"
                    : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600"
                )}>
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {deadlineTo ? format(deadlineTo, "PPP") : "To Date"}
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
            {(deadlineFrom || deadlineTo) && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setDeadlineFrom(undefined)
                  setDeadlineTo(undefined)
                }}
                className="w-full"
              >
                <X className="h-4 w-4 mr-2" />
                Clear Date Range
              </Button>
            )}
          </div>

          {/* Boolean Filters */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-gray-500" />
              <Label className="text-base font-semibold">Additional Filters</Label>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div
                className={cn(
                  "flex items-center gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all hover:shadow-md",
                  localFilters.hasAttachments === true
                    ? "border-gray-900 bg-gray-50 dark:border-gray-100 dark:bg-gray-800"
                    : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600"
                )}
                onClick={() => setLocalFilters({ ...localFilters, hasAttachments: !localFilters.hasAttachments })}
              >
                <Checkbox
                  id="hasAttachments"
                  checked={localFilters.hasAttachments === true}
                  onCheckedChange={(checked) =>
                    setLocalFilters({ ...localFilters, hasAttachments: checked as boolean })
                  }
                  className="pointer-events-none"
                />
                <Label htmlFor="hasAttachments" className="text-sm font-medium cursor-pointer pointer-events-none">
                  Has Attachments
                </Label>
              </div>
              <div
                className={cn(
                  "flex items-center gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all hover:shadow-md",
                  localFilters.hasCalendarEvent === true
                    ? "border-gray-900 bg-gray-50 dark:border-gray-100 dark:bg-gray-800"
                    : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600"
                )}
                onClick={() => setLocalFilters({ ...localFilters, hasCalendarEvent: !localFilters.hasCalendarEvent })}
              >
                <Checkbox
                  id="hasCalendarEvent"
                  checked={localFilters.hasCalendarEvent === true}
                  onCheckedChange={(checked) =>
                    setLocalFilters({ ...localFilters, hasCalendarEvent: checked as boolean })
                  }
                  className="pointer-events-none"
                />
                <Label htmlFor="hasCalendarEvent" className="text-sm font-medium cursor-pointer pointer-events-none">
                  Has Calendar Event
                </Label>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter className="pt-4 border-t flex justify-between gap-4">
          <Button
            variant="outline"
            onClick={handleReset}
            className="flex-1"
          >
            Reset All
          </Button>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleApply}
              className="bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 hover:bg-gray-800 dark:hover:bg-gray-200"
            >
              Apply Filters
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
