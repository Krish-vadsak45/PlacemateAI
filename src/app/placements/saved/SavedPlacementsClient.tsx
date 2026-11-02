"use client"

import React, { useState, useMemo } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { 
  Bookmark, 
  Scale, 
  ArrowLeft, 
  Sparkles, 
  DollarSign, 
  MapPin, 
  Clock, 
  Search, 
  Download, 
  Briefcase, 
  CheckCircle2, 
  AlertCircle,
  Trash2,
  ExternalLink,
  ChevronRight,
  TrendingUp,
  Filter
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useSavedPlacements } from "@/context/SavedPlacementsContext"
import { useComparison } from "@/context/ComparisonContext"
import { toast } from "sonner"

export interface SavedPlacementItem {
  _id: string
  companyName: string
  jobRole: string
  package?: string
  location?: string
  applicationDeadline?: string
  status: string
  tags?: string[]
  matchScore?: number
  applicationLink?: string
  createdAt?: string
}

interface SavedPlacementsClientProps {
  initialPlacements: SavedPlacementItem[]
}

export default function SavedPlacementsClient({ initialPlacements }: SavedPlacementsClientProps) {
  const router = useRouter()
  const { isSaved, toggleSave, savedCount } = useSavedPlacements()
  const { toggleItem, isSelected, selectedItems } = useComparison()

  const [searchQuery, setSearchQuery] = useState("")
  const [selectedStatus, setSelectedStatus] = useState<string>("ALL")

  // Filter items in real time: only show drives that are currently saved in context
  const savedItems = useMemo(() => {
    return initialPlacements.filter(p => isSaved(p._id))
  }, [initialPlacements, isSaved])

  // Filter by search query and status
  const filteredItems = useMemo(() => {
    return savedItems.filter(item => {
      const matchesSearch = 
        !searchQuery.trim() ||
        item.companyName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.jobRole.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.location && item.location.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (item.tags && item.tags.some(t => t.toLowerCase().includes(searchQuery.toLowerCase())))

      const matchesStatus = 
        selectedStatus === "ALL" || item.status === selectedStatus

      return matchesSearch && matchesStatus
    })
  }, [savedItems, searchQuery, selectedStatus])

  // Compute summary metrics
  const metrics = useMemo(() => {
    const total = savedItems.length
    if (total === 0) return { total: 0, highestPackage: "N/A", upcomingCount: 0, avgMatch: 0 }

    let highestLpa = 0
    let highestPackageStr = "N/A"
    let upcoming = 0
    let matchSum = 0
    let matchCount = 0
    const now = Date.now()

    savedItems.forEach(item => {
      if (item.package) {
        const num = parseFloat(item.package.replace(/[^0-9.]/g, ''))
        if (!isNaN(num) && num > highestLpa) {
          highestLpa = num
          highestPackageStr = item.package
        }
      }
      if (item.applicationDeadline) {
        const d = new Date(item.applicationDeadline).getTime()
        if (d > now) upcoming++
      }
      if (item.matchScore !== undefined) {
        matchSum += item.matchScore
        matchCount++
      }
    })

    const avgMatch = matchCount > 0 ? Math.round(matchSum / matchCount) : 0

    return {
      total,
      highestPackage: highestPackageStr !== "N/A" ? highestPackageStr : highestLpa > 0 ? `₹${highestLpa} LPA` : "Not specified",
      upcomingCount: upcoming,
      avgMatch
    }
  }, [savedItems])

  // Action: Compare All Saved
  const handleCompareAll = () => {
    if (savedItems.length < 2) {
      toast.warning("Save at least 2 placements to run a side-by-side comparison.")
      return
    }
    const ids = savedItems.map(p => p._id).slice(0, 4) // max 4 for comparison
    router.push(`/placements/compare?ids=${ids.join(",")}`)
  }

  // Action: Export CSV
  const handleExportCsv = () => {
    if (savedItems.length === 0) return

    const headers = ["Company Name", "Job Role", "Package", "Location", "Status", "Match Score", "Application Deadline", "Link"]
    const rows = savedItems.map(p => [
      `"${p.companyName.replace(/"/g, '""')}"`,
      `"${p.jobRole.replace(/"/g, '""')}"`,
      `"${p.package || ''}"`,
      `"${p.location || ''}"`,
      `"${p.status}"`,
      p.matchScore ? `"${p.matchScore}%"` : '""',
      p.applicationDeadline ? `"${new Date(p.applicationDeadline).toLocaleDateString()}"` : '""',
      `"${p.applicationLink || ''}"`
    ])

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map(r => r.join(","))].join("\n")
    const encodedUri = encodeURI(csvContent)
    const link = document.createElement("a")
    link.setAttribute("href", encodedUri)
    link.setAttribute("download", `saved_placements_${new Date().toISOString().split("T")[0]}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    toast.success("Saved shortlist exported to CSV successfully!")
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
      case "REJECTED":
        return "bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800/50"
      default:
        return "bg-muted text-muted-foreground border-border"
    }
  }

  return (
    <div className="space-y-8">
      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-border">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Link 
              href="/dashboard" 
              className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors font-medium"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>Back to Dashboard</span>
            </Link>
          </div>
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-500 flex items-center justify-center shadow-xs">
              <Bookmark className="h-5 w-5 fill-amber-400" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground font-heading">
                Saved Placements
              </h1>
              <p className="text-xs sm:text-sm text-muted-foreground">
                Your curated shortlist of dream companies and high-priority placement opportunities.
              </p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          {savedItems.length >= 2 && (
            <Button
              onClick={handleCompareAll}
              size="sm"
              className="h-9 gap-1.5 text-xs font-semibold rounded-xl bg-zinc-950 text-white dark:bg-zinc-100 dark:text-zinc-950 hover:opacity-90 shadow-sm cursor-pointer"
            >
              <Scale className="h-4 w-4" />
              <span>Compare All Saved ({savedItems.length})</span>
            </Button>
          )}

          {savedItems.length > 0 && (
            <Button
              onClick={handleExportCsv}
              variant="outline"
              size="sm"
              className="h-9 gap-1.5 text-xs font-medium rounded-xl border-border hover:bg-muted cursor-pointer"
            >
              <Download className="h-3.5 w-3.5 text-muted-foreground" />
              <span>Export CSV</span>
            </Button>
          )}

          <Link href="/dashboard">
            <Button
              variant="outline"
              size="sm"
              className="h-9 gap-1.5 text-xs font-medium rounded-xl border-border cursor-pointer"
            >
              <Briefcase className="h-3.5 w-3.5 text-muted-foreground" />
              <span>Browse Drives</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* METRICS ROW */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="glass-panel p-4 rounded-2xl border border-border shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-medium uppercase tracking-wider">Shortlisted Drives</span>
            <Bookmark className="h-4 w-4 text-amber-500 fill-amber-400/20" />
          </div>
          <div className="text-2xl font-extrabold text-foreground">{metrics.total}</div>
          <p className="text-[11px] text-muted-foreground">Companies pinned to watchlist</p>
        </div>

        <div className="glass-panel p-4 rounded-2xl border border-border shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-medium uppercase tracking-wider">Top Compensation</span>
            <DollarSign className="h-4 w-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-extrabold text-foreground truncate">{metrics.highestPackage}</div>
          <p className="text-[11px] text-muted-foreground">Highest package in shortlist</p>
        </div>

        <div className="glass-panel p-4 rounded-2xl border border-border shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-medium uppercase tracking-wider">Upcoming Deadlines</span>
            <Clock className="h-4 w-4 text-blue-500" />
          </div>
          <div className="text-2xl font-extrabold text-foreground">{metrics.upcomingCount}</div>
          <p className="text-[11px] text-muted-foreground">Drives currently accepting applications</p>
        </div>

        <div className="glass-panel p-4 rounded-2xl border border-border shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-medium uppercase tracking-wider">Avg Profile Match</span>
            <Sparkles className="h-4 w-4 text-violet-500" />
          </div>
          <div className="text-2xl font-extrabold text-foreground">
            {metrics.avgMatch > 0 ? `${metrics.avgMatch}%` : "—"}
          </div>
          <p className="text-[11px] text-muted-foreground">Overall alignment with requirements</p>
        </div>
      </div>

      {/* FILTER & SEARCH BAR */}
      {savedItems.length > 0 && (
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search saved companies, roles, locations..."
              className="pl-9 h-10 text-xs rounded-xl bg-card border-border shadow-2xs"
            />
          </div>

          <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
            {["ALL", "APPLIED", "INTERVIEW_SCHEDULED", "ASSESSMENT_SCHEDULED", "SELECTED"].map(st => (
              <Button
                key={st}
                size="sm"
                variant={selectedStatus === st ? "default" : "outline"}
                onClick={() => setSelectedStatus(st)}
                className={`h-8 text-xs px-3 rounded-xl transition-all cursor-pointer ${
                  selectedStatus === st 
                    ? "bg-zinc-950 text-white dark:bg-zinc-100 dark:text-zinc-950 shadow-xs" 
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {st === "ALL" ? "All Drives" : st.replace(/_/g, " ")}
              </Button>
            ))}
          </div>
        </div>
      )}

      {/* MAIN CONTENT LIST */}
      {savedItems.length === 0 ? (
        /* ZERO SAVED EMPTY STATE */
        <div className="glass-panel rounded-3xl p-12 text-center border border-border space-y-4 max-w-xl mx-auto shadow-sm">
          <div className="h-16 w-16 rounded-3xl bg-amber-500/10 border border-amber-500/20 text-amber-500 mx-auto flex items-center justify-center">
            <Bookmark className="h-8 w-8 fill-amber-400" />
          </div>
          <div className="space-y-2">
            <h2 className="text-lg font-bold text-foreground">No Saved Placements Yet</h2>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Whenever you come across high-priority drives or dream companies on your dashboard, 
              click the <span className="font-semibold text-foreground">"Save"</span> bookmark button 
              to curate your personalized shortlist and track deadlines here.
            </p>
          </div>
          <div className="pt-2">
            <Link href="/dashboard">
              <Button className="gap-2 text-xs font-semibold rounded-xl px-5 h-10 shadow-sm cursor-pointer">
                <Briefcase className="h-4 w-4" />
                <span>Explore Placement Drives</span>
              </Button>
            </Link>
          </div>
        </div>
      ) : filteredItems.length === 0 ? (
        /* NO FILTER RESULTS */
        <div className="glass-panel rounded-2xl p-8 text-center border border-border space-y-3">
          <p className="text-xs text-muted-foreground">
            No saved placements match your search query or status filter.
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setSearchQuery("")
              setSelectedStatus("ALL")
            }}
            className="text-xs rounded-xl"
          >
            Clear Filters
          </Button>
        </div>
      ) : (
        /* SAVED PLACEMENT CARDS */
        <div className="space-y-3">
          {filteredItems.map(placement => {
            const checked = isSelected(placement._id)
            const now = Date.now()
            const isDeadlineUrgent = placement.applicationDeadline && 
              (new Date(placement.applicationDeadline).getTime() - now < 48 * 3600 * 1000) &&
              (new Date(placement.applicationDeadline).getTime() > now)

            return (
              <div
                key={placement._id}
                onClick={() => router.push(`/placements/${placement._id}`)}
                className="glass-panel rounded-2xl p-4 sm:p-5 border border-border glow-card transition-all cursor-pointer group hover:border-border/80"
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                  {/* Left: Company & Details */}
                  <div className="flex items-start gap-3.5 flex-1 min-w-0">
                    <div className="h-11 w-11 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-foreground border border-border flex items-center justify-center font-bold text-sm shrink-0">
                      {placement.companyName.charAt(0).toUpperCase()}
                    </div>

                    <div className="space-y-1.5 min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-sm font-bold text-foreground transition-colors truncate">
                          {placement.companyName}
                        </h3>

                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${getStatusBadge(placement.status)}`}>
                          {placement.status.replace(/_/g, " ")}
                        </span>

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
                          <span className={`inline-flex items-center gap-1 ${isDeadlineUrgent ? "text-rose-600 dark:text-rose-400 font-semibold" : ""}`}>
                            <Clock className="h-3 w-3" />
                            Deadline: {new Date(placement.applicationDeadline).toLocaleDateString()}
                          </span>
                        )}
                      </div>

                      {placement.tags && placement.tags.length > 0 && (
                        <div className="flex items-center gap-1.5 pt-1.5 flex-wrap">
                          {placement.tags.slice(0, 3).map(tag => (
                            <span 
                              key={tag}
                              className="text-[10px] font-medium px-2 py-0.5 rounded-md bg-muted text-muted-foreground"
                            >
                              #{tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Right: Actions */}
                  <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                    {/* Compare Checkbox Button */}
                    <Button
                      variant={checked ? "default" : "outline"}
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation()
                        toggleItem({
                          id: placement._id,
                          companyName: placement.companyName,
                          jobRole: placement.jobRole,
                          package: placement.package,
                        })
                      }}
                      className={`h-7 text-xs px-2.5 rounded-lg gap-1 transition-all cursor-pointer ${
                        checked 
                          ? "bg-primary text-primary-foreground font-semibold shadow-xs" 
                          : "border-border text-muted-foreground hover:text-foreground"
                      }`}
                      title={checked ? "Remove from comparison" : "Add to comparison"}
                    >
                      <Scale className="h-3 w-3" />
                      <span>{checked ? "Comparing" : "Compare"}</span>
                    </Button>

                    {/* Unsave / Saved Button */}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation()
                        toggleSave(placement._id)
                      }}
                      className="h-7 text-xs px-2.5 rounded-lg gap-1 border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400 font-semibold hover:bg-rose-500/10 hover:text-rose-600 hover:border-rose-500/30 transition-all cursor-pointer group/btn"
                      title="Remove from saved"
                    >
                      <Bookmark className="h-3 w-3 fill-amber-400 group-hover/btn:hidden" />
                      <Trash2 className="h-3 w-3 hidden group-hover/btn:inline" />
                      <span className="group-hover/btn:hidden">Saved</span>
                      <span className="hidden group-hover/btn:inline">Remove</span>
                    </Button>

                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 w-7 p-0 rounded-lg text-muted-foreground hover:text-foreground"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
