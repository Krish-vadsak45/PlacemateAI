"use client"

import { useEffect, useState, useRef, useCallback, useMemo, memo } from "react"
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
  Briefcase,
  Tag as TagIcon,
  X,
  RotateCcw,
  GraduationCap,
  Paperclip,
  CalendarCheck,
  Calendar as CalendarIcon,
  Scale
} from "lucide-react"
import { toast } from "sonner"
import dynamic from "next/dynamic"
import SearchInput from "@/components/search/SearchInput"
import QuickFilters from "@/components/search/QuickFilters"
import TagBadge from "./placement/TagBadge"
import Link from "next/link"
import { useComparison } from "@/context/ComparisonContext"

const FilterModal = dynamic(() => import("@/components/search/FilterModal"), {
  ssr: false,
})

interface Placement {
  _id: string
  companyName: string
  jobRole: string
  package?: string
  location?: string
  applicationDeadline?: string
  status: string
  tags?: string[]
  emailSubject?: string
  emailFrom?: string
  emailDate?: string
  extractionConfidence: number
  applicationLink?: string
  createdAt: string
  matchScore?: number
}

interface PlacementItemCardProps {
  placement: Placement
  onNavigate: (id: string) => void
  onTagToggle: (tag: string) => void
  onUpdateStatus: (id: string, status: string, e?: React.MouseEvent) => void
  onDeletePlacement: (id: string, e?: React.MouseEvent) => void
}

const PlacementItemCard = memo(function PlacementItemCard({
  placement,
  onNavigate,
  onTagToggle,
  onUpdateStatus,
  onDeletePlacement,
}: PlacementItemCardProps) {
  const { toggleItem, isSelected } = useComparison()
  const checked = isSelected(placement._id)

  const handleCompareToggle = (e: React.MouseEvent) => {
    e.stopPropagation()
    toggleItem({
      id: placement._id,
      companyName: placement.companyName,
      jobRole: placement.jobRole,
      package: placement.package,
    })
  }

  const now = Date.now()
  const isDeadlineUrgent = placement.applicationDeadline && 
    (new Date(placement.applicationDeadline).getTime() - now < 48 * 3600 * 1000) &&
    (new Date(placement.applicationDeadline).getTime() > now)

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

  return (
    <div
      onClick={() => onNavigate(placement._id)}
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

            {placement.tags && placement.tags.length > 0 && (
              <div className="flex items-center gap-1.5 pt-1.5 flex-wrap">
                {placement.tags.map((tag) => (
                  <TagBadge
                    key={tag}
                    tag={tag}
                    size="sm"
                    onClick={() => onTagToggle(tag)}
                  />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right: Quick Actions */}
        <div 
          className="flex items-center sm:flex-col sm:items-end justify-between sm:justify-start gap-2 pt-2 sm:pt-0 border-t sm:border-t-0 border-border shrink-0"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center gap-1.5">
            {/* Compare Toggle Button */}
            <Button
              size="sm"
              variant={checked ? "default" : "outline"}
              onClick={handleCompareToggle}
              className={`h-7 text-xs px-2.5 rounded-lg gap-1 transition-all ${
                checked
                  ? "bg-primary text-primary-foreground font-semibold"
                  : "border-border text-muted-foreground hover:text-foreground"
              }`}
              title="Add to comparison"
            >
              <Scale className="h-3 w-3" />
              <span className="hidden sm:inline">{checked ? "Selected" : "Compare"}</span>
            </Button>

            {/* Status Selector Dropdown */}
            <select
              value={placement.status}
              onChange={(e) => onUpdateStatus(placement._id, e.target.value)}
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
              onClick={(e) => onDeletePlacement(placement._id, e)}
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
})

interface PlacementListProps {
  sharedOwnerId?: string;
  sharedPermission?: string;
}

export default function PlacementList({ sharedOwnerId, sharedPermission }: PlacementListProps = {}) {
  const { data: session } = useSession()
  const searchParams = useSearchParams()
  const router = useRouter()
  const [placements, setPlacements] = useState<Placement[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '')
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [filters, setFilters] = useState<any>({})
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [aggregations, setAggregations] = useState<any>(undefined)
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false)
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(parseInt(searchParams.get('page') || '1'))
  const [limit] = useState(20)
  const [availableTags, setAvailableTags] = useState<Array<{ tag: string; count: number }>>([])
  const [isFetchingNextPage, setIsFetchingNextPage] = useState(false)
  const observerTarget = useRef<HTMLDivElement | null>(null)
  const isUpdatingUrl = useRef(false)

  // Fetch available tags
  useEffect(() => {
    fetch('/api/placements/tags')
      .then((res) => res.json())
      .then((data) => {
        if (data.tags) setAvailableTags(data.tags)
      })
      .catch((err) => console.error("Error fetching tags:", err))
  }, [])

  // Sync URL params to state on mount
  useEffect(() => {
    if (isUpdatingUrl.current) return
    
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const urlFilters: any = {}
    if (searchParams.get('status')) urlFilters.status = searchParams.get('status')?.split(',')
    if (searchParams.get('tags')) urlFilters.tags = searchParams.get('tags')?.split(',')
    if (searchParams.get('cgpaMin')) urlFilters.cgpaMin = parseFloat(searchParams.get('cgpaMin')!)
    if (searchParams.get('cgpaMax')) urlFilters.cgpaMax = parseFloat(searchParams.get('cgpaMax')!)
    if (searchParams.get('matchScoreMin')) urlFilters.matchScoreMin = parseInt(searchParams.get('matchScoreMin')!)
    if (searchParams.get('matchScoreMax')) urlFilters.matchScoreMax = parseInt(searchParams.get('matchScoreMax')!)
    if (searchParams.get('deadlineFrom')) urlFilters.deadlineFrom = searchParams.get('deadlineFrom')
    if (searchParams.get('deadlineTo')) urlFilters.deadlineTo = searchParams.get('deadlineTo')
    if (searchParams.get('hasAttachments')) urlFilters.hasAttachments = searchParams.get('hasAttachments') === 'true'
    if (searchParams.get('hasCalendarEvent')) urlFilters.hasCalendarEvent = searchParams.get('hasCalendarEvent') === 'true'
    
    setFilters((prev: any) => {
      if (JSON.stringify(prev) === JSON.stringify(urlFilters)) return prev
      return urlFilters
    })
  }, [searchParams])

  // Update URL when filters change without triggering server component re-fetch
  useEffect(() => {
    const params = new URLSearchParams()
    if (searchQuery) params.set('q', searchQuery)
    if (filters.status?.length) params.set('status', filters.status.join(','))
    if (filters.tags?.length) params.set('tags', filters.tags.join(','))
    if (filters.cgpaMin !== undefined) params.set('cgpaMin', filters.cgpaMin.toString())
    if (filters.cgpaMax !== undefined) params.set('cgpaMax', filters.cgpaMax.toString())
    if (filters.matchScoreMin !== undefined) params.set('matchScoreMin', filters.matchScoreMin.toString())
    if (filters.matchScoreMax !== undefined) params.set('matchScoreMax', filters.matchScoreMax.toString())
    if (filters.deadlineFrom) params.set('deadlineFrom', filters.deadlineFrom)
    if (filters.deadlineTo) params.set('deadlineTo', filters.deadlineTo)
    if (filters.hasAttachments !== undefined) params.set('hasAttachments', filters.hasAttachments.toString())
    if (filters.hasCalendarEvent !== undefined) params.set('hasCalendarEvent', filters.hasCalendarEvent.toString())
    if (page > 1) params.set('page', page.toString())

    const queryString = params.toString()
    const newUrl = queryString ? `${window.location.pathname}?${queryString}` : window.location.pathname
    window.history.replaceState(null, '', newUrl)
  }, [searchQuery, filters, page])

  const handleNavigate = useCallback((id: string) => {
    router.push(`/placements/${id}`)
  }, [router])

  const handleSearchChange = useCallback((val: string) => {
    setSearchQuery((prev) => (prev === val ? prev : val))
    setPage(1)
  }, [])

  const handleTagToggle = useCallback((tag: string) => {
    setFilters((prev: any) => {
      const current = prev.tags || []
      const updated = current.includes(tag)
        ? current.filter((t: string) => t !== tag)
        : [...current, tag]
      return { ...prev, tags: updated.length > 0 ? updated : undefined }
    })
    setPage(1)
  }, [])

  const fetchPlacements = useCallback(async () => {
    try {
      if (page > 1) {
        setIsFetchingNextPage(true)
      } else {
        setIsLoading(true)
      }
      const params = new URLSearchParams()
      if (searchQuery) params.set('q', searchQuery)
      if (filters.status?.length) params.set('status', filters.status.join(','))
      if (filters.tags?.length) params.set('tags', filters.tags.join(','))
      if (filters.cgpaMin !== undefined) params.set('cgpaMin', filters.cgpaMin.toString())
      if (filters.cgpaMax !== undefined) params.set('cgpaMax', filters.cgpaMax.toString())
      if (filters.matchScoreMin !== undefined) params.set('matchScoreMin', filters.matchScoreMin.toString())
      if (filters.matchScoreMax !== undefined) params.set('matchScoreMax', filters.matchScoreMax.toString())
      if (filters.deadlineFrom) params.set('deadlineFrom', filters.deadlineFrom)
      if (filters.deadlineTo) params.set('deadlineTo', filters.deadlineTo)
      if (filters.hasAttachments !== undefined) params.set('hasAttachments', filters.hasAttachments.toString())
      if (filters.hasCalendarEvent !== undefined) params.set('hasCalendarEvent', filters.hasCalendarEvent.toString())
      params.set('page', page.toString())
      params.set('limit', limit.toString())
      if (sharedOwnerId) params.set('ownerId', sharedOwnerId)

      const response = await fetch(`/api/placements/search?${params.toString()}`)
      const data = await response.json()
      
      if (response.ok) {
        const newItems = data.placements || []
        if (page > 1) {
          setPlacements(prev => {
            const existingIds = new Set(prev.map(p => p._id))
            const filtered = newItems.filter((p: Placement) => !existingIds.has(p._id))
            return [...prev, ...filtered]
          })
        } else {
          setPlacements(newItems)
        }
        setTotal(data.total || 0)
        if (data.aggregations) setAggregations(data.aggregations)
      } else {
        toast.error("Failed to fetch placements")
      }
    } catch (error) {
      console.error("Error fetching placements:", error)
      toast.error("Failed to fetch placements")
    } finally {
      setIsLoading(false)
      setIsFetchingNextPage(false)
    }
  }, [searchQuery, filters, page, limit, sharedOwnerId])

  /* eslint-disable react-hooks/set-state-in-effect */
  const userId = session?.user?.id
  useEffect(() => {
    if (userId) {
      fetchPlacements().catch(console.error)
    }
  }, [userId, fetchPlacements])
  /* eslint-enable react-hooks/set-state-in-effect */

  // Infinite Scroll IntersectionObserver trigger
  const totalPages = useMemo(() => Math.ceil(total / limit), [total, limit])
  useEffect(() => {
    const target = observerTarget.current
    if (!target || isLoading || isFetchingNextPage || page >= totalPages) return

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && page < totalPages && !isFetchingNextPage && !isLoading) {
          setPage((prev) => prev + 1)
        }
      },
      { threshold: 0.1 }
    )

    observer.observe(target)
    return () => {
      if (target) observer.unobserve(target)
    }
  }, [isLoading, isFetchingNextPage, page, totalPages])

  const getActiveQuickFilter = useCallback(() => {
    if (filters.matchScoreMin === 80) return 'high-match'
    if (filters.status?.length === 3 && filters.status.includes('APPLIED') && filters.status.includes('ASSESSMENT_SCHEDULED') && filters.status.includes('INTERVIEW_SCHEDULED')) return 'applied'
    if (filters.deadlineFrom && filters.deadlineTo) {
      const diff = new Date(filters.deadlineTo).getTime() - new Date(filters.deadlineFrom).getTime()
      const diffHours = diff / (1000 * 3600)
      if (diffHours > 20 && diffHours < 30) return 'urgent'
      if (diffHours > 140 && diffHours < 180) return 'this-week'
    }
    return undefined
  }, [filters])

  const handleQuickFilter = useCallback((filterId: string) => {
    const now = new Date()
    const tomorrow = new Date(now)
    tomorrow.setDate(tomorrow.getDate() + 7)
    const urgentDeadline = new Date(now)
    urgentDeadline.setDate(urgentDeadline.getDate() + 1)
    const activeQF = getActiveQuickFilter()

    switch (filterId) {
      case 'this-week':
        if (activeQF === 'this-week') {
          setFilters((prev: any) => {
            const next = { ...prev }
            delete next.deadlineFrom
            delete next.deadlineTo
            return next
          })
        } else {
          setFilters((prev: any) => ({ ...prev, deadlineFrom: now.toISOString(), deadlineTo: tomorrow.toISOString() }))
        }
        break
      case 'high-match':
        if (filters.matchScoreMin === 80) {
          setFilters((prev: any) => {
            const next = { ...prev }
            delete next.matchScoreMin
            return next
          })
        } else {
          setFilters((prev: any) => ({ ...prev, matchScoreMin: 80 }))
        }
        break
      case 'urgent':
        if (activeQF === 'urgent') {
          setFilters((prev: any) => {
            const next = { ...prev }
            delete next.deadlineFrom
            delete next.deadlineTo
            return next
          })
        } else {
          setFilters((prev: any) => ({ ...prev, deadlineFrom: now.toISOString(), deadlineTo: urgentDeadline.toISOString() }))
        }
        break
      case 'applied':
        if (filters.status?.length === 3 && filters.status.includes('APPLIED') && filters.status.includes('ASSESSMENT_SCHEDULED') && filters.status.includes('INTERVIEW_SCHEDULED')) {
          setFilters((prev: any) => {
            const next = { ...prev }
            delete next.status
            return next
          })
        } else {
          setFilters((prev: any) => ({ ...prev, status: ['APPLIED', 'ASSESSMENT_SCHEDULED', 'INTERVIEW_SCHEDULED'] }))
        }
        break
    }
    setPage(1)
  }, [filters, getActiveQuickFilter])

  const removeSingleFilter = useCallback((key: string) => {
    setFilters((prev: any) => {
      const next = { ...prev }
      delete next[key]
      return next
    })
    setPage(1)
  }, [])

  const handleClearAll = useCallback(() => {
    setSearchQuery("")
    setFilters({})
    setPage(1)
  }, [])

  // Count total active filter elements
  const activeFilterCount = useMemo(() => {
    return Object.keys(filters).filter(
      (key) =>
        filters[key] !== undefined &&
        filters[key] !== "" &&
        (Array.isArray(filters[key]) ? filters[key].length > 0 : true)
    ).length
  }, [filters])

  const hasAnyActiveFilter = useMemo(() => {
    return activeFilterCount > 0 || Boolean(searchQuery)
  }, [activeFilterCount, searchQuery])

  const updateStatus = useCallback(async (id: string, newStatus: string, e?: React.MouseEvent) => {
    e?.stopPropagation()
    try {
      const response = await fetch(`/api/placements/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      })

      if (response.ok) {
        setPlacements((prev) => prev.map(p => p._id === id ? { ...p, status: newStatus } : p))
        toast.success(`Status updated to ${newStatus.replace(/_/g, " ")}`)
      } else {
        toast.error("Failed to update status")
      }
    } catch (error) {
      console.error("Error updating status:", error)
      toast.error("Failed to update status")
    }
  }, [])

  const deletePlacement = useCallback(async (id: string, e?: React.MouseEvent) => {
    e?.stopPropagation()
    if (!confirm("Are you sure you want to delete this placement record?")) return

    try {
      const response = await fetch(`/api/placements/${id}`, {
        method: "DELETE",
      })

      if (response.ok) {
        setPlacements((prev) => prev.filter(p => p._id !== id))
        setTotal(t => Math.max(0, t - 1))
        toast.success("Placement deleted successfully")
      } else {
        toast.error("Failed to delete placement")
      }
    } catch (error) {
      console.error("Error deleting placement:", error)
      toast.error("Failed to delete placement")
    }
  }, [])

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

  return (
    <div className="space-y-4">
      {/* SEARCH AND FILTER TOOLBAR */}
      <div className="glass-panel p-3.5 rounded-2xl border border-border space-y-3">
        <div className="flex flex-col sm:flex-row gap-2.5 items-stretch sm:items-center">
          <div className="flex-1">
            <SearchInput
              value={searchQuery}
              onChange={handleSearchChange}
              placeholder="Search companies, roles, skills, or packages..."
            />
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={() => setIsFilterModalOpen(true)}
              className="gap-1.5 h-10 text-xs rounded-xl border-border bg-card hover:bg-muted/80 cursor-pointer"
            >
              <Filter className="h-3.5 w-3.5 text-muted-foreground" />
              <span>Advanced Filters</span>
              {activeFilterCount > 0 && (
                <span className="ml-1 px-1.5 py-0.5 rounded-full bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-950 font-bold text-[10px]">
                  {activeFilterCount}
                </span>
              )}
            </Button>
          </div>
        </div>

        {/* Quick Filters */}
        <div className="flex items-center justify-between pt-1 flex-wrap gap-2">
          <QuickFilters onFilterSelect={handleQuickFilter} activeFilter={getActiveQuickFilter()} />
          <span className="text-xs text-muted-foreground ml-auto">
            {total} {total === 1 ? "opportunity" : "opportunities"}
          </span>
        </div>

        {/* ACTIVE FILTER CHIPS & CLEAR ALL BAR */}
        {hasAnyActiveFilter && (
          <div className="flex flex-wrap items-center gap-2 pt-2 pb-1 border-t border-border/60 text-xs">
            <span className="font-semibold text-foreground flex items-center gap-1 shrink-0 mr-1 text-[11px] uppercase tracking-wider">
              <Filter className="h-3 w-3 text-muted-foreground" />
              Active Filters:
            </span>

            {/* Search Query Chip */}
            {searchQuery && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-card border border-border text-foreground font-medium shadow-2xs text-xs">
                <span className="text-muted-foreground font-normal">Search:</span>
                <span className="truncate max-w-[140px]">"{searchQuery}"</span>
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="text-muted-foreground hover:text-foreground p-0.5 rounded-md hover:bg-muted transition-colors cursor-pointer"
                  title="Remove search query"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            )}

            {/* Statuses Chip */}
            {filters.status?.length > 0 && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-card border border-border text-foreground font-medium shadow-2xs text-xs">
                <Briefcase className="h-3 w-3 text-muted-foreground" />
                <span className="text-muted-foreground font-normal">Status:</span>
                <span>{filters.status.map((s: string) => s.replace(/_/g, " ")).join(", ")}</span>
                <button
                  type="button"
                  onClick={() => removeSingleFilter("status")}
                  className="text-muted-foreground hover:text-foreground p-0.5 rounded-md hover:bg-muted transition-colors cursor-pointer"
                  title="Remove status filter"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            )}

            {/* CGPA Chip */}
            {(filters.cgpaMin !== undefined || filters.cgpaMax !== undefined) && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-card border border-border text-foreground font-medium shadow-2xs text-xs">
                <GraduationCap className="h-3 w-3 text-muted-foreground" />
                <span className="text-muted-foreground font-normal">CGPA:</span>
                <span>
                  {filters.cgpaMin !== undefined && filters.cgpaMax !== undefined
                    ? `${filters.cgpaMin} - ${filters.cgpaMax}`
                    : filters.cgpaMin !== undefined
                    ? `≥ ${filters.cgpaMin}`
                    : `≤ ${filters.cgpaMax}`}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    const next = { ...filters }
                    delete next.cgpaMin
                    delete next.cgpaMax
                    setFilters(next)
                  }}
                  className="text-muted-foreground hover:text-foreground p-0.5 rounded-md hover:bg-muted transition-colors cursor-pointer"
                  title="Remove CGPA filter"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            )}

            {/* Match Score Chip */}
            {(filters.matchScoreMin !== undefined || filters.matchScoreMax !== undefined) && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-card border border-border text-foreground font-medium shadow-2xs text-xs">
                <Sparkles className="h-3 w-3 text-muted-foreground" />
                <span className="text-muted-foreground font-normal">Match:</span>
                <span>
                  {filters.matchScoreMin !== undefined && filters.matchScoreMax !== undefined
                    ? `${filters.matchScoreMin}% - ${filters.matchScoreMax}%`
                    : filters.matchScoreMin !== undefined
                    ? `≥ ${filters.matchScoreMin}%`
                    : `≤ ${filters.matchScoreMax}%`}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    const next = { ...filters }
                    delete next.matchScoreMin
                    delete next.matchScoreMax
                    setFilters(next)
                  }}
                  className="text-muted-foreground hover:text-foreground p-0.5 rounded-md hover:bg-muted transition-colors cursor-pointer"
                  title="Remove Match Score filter"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            )}

            {/* Deadline Range Chip */}
            {(filters.deadlineFrom || filters.deadlineTo) && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-card border border-border text-foreground font-medium shadow-2xs text-xs">
                <Clock className="h-3 w-3 text-muted-foreground" />
                <span className="text-muted-foreground font-normal">Deadline:</span>
                <span>
                  {filters.deadlineFrom ? new Date(filters.deadlineFrom).toLocaleDateString() : "Any"} to {filters.deadlineTo ? new Date(filters.deadlineTo).toLocaleDateString() : "Any"}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    const next = { ...filters }
                    delete next.deadlineFrom
                    delete next.deadlineTo
                    setFilters(next)
                  }}
                  className="text-muted-foreground hover:text-foreground p-0.5 rounded-md hover:bg-muted transition-colors cursor-pointer"
                  title="Remove deadline filter"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            )}

            {/* Has Attachments Chip */}
            {filters.hasAttachments !== undefined && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-card border border-border text-foreground font-medium shadow-2xs text-xs">
                <Paperclip className="h-3 w-3 text-muted-foreground" />
                <span>Has Attachments</span>
                <button
                  type="button"
                  onClick={() => removeSingleFilter("hasAttachments")}
                  className="text-muted-foreground hover:text-foreground p-0.5 rounded-md hover:bg-muted transition-colors cursor-pointer"
                  title="Remove attachments filter"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            )}

            {/* Calendar Synced Chip */}
            {filters.hasCalendarEvent !== undefined && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-card border border-border text-foreground font-medium shadow-2xs text-xs">
                <CalendarCheck className="h-3 w-3 text-muted-foreground" />
                <span>Calendar Synced</span>
                <button
                  type="button"
                  onClick={() => removeSingleFilter("hasCalendarEvent")}
                  className="text-muted-foreground hover:text-foreground p-0.5 rounded-md hover:bg-muted transition-colors cursor-pointer"
                  title="Remove calendar filter"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            )}

            {/* Tag Chips */}
            {filters.tags?.map((tag: string) => (
              <span key={tag} className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-card border border-border text-foreground font-medium shadow-2xs text-xs">
                <TagIcon className="h-3 w-3 text-muted-foreground" />
                <span>#{tag}</span>
                <button
                  type="button"
                  onClick={() => handleTagToggle(tag)}
                  className="text-muted-foreground hover:text-foreground p-0.5 rounded-md hover:bg-muted transition-colors cursor-pointer"
                  title={`Remove tag #${tag}`}
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            ))}

            {/* Clear All UI Button */}
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClearAll}
              className="h-7 text-xs px-2.5 rounded-lg text-rose-600 dark:text-rose-400 hover:bg-rose-500/10 hover:text-rose-700 dark:hover:text-rose-300 gap-1 ml-auto font-medium cursor-pointer"
            >
              <RotateCcw className="h-3 w-3" />
              Clear All
            </Button>
          </div>
        )}

        {/* Available Tags Filter Bar */}
        {availableTags.length > 0 && (
          <div className="flex items-center gap-1.5 flex-wrap pt-2 border-t border-border/50 text-xs">
            <span className="text-[11px] font-medium text-muted-foreground flex items-center gap-1">
              <TagIcon className="h-3 w-3 text-muted-foreground" />
              Tags:
            </span>
            {availableTags.map(({ tag, count }) => {
              const isSelected = filters.tags?.includes(tag)
              return (
                <button
                  key={tag}
                  type="button"
                  onClick={() => handleTagToggle(tag)}
                  className={`inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-lg border transition-all cursor-pointer ${
                    isSelected
                      ? "bg-primary text-primary-foreground border-primary shadow-xs font-semibold"
                      : "bg-secondary/60 text-muted-foreground hover:text-foreground border-border hover:bg-secondary"
                  }`}
                >
                  <span>#{tag}</span>
                  <span className="text-[10px] opacity-75">({count})</span>
                </button>
              )
            })}
            {filters.tags && filters.tags.length > 0 && (
              <button
                type="button"
                onClick={() => {
                  const updated = { ...filters }
                  delete updated.tags
                  setFilters(updated)
                }}
                className="text-[11px] text-muted-foreground hover:text-foreground underline ml-1 cursor-pointer"
              >
                Clear tags
              </button>
            )}
          </div>
        )}
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
          {placements.map((placement) => (
            <PlacementItemCard
              key={placement._id}
              placement={placement}
              onNavigate={handleNavigate}
              onTagToggle={handleTagToggle}
              onUpdateStatus={updateStatus}
              onDeletePlacement={deletePlacement}
            />
          ))}
        </div>
      )}

      {/* INFINITE SCROLL SENTINEL & LOADING INDICATOR */}
      {page < totalPages && (
        <div ref={observerTarget} className="py-4 text-center">
          {isFetchingNextPage && (
            <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
              <span className="h-4 w-4 rounded-full border-2 border-primary border-t-transparent animate-spin" />
              <span>Loading more placement drives...</span>
            </div>
          )}
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
        aggregations={aggregations}
      />
    </div>
  )
}
