import { GoogleGenerativeAI } from '@google/generative-ai'
import Groq from 'groq-sdk'
import { IPlacement } from '@/models/Placement'

export interface ProposedChangeOutput {
  field: string
  label: string
  oldValue: any
  newValue: any
  applied: boolean
}

export interface CopilotAnalysisResult {
  reply: string
  isUpdateAnnouncement: boolean
  summary?: string
  proposedChanges: ProposedChangeOutput[]
  provider: 'gemini' | 'groq' | 'fallback'
}

export class PlacementCopilotService {
  private geminiClient: GoogleGenerativeAI | null = null
  private groqClient: Groq | null = null
  private geminiModel: string
  private groqModel: string

  constructor() {
    const geminiKey = process.env.GEMINI_API_KEY
    const groqKey = process.env.GROQ_API_KEY

    if (geminiKey) {
      this.geminiClient = new GoogleGenerativeAI(geminiKey)
    }
    if (groqKey) {
      this.groqClient = new Groq({ apiKey: groqKey })
    }

    this.geminiModel = process.env.GEMINI_MODEL || 'gemini-1.5-flash'
    this.groqModel = process.env.GROQ_MODEL || 'llama3-70b-8192'
  }

  async processMessage(
    placement: IPlacement | any,
    chatHistory: Array<{ role: 'user' | 'assistant'; content: string }>,
    userMessage: string
  ): Promise<CopilotAnalysisResult> {
    const prompt = this.buildPrompt(placement, chatHistory, userMessage)

    // 1. Try Gemini
    if (this.geminiClient) {
      try {
        const result = await this.callGemini(prompt)
        if (result) return { ...result, provider: 'gemini' }
      } catch (err) {
        console.error('PlacementCopilot Gemini error:', err)
      }
    }

    // 2. Fallback to Groq
    if (this.groqClient) {
      try {
        const result = await this.callGroq(prompt)
        if (result) return { ...result, provider: 'groq' }
      } catch (err) {
        console.error('PlacementCopilot Groq error:', err)
      }
    }

    // 3. Fallback heuristic
    return this.fallbackResponse(placement, userMessage)
  }

  private buildPrompt(
    placement: IPlacement | any,
    chatHistory: Array<{ role: 'user' | 'assistant'; content: string }>,
    userMessage: string
  ): string {
    const currentValues = {
      companyName: placement.companyName,
      jobRole: placement.jobRole,
      status: placement.status,
      package: placement.package || 'Not specified',
      location: placement.location || 'Not specified',
      applicationDeadline: placement.applicationDeadline
        ? new Date(placement.applicationDeadline).toISOString()
        : null,
      assessmentDate: placement.assessmentDate
        ? new Date(placement.assessmentDate).toISOString()
        : null,
      interviewDate: placement.interviewDate
        ? new Date(placement.interviewDate).toISOString()
        : null,
      applicationLink: placement.applicationLink || null,
      minimumCGPA: placement.eligibility?.minimumCGPA ?? null,
      allowedBranches: placement.eligibility?.allowedBranches || [],
      existingNotesCount: placement.notes?.length || 0
    }

    const recentHistoryText = chatHistory
      .slice(-6)
      .map(m => `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.content}`)
      .join('\n')

    return `You are the dedicated AI Placement Copilot for a campus placement opportunity.
You are assisting a college student regarding this specific campus drive:
Company: "${placement.companyName}"
Role: "${placement.jobRole}"

=== CURRENT PLACEMENT RECORD (OLD VALUES) ===
${JSON.stringify(currentValues, null, 2)}

=== RECENT CHAT HISTORY ===
${recentHistoryText || 'No prior conversation.'}

=== NEW USER INPUT ===
"${userMessage}"

=== YOUR OBJECTIVE ===
1. Analyze the user's input. It could be:
   a) A pasted update message (from WhatsApp, TPO/Placement Coordinator notice, Telegram, or email announcement regarding schedule changes, test links, shortlists, guidelines, etc.)
   b) A general question or query about this placement (e.g. "When is my test?", "What should I prepare?", "Summarize what we know so far").

2. If the user input contains a drive update / announcement:
   - Identify what has changed compared to the CURRENT PLACEMENT RECORD (old values).
   - Possible fields to update:
     - "status": Allowed values: 'NEW', 'INTERESTED', 'APPLIED', 'ASSESSMENT_SCHEDULED', 'INTERVIEW_SCHEDULED', 'REJECTED', 'SELECTED', 'NOT_INTERESTED', 'EXPIRED'.
     - "assessmentDate": ISO 8601 date string (e.g. "2026-10-02T14:30:00.000Z") or null. Use current year (2026) and accurate time if mentioned.
     - "interviewDate": ISO 8601 date string or null.
     - "applicationDeadline": ISO 8601 date string or null.
     - "applicationLink": new or updated URL or null.
     - "package": string or null.
     - "location": string or null.
     - "note": A concise new note/instruction to add to the placement (e.g. "Assessment platform is HackerEarth. Chrome required, webcam proctored.").
   - Produce a concise bulleted summary (2-4 bullets) focusing on key changes, deadlines, and critical instructions.
   - List the proposed changes with the old value and the new value.

3. If the user input is a regular question:
   - Answer accurately using the current placement data and past conversation.
   - Do not propose changes unless the user explicitly asks to update something.

=== OUTPUT FORMAT ===
You MUST respond ONLY with a raw JSON object (NO markdown backticks, NO other text).
{
  "reply": "Your conversational response explaining the update or answering the question.",
  "isUpdateAnnouncement": true/false,
  "summary": "• Bullet 1\\n• Bullet 2" (or null if not an announcement),
  "proposedChanges": [
    {
      "field": "assessmentDate",
      "label": "Assessment Date & Time",
      "oldValue": "2026-10-02T10:30:00.000Z",
      "newValue": "2026-10-02T14:30:00.000Z",
      "applied": false
    }
  ]
}`
  }

  private async callGemini(prompt: string): Promise<CopilotAnalysisResult | null> {
    const model = this.geminiClient!.getGenerativeModel({
      model: this.geminiModel,
      generationConfig: {
        responseMimeType: 'application/json'
      }
    })

    const result = await model.generateContent(prompt)
    const text = result.response.text()
    return this.parseJSONResponse(text)
  }

  private async callGroq(prompt: string): Promise<CopilotAnalysisResult | null> {
    const completion = await this.groqClient!.chat.completions.create({
      messages: [
        {
          role: 'system',
          content: 'You are an AI placement copilot assistant. Always output valid JSON.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      model: this.groqModel,
      response_format: { type: 'json_object' }
    })

    const text = completion.choices[0]?.message?.content
    if (!text) return null
    return this.parseJSONResponse(text)
  }

  private parseJSONResponse(rawText: string): CopilotAnalysisResult | null {
    try {
      const cleaned = rawText
        .replace(/^```json\s*/i, '')
        .replace(/^```\s*/i, '')
        .replace(/```\s*$/i, '')
        .trim()

      const parsed = JSON.parse(cleaned)

      return {
        reply: parsed.reply || 'Update processed.',
        isUpdateAnnouncement: Boolean(parsed.isUpdateAnnouncement),
        summary: parsed.summary || undefined,
        proposedChanges: Array.isArray(parsed.proposedChanges)
          ? parsed.proposedChanges.map((c: any) => ({
              field: String(c.field),
              label: String(c.label || c.field),
              oldValue: c.oldValue ?? null,
              newValue: c.newValue ?? null,
              applied: false
            }))
          : [],
        provider: 'gemini'
      }
    } catch (e) {
      console.error('Failed to parse AI Copilot JSON output:', e, rawText)
      return null
    }
  }

  private fallbackResponse(placement: IPlacement | any, userMessage: string): CopilotAnalysisResult {
    const isUpdate =
      /postponed|rescheduled|link|shortlist|test|interview|drive|date|timing|deadline|portal/i.test(
        userMessage
      )

    return {
      reply: isUpdate
        ? `I have noted this update for ${placement.companyName}. You can add any specific changes or review the placement details above.`
        : `I'm here to help with your ${placement.companyName} (${placement.jobRole}) placement process. You can paste any WhatsApp announcements, test links, or rescheduling notices here.`,
      isUpdateAnnouncement: isUpdate,
      summary: isUpdate
        ? `• New message received regarding ${placement.companyName}\n• Please review if dates or links need manual adjustment.`
        : undefined,
      proposedChanges: [],
      provider: 'fallback'
    }
  }
}

export const placementCopilot = new PlacementCopilotService()
