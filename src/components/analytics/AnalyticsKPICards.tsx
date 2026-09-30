"use client"

import React from "react"
import { AnalyticsKPIs } from "@/lib/analytics-service"
import {
  Trophy,
  Send,
  UserCheck,
  Clock,
  Sparkles,
  Timer,
  TrendingUp,
} from "lucide-react"

interface Props {
  kpis: AnalyticsKPIs
}

export default function AnalyticsKPICards({ kpis }: Props) {
  const cards = [
    {
      title: "Success Rate",
      value: `${kpis.successRate}%`,
      subtitle: `${kpis.totalOffers} offer${kpis.totalOffers === 1 ? "" : "s"} earned from ${kpis.totalApplied} applied`,
      icon: Trophy,
      color: "text-emerald-500",
      bgGradient: "from-emerald-500/10 via-emerald-500/5 to-transparent",
      borderColor: "hover:border-emerald-500/40",
      highlight: true,
    },
    {
      title: "Interview Rate",
      value: `${kpis.interviewRate}%`,
      subtitle: `${kpis.totalInterviews} reached interview / test stage`,
      icon: UserCheck,
      color: "text-purple-500",
      bgGradient: "from-purple-500/10 via-purple-500/5 to-transparent",
      borderColor: "hover:border-purple-500/40",
    },
    {
      title: "Applications In Progress",
      value: `${kpis.inProgress}`,
      subtitle: `${kpis.totalApplied} submitted / ${kpis.totalRejected} rejected`,
      icon: Send,
      color: "text-sky-500",
      bgGradient: "from-sky-500/10 via-sky-500/5 to-transparent",
      borderColor: "hover:border-sky-500/40",
    },
    {
      title: "Total Drives Tracked",
      value: `${kpis.totalDrives}`,
      subtitle: "Discovered & analyzed on campus",
      icon: Sparkles,
      color: "text-indigo-500",
      bgGradient: "from-indigo-500/10 via-indigo-500/5 to-transparent",
      borderColor: "hover:border-indigo-500/40",
    },
    {
      title: "Avg Time to Offer",
      value: kpis.avgTimeToOfferDays > 0 ? `${kpis.avgTimeToOfferDays} days` : "N/A",
      subtitle: "From application to selection",
      icon: Timer,
      color: "text-amber-500",
      bgGradient: "from-amber-500/10 via-amber-500/5 to-transparent",
      borderColor: "hover:border-amber-500/40",
    },
    {
      title: "Avg Response Time",
      value: kpis.avgResponseTimeDays > 0 ? `${kpis.avgResponseTimeDays} days` : "N/A",
      subtitle: "Turnaround to test / 1st round",
      icon: Clock,
      color: "text-rose-500",
      bgGradient: "from-rose-500/10 via-rose-500/5 to-transparent",
      borderColor: "hover:border-rose-500/40",
    },
  ]

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
      {cards.map((card, idx) => {
        const Icon = card.icon
        return (
          <div
            key={idx}
            className={`glass-panel p-4 rounded-2xl border border-border bg-gradient-to-b ${card.bgGradient} transition-all duration-200 hover:shadow-lg ${card.borderColor} flex flex-col justify-between`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground truncate">
                {card.title}
              </span>
              <div className={`p-1.5 rounded-lg bg-card/80 border border-border/60 ${card.color}`}>
                <Icon className="h-4 w-4" />
              </div>
            </div>

            <div>
              <div className="text-2xl font-bold tracking-tight text-foreground font-heading">
                {card.value}
              </div>
              <p className="text-[11px] text-muted-foreground mt-1 line-clamp-2 leading-tight">
                {card.subtitle}
              </p>
            </div>
          </div>
        )
      })}
    </div>
  )
}
