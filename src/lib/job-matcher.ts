import mongoose from 'mongoose'
import User, { IUser } from '@/models/User'
import Placement, { IPlacement } from '@/models/Placement'

export interface MatchBreakdown {
  skillsMatch: number // 0-100
  cgpaMatch: number // 0-100
  branchMatch: number // 0-100
  experienceMatch: number // 0-100
  locationMatch: number // 0-100
  overallScore: number // 0-100
}

export interface MatchResult {
  score: number // 0-100
  breakdown: MatchBreakdown
  missingRequiredSkills: string[]
}

class JobMatcher {
  /**
   * Calculate match score between user profile and job requirements
   */
  async calculateMatchScore(
    userId: mongoose.Types.ObjectId,
    placement: IPlacement
  ): Promise<MatchResult> {
    const user = await User.findById(userId)
    if (!user) {
      throw new Error('User not found')
    }

    const jobRequirements = placement.jobRequirements
    if (!jobRequirements) {
      // No requirements extracted, return neutral score
      return {
        score: 50,
        breakdown: {
          skillsMatch: 50,
          cgpaMatch: 50,
          branchMatch: 50,
          experienceMatch: 50,
          locationMatch: 50,
          overallScore: 50
        },
        missingRequiredSkills: []
      }
    }

    // Calculate individual component scores
    const skillsMatch = this.calculateSkillsMatch(
      user.profile.skills,
      jobRequirements.requiredSkills,
      jobRequirements.preferredSkills
    )

    const cgpaMatch = this.calculateCgpaMatch(
      user.profile.cgpa,
      placement.eligibility.minimumCGPA
    )

    const branchMatch = this.calculateBranchMatch(
      user.profile.branch,
      placement.eligibility.allowedBranches
    )

    const experienceMatch = this.calculateExperienceMatch(
      user.profile.experience,
      jobRequirements.experienceLevel
    )

    const locationMatch = this.calculateLocationMatch(
      placement.location,
      jobRequirements.locationPreference
    )

    // Calculate weighted overall score
    const overallScore = this.calculateOverallScore({
      skillsMatch,
      cgpaMatch,
      branchMatch,
      experienceMatch,
      locationMatch
    })

    // Identify missing required skills
    const missingRequiredSkills = this.getMissingSkills(
      user.profile.skills,
      jobRequirements.requiredSkills
    )

    return {
      score: overallScore,
      breakdown: {
        skillsMatch,
        cgpaMatch,
        branchMatch,
        experienceMatch,
        locationMatch,
        overallScore
      },
      missingRequiredSkills
    }
  }

  /**
   * Calculate skills match score (40% weight)
   */
  private calculateSkillsMatch(
    userSkills: string[],
    requiredSkills: string[],
    preferredSkills: string[]
  ): number {
    if (!requiredSkills || requiredSkills.length === 0) {
      // No required skills specified, give full credit
      return 100
    }

    if (!userSkills || userSkills.length === 0) {
      return 0
    }

    // Normalize skills for comparison (case-insensitive, trim)
    const normalizedUserSkills = userSkills.map(s => s.toLowerCase().trim())
    const normalizedRequiredSkills = requiredSkills.map(s => s.toLowerCase().trim())
    const normalizedPreferredSkills = (preferredSkills || []).map(s => s.toLowerCase().trim())

    // Count matching required skills
    let matchedRequired = 0
    const matchedRequiredSet = new Set<string>()

    for (const requiredSkill of normalizedRequiredSkills) {
      for (const userSkill of normalizedUserSkills) {
        // Check for exact match or contains match
        if (userSkill === requiredSkill || 
            userSkill.includes(requiredSkill) || 
            requiredSkill.includes(userSkill)) {
          if (!matchedRequiredSet.has(requiredSkill)) {
            matchedRequiredSet.add(requiredSkill)
            matchedRequired++
          }
          break
        }
      }
    }

    // Calculate required skills score (70% of skills score)
    const requiredScore = (matchedRequired / normalizedRequiredSkills.length) * 70

    // Count matching preferred skills (30% of skills score)
    let matchedPreferred = 0
    if (normalizedPreferredSkills.length > 0) {
      for (const preferredSkill of normalizedPreferredSkills) {
        for (const userSkill of normalizedUserSkills) {
          if (userSkill === preferredSkill || 
              userSkill.includes(preferredSkill) || 
              preferredSkill.includes(userSkill)) {
            matchedPreferred++
            break
          }
        }
      }
      const preferredScore = (matchedPreferred / normalizedPreferredSkills.length) * 30
      return Math.round(requiredScore + preferredScore)
    }

    return Math.round(requiredScore)
  }

  /**
   * Calculate CGPA match score (20% weight)
   */
  private calculateCgpaMatch(
    userCgpa: number | undefined,
    minimumCgpa: number | undefined
  ): number {
    if (!minimumCgpa) {
      // No CGPA requirement, full credit
      return 100
    }

    if (!userCgpa) {
      // User hasn't provided CGPA
      return 50
    }

    if (userCgpa >= minimumCgpa) {
      return 100
    }

    // Partial credit if close to requirement
    const diff = minimumCgpa - userCgpa
    if (diff <= 0.5) {
      return 75
    } else if (diff <= 1.0) {
      return 50
    } else {
      return 0
    }
  }

  /**
   * Calculate branch match score (15% weight)
   */
  private calculateBranchMatch(
    userBranch: string | undefined,
    allowedBranches: string[]
  ): number {
    if (!allowedBranches || allowedBranches.length === 0) {
      // No branch restriction, full credit
      return 100
    }

    if (!userBranch) {
      // User hasn't provided branch
      return 50
    }

    const normalizedUserBranch = userBranch.toLowerCase().trim()
    const normalizedAllowedBranches = allowedBranches.map(b => b.toLowerCase().trim())

    // Check if user's branch is in allowed list
    for (const allowedBranch of normalizedAllowedBranches) {
      if (normalizedUserBranch === allowedBranch || 
          normalizedUserBranch.includes(allowedBranch) || 
          allowedBranch.includes(normalizedUserBranch)) {
        return 100
      }
    }

    return 0
  }

  /**
   * Calculate experience match score (15% weight)
   */
  private calculateExperienceMatch(
    userExperience: string | undefined,
    requiredExperienceLevel: string | undefined
  ): number {
    if (!requiredExperienceLevel) {
      // No experience requirement, full credit
      return 100
    }

    if (!userExperience) {
      // User hasn't provided experience (assume fresher)
      if (requiredExperienceLevel.toLowerCase().includes('entry') || 
          requiredExperienceLevel.toLowerCase().includes('fresher')) {
        return 100
      }
      return 50
    }

    const normalizedRequired = requiredExperienceLevel.toLowerCase()
    const normalizedUser = userExperience.toLowerCase()

    // Check for experience level match
    if (normalizedRequired.includes('entry') || normalizedRequired.includes('fresher')) {
      // Entry level - any experience is fine
      return 100
    } else if (normalizedRequired.includes('mid')) {
      // Mid level - should have some experience
      if (normalizedUser.includes('year') || normalizedUser.includes('experience')) {
        return 100
      }
      return 50
    } else if (normalizedRequired.includes('senior')) {
      // Senior level - should have significant experience
      if (normalizedUser.includes('3') || normalizedUser.includes('4') || 
          normalizedUser.includes('5') || normalizedUser.includes('senior')) {
        return 100
      }
      return 25
    }

    return 50
  }

  /**
   * Calculate location match score (10% weight)
   */
  private calculateLocationMatch(
    jobLocation: string | undefined,
    locationPreference: string | undefined
  ): number {
    if (!locationPreference) {
      // No location preference specified, full credit
      return 100
    }

    if (!jobLocation) {
      // Job location not specified
      return 50
    }

    const normalizedPreference = locationPreference.toLowerCase()
    const normalizedJobLocation = jobLocation.toLowerCase()

    // If job is remote and preference allows remote
    if (normalizedJobLocation.includes('remote') || normalizedJobLocation.includes('wfh')) {
      if (normalizedPreference.includes('remote') || normalizedPreference.includes('hybrid')) {
        return 100
      }
      return 50
    }

    // If job is on-site
    if (normalizedPreference.includes('on-site') || normalizedPreference.includes('onsite')) {
      return 100
    }

    // If preference is hybrid
    if (normalizedPreference.includes('hybrid')) {
      return 75
    }

    return 50
  }

  /**
   * Calculate overall weighted score
   */
  private calculateOverallScore(scores: {
    skillsMatch: number
    cgpaMatch: number
    branchMatch: number
    experienceMatch: number
    locationMatch: number
  }): number {
    const weights = {
      skillsMatch: 0.40,
      cgpaMatch: 0.20,
      branchMatch: 0.15,
      experienceMatch: 0.15,
      locationMatch: 0.10
    }

    const overallScore =
      scores.skillsMatch * weights.skillsMatch +
      scores.cgpaMatch * weights.cgpaMatch +
      scores.branchMatch * weights.branchMatch +
      scores.experienceMatch * weights.experienceMatch +
      scores.locationMatch * weights.locationMatch

    return Math.round(overallScore)
  }

  /**
   * Get missing required skills
   */
  private getMissingSkills(
    userSkills: string[],
    requiredSkills: string[]
  ): string[] {
    if (!requiredSkills || requiredSkills.length === 0) {
      return []
    }

    if (!userSkills || userSkills.length === 0) {
      return requiredSkills
    }

    const normalizedUserSkills = userSkills.map(s => s.toLowerCase().trim())
    const missing: string[] = []

    for (const requiredSkill of requiredSkills) {
      const normalizedRequired = requiredSkill.toLowerCase().trim()
      let isMatched = false

      for (const userSkill of normalizedUserSkills) {
        if (userSkill === normalizedRequired || 
            userSkill.includes(normalizedRequired) || 
            normalizedRequired.includes(userSkill)) {
          isMatched = true
          break
        }
      }

      if (!isMatched) {
        missing.push(requiredSkill)
      }
    }

    return missing
  }
}

/**
 * Factory function to create job matcher service
 */
export function createJobMatcher(): JobMatcher {
  return new JobMatcher()
}

export default JobMatcher
