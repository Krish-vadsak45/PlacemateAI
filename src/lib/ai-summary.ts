import { GoogleGenerativeAI } from '@google/generative-ai'
import { Groq } from 'groq-sdk'

interface AISummaryResult {
  summary: string
  provider: 'gemini' | 'groq'
  error?: string
}

export class AISummaryService {
  private geminiClient: GoogleGenerativeAI | null = null
  private groqClient: Groq | null = null

  constructor() {
    // Initialize Gemini
    if (process.env.GEMINI_API_KEY) {
      this.geminiClient = new GoogleGenerativeAI(process.env.GEMINI_API_KEY)
    }

    // Initialize Groq
    if (process.env.GROQ_API_KEY) {
      this.groqClient = new Groq({ apiKey: process.env.GROQ_API_KEY })
    }
  }

  async generateSummary(emailContent: {
    subject: string
    body: string
    from: string
  }): Promise<AISummaryResult> {
    // Try Gemini first
    if (this.geminiClient) {
      try {
        const summary = await this.generateGeminiSummary(emailContent)
        return { summary, provider: 'gemini' }
      } catch (error) {
        console.error('Gemini failed, falling back to Groq:', error)
      }
    }

    // Fallback to Groq
    if (this.groqClient) {
      try {
        const summary = await this.generateGroqSummary(emailContent)
        return { summary, provider: 'groq' }
      } catch (error) {
        console.error('Groq failed:', error)
      }
    }

    return {
      summary: 'Unable to generate AI summary. Please check your API keys.',
      provider: 'gemini',
      error: 'No AI service available'
    }
  }

  private async generateGeminiSummary(emailContent: {
    subject: string
    body: string
    from: string
  }): Promise<string> {
    const modelName = process.env.GEMINI_MODEL || 'gemini-1.5-pro'
    const model = this.geminiClient!.getGenerativeModel({ model: modelName })

    const prompt = `Analyze this placement email and provide a concise summary in this exact format:

**Company & Role:** [Company name] - [Job role]

**Requirements:**
• [Eligibility]
• [Skills]
• [Location]

**Key Dates:**
• [Deadline]
• [Assessment]
• [Interview]

**Package/Compensation:**
• [Stipend/Salary]
• [Benefits]

**Application Process:**
• [How to apply]
• [Links]

**Notes:**
• [Special instructions]

Keep it extremely concise. Use only bullet points. Maximum 2-3 bullet points per section. No paragraphs.

Email:
From: ${emailContent.from}
Subject: ${emailContent.subject}
Body: ${emailContent.body}`

    const result = await model.generateContent(prompt)
    return result.response.text()
  }

  private async generateGroqSummary(emailContent: {
    subject: string
    body: string
    from: string
  }): Promise<string> {
    const modelName = process.env.GROQ_MODEL || 'llama3-70b-versatile'
    const prompt = `Analyze this placement email and provide a concise summary in this exact format:

**Company & Role:** [Company name] - [Job role]

**Requirements:**
• [Eligibility]
• [Skills]
• [Location]

**Key Dates:**
• [Deadline]
• [Assessment]
• [Interview]

**Package/Compensation:**
• [Stipend/Salary]
• [Benefits]

**Application Process:**
• [How to apply]
• [Links]

**Notes:**
• [Special instructions]

Keep it extremely concise. Use only bullet points. Maximum 2-3 bullet points per section. No paragraphs.

Email:
From: ${emailContent.from}
Subject: ${emailContent.subject}
Body: ${emailContent.body}`

    const completion = await this.groqClient!.chat.completions.create({
      messages: [{ role: 'user', content: prompt }],
      model: modelName,
    })

    return completion.choices[0]?.message?.content || 'Failed to generate summary'
  }
}

export function createAISummaryService(): AISummaryService {
  return new AISummaryService()
}
