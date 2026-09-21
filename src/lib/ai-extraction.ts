import { GoogleGenerativeAI } from "@google/generative-ai"
import Groq from "groq-sdk"

export interface ExtractionResult {
  companyName: string
  jobRole: string
  package?: string
  location?: string
  applicationDeadline?: string
  assessmentDate?: string
  interviewDate?: string
  applicationLink?: string
  googleFormLink?: string
  placementCellFormLink?: string // New: Placement cell specific form
  companyFormLink?: string // New: Company specific form
  // Job requirements for matching
  jobRequirements?: {
    requiredSkills: string[]
    preferredSkills: string[]
    responsibilities: string[]
    experienceLevel?: string
    educationRequirements?: string
    locationPreference?: string
  }
  provider: "gemini" | "groq" | "regex"
  confidence: number
}

export interface ExtractionInput {
  subject: string
  body: string
  from: string
}

class AIExtractionService {
  private geminiClient: GoogleGenerativeAI | null = null
  private groqClient: Groq | null = null
  private geminiModel: string
  private groqModel: string

  constructor() {
    const geminiApiKey = process.env.GEMINI_API_KEY
    const groqApiKey = process.env.GROQ_API_KEY

    if (geminiApiKey) {
      this.geminiClient = new GoogleGenerativeAI(geminiApiKey)
    }

    if (groqApiKey) {
      this.groqClient = new Groq({ apiKey: groqApiKey })
    }

    this.geminiModel = process.env.GEMINI_MODEL || "gemini-1.5-flash"
    this.groqModel = process.env.GROQ_MODEL || "llama3-70b-8192"
  }

  /**
   * Extract placement details using AI with fallback chain: Gemini -> Groq -> Regex
   */
  async extractDetails(input: ExtractionInput): Promise<ExtractionResult> {
    // Try Gemini first
    if (this.geminiClient) {
      try {
        const result = await this.extractWithGemini(input)
        if (this.isValidExtraction(result)) {
          return { ...result, provider: "gemini", confidence: 0.9 }
        }
      } catch (error) {
        console.error("Gemini extraction failed:", error)
      }
    }

    // Fallback to Groq
    if (this.groqClient) {
      try {
        const result = await this.extractWithGroq(input)
        if (this.isValidExtraction(result)) {
          return { ...result, provider: "groq", confidence: 0.8 }
        }
      } catch (error) {
        console.error("Groq extraction failed:", error)
      }
    }

    // Final fallback to regex
    return this.extractWithRegex(input)
  }

  /**
   * Extract using Gemini
   */
  private async extractWithGemini(input: ExtractionInput): Promise<ExtractionResult> {
    const prompt = this.buildExtractionPrompt(input)
    
    const model = this.geminiClient!.getGenerativeModel({ model: this.geminiModel })
    const result = await model.generateContent(prompt)
    const response = await result.response
    const text = response.text()

    const parsed = this.parseAIResponse(text)
    return { ...parsed, provider: "gemini", confidence: 0.9 }
  }

  /**
   * Extract using Groq
   */
  private async extractWithGroq(input: ExtractionInput): Promise<ExtractionResult> {
    const prompt = this.buildExtractionPrompt(input)
    
    const completion = await this.groqClient!.chat.completions.create({
      model: this.groqModel,
      messages: [
        {
          role: "system",
          content: "You are a precise data extraction assistant. Extract placement details from emails and return only valid JSON."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.3,
      response_format: { type: "json_object" }
    })

    const text = completion.choices[0]?.message?.content || "{}"
    const parsed = this.parseAIResponse(text)
    return { ...parsed, provider: "groq", confidence: 0.8 }
  }

  /**
   * Extract using regex patterns (fallback)
   */
  private extractWithRegex(input: ExtractionInput): ExtractionResult {
    const { subject, body } = input
    const fullText = `${subject} ${body}`
    
    // Common patterns for placement cell emails
    const patterns = [
      // Pattern: (BTech/MTech/MCA - Role) Company Name
      /\([^)]+\)\s*(.+)$/,
      // Pattern: Company Name - Role
      /^(.+)\s*-\s*(.+)$/,
      // Pattern: Role at Company Name
      /^(.+)\s+at\s+(.+)$/i,
    ]

    let companyName = "Unknown"
    let jobRole = "To be determined"

    for (const pattern of patterns) {
      const match = subject.match(pattern)
      if (match) {
        const parts = match.slice(1)
        const companyPart = parts.find(p => 
          p.includes('Pvt') || p.includes('Ltd') || p.includes('Inc') || 
          p.includes('Technologies') || p.includes('Solutions') || 
          p.includes('Company') || p.includes('Corp')
        )
        
        if (companyPart) {
          const jobRolePart = parts.find(p => p !== companyPart)
          companyName = companyPart.trim()
          jobRole = jobRolePart?.trim() || 'Internship'
          break
        }
      }
    }

    // Fallback: if subject contains parentheses, extract content after parentheses
    if (companyName === "Unknown") {
      const parenMatch = subject.match(/\([^)]+\)\s*(.+)$/)
      if (parenMatch) {
        companyName = parenMatch[1].trim()
        jobRole = 'Internship'
      }
    }

    // Extract URLs from the email
    const urlRegex = /(https?:\/\/[^\s]+)/g
    const urls = fullText.match(urlRegex) || []

    // Categorize URLs
    let googleFormLink: string | undefined
    let placementCellFormLink: string | undefined
    let companyFormLink: string | undefined
    let applicationLink: string | undefined

    urls.forEach(url => {
      // Google Forms
      if (url.includes('docs.google.com/forms')) {
        googleFormLink = url
      }
      // Placement cell indicators
      else if (url.includes('placement') || url.includes('tpo') || 
               url.includes('training') || url.includes('college') || 
               url.includes('campus') || url.includes('scet.ac.in')) {
        placementCellFormLink = url
      }
      // Company career/application pages
      else if (url.includes('careers') || url.includes('jobs') || 
               url.includes('apply') || url.includes('recruitment')) {
        companyFormLink = url
      }
      // General application link
      else if (!googleFormLink && !placementCellFormLink && !companyFormLink) {
        applicationLink = url
      }
    })

    return {
      companyName,
      jobRole,
      googleFormLink,
      placementCellFormLink,
      companyFormLink,
      applicationLink,
      provider: "regex",
      confidence: 0.5
    }
  }

  /**
   * Build the extraction prompt for AI
   */
  private buildExtractionPrompt(input: ExtractionInput): string {
    return `Extract placement details from the following email. Return ONLY valid JSON with these fields:
- companyName: The company name (required)
- jobRole: The job role or position (required) 
- package: Salary/package if mentioned (optional)
- location: Job location if mentioned (optional)
- applicationDeadline: Application deadline date if mentioned (optional)
- assessmentDate: Assessment/interview date if mentioned (optional)
- interviewDate: Interview date if mentioned (optional)
- applicationLink: Application URL if mentioned (optional)
- googleFormLink: Google Form link if mentioned (optional)
- placementCellFormLink: Placement cell/college registration form link if mentioned (optional) - This is typically a form from the college placement cell for student registration
- companyFormLink: Company's own application form link if mentioned (optional) - This is typically the company's direct application form
- jobRequirements: Object containing job requirements for matching (optional):
  - requiredSkills: Array of required technical skills (e.g., ["JavaScript", "React", "Node.js"])
  - preferredSkills: Array of preferred/nice-to-have skills
  - responsibilities: Array of key job responsibilities
  - experienceLevel: Experience level (e.g., "Entry Level", "Mid Level", "Senior")
  - educationRequirements: Education/degree requirements (e.g., "BTech/MTech in CS")
  - locationPreference: Work location preference (e.g., "On-site", "Remote", "Hybrid")

IMPORTANT: Distinguish between different types of forms:

1. Placement Cell Forms (placementCellFormLink):
   - Forms from college/university placement cell
   - Keywords: "placement cell", "student registration", "college registration", "campus recruitment", "training and placement"
   - URLs containing: "placement", "tpo", "training", "college", "campus"
   - Purpose: Student registration for campus placement process
   - Examples: "scet.ac.in/placement", "tpo.college.edu", "placement.vidyalaya"

2. Company Forms (companyFormLink):
   - Company's own application/career portal
   - Keywords: "company application", "career portal", "job application", "apply now", "company website"
   - URLs containing: "company.com", "careers", "jobs", "apply", "recruitment"
   - Purpose: Direct application to company
   - Examples: "google.com/careers", "microsoft.com/jobs", "company.com/apply"

3. General Google Forms (googleFormLink):
   - Generic Google Forms not specific to placement cell or company
   - URLs containing: "docs.google.com/forms"
   - Use this only if the form doesn't clearly fit the above categories

For jobRequirements, extract skills and requirements mentioned in the job description. Look for:
- Technical skills (programming languages, frameworks, tools)
- Soft skills (communication, teamwork)
- Required qualifications
- Experience level indicators (fresher, 0-1 years, 2+ years, etc.)
- Work location preferences

Email Details:
From: ${input.from}
Subject: ${input.subject}
Body: ${input.body}

Return only the JSON object, no additional text.`
  }

  /**
   * Parse AI response into ExtractionResult
   */
  private parseAIResponse(text: string): Omit<ExtractionResult, 'provider' | 'confidence'> {
    try {
      // Clean the response to extract JSON
      const jsonMatch = text.match(/\{[\s\S]*\}/)
      if (!jsonMatch) {
        throw new Error("No JSON found in response")
      }

      const parsed = JSON.parse(jsonMatch[0])
      
      return {
        companyName: parsed.companyName || "Unknown",
        jobRole: parsed.jobRole || "To be determined",
        package: parsed.package,
        location: parsed.location,
        applicationDeadline: parsed.applicationDeadline,
        assessmentDate: parsed.assessmentDate,
        interviewDate: parsed.interviewDate,
        applicationLink: parsed.applicationLink,
        googleFormLink: parsed.googleFormLink,
        placementCellFormLink: parsed.placementCellFormLink,
        companyFormLink: parsed.companyFormLink,
        jobRequirements: parsed.jobRequirements ? {
          requiredSkills: parsed.jobRequirements.requiredSkills || [],
          preferredSkills: parsed.jobRequirements.preferredSkills || [],
          responsibilities: parsed.jobRequirements.responsibilities || [],
          experienceLevel: parsed.jobRequirements.experienceLevel,
          educationRequirements: parsed.jobRequirements.educationRequirements,
          locationPreference: parsed.jobRequirements.locationPreference
        } : undefined
      }
    } catch (error) {
      console.error("Failed to parse AI response:", error)
      throw new Error("Invalid AI response format")
    }
  }

  /**
   * Validate extraction result
   */
  private isValidExtraction(result: ExtractionResult): boolean {
    return !!result.companyName && !!result.jobRole && 
           result.companyName !== "Unknown" && 
           result.jobRole !== "To be determined"
  }
}

/**
 * Factory function to create AI extraction service
 */
export function createAIExtractionService(): AIExtractionService {
  return new AIExtractionService()
}
