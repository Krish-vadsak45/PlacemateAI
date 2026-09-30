import mongoose from 'mongoose'
import connectDB from './mongodb'
import Placement from '@/models/Placement'
import User from '@/models/User'

export interface AnalyticsKPIs {
  totalDrives: number
  totalApplied: number
  inProgress: number
  totalInterviews: number
  totalOffers: number
  totalRejected: number
  successRate: number
  interviewRate: number
  avgTimeToOfferDays: number
  avgResponseTimeDays: number
}

export interface FunnelStage {
  stage: string
  key: string
  count: number
  percentage: number
}

export interface StatusDistributionItem {
  status: string
  label: string
  count: number
  fill: string
}

export interface MonthlyTrendItem {
  month: string
  discovered: number
  applied: number
  offers: number
}

export interface CompanyMetricItem {
  id: string
  companyName: string
  jobRole: string
  status: string
  matchScore: number
  package: string
  appliedDate?: string
  responseDays?: number
}

export interface SkillGapItem {
  skill: string
  demand: number // 0-100 normalized demand
  userProficiency: number // 100 if user has it, 0 or partial if not
  userHas: boolean
}

export interface CgpaCorrelationItem {
  bracket: string
  totalDrives: number
  eligibleCount: number
  appliedCount: number
  offerCount: number
}

export interface DashboardAnalyticsData {
  timeRange: string
  kpis: AnalyticsKPIs
  funnel: FunnelStage[]
  statusDistribution: StatusDistributionItem[]
  monthlyTrends: MonthlyTrendItem[]
  companyBreakdown: CompanyMetricItem[]
  skillRadar: SkillGapItem[]
  cgpaCorrelation: CgpaCorrelationItem[]
  userCgpa?: number
}

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  NEW: { label: 'New / Discovered', color: '#6366f1' },
  INTERESTED: { label: 'Saved / Interested', color: '#3b82f6' },
  APPLIED: { label: 'Applied', color: '#0ea5e9' },
  ASSESSMENT_SCHEDULED: { label: 'Assessment Scheduled', color: '#f59e0b' },
  INTERVIEW_SCHEDULED: { label: 'Interview Scheduled', color: '#8b5cf6' },
  SELECTED: { label: 'Selected / Offer', color: '#10b981' },
  REJECTED: { label: 'Rejected', color: '#ef4444' },
  NOT_INTERESTED: { label: 'Not Interested', color: '#71717a' },
  EXPIRED: { label: 'Expired', color: '#a1a1aa' },
}

export function getDateFilter(range: string, customStart?: string, customEnd?: string) {
  const now = new Date()
  if (range === 'all') return {}

  let fromDate: Date
  if (customStart && customEnd) {
    return {
      createdAt: {
        $gte: new Date(customStart),
        $lte: new Date(customEnd),
      },
    }
  }

  switch (range) {
    case '7d':
      fromDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
      break
    case '30d':
      fromDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
      break
    case '90d':
      fromDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000)
      break
    case '6m':
      fromDate = new Date(now.getTime() - 180 * 24 * 60 * 60 * 1000)
      break
    case '1y':
      fromDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000)
      break
    default:
      fromDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000)
  }

  return { createdAt: { $gte: fromDate } }
}

export async function computeDashboardAnalytics(
  userId: string,
  range: string = '90d',
  customStart?: string,
  customEnd?: string
): Promise<DashboardAnalyticsData> {
  await connectDB()

  const userObjectId = new mongoose.Types.ObjectId(userId)
  const dateQuery = getDateFilter(range, customStart, customEnd)

  const [placements, user] = await Promise.all([
    Placement.find({
      userId: userObjectId,
      ...dateQuery,
    }).lean(),
    User.findById(userObjectId).select('profile').lean(),
  ])

  const userSkills = (user?.profile?.skills || []).map((s: string) => s.trim().toLowerCase())
  const userCgpa = user?.profile?.cgpa || 0

  // 1. KPI Calculations
  let totalDrives = placements.length
  let totalApplied = 0
  let totalInterviews = 0
  let totalOffers = 0
  let totalRejected = 0
  let inProgress = 0

  const appliedStatuses = new Set([
    'APPLIED',
    'ASSESSMENT_SCHEDULED',
    'INTERVIEW_SCHEDULED',
    'SELECTED',
    'REJECTED',
  ])

  const responseTimeDaysList: number[] = []
  const timeToOfferDaysList: number[] = []

  const statusCountMap: Record<string, number> = {}

  placements.forEach((p) => {
    const status = p.status || 'NEW'
    statusCountMap[status] = (statusCountMap[status] || 0) + 1

    if (appliedStatuses.has(status)) {
      totalApplied++
    }

    if (status === 'INTERVIEW_SCHEDULED' || status === 'SELECTED') {
      totalInterviews++
    }

    if (status === 'SELECTED') {
      totalOffers++
    } else if (status === 'REJECTED') {
      totalRejected++
    } else if (
      status === 'APPLIED' ||
      status === 'ASSESSMENT_SCHEDULED' ||
      status === 'INTERVIEW_SCHEDULED'
    ) {
      inProgress++
    }

    // Time calculations using applicationHistory or dates
    const history = p.applicationHistory || []
    const appliedEntry = history.find((h: any) => h.status === 'APPLIED')
    const firstProgressEntry = history.find(
      (h: any) => h.status === 'ASSESSMENT_SCHEDULED' || h.status === 'INTERVIEW_SCHEDULED'
    )
    const selectedEntry = history.find((h: any) => h.status === 'SELECTED')

    const appliedTime = appliedEntry ? new Date(appliedEntry.changedAt).getTime() : (p.createdAt ? new Date(p.createdAt).getTime() : null)

    if (appliedTime && firstProgressEntry) {
      const responseTime = (new Date(firstProgressEntry.changedAt).getTime() - appliedTime) / (1000 * 60 * 60 * 24)
      if (responseTime >= 0 && responseTime < 180) {
        responseTimeDaysList.push(responseTime)
      }
    }

    if (appliedTime && (selectedEntry || status === 'SELECTED')) {
      const offerTime = selectedEntry ? new Date(selectedEntry.changedAt).getTime() : (p.updatedAt ? new Date(p.updatedAt).getTime() : null)
      if (offerTime) {
        const timeToOffer = (offerTime - appliedTime) / (1000 * 60 * 60 * 24)
        if (timeToOffer >= 0 && timeToOffer < 365) {
          timeToOfferDaysList.push(timeToOffer)
        }
      }
    }
  })

  const successRate = totalApplied > 0 ? Math.round((totalOffers / totalApplied) * 100) : 0
  const interviewRate = totalApplied > 0 ? Math.round((totalInterviews / totalApplied) * 100) : 0
  const avgResponseTimeDays = responseTimeDaysList.length > 0
    ? Math.round((responseTimeDaysList.reduce((a, b) => a + b, 0) / responseTimeDaysList.length) * 10) / 10
    : 0
  const avgTimeToOfferDays = timeToOfferDaysList.length > 0
    ? Math.round((timeToOfferDaysList.reduce((a, b) => a + b, 0) / timeToOfferDaysList.length) * 10) / 10
    : 0

  const kpis: AnalyticsKPIs = {
    totalDrives,
    totalApplied,
    inProgress,
    totalInterviews,
    totalOffers,
    totalRejected,
    successRate,
    interviewRate,
    avgTimeToOfferDays,
    avgResponseTimeDays,
  }

  // 2. Funnel Visualization Stages
  const interestedCount = placements.filter((p) =>
    ['INTERESTED', 'APPLIED', 'ASSESSMENT_SCHEDULED', 'INTERVIEW_SCHEDULED', 'SELECTED'].includes(p.status)
  ).length
  const assessmentCount = placements.filter((p) =>
    ['ASSESSMENT_SCHEDULED', 'INTERVIEW_SCHEDULED', 'SELECTED'].includes(p.status)
  ).length
  const interviewCount = placements.filter((p) =>
    ['INTERVIEW_SCHEDULED', 'SELECTED'].includes(p.status)
  ).length

  const funnel: FunnelStage[] = [
    {
      stage: 'Opportunities Discovered',
      key: 'discovered',
      count: totalDrives,
      percentage: 100,
    },
    {
      stage: 'Shortlisted / Interested',
      key: 'interested',
      count: interestedCount,
      percentage: totalDrives > 0 ? Math.round((interestedCount / totalDrives) * 100) : 0,
    },
    {
      stage: 'Applications Submitted',
      key: 'applied',
      count: totalApplied,
      percentage: totalDrives > 0 ? Math.round((totalApplied / totalDrives) * 100) : 0,
    },
    {
      stage: 'Assessments Scheduled',
      key: 'assessment',
      count: assessmentCount,
      percentage: totalDrives > 0 ? Math.round((assessmentCount / totalDrives) * 100) : 0,
    },
    {
      stage: 'Interviews Reached',
      key: 'interview',
      count: interviewCount,
      percentage: totalDrives > 0 ? Math.round((interviewCount / totalDrives) * 100) : 0,
    },
    {
      stage: 'Job Offers / Selected',
      key: 'offer',
      count: totalOffers,
      percentage: totalDrives > 0 ? Math.round((totalOffers / totalDrives) * 100) : 0,
    },
  ]

  // 3. Status Distribution
  const statusDistribution: StatusDistributionItem[] = Object.entries(statusCountMap)
    .filter(([_, count]) => count > 0)
    .map(([status, count]) => {
      const meta = STATUS_LABELS[status] || { label: status, color: '#94a3b8' }
      return {
        status,
        label: meta.label,
        count,
        fill: meta.color,
      }
    })
    .sort((a, b) => b.count - a.count)

  // 4. Monthly Trends
  const monthlyDataMap: Record<string, { discovered: number; applied: number; offers: number }> = {}

  placements.forEach((p) => {
    const date = p.createdAt ? new Date(p.createdAt) : new Date()
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`

    if (!monthlyDataMap[monthKey]) {
      monthlyDataMap[monthKey] = { discovered: 0, applied: 0, offers: 0 }
    }
    monthlyDataMap[monthKey].discovered++

    if (appliedStatuses.has(p.status)) {
      monthlyDataMap[monthKey].applied++
    }
    if (p.status === 'SELECTED') {
      monthlyDataMap[monthKey].offers++
    }
  })

  // Format month names (e.g., 'Oct 2025')
  const monthlyTrends: MonthlyTrendItem[] = Object.entries(monthlyDataMap)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, val]) => {
      const [year, month] = key.split('-')
      const monthDate = new Date(parseInt(year), parseInt(month) - 1, 1)
      const label = monthDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
      return {
        month: label,
        discovered: val.discovered,
        applied: val.applied,
        offers: val.offers,
      }
    })

  // 5. Company Breakdown & Performance
  const companyBreakdown: CompanyMetricItem[] = placements
    .slice(0, 50)
    .map((p) => {
      const history = p.applicationHistory || []
      const appliedEntry = history.find((h: any) => h.status === 'APPLIED')
      const firstProgress = history.find(
        (h: any) => h.status === 'ASSESSMENT_SCHEDULED' || h.status === 'INTERVIEW_SCHEDULED' || h.status === 'SELECTED'
      )

      let responseDays: number | undefined
      if (appliedEntry && firstProgress) {
        responseDays = Math.round(
          (new Date(firstProgress.changedAt).getTime() - new Date(appliedEntry.changedAt).getTime()) / (1000 * 60 * 60 * 24)
        )
      }

      return {
        id: (p._id as any).toString(),
        companyName: p.companyName,
        jobRole: p.jobRole,
        status: p.status,
        matchScore: p.matchScore ?? 0,
        package: p.package || 'Not disclosed',
        appliedDate: appliedEntry ? new Date(appliedEntry.changedAt).toLocaleDateString() : (p.createdAt ? new Date(p.createdAt).toLocaleDateString() : undefined),
        responseDays,
      }
    })
    .sort((a, b) => (b.matchScore || 0) - (a.matchScore || 0))

  // 6. Skill Gap & Radar Analysis
  const skillOccurrences: Record<string, number> = {}

  placements.forEach((p) => {
    const required = p.jobRequirements?.requiredSkills || []
    const preferred = p.jobRequirements?.preferredSkills || []
    const allJobSkills = [...required, ...preferred]

    allJobSkills.forEach((raw) => {
      const clean = raw.trim()
      if (clean) {
        skillOccurrences[clean] = (skillOccurrences[clean] || 0) + 1
      }
    })
  })

  const topSkills = Object.entries(skillOccurrences)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)

  const maxDemand = topSkills.length > 0 ? topSkills[0][1] : 1

  const skillRadar: SkillGapItem[] = topSkills.map(([skill, count]) => {
    const lower = skill.toLowerCase()
    const userHas = userSkills.some(
      (s: string) => s.includes(lower) || lower.includes(s)
    )
    const demandNormalized = Math.round((count / maxDemand) * 100)

    return {
      skill,
      demand: demandNormalized,
      userProficiency: userHas ? 90 : 20,
      userHas,
    }
  })

  // 7. CGPA Correlation
  const brackets = [
    { label: '< 6.0', min: 0, max: 5.99 },
    { label: '6.0 - 7.0', min: 6.0, max: 6.99 },
    { label: '7.0 - 8.0', min: 7.0, max: 7.99 },
    { label: '8.0 - 9.0', min: 8.0, max: 8.99 },
    { label: '9.0+', min: 9.0, max: 10.0 },
  ]

  const cgpaCorrelation: CgpaCorrelationItem[] = brackets.map((b) => {
    const inBracket = placements.filter((p) => {
      const minReq = p.eligibility?.minimumCGPA ?? 0
      return minReq >= b.min && minReq <= b.max
    })

    const eligible = inBracket.filter((p) => userCgpa >= (p.eligibility?.minimumCGPA ?? 0)).length
    const applied = inBracket.filter((p) => appliedStatuses.has(p.status)).length
    const offers = inBracket.filter((p) => p.status === 'SELECTED').length

    return {
      bracket: b.label,
      totalDrives: inBracket.length,
      eligibleCount: eligible,
      appliedCount: applied,
      offerCount: offers,
    }
  })

  return {
    timeRange: range,
    kpis,
    funnel,
    statusDistribution,
    monthlyTrends,
    companyBreakdown,
    skillRadar,
    cgpaCorrelation,
    userCgpa,
  }
}
