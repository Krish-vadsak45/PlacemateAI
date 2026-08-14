import User from "@/models/User"

export interface ProfileCheckResult {
  isComplete: boolean
  missingFields: string[]
}

/**
 * Check if user profile is complete
 * A profile is considered complete if it has at least:
 * - College email
 * - Placement cell email
 * - College name
 * - Branch
 * - Current semester
 * - CGPA
 * - Graduation year
 * - At least one skill
 */
export async function checkProfileCompletion(userId: string): Promise<ProfileCheckResult> {
  try {
    const user = await User.findById(userId)
    
    if (!user) {
      return { isComplete: false, missingFields: ["User not found"] }
    }

    const missingFields: string[] = []

    // Check required fields
    if (!user.profile?.collegeEmail) missingFields.push("College Email")
    if (!user.profile?.placementCellEmail) missingFields.push("Placement Cell Email")
    if (!user.profile?.college) missingFields.push("College")
    if (!user.profile?.branch) missingFields.push("Branch")
    if (!user.profile?.semester) missingFields.push("Semester")
    if (!user.profile?.cgpa) missingFields.push("CGPA")
    if (!user.profile?.graduationYear) missingFields.push("Graduation Year")
    if (!user.profile?.skills || user.profile.skills.length === 0) missingFields.push("Skills")

    return {
      isComplete: missingFields.length === 0,
      missingFields,
    }
  } catch (error) {
    console.error("Error checking profile completion:", error)
    return { isComplete: false, missingFields: ["Error checking profile"] }
  }
}
