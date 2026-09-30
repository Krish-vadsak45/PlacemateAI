"use client"

import React from "react"
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from "recharts"
import { SkillGapItem } from "@/lib/analytics-service"
import { Award, AlertCircle, CheckCircle2 } from "lucide-react"

interface Props {
  data: SkillGapItem[]
}

const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const item = payload[0].payload as SkillGapItem
    return (
      <div className="bg-popover/95 backdrop-blur-md border border-border p-3 rounded-xl shadow-xl text-xs space-y-1.5 min-w-[150px]">
        <p className="font-semibold text-foreground border-b border-border pb-1 flex items-center justify-between">
          <span>{item.skill}</span>
          {item.userHas ? (
            <span className="text-[10px] text-emerald-500 font-medium flex items-center gap-1">
              <CheckCircle2 className="h-3 w-3" /> In Profile
            </span>
          ) : (
            <span className="text-[10px] text-rose-500 font-medium flex items-center gap-1">
              <AlertCircle className="h-3 w-3" /> Missing
            </span>
          )}
        </p>
        <div className="flex items-center justify-between text-muted-foreground">
          <span>Market Demand:</span>
          <strong className="text-foreground">{item.demand}%</strong>
        </div>
        <div className="flex items-center justify-between text-muted-foreground">
          <span>Profile Match:</span>
          <strong className={item.userHas ? "text-emerald-500" : "text-muted-foreground"}>
            {item.userProficiency}%
          </strong>
        </div>
      </div>
    )
  }
  return null
}

export default function SkillCoverageRadar({ data }: Props) {
  if (!data || data.length === 0) {
    return (
      <div className="glass-panel p-6 rounded-2xl border border-border h-full flex flex-col justify-center items-center text-center py-12">
        <div className="p-3 rounded-2xl bg-secondary mb-3 text-muted-foreground">
          <Award className="h-6 w-6" />
        </div>
        <h3 className="text-sm font-semibold text-foreground">No Skill Requirements Extracted</h3>
        <p className="text-xs text-muted-foreground mt-1 max-w-xs">
          As placements are parsed with required skills, radar analysis will benchmark them against your profile.
        </p>
      </div>
    )
  }

  const missingSkills = data.filter((s) => !s.userHas)
  const matchedSkills = data.filter((s) => s.userHas)

  return (
    <div className="glass-panel p-6 rounded-2xl border border-border h-full flex flex-col justify-between">
      <div className="flex items-center justify-between mb-2">
        <div>
          <h2 className="text-base font-semibold text-foreground tracking-tight font-heading">
            Skill Gap & Market Demand Radar
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Your profile competencies vs. most demanded skills in your target jobs
          </p>
        </div>
        <div className="p-2 rounded-xl bg-primary/5 text-primary border border-border">
          <Award className="h-4 w-4" />
        </div>
      </div>

      <div className="h-64 w-full my-2">
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart cx="50%" cy="50%" outerRadius="75%" data={data}>
            <PolarGrid stroke="currentColor" className="text-border/40" />
            <PolarAngleAxis
              dataKey="skill"
              tick={{ fontSize: 11, fill: "var(--color-foreground)" }}
            />
            <PolarRadiusAxis
              angle={30}
              domain={[0, 100]}
              tick={{ fontSize: 9, fill: "var(--color-muted-foreground)" }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend
              verticalAlign="bottom"
              wrapperStyle={{ fontSize: 11, paddingTop: 10 }}
            />
            <Radar
              name="Company Demand"
              dataKey="demand"
              stroke="#f59e0b"
              fill="#f59e0b"
              fillOpacity={0.35}
            />
            <Radar
              name="Profile Match"
              dataKey="userProficiency"
              stroke="#10b981"
              fill="#10b981"
              fillOpacity={0.45}
            />
          </RadarChart>
        </ResponsiveContainer>
      </div>

      {/* Highlights / Recommendations */}
      <div className="pt-3 border-t border-border space-y-2 text-xs">
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground">Competency Match:</span>
          <span className="font-semibold text-foreground">
            {matchedSkills.length} of {data.length} key skills in profile
          </span>
        </div>
        {missingSkills.length > 0 && (
          <div className="flex flex-wrap items-center gap-1.5 pt-1">
            <span className="text-[11px] text-muted-foreground">High-demand skills to learn:</span>
            {missingSkills.slice(0, 4).map((s) => (
              <span
                key={s.skill}
                className="px-2 py-0.5 rounded-md text-[10px] font-medium bg-rose-500/10 text-rose-500 border border-rose-500/20"
              >
                +{s.skill}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
