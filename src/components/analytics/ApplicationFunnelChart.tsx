"use client"

import React from "react"
import { FunnelStage } from "@/lib/analytics-service"
import { Filter, ChevronDown, CheckCircle2 } from "lucide-react"

interface Props {
  stages: FunnelStage[]
}

const STAGE_COLORS = [
  "bg-indigo-500",
  "bg-blue-500",
  "bg-cyan-500",
  "bg-amber-500",
  "bg-purple-500",
  "bg-emerald-500",
]

const STAGE_BAR_COLORS = [
  "from-indigo-500 to-indigo-600",
  "from-blue-500 to-blue-600",
  "from-cyan-500 to-cyan-600",
  "from-amber-500 to-amber-600",
  "from-purple-500 to-purple-600",
  "from-emerald-500 to-emerald-600",
]

export default function ApplicationFunnelChart({ stages }: Props) {
  const maxCount = stages.length > 0 && stages[0].count > 0 ? stages[0].count : 1

  return (
    <div className="glass-panel p-6 rounded-2xl border border-border h-full flex flex-col justify-between">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-base font-semibold text-foreground tracking-tight font-heading">
            Application Funnel
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Stage conversion & retention through campus drive rounds
          </p>
        </div>
        <div className="p-2 rounded-xl bg-primary/5 text-primary border border-border">
          <Filter className="h-4 w-4" />
        </div>
      </div>

      <div className="space-y-4 my-auto pt-2">
        {stages.map((stage, idx) => {
          const widthPercent = Math.max(Math.round((stage.count / maxCount) * 100), 2)
          const prevCount = idx > 0 ? stages[idx - 1].count : null
          const conversionFromPrev = prevCount && prevCount > 0
            ? Math.round((stage.count / prevCount) * 100)
            : null

          return (
            <div key={stage.key} className="group relative">
              <div className="flex items-center justify-between text-xs mb-1.5 font-medium">
                <div className="flex items-center gap-2">
                  <span className={`h-2 w-2 rounded-full ${STAGE_COLORS[idx % STAGE_COLORS.length]}`} />
                  <span className="text-foreground">{stage.stage}</span>
                </div>
                <div className="flex items-center gap-3">
                  {conversionFromPrev !== null && (
                    <span className="text-[11px] text-muted-foreground hidden sm:inline">
                      {conversionFromPrev}% of prev stage
                    </span>
                  )}
                  <span className="font-semibold text-foreground">
                    {stage.count} <span className="text-[11px] text-muted-foreground font-normal">({stage.percentage}%)</span>
                  </span>
                </div>
              </div>

              {/* Funnel Bar */}
              <div className="h-3 w-full bg-secondary/50 rounded-full overflow-hidden p-0.5">
                <div
                  className={`h-full rounded-full bg-gradient-to-r ${STAGE_BAR_COLORS[idx % STAGE_BAR_COLORS.length]} transition-all duration-700 ease-out`}
                  style={{ width: `${widthPercent}%` }}
                />
              </div>
            </div>
          )
        })}
      </div>

      <div className="mt-6 pt-4 border-t border-border flex items-center justify-between text-xs text-muted-foreground">
        <div className="flex items-center gap-1.5">
          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
          <span>Final offer yield: <strong>{stages[stages.length - 1]?.percentage || 0}%</strong></span>
        </div>
        <span>Calculated from active drives</span>
      </div>
    </div>
  )
}
