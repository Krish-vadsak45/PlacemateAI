"use client"

import React, { useState, useEffect, useCallback } from "react"
import { DashboardAnalyticsData } from "@/lib/analytics-service"
import AnalyticsHeader from "./AnalyticsHeader"
import AnalyticsKPICards from "./AnalyticsKPICards"
import ApplicationFunnelChart from "./ApplicationFunnelChart"
import StatusDistributionChart from "./StatusDistributionChart"
import PlacementTrendChart from "./PlacementTrendChart"
import SkillCoverageRadar from "./SkillCoverageRadar"
import CgpaCorrelationChart from "./CgpaCorrelationChart"
import CompanyPerformanceTable from "./CompanyPerformanceTable"
import { Sparkles, AlertCircle, Briefcase } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"

interface Props {
  initialData?: DashboardAnalyticsData
}

export default function AnalyticsDashboardClient({ initialData }: Props) {
  const [data, setData] = useState<DashboardAnalyticsData | null>(initialData || null)
  const [range, setRange] = useState("90d")
  const [isLoading, setIsLoading] = useState(!initialData)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [lastUpdated, setLastUpdated] = useState(new Date())
  const [error, setError] = useState<string | null>(null)

  const fetchData = useCallback(
    async (selectedRange: string, forceRefresh: boolean = false) => {
      try {
        if (forceRefresh) {
          setIsRefreshing(true)
        } else if (!data) {
          setIsLoading(true)
        }

        setError(null)
        const res = await fetch(
          `/api/analytics/dashboard?range=${selectedRange}${forceRefresh ? "&refresh=true" : ""}`
        )
        const json = await res.json()

        if (!res.ok || !json.success) {
          throw new Error(json.error || "Failed to load analytics")
        }

        setData(json.data)
        setLastUpdated(new Date())
      } catch (err: any) {
        setError(err.message || "Something went wrong loading analytics data")
      } finally {
        setIsLoading(false)
        setIsRefreshing(false)
      }
    },
    [data]
  )

  useEffect(() => {
    fetchData(range, false)
  }, [range])

  const handleRefresh = () => {
    fetchData(range, true)
  }

  if (isLoading && !data) {
    return (
      <div className="space-y-8 animate-pulse">
        {/* Header Skeleton */}
        <div className="h-14 bg-secondary/50 rounded-2xl w-full" />
        {/* KPI Cards Skeleton */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-28 bg-secondary/40 rounded-2xl border border-border/50" />
          ))}
        </div>
        {/* Charts Grid Skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-7 h-80 bg-secondary/30 rounded-2xl border border-border/50" />
          <div className="lg:col-span-5 h-80 bg-secondary/30 rounded-2xl border border-border/50" />
        </div>
      </div>
    )
  }

  if (error && !data) {
    return (
      <div className="glass-panel p-12 rounded-2xl border border-border text-center space-y-4 max-w-lg mx-auto my-12">
        <div className="p-3 rounded-2xl bg-destructive/10 text-destructive inline-block">
          <AlertCircle className="h-8 w-8" />
        </div>
        <h3 className="text-lg font-bold text-foreground">Failed to Load Analytics</h3>
        <p className="text-xs text-muted-foreground">{error}</p>
        <Button onClick={() => fetchData(range, true)} className="mt-2 text-xs">
          Try Again
        </Button>
      </div>
    )
  }

  const isEmpty = !data || data.kpis.totalDrives === 0

  return (
    <div className="space-y-8">
      {/* Top Header & Range Selection */}
      <AnalyticsHeader
        currentRange={range}
        onRangeChange={setRange}
        onRefresh={handleRefresh}
        isRefreshing={isRefreshing}
        lastUpdated={lastUpdated}
      />

      {isEmpty ? (
        <div className="glass-panel p-12 rounded-3xl border border-border text-center max-w-2xl mx-auto my-12 space-y-4">
          <div className="p-4 rounded-2xl bg-primary/10 text-primary inline-flex">
            <Briefcase className="h-8 w-8" />
          </div>
          <h2 className="text-xl font-bold tracking-tight text-foreground font-heading">
            No Placement Activity Found
          </h2>
          <p className="text-xs text-muted-foreground max-w-md mx-auto">
            Once campus placement emails are parsed or opportunities are added to your tracker, PlaceMate AI will automatically compute your application funnel, turnaround times, and skill radar.
          </p>
          <div className="pt-2 flex items-center justify-center gap-3">
            <Link href="/dashboard">
              <Button size="sm" className="gap-2 text-xs rounded-xl">
                <Sparkles className="h-3.5 w-3.5" />
                Go to Dashboard
              </Button>
            </Link>
          </div>
        </div>
      ) : (
        <>
          {/* Bento KPI Cards */}
          <AnalyticsKPICards kpis={data.kpis} />

          {/* Row 1: Funnel & Status Distribution */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
            <div className="lg:col-span-7">
              <ApplicationFunnelChart stages={data.funnel} />
            </div>
            <div className="lg:col-span-5">
              <StatusDistributionChart data={data.statusDistribution} />
            </div>
          </div>

          {/* Row 2: Placement Trends & Skill Radar */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
            <div className="lg:col-span-7">
              <PlacementTrendChart data={data.monthlyTrends} />
            </div>
            <div className="lg:col-span-5">
              <SkillCoverageRadar data={data.skillRadar} />
            </div>
          </div>

          {/* Row 3: CGPA Correlation & Cutoffs */}
          <div className="grid grid-cols-1 gap-6">
            <CgpaCorrelationChart
              data={data.cgpaCorrelation}
              userCgpa={data.userCgpa}
            />
          </div>

          {/* Row 4: Company Performance Breakdown Table */}
          <div className="grid grid-cols-1 gap-6">
            <CompanyPerformanceTable companies={data.companyBreakdown} />
          </div>
        </>
      )}
    </div>
  )
}
