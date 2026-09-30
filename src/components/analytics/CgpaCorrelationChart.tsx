"use client"

import React from "react"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts"
import { CgpaCorrelationItem } from "@/lib/analytics-service"
import { GraduationCap } from "lucide-react"

interface Props {
  data: CgpaCorrelationItem[]
  userCgpa?: number
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-popover/95 backdrop-blur-md border border-border p-3 rounded-xl shadow-xl text-xs space-y-1.5 min-w-[150px]">
        <p className="font-semibold text-foreground border-b border-border pb-1">
          Min CGPA Bracket: {label}
        </p>
        {payload.map((entry: any, index: number) => (
          <div key={`cgpa-tip-${index}`} className="flex items-center justify-between gap-4">
            <span className="flex items-center gap-1.5 text-muted-foreground">
              <span className="h-2 w-2 rounded-full" style={{ backgroundColor: entry.fill }} />
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

export default function CgpaCorrelationChart({ data, userCgpa }: Props) {
  const hasData = data && data.some((d) => d.totalDrives > 0)

  if (!hasData) {
    return (
      <div className="glass-panel p-6 rounded-2xl border border-border h-full flex flex-col justify-center items-center text-center py-12">
        <div className="p-3 rounded-2xl bg-secondary mb-3 text-muted-foreground">
          <GraduationCap className="h-6 w-6" />
        </div>
        <h3 className="text-sm font-semibold text-foreground">No CGPA Criteria Data</h3>
        <p className="text-xs text-muted-foreground mt-1 max-w-xs">
          Eligibility insights will populate as drive criteria are parsed.
        </p>
      </div>
    )
  }

  return (
    <div className="glass-panel p-6 rounded-2xl border border-border h-full flex flex-col justify-between">
      <div className="flex items-center justify-between mb-2">
        <div>
          <h2 className="text-base font-semibold text-foreground tracking-tight font-heading">
            CGPA Eligibility & Outcomes
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Drives, eligibility, and offers across minimum CGPA requirement brackets
          </p>
        </div>
        <div className="p-2 rounded-xl bg-primary/5 text-primary border border-border">
          <GraduationCap className="h-4 w-4" />
        </div>
      </div>

      <div className="h-64 w-full my-2">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="currentColor" className="text-border/40" />
            <XAxis
              dataKey="bracket"
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
            <Bar dataKey="totalDrives" name="Total Drives" fill="#818cf8" radius={[4, 4, 0, 0]} />
            <Bar dataKey="appliedCount" name="Applied" fill="#38bdf8" radius={[4, 4, 0, 0]} />
            <Bar dataKey="offerCount" name="Offers" fill="#34d399" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="pt-3 border-t border-border flex items-center justify-between text-xs text-muted-foreground">
        <span>
          Your Profile CGPA:{" "}
          <strong className="text-foreground">
            {userCgpa ? userCgpa.toFixed(2) : "Not configured"}
          </strong>
        </span>
        <span className="text-[11px]">Bracket distribution based on company cutoffs</span>
      </div>
    </div>
  )
}
