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
      label: "High Match",
      icon: TrendingUp,
      description: "80%+ match score",
    },
    {
      id: "urgent",
      label: "Urgent",
      icon: Clock,
      description: "Deadline within 24 hours",
    },
    {
      id: "applied",
      label: "Applied",
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
            className="gap-2"
          >
            <Icon className="h-4 w-4" />
            {filter.label}
          </Button>
        )
      })}
    </div>
  )
}
