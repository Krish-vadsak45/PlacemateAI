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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5 perspective-1000">
          {/* Card 1: Total Opportunities */}
          <div className="glass-3d-card p-5 relative overflow-hidden group">
            <div className="flex items-center justify-between text-muted-foreground mb-3">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Total Drives</span>
              <div className="h-9 w-9 rounded-xl bg-zinc-950 text-white dark:bg-zinc-100 dark:text-zinc-950 flex items-center justify-center shadow-md border border-white/20 transition-transform group-hover:scale-110">
                <Briefcase className="h-4.5 w-4.5" />
              </div>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-foreground font-heading tracking-tight">
                {totalPlacements}
              </span>
              <span className="text-[11px] text-muted-foreground font-medium">Captured Drives</span>
            </div>
            <div className="mt-3 flex items-center gap-1.5 text-[11px] text-muted-foreground">
              <span className="h-1.5 w-1.5 rounded-full bg-blue-500 animate-pulse shadow-[0_0_8px_#3b82f6]" />
              <span>Parsed &amp; structured from emails</span>
            </div>
          </div>

          {/* Card 2: High Match Score (80%+) */}
          <div className="glass-3d-card p-5 relative overflow-hidden group">
            <div className="flex items-center justify-between text-muted-foreground mb-3">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Top AI Matches</span>
              <div className="h-9 w-9 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center shadow-md transition-transform group-hover:scale-110 border border-emerald-500/30">
                <Sparkles className="h-4.5 w-4.5" />
              </div>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-foreground font-heading tracking-tight">
                {highMatchCount}
              </span>
              <span className="text-[11px] text-emerald-500 font-semibold px-2 py-0.5 rounded-md bg-emerald-500/10 border border-emerald-500/30">
                ≥ 80% Fit
              </span>
            </div>
            <div className="mt-3 flex items-center gap-1.5 text-[11px] text-muted-foreground">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_#10b981]" />
              <span>High eligibility match score</span>
            </div>
          </div>

          {/* Card 3: Active Deadlines */}
          <div className="glass-3d-card p-5 relative overflow-hidden group">
            <div className="flex items-center justify-between text-muted-foreground mb-3">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Active Windows</span>
              <div className="h-9 w-9 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center shadow-md transition-transform group-hover:scale-110 border border-amber-500/30">
                <Clock className="h-4.5 w-4.5" />
              </div>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-foreground font-heading tracking-tight">
                {activeDeadlines}
              </span>
              <span className="text-[11px] text-amber-500 font-medium">Open Registration</span>
            </div>
            <div className="mt-3 flex items-center gap-1.5 text-[11px] text-muted-foreground">
              <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-ping" />
              <span>Google Calendar deadlines synced</span>
            </div>
          </div>

          {/* Card 4: In Progress & Selected */}
          <div className="glass-3d-card p-5 relative overflow-hidden group">
            <div className="flex items-center justify-between text-muted-foreground mb-3">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Active Pipeline</span>
              <div className="h-9 w-9 rounded-xl bg-purple-500/10 text-purple-500 flex items-center justify-center shadow-md transition-transform group-hover:scale-110 border border-purple-500/30">
                <TrendingUp className="h-4.5 w-4.5" />
              </div>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-foreground font-heading tracking-tight">
                {appliedCount}
              </span>
              {selectedCount > 0 ? (
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-500 border border-emerald-500/30">
                  🎉 {selectedCount} Selected
                </span>
              ) : (
                <span className="text-[11px] text-muted-foreground font-medium">Applied / Testing</span>
              )}
            </div>
            <div className="mt-3 flex items-center gap-1.5 text-[11px] text-muted-foreground">
              <span className="h-1.5 w-1.5 rounded-full bg-purple-500 shadow-[0_0_8px_#a855f7]" />
              <span>Application &amp; Interview tracking</span>
            </div>
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
