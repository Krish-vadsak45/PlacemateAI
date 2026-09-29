"use client"

import { useEffect, useState, useRef, useCallback } from "react"
import { useSession } from "next-auth/react"
import { useSearchParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { 
  ExternalLink, 
  Trash2, 
  Filter, 
  ChevronLeft, 
  ChevronRight, 
  Sparkles, 
  DollarSign, 
  MapPin, 
  Clock,
  ArrowRight,
  Briefcase
} from "lucide-react"
import { toast } from "sonner"
import SearchInput from "@/components/search/SearchInput"
import FilterModal from "@/components/search/FilterModal"
import QuickFilters from "@/components/search/QuickFilters"
import Link from "next/link"

interface Placement {
  _id: string
  companyName: string
  jobRole: string
  package?: string
  location?: string
  applicationDeadline?: string
  status: string
  emailSubject?: string
  emailFrom?: string
  emailDate?: string
  extractionConfidence: number
  applicationLink?: string
  createdAt: string
  matchScore?: number
}

export default function PlacementList() {
  const { data: session } = useSession()
  const searchParams = useSearchParams()
  const router = useRouter()
  const [placements, setPlacements] = useState<Placement[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '')
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [filters, setFilters] = useState<any>({})
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false)
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(parseInt(searchParams.get('page') || '1'))
  const [limit] = useState(20)
  const isUpdatingUrl = useRef(false)

  // Sync URL params to state on mount
  useEffect(() => {
    if (isUpdatingUrl.current) return
    
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const urlFilters: any = {}
    if (searchParams.get('status')) urlFilters.status = searchParams.get('status')?.split(',')
    if (searchParams.get('cgpaMin')) urlFilters.cgpaMin = parseFloat(searchParams.get('cgpaMin')!)
    if (searchParams.get('cgpaMax')) urlFilters.cgpaMax = parseFloat(searchParams.get('cgpaMax')!)
    if (searchParams.get('matchScoreMin')) urlFilters.matchScoreMin = parseInt(searchParams.get('matchScoreMin')!)
    if (searchParams.get('matchScoreMax')) urlFilters.matchScoreMax = parseInt(searchParams.get('matchScoreMax')!)
    if (searchParams.get('deadlineFrom')) urlFilters.deadlineFrom = searchParams.get('deadlineFrom')
    if (searchParams.get('deadlineTo')) urlFilters.deadlineTo = searchParams.get('deadlineTo')
    if (searchParams.get('hasAttachments')) urlFilters.hasAttachments = searchParams.get('hasAttachments') === 'true'
    if (searchParams.get('hasCalendarEvent')) urlFilters.hasCalendarEvent = searchParams.get('hasCalendarEvent') === 'true'
    
    setFilters(urlFilters)
  }, [searchParams])

  // Update URL when filters change
  useEffect(() => {
    if (isUpdatingUrl.current) {
      isUpdatingUrl.current = false
      return
    }

    const params = new URLSearchParams()
    if (searchQuery) params.set('q', searchQuery)
    if (filters.status?.length) params.set('status', filters.status.join(','))
    if (filters.cgpaMin) params.set('cgpaMin', filters.cgpaMin.toString())
    if (filters.cgpaMax) params.set('cgpaMax', filters.cgpaMax.toString())
    if (filters.matchScoreMin) params.set('matchScoreMin', filters.matchScoreMin.toString())
    if (filters.matchScoreMax) params.set('matchScoreMax', filters.matchScoreMax.toString())
    if (filters.deadlineFrom) params.set('deadlineFrom', filters.deadlineFrom)
    if (filters.deadlineTo) params.set('deadlineTo', filters.deadlineTo)
    if (filters.hasAttachments !== undefined) params.set('hasAttachments', filters.hasAttachments.toString())
    if (filters.hasCalendarEvent !== undefined) params.set('hasCalendarEvent', filters.hasCalendarEvent.toString())
    if (page > 1) params.set('page', page.toString())

    const queryString = params.toString()
    isUpdatingUrl.current = true
    router.push(queryString ? `?${queryString}` : window.location.pathname, { scroll: false })
  }, [searchQuery, filters, page, router])

  const fetchPlacements = useCallback(async () => {
    try {
      setIsLoading(true)
      const params = new URLSearchParams()
      if (searchQuery) params.set('q', searchQuery)
      if (filters.status?.length) params.set('status', filters.status.join(','))
      if (filters.cgpaMin) params.set('cgpaMin', filters.cgpaMin.toString())
      if (filters.cgpaMax) params.set('cgpaMax', filters.cgpaMax.toString())
      if (filters.matchScoreMin) params.set('matchScoreMin', filters.matchScoreMin.toString())
      if (filters.matchScoreMax) params.set('matchScoreMax', filters.matchScoreMax.toString())
      if (filters.deadlineFrom) params.set('deadlineFrom', filters.deadlineFrom)
      if (filters.deadlineTo) params.set('deadlineTo', filters.deadlineTo)
      if (filters.hasAttachments !== undefined) params.set('hasAttachments', filters.hasAttachments.toString())
      if (filters.hasCalendarEvent !== undefined) params.set('hasCalendarEvent', filters.hasCalendarEvent.toString())
      params.set('page', page.toString())
      params.set('limit', limit.toString())

      const response = await fetch(`/api/placements/search?${params.toString()}`)
      const data = await response.json()
      
      if (response.ok) {
        setPlacements(data.placements || [])
        setTotal(data.total || 0)
      } else {
        toast.error("Failed to fetch placements")
      }
    } catch (error) {
      console.error("Error fetching placements:", error)
      toast.error("Failed to fetch placements")
    } finally {
      setIsLoading(false)
    }
  }, [searchQuery, filters, page, limit])

  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    if (session?.user?.id) {
      fetchPlacements().catch(console.error)
    }
  }, [session, fetchPlacements])
  /* eslint-enable react-hooks/set-state-in-effect */

  const handleQuickFilter = (filterId: string) => {
    const now = new Date()
    const tomorrow = new Date(now)
    tomorrow.setDate(tomorrow.getDate() + 7)
    const urgentDeadline = new Date(now)
    urgentDeadline.setDate(urgentDeadline.getDate() + 1)

    switch (filterId) {
      case 'this-week':
        setFilters({ ...filters, deadlineFrom: now.toISOString(), deadlineTo: tomorrow.toISOString() })
        break
      case 'high-match':
        setFilters({ ...filters, matchScoreMin: 80 })
        break
      case 'urgent':
        setFilters({ ...filters, deadlineFrom: now.toISOString(), deadlineTo: urgentDeadline.toISOString() })
        break
      case 'applied':
        setFilters({ ...filters, status: ['APPLIED', 'ASSESSMENT_SCHEDULED', 'INTERVIEW_SCHEDULED'] })
        break
    }
  }

  const updateStatus = async (id: string, newStatus: string, e?: React.MouseEvent) => {
    e?.stopPropagation()
    try {
      const response = await fetch(`/api/placements/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      })

      if (response.ok) {
        setPlacements(placements.map(p => p._id === id ? { ...p, status: newStatus } : p))
        toast.success(`Status updated to ${newStatus.replace(/_/g, " ")}`)
      } else {
        toast.error("Failed to update status")
      }
    } catch (error) {
      console.error("Error updating status:", error)
      toast.error("Failed to update status")
    }
  }

  const deletePlacement = async (id: string, e?: React.MouseEvent) => {
    e?.stopPropagation()
    if (!confirm("Are you sure you want to delete this placement record?")) return

    try {
      const response = await fetch(`/api/placements/${id}`, {
        method: "DELETE",
      })

      if (response.ok) {
        setPlacements(placements.filter(p => p._id !== id))
        setTotal(t => Math.max(0, t - 1))
        toast.success("Placement deleted successfully")
      } else {
        toast.error("Failed to delete placement")
      }
    } catch (error) {
      console.error("Error deleting placement:", error)
      toast.error("Failed to delete placement")
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "SELECTED":
        return "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/50"
      case "INTERVIEW_SCHEDULED":
      case "ASSESSMENT_SCHEDULED":
        return "bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800/50"
      case "APPLIED":
      case "INTERESTED":
        return "bg-zinc-100 dark:bg-zinc-800 text-foreground border-border"
      case "NEW":
        return "bg-zinc-100 dark:bg-zinc-800 text-foreground border-border font-medium"
      case "REJECTED":
        return "bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800/50"
      default:
        return "bg-muted text-muted-foreground border-border"
    }
  }

  const totalPages = Math.ceil(total / limit)

  return (
    <div className="space-y-4">
      {/* SEARCH AND FILTER TOOLBAR */}
      <div className="glass-panel p-3.5 rounded-2xl border border-border space-y-3">
        <div className="flex flex-col sm:flex-row gap-2.5 items-stretch sm:items-center">
          <div className="flex-1">
            <SearchInput
              value={searchQuery}
              onChange={setSearchQuery}
              placeholder="Search companies, roles, skills, or packages..."
            />
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={() => setIsFilterModalOpen(true)}
              className="gap-1.5 h-10 text-xs rounded-xl border-border bg-card"
            >
              <Filter className="h-3.5 w-3.5 text-muted-foreground" />
              Advanced Filters
              {(filters.status?.length || filters.cgpaMin || filters.matchScoreMin) && (
                <span className="h-1.5 w-1.5 rounded-full bg-zinc-900 dark:bg-zinc-100" />
              )}
            </Button>
          </div>
        </div>

        {/* Quick Filters */}
        <div className="flex items-center justify-between pt-1 flex-wrap gap-2">
          <QuickFilters onFilterSelect={handleQuickFilter} />
          <span className="text-xs text-muted-foreground ml-auto">
            {total} {total === 1 ? "opportunity" : "opportunities"}
          </span>
        </div>
      </div>

      {/* SKELETON LOADING STATE */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="glass-panel rounded-2xl p-5 border border-border animate-pulse space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-muted" />
                  <div className="space-y-1.5">
                    <div className="h-3.5 w-36 bg-muted rounded" />
                    <div className="h-3 w-24 bg-muted rounded" />
                  </div>
                </div>
                <div className="h-6 w-16 bg-muted rounded-full" />
              </div>
              <div className="h-3 w-2/3 bg-muted rounded" />
            </div>
          ))}
        </div>
      ) : placements.length === 0 ? (
        /* EMPTY STATE */
        <div className="glass-panel rounded-2xl p-10 text-center border border-border space-y-3">
          <div className="h-12 w-12 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-muted-foreground mx-auto flex items-center justify-center">
            <Briefcase className="h-5 w-5" />
          </div>
          <div className="space-y-1 max-w-sm mx-auto">
            <h3 className="text-sm font-bold text-foreground">No Placements Found</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              {searchQuery || Object.keys(filters).length > 0
                ? "Try clearing filters or search terms."
                : "Placement emails received in your Gmail inbox will appear here once processed."}
            </p>
          </div>
          {(searchQuery || Object.keys(filters).length > 0) && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setSearchQuery("")
                setFilters({})
              }}
              className="text-xs rounded-xl"
            >
              Reset Filters
            </Button>
          )}
        </div>
      ) : (
        /* PLACEMENT CARDS LIST */
        <div className="space-y-3">
          {placements.map((placement) => {
            const now = Date.now()
            const isDeadlineUrgent = placement.applicationDeadline && 
              (new Date(placement.applicationDeadline).getTime() - now < 48 * 3600 * 1000) &&
              (new Date(placement.applicationDeadline).getTime() > now)

            return (
              <div
                key={placement._id}
                onClick={() => router.push(`/placements/${placement._id}`)}
                className="glass-panel rounded-2xl p-4 sm:p-5 border border-border glow-card transition-all cursor-pointer group"
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                  {/* Left: Company & Role */}
                  <div className="flex items-start gap-3.5 flex-1 min-w-0">
                    <div className="h-10 w-10 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-foreground border border-border flex items-center justify-center font-bold text-sm shrink-0">
                      {placement.companyName.charAt(0).toUpperCase()}
                    </div>

                    <div className="space-y-1 min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-sm font-bold text-foreground transition-colors truncate">
                          {placement.companyName}
                        </h3>

                        {/* Status Badge */}
                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${getStatusBadge(placement.status)}`}>
                          {placement.status.replace(/_/g, " ")}
                        </span>

                        {/* Match Score Badge */}
                        {placement.matchScore !== undefined && (
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full border border-border bg-zinc-100 dark:bg-zinc-800 text-foreground flex items-center gap-1">
                            <Sparkles className="h-2.5 w-2.5 text-muted-foreground" />
                            {placement.matchScore}% Match
                          </span>
                        )}
                      </div>

                      <p className="text-xs text-muted-foreground truncate">
                        {placement.jobRole}
                      </p>

                      {/* Chips row: Package, Location, Deadline */}
                      <div className="flex items-center gap-2.5 pt-1 flex-wrap text-xs text-muted-foreground">
                        {placement.package && (
                          <span className="inline-flex items-center gap-1 font-medium text-foreground bg-muted/60 px-2 py-0.5 rounded-md">
                            <DollarSign className="h-3 w-3" />
                            {placement.package}
                          </span>
                        )}

                        {placement.location && (
                          <span className="inline-flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            {placement.location}
                          </span>
                        )}

                        {placement.applicationDeadline && (
                          <span className={`inline-flex items-center gap-1 ${isDeadlineUrgent ? "text-amber-600 dark:text-amber-400 font-semibold" : ""}`}>
                            <Clock className="h-3 w-3" />
                            Deadline: {new Date(placement.applicationDeadline).toLocaleDateString()}
                            {isDeadlineUrgent && " (Urgent)"}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Right: Quick Actions */}
                  <div 
                    className="flex items-center sm:flex-col sm:items-end justify-between sm:justify-start gap-2 pt-2 sm:pt-0 border-t sm:border-t-0 border-border shrink-0"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="flex items-center gap-1.5">
                      {/* Status Selector Dropdown */}
                      <select
                        value={placement.status}
                        onChange={(e) => updateStatus(placement._id, e.target.value)}
                        className="text-xs bg-muted/70 border border-border rounded-lg px-2 py-1 font-medium text-foreground cursor-pointer hover:bg-muted focus:outline-none"
                      >
                        <option value="NEW">New</option>
                        <option value="INTERESTED">Interested</option>
                        <option value="APPLIED">Applied</option>
                        <option value="ASSESSMENT_SCHEDULED">Assessment</option>
                        <option value="INTERVIEW_SCHEDULED">Interview</option>
                        <option value="SELECTED">Selected</option>
                        <option value="REJECTED">Rejected</option>
                        <option value="NOT_INTERESTED">Not Interested</option>
                      </select>

                      {placement.applicationLink && (
                        <a
                          href={placement.applicationLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex"
                        >
                          <Button size="sm" variant="outline" className="h-7 text-xs px-2.5 rounded-lg gap-1 border-border">
                            Apply <ExternalLink className="h-3 w-3" />
                          </Button>
                        </a>
                      )}

                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={(e) => deletePlacement(placement._id, e)}
                        className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg"
                        title="Delete record"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>

                    <Link 
                      href={`/placements/${placement._id}`}
                      className="text-xs font-medium text-muted-foreground hover:text-foreground hover:underline flex items-center gap-1"
                    >
                      Details <ArrowRight className="h-3 w-3" />
                    </Link>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* PAGINATION CONTROLS */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-4 border-t border-border">
          <p className="text-xs text-muted-foreground">
            Page {page} of {totalPages}
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="h-8 text-xs rounded-xl"
            >
              <ChevronLeft className="h-3.5 w-3.5 mr-1" />
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="h-8 text-xs rounded-xl"
            >
              Next
              <ChevronRight className="h-3.5 w-3.5 ml-1" />
            </Button>
          </div>
        </div>
      )}

      {/* ADVANCED FILTER MODAL */}
      <FilterModal
        open={isFilterModalOpen}
        onOpenChange={setIsFilterModalOpen}
        filters={filters}
        onFiltersChange={setFilters}
      />
    </div>
  )
}
