"use client"

import React, { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Download,
  RefreshCw,
  Calendar,
  FileSpreadsheet,
  FileJson,
  BarChart3,
} from "lucide-react"

interface Props {
  currentRange: string
  onRangeChange: (range: string) => void
  onRefresh: () => void
  isRefreshing: boolean
  lastUpdated: Date
}

const RANGES = [
  { label: "7 Days", value: "7d" },
  { label: "30 Days", value: "30d" },
  { label: "90 Days", value: "90d" },
  { label: "6 Months", value: "6m" },
  { label: "1 Year", value: "1y" },
  { label: "All Time", value: "all" },
]

export default function AnalyticsHeader({
  currentRange,
  onRangeChange,
  onRefresh,
  isRefreshing,
  lastUpdated,
}: Props) {
  const [isExporting, setIsExporting] = useState(false)

  const handleExport = async (format: "csv" | "json") => {
    try {
      setIsExporting(true)
      const url = `/api/analytics/export?range=${currentRange}&format=${format}`

      if (format === "csv") {
        // Trigger direct file download
        const a = document.createElement("a")
        a.href = url
        a.download = `placemate-analytics-${new Date().toISOString().slice(0, 10)}.csv`
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
      } else {
        const res = await fetch(url)
        const json = await res.json()
        const blob = new Blob([JSON.stringify(json, null, 2)], { type: "application/json" })
        const blobUrl = URL.createObjectURL(blob)
        const a = document.createElement("a")
        a.href = blobUrl
        a.download = `placemate-analytics-${new Date().toISOString().slice(0, 10)}.json`
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(blobUrl)
      }
    } catch (err) {
      console.error("Export failed:", err)
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-border">
      <div>
        <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground uppercase tracking-wider">
          <BarChart3 className="h-3.5 w-3.5 text-primary" />
          <span>Performance & Funnel Intelligence</span>
          <span>•</span>
          <span>Updated {lastUpdated.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight font-heading mt-1">
          Application Analytics Dashboard
        </h1>
      </div>

      <div className="flex flex-wrap items-center gap-2.5">
        {/* Date Range Selector Pills */}
        <div className="flex items-center bg-secondary/80 p-1 rounded-xl border border-border">
          {RANGES.map((r) => {
            const active = currentRange === r.value
            return (
              <button
                key={r.value}
                onClick={() => onRangeChange(r.value)}
                className={`px-3 py-1 text-xs font-medium rounded-lg transition-all ${
                  active
                    ? "bg-card text-foreground shadow-xs font-semibold"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {r.label}
              </button>
            )
          })}
        </div>

        {/* Refresh Button */}
        <Button
          variant="outline"
          size="sm"
          onClick={onRefresh}
          disabled={isRefreshing}
          className="h-8 gap-1.5 text-xs rounded-xl border-border bg-card"
          title="Refresh real-time data"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${isRefreshing ? "animate-spin text-primary" : "text-muted-foreground"}`} />
          <span className="hidden sm:inline">Refresh</span>
        </Button>

        {/* Export CSV Button */}
        <Button
          variant="outline"
          size="sm"
          onClick={() => handleExport("csv")}
          disabled={isExporting}
          className="h-8 gap-1.5 text-xs rounded-xl border-border bg-card text-foreground hover:bg-secondary"
        >
          <FileSpreadsheet className="h-3.5 w-3.5 text-emerald-500" />
          <span>Export CSV</span>
        </Button>

        {/* Export JSON Button */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => handleExport("json")}
          disabled={isExporting}
          className="h-8 gap-1.5 text-xs rounded-xl text-muted-foreground hover:text-foreground hidden lg:inline-flex"
        >
          <FileJson className="h-3.5 w-3.5 text-sky-500" />
          <span>JSON</span>
        </Button>
      </div>
    </div>
  )
}
