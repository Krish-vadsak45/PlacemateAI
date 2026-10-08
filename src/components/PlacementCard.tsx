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
        return "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/50"
      case "INTERVIEW_SCHEDULED":
      case "ASSESSMENT_SCHEDULED":
        return "bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800/50"
      case "APPLIED":
      case "INTERESTED":
      case "NEW":
        return "bg-zinc-100 dark:bg-zinc-800 text-foreground border-border"
      case "REJECTED":
        return "bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800/50"
      default:
        return "bg-muted text-muted-foreground border-border"
    }
  }

  return (
    <div 
      onClick={onViewDetails}
      className="glass-panel rounded-2xl p-5 border border-border glow-card transition-all cursor-pointer group"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3.5 flex-1 min-w-0">
          <div className="h-10 w-10 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-foreground border border-border flex items-center justify-center font-bold text-sm shrink-0">
            {companyName.charAt(0).toUpperCase()}
          </div>

          <div className="space-y-1 min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-sm font-bold text-foreground transition-colors truncate">
                {companyName}
              </h3>
              <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${getStatusColor(status)}`}>
                {status.replace(/_/g, " ")}
              </span>
              {matchScore !== undefined && (
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full border border-border bg-zinc-100 dark:bg-zinc-800 text-foreground flex items-center gap-1">
                  <Sparkles className="h-2.5 w-2.5 text-muted-foreground" />
                  {matchScore}% Match
                </span>
              )}
            </div>

            <p className="text-xs text-muted-foreground truncate">{jobRole}</p>

            <div className="flex items-center gap-2.5 pt-1.5 flex-wrap text-xs text-muted-foreground">
              {salary && (
                <span className="font-medium text-foreground bg-muted/60 px-2 py-0.5 rounded-md">
                  {salary}
                </span>
              )}
              {location && (
                <span className="inline-flex items-center gap-1">
                  <MapPin className="h-3 w-3" />
                  {location}
                </span>
              )}
              {applicationDeadline && (
                <span className="inline-flex items-center gap-1">
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
                  ? "bg-primary text-primary-foreground font-semibold"
                  : "border-border text-muted-foreground hover:text-foreground"
              }`}

            >
              <Scale className="h-3 w-3" />
              <span className="hidden sm:inline">{checked ? "Selected" : "Compare"}</span>
            </Button>
          )}
          {applicationLink && (
            <a href={applicationLink} target="_blank" rel="noopener noreferrer">
              <Button size="sm" variant="outline" className="h-8 text-xs gap-1.5 rounded-xl border-border">
                Apply <ExternalLink className="h-3 w-3" />
              </Button>
            </a>
          )}
        </div>
      </div>
    </div>
  )
}

