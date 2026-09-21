export interface Placement {
  _id: string
  companyName: string
  jobRole: string
  status: string
  emailSubject?: string
  emailFrom?: string
  emailBody?: string
  emailDate?: string
  package?: string
  location?: string
  applicationDeadline?: string
  assessmentDate?: string
  interviewDate?: string
  applicationLink?: string
  googleFormLink?: string
  placementCellFormLink?: string // New: Placement cell specific form
  companyFormLink?: string // New: Company specific form
  notes?: Array<{ id: string; content: string; createdAt: string }>
  attachments?: Array<{ id: string; name: string; url: string; type: string }>
  applicationHistory?: Array<{ status: string; changedAt: string; note?: string }>
  calendarEventId?: string
  deadlineCalendarEventId?: string
  assessmentCalendarEventId?: string
  interviewCalendarEventId?: string
  aiSummary?: string
  // Job matching fields
  jobRequirements?: {
    requiredSkills: string[]
    preferredSkills: string[]
    responsibilities: string[]
    experienceLevel?: string
    educationRequirements?: string
    locationPreference?: string
  }
  matchScore?: number // 0-100
  matchBreakdown?: {
    skillsMatch: number // 0-100
    cgpaMatch: number // 0-100
    branchMatch: number // 0-100
    experienceMatch: number // 0-100
    locationMatch: number // 0-100
    overallScore: number // 0-100
  }
}

export interface PlacementDetailProps {
  placement: Placement
}
