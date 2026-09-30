"use client"

import React from "react"
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
} from "recharts"
import { StatusDistributionItem } from "@/lib/analytics-service"
import { PieChart as PieIcon } from "lucide-react"

interface Props {
  data: StatusDistributionItem[]
}

const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const item = payload[0].payload as StatusDistributionItem
    return (
      <div className="bg-popover/95 backdrop-blur-md border border-border p-2.5 rounded-xl shadow-xl text-xs space-y-1">
        <div className="flex items-center gap-1.5 font-medium text-foreground">
          <span className="h-2 w-2 rounded-full" style={{ backgroundColor: item.fill }} />
          <span>{item.label}</span>
        </div>
        <p className="text-muted-foreground">
          Count: <strong className="text-foreground">{item.count}</strong>
        </p>
      </div>
    )
  }
  return null
}

export default function StatusDistributionChart({ data }: Props) {
  const total = data.reduce((acc, curr) => acc + curr.count, 0)

  if (total === 0) {
    return (
      <div className="glass-panel p-6 rounded-2xl border border-border h-full flex flex-col justify-center items-center text-center py-12">
        <div className="p-3 rounded-2xl bg-secondary mb-3 text-muted-foreground">
          <PieIcon className="h-6 w-6" />
        </div>
        <h3 className="text-sm font-semibold text-foreground">No Status Data</h3>
        <p className="text-xs text-muted-foreground mt-1 max-w-xs">
          Start adding or discovering placements to see your status distribution.
        </p>
      </div>
    )
  }

  return (
    <div className="glass-panel p-6 rounded-2xl border border-border h-full flex flex-col justify-between">
      <div className="flex items-center justify-between mb-2">
        <div>
          <h2 className="text-base font-semibold text-foreground tracking-tight font-heading">
            Status Breakdown
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Distribution of {total} placements by current round
          </p>
        </div>
        <div className="p-2 rounded-xl bg-primary/5 text-primary border border-border">
          <PieIcon className="h-4 w-4" />
        </div>
      </div>

      <div className="h-56 w-full relative flex items-center justify-center my-2">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Tooltip content={<CustomTooltip />} />
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={55}
              outerRadius={80}
              paddingAngle={4}
              dataKey="count"
              animationDuration={800}
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.fill} stroke="transparent" />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
        {/* Center label */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <span className="text-2xl font-bold font-heading text-foreground">{total}</span>
          <span className="text-[10px] uppercase font-semibold text-muted-foreground tracking-wider">Total</span>
        </div>
      </div>

      {/* Legend Grid */}
      <div className="grid grid-cols-2 gap-x-4 gap-y-2 pt-2 border-t border-border mt-2">
        {data.slice(0, 6).map((item) => (
          <div key={item.status} className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-1.5 truncate">
              <span className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: item.fill }} />
              <span className="text-muted-foreground truncate">{item.label}</span>
            </div>
            <span className="font-semibold text-foreground shrink-0">{item.count}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
