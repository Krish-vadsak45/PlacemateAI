"use client"

import React from "react"
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts"
import { MonthlyTrendItem } from "@/lib/analytics-service"
import { TrendingUp } from "lucide-react"

interface Props {
  data: MonthlyTrendItem[]
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-popover/95 backdrop-blur-md border border-border p-3 rounded-xl shadow-xl text-xs space-y-1.5 min-w-[140px]">
        <p className="font-semibold text-foreground border-b border-border pb-1">{label}</p>
        {payload.map((entry: any, index: number) => (
          <div key={`item-${index}`} className="flex items-center justify-between gap-4">
            <span className="flex items-center gap-1.5 text-muted-foreground">
              <span className="h-2 w-2 rounded-full" style={{ backgroundColor: entry.color }} />
              {entry.name}:
            </span>
            <span className="font-bold text-foreground">{entry.value}</span>
          </div>
        ))}
      </div>
    )
  }
  return null
}

export default function PlacementTrendChart({ data }: Props) {
  if (!data || data.length === 0) {
    return (
      <div className="glass-panel p-6 rounded-2xl border border-border h-full flex flex-col justify-center items-center text-center py-12">
        <div className="p-3 rounded-2xl bg-secondary mb-3 text-muted-foreground">
          <TrendingUp className="h-6 w-6" />
        </div>
        <h3 className="text-sm font-semibold text-foreground">No Trend Data</h3>
        <p className="text-xs text-muted-foreground mt-1 max-w-xs">
          Activity over time will appear here once placements are tracked across months.
        </p>
      </div>
    )
  }

  return (
    <div className="glass-panel p-6 rounded-2xl border border-border h-full flex flex-col justify-between">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-base font-semibold text-foreground tracking-tight font-heading">
            Placement & Application Activity Trends
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Monthly timeline of opportunities discovered vs applications vs offers
          </p>
        </div>
        <div className="p-2 rounded-xl bg-primary/5 text-primary border border-border">
          <TrendingUp className="h-4 w-4" />
        </div>
      </div>

      <div className="h-64 w-full my-2">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="colorDiscovered" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="colorApplied" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.4} />
                <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="colorOffers" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="currentColor" className="text-border/40" />
            <XAxis
              dataKey="month"
              tickLine={false}
              axisLine={false}
              tick={{ fontSize: 11, fill: "var(--color-muted-foreground)" }}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              allowDecimals={false}
              tick={{ fontSize: 11, fill: "var(--color-muted-foreground)" }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend
              verticalAlign="top"
              align="right"
              iconType="circle"
              wrapperStyle={{ fontSize: 11, paddingBottom: 10 }}
            />
            <Area
              type="monotone"
              dataKey="discovered"
              name="Discovered"
              stroke="#6366f1"
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#colorDiscovered)"
            />
            <Area
              type="monotone"
              dataKey="applied"
              name="Applied"
              stroke="#0ea5e9"
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#colorApplied)"
            />
            <Area
              type="monotone"
              dataKey="offers"
              name="Offers"
              stroke="#10b981"
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#colorOffers)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="pt-2 border-t border-border flex items-center justify-between text-xs text-muted-foreground">
        <span>Tracking across active college placement session</span>
        <span className="font-medium text-foreground">Updated in real-time</span>
      </div>
    </div>
  )
}
