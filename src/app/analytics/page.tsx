import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { computeDashboardAnalytics } from "@/lib/analytics-service"
import AnalyticsDashboardClient from "@/components/analytics/AnalyticsDashboardClient"
import { Metadata } from "next"

export const metadata: Metadata = {
  title: "Application Analytics & Insights | PlaceMate AI",
  description: "Track your placement success rates, interview funnel, company response times, and skills gap analysis.",
}

export default async function AnalyticsPage() {
  const session = await auth()

  if (!session?.user?.id) {
    redirect("/api/auth/signin")
  }

  let initialData = undefined
  try {
    initialData = await computeDashboardAnalytics(session.user.id, "90d")
  } catch (err) {
    console.error("Error prefetching analytics for user:", err)
  }

  return (
    <div className="min-h-screen bg-background text-foreground pb-20">
      <main className="container mx-auto px-4 sm:px-6 lg:px-8 pt-8 max-w-7xl">
        <AnalyticsDashboardClient initialData={initialData} />
      </main>
    </div>
  )
}
