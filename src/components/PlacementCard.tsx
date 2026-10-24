"use client"

import { Button } from "@/components/ui/button"
import { MapPin, ExternalLink, Clock, Sparkles, Scale } from "lucide-react"
import TagBadge from "./placement/TagBadge"
import { useComparison } from "@/context/ComparisonContext"

interface PlacementCardProps {
  id?: string
  companyName: string
  jobRole: string
  package?: string
  location?: string
  applicationDeadline?: Date
  status: string
  applicationLink?: string
  matchScore?: number
  tags?: string[]
  onTagClick?: (tag: string) => void
  onViewDetails?: () => void
}

export default function PlacementCard({
  id,
  companyName,
  jobRole,
  package: salary,
  location,
  applicationDeadline,
  status,
  applicationLink,
  matchScore,
  tags = [],
  onTagClick,
  onViewDetails,
}: PlacementCardProps) {
  const { toggleItem, isSelected } = useComparison()
  const checked = id ? isSelected(id) : false

  const handleCompareClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (id) {
      toggleItem({
        id,
        companyName,
        jobRole,
        package: salary,
      })
    }
  }

  const getStatusColor = (s: string) => {
    switch (s) {
      case "SELECTED":
        return "bg-emerald-500/10 text-emerald-500 border-emerald-500/30"
      case "INTERVIEW_SCHEDULED":
      case "ASSESSMENT_SCHEDULED":
        return "bg-amber-500/10 text-amber-500 border-amber-500/30"
      case "APPLIED":
      case "INTERESTED":
      case "NEW":
        return "bg-blue-500/10 text-blue-500 border-blue-500/30"
      case "REJECTED":
        return "bg-rose-500/10 text-rose-500 border-rose-500/30"
      default:
        return "bg-muted text-muted-foreground border-border"
    }
  }

  return (
    <div 
      onClick={onViewDetails}
      className="glass-3d-card p-5 transition-all cursor-pointer group"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3.5 flex-1 min-w-0">
          <div className="h-10 w-10 rounded-xl bg-zinc-900/90 text-white dark:bg-zinc-100 dark:text-zinc-950 border border-border flex items-center justify-center font-bold text-sm shrink-0 shadow-sm transition-transform group-hover:scale-105">
            {companyName.charAt(0).toUpperCase()}
          </div>

          <div className="space-y-1.5 min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-sm font-bold text-foreground transition-colors truncate font-heading group-hover:text-primary">
                {companyName}
              </h3>
              <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${getStatusColor(status)}`}>
                {status.replace(/_/g, " ")}
              </span>
              {matchScore !== undefined && (
                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border flex items-center gap-1 ${
                  matchScore >= 80 
                    ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/30" 
                    : matchScore >= 60 
                    ? "bg-amber-500/10 text-amber-500 border-amber-500/30" 
                    : "bg-zinc-800 text-muted-foreground border-border"
                }`}>
                  <Sparkles className="h-2.5 w-2.5" />
                  {matchScore}% Match
                </span>
              )}
            </div>

            <p className="text-xs text-muted-foreground truncate font-medium">{jobRole}</p>

            <div className="flex items-center gap-2.5 pt-1 flex-wrap text-xs text-muted-foreground">
              {salary && (
                <span className="font-semibold text-foreground bg-secondary/80 px-2 py-0.5 rounded-md border border-border/60">
                  💰 {salary}
                </span>
              )}
              {location && (
                <span className="inline-flex items-center gap-1">
                  <MapPin className="h-3 w-3 text-muted-foreground" />
                  {location}
                </span>
              )}
              {applicationDeadline && (
                <span className="inline-flex items-center gap-1 text-amber-500 font-medium">
                  <Clock className="h-3 w-3" />
                  Deadline: {new Date(applicationDeadline).toLocaleDateString()}
                </span>
              )}
            </div>

            {tags && tags.length > 0 && (
              <div className="flex items-center gap-1.5 pt-1.5 flex-wrap">
                {tags.map((tag) => (
                  <TagBadge
                    key={tag}
                    tag={tag}
                    size="sm"
                    onClick={
                      onTagClick
                        ? () => onTagClick(tag)
                        : undefined
                    }
                  />
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
          {id && (
            <Button
              size="sm"
              variant={checked ? "default" : "outline"}
              onClick={handleCompareClick}
              className={`h-8 text-xs gap-1 rounded-xl transition-all ${
                checked
                  ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-950 font-semibold shadow-sm"
                  : "border-border text-muted-foreground hover:text-foreground"
              }`}
            >
              <Scale className="h-3 w-3" />
              <span className="hidden sm:inline">{checked ? "Selected" : "Compare"}</span>
            </Button>
          )}
          {applicationLink && (
            <a href={applicationLink} target="_blank" rel="noopener noreferrer">
              <Button size="sm" variant="outline" className="h-8 text-xs gap-1.5 rounded-xl border-border hover:border-primary/50">
                Apply <ExternalLink className="h-3 w-3" />
              </Button>
            </a>
          )}
        </div>
      </div>
    </div>
  )
}

