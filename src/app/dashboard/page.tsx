import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import connectDB from "@/lib/mongodb"
import Placement from "@/models/Placement"
import PlacementList from "@/components/PlacementList"
import GmailMonitorToggle from "@/components/GmailMonitorToggle"
import DashboardSwitcher from "@/components/DashboardSwitcher"
import SharingManager from "@/components/SharingManager"
import { 
  Briefcase, 
  Sparkles, 
  Clock, 
  TrendingUp, 
  UserCheck, 
  Building2,
  BarChart3 
} from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { checkSharedAccess } from "@/lib/shared-access"

interface DashboardProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

export default async function Dashboard({ searchParams }: DashboardProps) {
  const session = await auth()
  
  if (!session?.user) {
    redirect("/api/auth/signin")
  }

  const resolvedParams = await searchParams
  const targetOwnerId = typeof resolvedParams.ownerId === 'string' ? resolvedParams.ownerId : undefined
  
  // Check shared access if viewing another user's dashboard
  let isViewingShared = false
  let sharedPermission: string = 'owner'

  if (targetOwnerId && targetOwnerId !== session.user.id) {
    const access = await checkSharedAccess(session.user.id, targetOwnerId, 'viewer')
    if (!access.allowed) {
      redirect("/dashboard")
    }
    isViewingShared = true
    sharedPermission = access.permission
  }

  const effectiveUserId = targetOwnerId || session.user.id

  // Fetch real statistics from database
  let totalPlacements = 0
  let highMatchCount = 0
  let activeDeadlines = 0
  let appliedCount = 0
  let selectedCount = 0

  try {
    await connectDB()
    const now = new Date()

    const [total, highMatch, deadlines, applied, selected] = await Promise.all([
      Placement.countDocuments({ userId: effectiveUserId }),
      Placement.countDocuments({ userId: effectiveUserId, matchScore: { $gte: 80 } }),
      Placement.countDocuments({ userId: effectiveUserId, applicationDeadline: { $gte: now } }),
      Placement.countDocuments({ 
        userId: effectiveUserId, 
        status: { $in: ['APPLIED', 'ASSESSMENT_SCHEDULED', 'INTERVIEW_SCHEDULED', 'SELECTED'] } 
      }),
      Placement.countDocuments({ userId: effectiveUserId, status: 'SELECTED' }),
    ])

    totalPlacements = total
    highMatchCount = highMatch
    activeDeadlines = deadlines
    appliedCount = applied
    selectedCount = selected
  } catch (error) {
    console.error("Error fetching dashboard statistics:", error)
  }

  const currentDateFormatted = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric'
  })

  return (
    <div className="min-h-screen bg-background text-foreground pb-20">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 pt-8 max-w-7xl space-y-8">
        {/* DASHBOARD SWITCHER (if user has shared dashboards) */}
        <DashboardSwitcher />

        {/* TOP BAR / GREETING */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-border">
          <div>
            <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground uppercase tracking-wider">
              <span>{currentDateFormatted}</span>
              <span>•</span>
              <span>Campus Drive Session</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight font-heading mt-1">
              {isViewingShared
                ? `Shared Dashboard`
                : `Welcome back, ${session.user.name?.split(" ")[0]}!`}
            </h1>
          </div>

          <div className="flex items-center gap-2">
            <SharingManager />
            <Link href="/analytics">
              <Button variant="outline" size="sm" className="gap-2 text-xs h-9 rounded-xl border-border bg-card">
                <BarChart3 className="h-3.5 w-3.5 text-primary" />
                Analytics & Insights
              </Button>
            </Link>
            <Link href="/profile">
              <Button variant="outline" size="sm" className="gap-2 text-xs h-9 rounded-xl border-border bg-card">
                <UserCheck className="h-3.5 w-3.5 text-muted-foreground" />
                Profile Settings
              </Button>
            </Link>
          </div>
        </div>

        {/* GMAIL MONITOR STRIP - only show on own dashboard */}
        {!isViewingShared && <GmailMonitorToggle />}

        {/* METRICS BENTO GRID */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
          {/* Card 1: Total Opportunities */}
          <div className="glass-panel p-5 rounded-2xl border border-border glow-card relative overflow-hidden">
            <div className="flex items-center justify-between text-muted-foreground mb-3">
              <span className="text-xs font-medium uppercase tracking-wider">Total Drives</span>
              <div className="h-8 w-8 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-foreground flex items-center justify-center">
                <Briefcase className="h-4 w-4" />
              </div>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold text-foreground font-heading">
                {totalPlacements}
              </span>
              <span className="text-[11px] text-muted-foreground font-medium">Opportunities</span>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Ingested from placement emails
            </p>
          </div>

          {/* Card 2: High Match Score (80%+) */}
          <div className="glass-panel p-5 rounded-2xl border border-border glow-card relative overflow-hidden">
            <div className="flex items-center justify-between text-muted-foreground mb-3">
              <span className="text-xs font-medium uppercase tracking-wider">Top Matches</span>
              <div className="h-8 w-8 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-foreground flex items-center justify-center">
                <Sparkles className="h-4 w-4" />
              </div>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold text-foreground font-heading">
                {highMatchCount}
              </span>
              <span className="text-[11px] text-muted-foreground font-medium">≥ 80% Fit</span>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Matched against your profile
            </p>
          </div>

          {/* Card 3: Active Deadlines */}
          <div className="glass-panel p-5 rounded-2xl border border-border glow-card relative overflow-hidden">
            <div className="flex items-center justify-between text-muted-foreground mb-3">
              <span className="text-xs font-medium uppercase tracking-wider">Upcoming Deadlines</span>
              <div className="h-8 w-8 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-foreground flex items-center justify-center">
                <Clock className="h-4 w-4" />
              </div>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold text-foreground font-heading">
                {activeDeadlines}
              </span>
              <span className="text-[11px] text-muted-foreground font-medium">Open Drives</span>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Registration windows active
            </p>
          </div>

          {/* Card 4: In Progress */}
          <div className="glass-panel p-5 rounded-2xl border border-border glow-card relative overflow-hidden">
            <div className="flex items-center justify-between text-muted-foreground mb-3">
              <span className="text-xs font-medium uppercase tracking-wider">In Progress</span>
              <div className="h-8 w-8 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-foreground flex items-center justify-center">
                <TrendingUp className="h-4 w-4" />
              </div>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold text-foreground font-heading">
                {appliedCount}
              </span>
              {selectedCount > 0 && (
                <span className="text-xs px-2 py-0.5 rounded-md bg-zinc-100 dark:bg-zinc-800 text-foreground font-medium border border-border">
                  {selectedCount} Selected
                </span>
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Applied, test, or interview stages
            </p>
          </div>
        </div>

        {/* MAIN PLACEMENT LIST SECTION */}
        <div className="space-y-4 pt-2">
          <div className="flex items-center gap-2 pb-1">
            <Building2 className="h-4 w-4 text-muted-foreground" />
            <h2 className="text-lg font-bold tracking-tight text-foreground font-heading">
              Placement Opportunities
            </h2>
          </div>

          {/* Placement List — pass ownerId for shared viewing */}
          <PlacementList sharedOwnerId={targetOwnerId} sharedPermission={isViewingShared ? sharedPermission : undefined} />
        </div>
      </div>
    </div>
  )
}
