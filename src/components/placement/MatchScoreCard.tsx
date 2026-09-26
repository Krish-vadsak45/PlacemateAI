"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { motion } from "framer-motion"
import { Target, CheckCircle2, XCircle, AlertCircle, TrendingUp, Award, BookOpen, Briefcase, MapPin, Sparkles } from "lucide-react"

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
  if (!matchScore || !matchBreakdown) {
    return (
      <Card className="border-2 border-dashed border-gray-300 dark:border-gray-700 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900">
        <CardContent className="p-6">
          <div className="flex items-center gap-2 text-muted-foreground">
            <AlertCircle className="h-5 w-5" />
            <p>Match score not available</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-600 dark:text-green-400"
    if (score >= 60) return "text-yellow-600 dark:text-yellow-400"
    return "text-red-600 dark:text-red-400"
  }

  const getScoreGradient = (score: number) => {
    if (score >= 80) return "from-green-500 to-emerald-500"
    if (score >= 60) return "from-yellow-500 to-orange-500"
    return "from-red-500 to-rose-500"
  }

  const getProgressGradient = (score: number) => {
    if (score >= 80) return "bg-gradient-to-r from-green-500 to-emerald-500"
    if (score >= 60) return "bg-gradient-to-r from-yellow-500 to-orange-500"
    return "bg-gradient-to-r from-red-500 to-rose-500"
  }

  const getScoreLabel = (score: number) => {
    if (score >= 90) return "Excellent Match"
    if (score >= 80) return "Great Match"
    if (score >= 70) return "Good Match"
    if (score >= 60) return "Fair Match"
    if (score >= 40) return "Low Match"
    return "Poor Match"
  }

  const getScoreIcon = (score: number) => {
    if (score >= 80) return <Award className="h-5 w-5" />
    if (score >= 60) return <TrendingUp className="h-5 w-5" />
    return <AlertCircle className="h-5 w-5" />
  }

  const scoreItems = [
    {
      label: "Skills Match",
      value: matchBreakdown.skillsMatch,
      icon: <Sparkles className="h-4 w-4" />,
      weight: "40%",
      description: "Required & preferred skills alignment"
    },
    {
      label: "CGPA Eligibility",
      value: matchBreakdown.cgpaMatch,
      icon: <BookOpen className="h-4 w-4" />,
      weight: "20%",
      description: "Academic performance requirement"
    },
    {
      label: "Branch Eligibility",
      value: matchBreakdown.branchMatch,
      icon: <Award className="h-4 w-4" />,
      weight: "15%",
      description: "Branch/degree requirement"
    },
    {
      label: "Experience Level",
      value: matchBreakdown.experienceMatch,
      icon: <Briefcase className="h-4 w-4" />,
      weight: "15%",
      description: "Experience level alignment"
    },
    {
      label: "Location Preference",
      value: matchBreakdown.locationMatch,
      icon: <MapPin className="h-4 w-4" />,
      weight: "10%",
      description: "Work location compatibility"
    }
  ]

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Card className="border-2 border-primary/20 shadow-xl bg-gradient-to-br from-white via-blue-50/50 to-purple-50/50 dark:from-gray-800 dark:via-gray-900 dark:to-gray-800 overflow-hidden">
        {/* Decorative gradient background */}
        <div className={`absolute top-0 right-0 w-64 h-64 bg-gradient-to-br ${getScoreGradient(matchScore)} opacity-5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2`} />
        
        <CardHeader className="relative pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <motion.div
              whileHover={{ rotate: 360 }}
              transition={{ duration: 0.6 }}
            >
              <Target className="h-5 w-5 text-primary" />
            </motion.div>
            Job Match Analysis
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 relative p-4 pt-0">
          {/* Overall Score with Circular Progress */}
          <div className="flex items-center gap-4 py-2">
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: "spring", delay: 0.2, duration: 0.8 }}
              className="relative flex-shrink-0"
            >
              <div className="relative w-20 h-20">
                {/* Background circle */}
                <svg className="w-full h-full transform -rotate-90">
                  <circle
                    cx="40"
                    cy="40"
                    r="36"
                    stroke="currentColor"
                    strokeWidth="6"
                    fill="none"
                    className="text-gray-200 dark:text-gray-700"
                  />
                  {/* Progress circle */}
                  <motion.circle
                    cx="40"
                    cy="40"
                    r="36"
                    stroke="currentColor"
                    strokeWidth="6"
                    fill="none"
                    strokeLinecap="round"
                    className={`text-current ${getScoreColor(matchScore)}`}
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: matchScore / 100 }}
                    transition={{ delay: 0.4, duration: 1, ease: "easeOut" }}
                    style={{
                      strokeDasharray: "226.19",
                      strokeDashoffset: 226.19 - (226.19 * matchScore / 100)
                    }}
                  />
                </svg>
                {/* Center content */}
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <motion.div
                    initial={{ opacity: 0, scale: 0.5 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.5 }}
                    className={`text-xl font-bold ${getScoreColor(matchScore)}`}
                  >
                    {matchScore}%
                  </motion.div>
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.6 }}
                    className={`text-[9px] font-medium ${getScoreColor(matchScore)} flex items-center gap-0.5 mt-0.5`}
                  >
                    {getScoreIcon(matchScore)}
                  </motion.div>
                </div>
              </div>
            </motion.div>
            <div className="flex-1">
              <motion.p
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7 }}
                className="text-muted-foreground text-xs"
              >
                This job aligns {matchScore >= 70 ? 'well' : matchScore >= 50 ? 'moderately' : 'poorly'} with your profile
              </motion.p>
            </div>
          </div>

          {/* Detailed Breakdown */}
          <div className="space-y-2">
            <h3 className="font-semibold text-xs flex items-center gap-2">
              <TrendingUp className="h-3 w-3 text-primary" />
              Score Breakdown
            </h3>

            <div className="space-y-1.5">
              {scoreItems.map((item, index) => (
                <motion.div
                  key={item.label}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 + index * 0.1 }}
                  className="group"
                >
                  <div className="flex items-center justify-between mb-0.5">
                    <div className="flex items-center gap-1.5">
                      <motion.div
                        whileHover={{ scale: 1.2, rotate: 10 }}
                        className={`p-0.5 rounded-md ${item.value >= 70 ? 'bg-green-100 dark:bg-green-900/30' : item.value >= 50 ? 'bg-yellow-100 dark:bg-yellow-900/30' : 'bg-red-100 dark:bg-red-900/30'}`}
                      >
                        <span className={item.value >= 70 ? 'text-green-600 dark:text-green-400' : item.value >= 50 ? 'text-yellow-600 dark:text-yellow-400' : 'text-red-600 dark:text-red-400'}>
                          {item.icon}
                        </span>
                      </motion.div>
                      <span className="text-[11px] font-medium">{item.label}</span>
                    </div>
                    <motion.span
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.5 + index * 0.1 }}
                      className={`px-1.5 py-0.5 rounded-full text-[9px] font-bold ${item.value >= 70 ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' : item.value >= 50 ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300' : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'}`}
                    >
                      {item.value}%
                    </motion.span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="relative h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden flex-1">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${item.value}%` }}
                        transition={{ delay: 0.4 + index * 0.1, duration: 0.8, ease: "easeOut" }}
                        className={`h-full ${getProgressGradient(item.value)} rounded-full relative`}
                      >
                        <div className="absolute inset-0 bg-white/20 animate-pulse" />
                      </motion.div>
                    </div>
                    <motion.span
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.6 + index * 0.1 }}
                      className="text-[9px] text-muted-foreground font-medium w-6 text-right"
                    >
                      {item.weight}
                    </motion.span>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Missing Skills */}
          {missingRequiredSkills.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8 }}
              className="space-y-1.5 pt-2 border-t border-gray-200 dark:border-gray-700"
            >
              <h3 className="font-semibold text-xs flex items-center gap-2 text-red-600 dark:text-red-400">
                <motion.div
                  whileHover={{ rotate: 360 }}
                  transition={{ duration: 0.6 }}
                >
                  <XCircle className="h-3 w-3" />
                </motion.div>
                Missing Skills
              </h3>
              <div className="flex flex-wrap gap-1">
                {missingRequiredSkills.map((skill, index) => (
                  <motion.span
                    key={index}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.9 + index * 0.05 }}
                    whileHover={{ scale: 1.05, y: -2 }}
                    className="px-1.5 py-0.5 bg-gradient-to-r from-red-100 to-red-200 dark:from-red-900/30 dark:to-red-800/30 text-red-800 dark:text-red-300 rounded-full text-[10px] font-medium shadow-sm cursor-default"
                  >
                    {skill}
                  </motion.span>
                ))}
              </div>
            </motion.div>
          )}

          {/* Recommendation */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1 }}
            className="pt-2 border-t border-gray-200 dark:border-gray-700"
          >
            <div className={`p-2 rounded-lg ${matchScore >= 70 ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800' : matchScore >= 50 ? 'bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800' : 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800'}`}>
              <div className="flex items-start gap-1.5">
                {matchScore >= 70 ? (
                  <CheckCircle2 className="h-3 w-3 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" />
                ) : matchScore >= 50 ? (
                  <TrendingUp className="h-3 w-3 text-yellow-600 dark:text-yellow-400 mt-0.5 flex-shrink-0" />
                ) : (
                  <AlertCircle className="h-3 w-3 text-red-600 dark:text-red-400 mt-0.5 flex-shrink-0" />
                )}
                <div>
                  <p className={`text-[10px] font-medium ${matchScore >= 70 ? 'text-green-800 dark:text-green-300' : matchScore >= 50 ? 'text-yellow-800 dark:text-yellow-300' : 'text-red-800 dark:text-red-300'}`}>
                    {matchScore >= 70 ? 'Great opportunity!' : matchScore >= 50 ? 'Consider with preparation' : 'Not the best fit'}
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        </CardContent>
      </Card>
    </motion.div>
  )
}
