"use client"

import { motion } from "framer-motion"
import { 
  Target, 
  AlertCircle, 
  Award, 
  BookOpen, 
  Briefcase, 
  MapPin, 
  Sparkles 
} from "lucide-react"
import Link from "next/link"

interface MatchBreakdown {
  skillsMatch: number
  cgpaMatch: number
  branchMatch: number
  experienceMatch: number
  locationMatch: number
  overallScore: number
}

interface MatchScoreCardProps {
  matchScore?: number
  matchBreakdown?: MatchBreakdown
  missingRequiredSkills?: string[]
}

export function MatchScoreCard({
  matchScore,
  matchBreakdown,
  missingRequiredSkills = [],
}: MatchScoreCardProps) {
  if (matchScore === undefined) {
    return (
      <div className="glass-panel rounded-2xl p-6 border border-border text-center space-y-3">
        <div className="h-10 w-10 rounded-xl bg-muted mx-auto flex items-center justify-center text-muted-foreground">
          <Target className="h-5 w-5" />
        </div>
        <div className="space-y-1">
          <h4 className="text-sm font-bold text-foreground">Match Score Pending</h4>
          <p className="text-xs text-muted-foreground">
            Complete your profile skills and CGPA to generate predictive matching.
          </p>
        </div>
        <Link href="/profile" className="inline-block text-xs font-medium text-foreground underline hover:text-muted-foreground">
          Go to Profile →
        </Link>
      </div>
    )
  }

  const scoreItems = matchBreakdown ? [
    {
      label: "Skills Match",
      value: matchBreakdown.skillsMatch,
      icon: <Sparkles className="h-3.5 w-3.5 text-muted-foreground" />,
      weight: "40%",
    },
    {
      label: "CGPA Cutoff",
      value: matchBreakdown.cgpaMatch,
      icon: <BookOpen className="h-3.5 w-3.5 text-muted-foreground" />,
      weight: "20%",
    },
    {
      label: "Branch Fit",
      value: matchBreakdown.branchMatch,
      icon: <Award className="h-3.5 w-3.5 text-muted-foreground" />,
      weight: "15%",
    },
    {
      label: "Experience",
      value: matchBreakdown.experienceMatch,
      icon: <Briefcase className="h-3.5 w-3.5 text-muted-foreground" />,
      weight: "15%",
    },
    {
      label: "Location",
      value: matchBreakdown.locationMatch,
      icon: <MapPin className="h-3.5 w-3.5 text-muted-foreground" />,
      weight: "10%",
    },
  ] : []

  return (
    <div className="glass-panel rounded-2xl p-6 border border-border shadow-sm space-y-5">
      <div className="flex items-center justify-between pb-3 border-b border-border">
        <div className="flex items-center gap-2.5">
          <div className="h-8 w-8 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-foreground flex items-center justify-center">
            <Target className="h-4 w-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-foreground">Profile Fit Analysis</h3>
            <p className="text-[11px] text-muted-foreground">Weighted matching engine</p>
          </div>
        </div>

        <span className="text-[11px] font-medium px-2.5 py-0.5 rounded-full border border-border bg-zinc-100 dark:bg-zinc-800 text-foreground">
          {matchScore >= 80 ? "High Match" : matchScore >= 60 ? "Moderate Fit" : "Low Match"}
        </span>
      </div>

      {/* Radial score gauge */}
      <div className="flex items-center gap-5">
        <div className="relative w-20 h-20 shrink-0">
          <svg className="w-full h-full transform -rotate-90">
            <circle
              cx="40"
              cy="40"
              r="34"
              stroke="currentColor"
              strokeWidth="5"
              fill="none"
              className="text-muted/50"
            />
            <motion.circle
              cx="40"
              cy="40"
              r="34"
              stroke="currentColor"
              strokeWidth="5"
              fill="none"
              strokeLinecap="round"
              className="text-zinc-900 dark:text-zinc-100"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: matchScore / 100 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              style={{
                strokeDasharray: "213.6",
                strokeDashoffset: 213.6 - (213.6 * matchScore / 100)
              }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
            <span className="text-xl font-bold font-heading text-foreground">
              {matchScore}%
            </span>
          </div>
        </div>

        <div className="space-y-0.5">
          <p className="text-xs font-semibold text-foreground">
            {matchScore >= 80 
              ? "Strong profile fit" 
              : matchScore >= 60 
              ? "Eligible with good skill alignment" 
              : "Review required criteria"}
          </p>
          <p className="text-[11px] text-muted-foreground leading-relaxed">
            Evaluates your skills, CGPA cutoff, and academic branch against drive requirements.
          </p>
        </div>
      </div>

      {/* Breakdown Items */}
      {scoreItems.length > 0 && (
        <div className="space-y-2.5 pt-2 border-t border-border">
          <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
            Factor Breakdown
          </span>

          <div className="space-y-2">
            {scoreItems.map((item) => (
              <div key={item.label} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="flex items-center gap-1.5 text-muted-foreground font-medium">
                    {item.icon}
                    {item.label}
                  </span>
                  <div className="flex items-center gap-1.5">
                    <span className="font-semibold text-foreground">{item.value}%</span>
                    <span className="text-[10px] text-muted-foreground">({item.weight})</span>
                  </div>
                </div>
                <div className="h-1.5 w-full bg-muted/60 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-zinc-900 dark:bg-zinc-100 rounded-full"
                    style={{ width: `${item.value}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Missing Skills Warning */}
      {missingRequiredSkills && missingRequiredSkills.length > 0 && (
        <div className="p-3 rounded-xl bg-muted/40 border border-border space-y-1.5">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
            <AlertCircle className="h-3.5 w-3.5 text-muted-foreground" />
            Missing Skills from Profile
          </div>
          <div className="flex flex-wrap gap-1">
            {missingRequiredSkills.map((skill, idx) => (
              <span 
                key={idx}
                className="text-[10px] px-2 py-0.5 rounded-md bg-muted text-muted-foreground font-medium border border-border"
              >
                {skill}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
