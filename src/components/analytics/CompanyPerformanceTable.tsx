"use client"

import React, { useState, useMemo } from "react"
import { CompanyMetricItem } from "@/lib/analytics-service"
import {
  Building2,
  Search,
  ExternalLink,
  Clock,
  Sparkles,
  ChevronRight,
} from "lucide-react"
import Link from "next/link"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"

interface Props {
  companies: CompanyMetricItem[]
}

const STATUS_VARIANTS: Record<string, { label: string; className: string }> = {
  NEW: { label: "New", className: "bg-indigo-500/10 text-indigo-500 border-indigo-500/20" },
  INTERESTED: { label: "Interested", className: "bg-blue-500/10 text-blue-500 border-blue-500/20" },
  APPLIED: { label: "Applied", className: "bg-sky-500/10 text-sky-500 border-sky-500/20" },
  ASSESSMENT_SCHEDULED: { label: "Assessment", className: "bg-amber-500/10 text-amber-500 border-amber-500/20" },
  INTERVIEW_SCHEDULED: { label: "Interview", className: "bg-purple-500/10 text-purple-500 border-purple-500/20" },
  SELECTED: { label: "Selected / Offer", className: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" },
  REJECTED: { label: "Rejected", className: "bg-rose-500/10 text-rose-500 border-rose-500/20" },
  NOT_INTERESTED: { label: "Not Interested", className: "bg-zinc-500/10 text-zinc-500 border-zinc-500/20" },
  EXPIRED: { label: "Expired", className: "bg-zinc-500/10 text-zinc-500 border-zinc-500/20" },
}

export default function CompanyPerformanceTable({ companies }: Props) {
  const [searchTerm, setSearchTerm] = useState("")

  const filtered = useMemo(() => {
    if (!searchTerm.trim()) return companies
    const q = searchTerm.toLowerCase()
    return companies.filter(
      (c) =>
        c.companyName.toLowerCase().includes(q) ||
        c.jobRole.toLowerCase().includes(q) ||
        c.status.toLowerCase().includes(q)
    )
  }, [companies, searchTerm])

  return (
    <div className="glass-panel p-6 rounded-2xl border border-border">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
        <div>
          <h2 className="text-base font-semibold text-foreground tracking-tight font-heading">
            Company-Wise Performance & Response Logs
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Turnaround times, match scores, and status by company
          </p>
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            placeholder="Search company or role..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 h-9 text-xs rounded-xl bg-card border-border"
          />
        </div>
      </div>

      <div className="overflow-x-auto rounded-xl border border-border">
        <table className="w-full text-left text-xs">
          <thead className="bg-secondary/60 text-muted-foreground font-semibold border-b border-border">
            <tr>
              <th className="py-3 px-4">Company & Role</th>
              <th className="py-3 px-4">Status</th>
              <th className="py-3 px-4">Package</th>
              <th className="py-3 px-4">AI Match</th>
              <th className="py-3 px-4">Response Time</th>
              <th className="py-3 px-4 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-8 text-center text-muted-foreground">
                  No company records match your search.
                </td>
              </tr>
            ) : (
              filtered.map((item) => {
                const statusMeta = STATUS_VARIANTS[item.status] || {
                  label: item.status,
                  className: "bg-secondary text-foreground",
                }

                return (
                  <tr
                    key={item.id}
                    className="hover:bg-card/50 transition-colors duration-150 group"
                  >
                    <td className="py-3 px-4">
                      <div className="font-semibold text-foreground flex items-center gap-2">
                        <Building2 className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                        <span>{item.companyName}</span>
                      </div>
                      <div className="text-[11px] text-muted-foreground mt-0.5">
                        {item.jobRole}
                      </div>
                    </td>

                    <td className="py-3 px-4">
                      <Badge
                        variant="outline"
                        className={`text-[11px] font-medium border px-2 py-0.5 rounded-md ${statusMeta.className}`}
                      >
                        {statusMeta.label}
                      </Badge>
                    </td>

                    <td className="py-3 px-4 text-foreground font-medium">
                      {item.package}
                    </td>

                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-2 bg-secondary rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${
                              item.matchScore >= 80
                                ? "bg-emerald-500"
                                : item.matchScore >= 60
                                ? "bg-amber-500"
                                : "bg-zinc-400"
                            }`}
                            style={{ width: `${item.matchScore}%` }}
                          />
                        </div>
                        <span className="font-semibold text-foreground">
                          {item.matchScore}%
                        </span>
                      </div>
                    </td>

                    <td className="py-3 px-4 text-muted-foreground">
                      {item.responseDays !== undefined ? (
                        <div className="flex items-center gap-1 text-foreground font-medium">
                          <Clock className="h-3 w-3 text-muted-foreground" />
                          <span>{item.responseDays} day{item.responseDays === 1 ? "" : "s"}</span>
                        </div>
                      ) : (
                        <span className="text-[11px] text-muted-foreground">Pending</span>
                      )}
                    </td>

                    <td className="py-3 px-4 text-right">
                      <Link
                        href={`/dashboard`}
                        className="inline-flex items-center gap-1 text-[11px] text-primary hover:underline font-medium"
                      >
                        <span>View</span>
                        <ChevronRight className="h-3 w-3" />
                      </Link>
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between text-xs text-muted-foreground mt-4">
        <span>Showing {filtered.length} of {companies.length} companies</span>
        <span>Sorted by AI Job Match Score</span>
      </div>
    </div>
  )
}
