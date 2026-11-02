"use client"

import { Button } from "@/components/ui/button"
import { Calendar, TrendingUp, Clock, CheckCircle, Bookmark } from "lucide-react"

interface QuickFiltersProps {
  onFilterSelect: (filter: string) => void
  activeFilter?: string
  savedCount?: number
}

export default function QuickFilters({ onFilterSelect, activeFilter, savedCount }: QuickFiltersProps) {
  const quickFilters = [
    {
      id: "saved",
      label: savedCount !== undefined && savedCount > 0 ? `Saved (${savedCount})` : "Saved",
      icon: Bookmark,
      description: "Bookmarked dream companies",
    },
    {
      id: "this-week",
      label: "This Week",
      icon: Calendar,
      description: "Deadlines within 7 days",
    },
    {
      id: "high-match",
      label: "Top Matches (80%+)",
      icon: TrendingUp,
      description: "80%+ match score",
    },
    {
      id: "urgent",
      label: "Urgent (< 24h)",
      icon: Clock,
      description: "Deadline within 24 hours",
    },
    {
      id: "applied",
      label: "Applied / Active",
      icon: CheckCircle,
      description: "Applied or higher status",
    },
  ]

  return (
    <div className="flex flex-wrap gap-2">
      {quickFilters.map((filter) => {
        const Icon = filter.icon
        const isActive = activeFilter === filter.id
        const isSavedTab = filter.id === "saved"

        return (
          <Button
            key={filter.id}
            variant={isActive ? "default" : "outline"}
            size="sm"
            onClick={() => onFilterSelect(filter.id)}
            className={`gap-1.5 h-8 text-xs rounded-xl transition-all cursor-pointer ${
              isActive 
                ? "bg-primary text-primary-foreground shadow-md shadow-primary/20 scale-105 font-bold" 
                : "glass-3d-pill text-muted-foreground hover:text-foreground"
            }`}
          >
            <Icon className={`h-3.5 w-3.5 ${isSavedTab && (isActive || (savedCount ?? 0) > 0) ? "fill-amber-400 text-amber-500" : ""}`} />
            <span>{filter.label}</span>
          </Button>
        )
      })}
    </div>
  )
}
