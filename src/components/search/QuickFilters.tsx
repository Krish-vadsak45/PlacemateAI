"use client"

import { Button } from "@/components/ui/button"
import { Calendar, TrendingUp, Clock, CheckCircle } from "lucide-react"

interface QuickFiltersProps {
  onFilterSelect: (filter: string) => void
  activeFilter?: string
}

export default function QuickFilters({ onFilterSelect, activeFilter }: QuickFiltersProps) {
  const quickFilters = [
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
        return (
          <Button
            key={filter.id}
            variant={isActive ? "default" : "outline"}
            size="sm"
            onClick={() => onFilterSelect(filter.id)}
            className={`gap-1.5 h-8 text-xs rounded-xl transition-all cursor-pointer ${
              isActive 
                ? "bg-primary text-primary-foreground shadow-sm" 
                : "border-border/80 bg-background/50 hover:bg-muted/80 text-muted-foreground hover:text-foreground"
            }`}
          >
            <Icon className="h-3.5 w-3.5" />
            <span>{filter.label}</span>
          </Button>
        )
      })}
    </div>
  )
}
