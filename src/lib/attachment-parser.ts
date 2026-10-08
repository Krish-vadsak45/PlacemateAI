import { PDFParse } from 'pdf-parse'
import mammoth from 'mammoth'
import * as XLSX from 'xlsx'
import Groq from 'groq-sdk'

export interface ParsedDocumentResult {
  text: string
  fileType: 'pdf' | 'docx' | 'xlsx' | 'text' | 'unknown'
  pageCount?: number
  summary?: string
}

export class AttachmentParserService {
  private groqClient: Groq | null = null
  private groqModel: string

  constructor() {
    if (process.env.GROQ_API_KEY) {
      this.groqClient = new Groq({ apiKey: process.env.GROQ_API_KEY })
    }
    this.groqModel = process.env.GROQ_MODEL || 'llama3-70b-8192'
  }

  /**
   * Parse plain text from an attachment buffer according to MIME type / extension
   */
  async extractText(
    buffer: Buffer,
    mimeType: string,
    filename: string
  ): Promise<ParsedDocumentResult> {
    const ext = filename.split('.').pop()?.toLowerCase() || ''

    try {
      // 1. PDF Documents
      if (mimeType.includes('pdf') || ext === 'pdf') {
        const parser = new PDFParse({ data: buffer })
        try {
          const data = await parser.getText()
          const cleanText = this.sanitizeText(data.text || '')
          return {
            text: cleanText,
            fileType: 'pdf',
            pageCount: data.total || data.pages?.length,
          }
        } finally {
          await parser.destroy().catch(() => {})
        }
      }

      // 2. Word Documents (.docx)
      if (
        mimeType.includes('wordprocessingml') ||
        mimeType.includes('msword') ||
        ext === 'docx' ||
        ext === 'doc'
      ) {
        const result = await mammoth.extractRawText({ buffer })
        const cleanText = this.sanitizeText(result.value || '')
        return {
          text: cleanText,
          fileType: 'docx',
        }
      }

      // 3. Excel Spreadsheets (.xlsx, .xls, .csv) - typical for shortlist announcements
      if (
        mimeType.includes('spreadsheetml') ||
        mimeType.includes('excel') ||
        mimeType.includes('csv') ||
        ext === 'xlsx' ||
        ext === 'xls' ||
        ext === 'csv'
      ) {
        const workbook = XLSX.read(buffer, { type: 'buffer' })
        let combinedCsv = ''
        for (const sheetName of workbook.SheetNames) {
          const worksheet = workbook.Sheets[sheetName]
          const csv = XLSX.utils.sheet_to_csv(worksheet)
          if (csv.trim()) {
            combinedCsv += `[Sheet: ${sheetName}]\n${csv}\n\n`
          }
        }
        return {
          text: this.sanitizeText(combinedCsv),
          fileType: 'xlsx',
        }
      }

      // 4. Plain Text
      if (mimeType.startsWith('text/') || ext === 'txt') {
        return {
          text: this.sanitizeText(buffer.toString('utf-8')),
          fileType: 'text',
        }
      }

      return {
        text: '',
        fileType: 'unknown',
      }
    } catch (error) {
      console.error(`Error parsing document ${filename} (${mimeType}):`, error)
      return {
        text: '',
        fileType: 'unknown',
      }
    }
  }

  /**
   * Summarize or extract critical JD requirements using Groq LLM (prioritized as requested)
   */
  async summarizeDocumentWithGroq(
    documentText: string,
    filename: string
  ): Promise<string | null> {
    if (!this.groqClient || !documentText.trim()) {
      return null
    }

    try {
      // Truncate to avoid exceeding rate limits while preserving rich context
      const truncated = documentText.slice(0, 12000)

      const completion = await this.groqClient.chat.completions.create({
        model: this.groqModel,
        messages: [
          {
            role: 'system',
            content:
              'You are an expert placement analyst. Summarize this attached campus placement document concisely. Extract: 1) Role & Company, 2) CTC/Compensation breakdown, 3) Eligibility (CGPA, branches, passing year), 4) Test/Interview dates, 5) Service Agreement/Bond if any.',
          },
          {
            role: 'user',
            content: `Filename: ${filename}\n\nContent:\n${truncated}`,
          },
        ],
        temperature: 0.2,
        max_tokens: 500,
      })

      return completion.choices[0]?.message?.content || null
    } catch (error) {
      console.error('Groq attachment summarization error:', error)
      return null
    }
  }

  private sanitizeText(raw: string): string {
    return raw
      .replace(/\r\n/g, '\n')
      .replace(/\r/g, '\n')
      .replace(/[ \t]+/g, ' ')
      .replace(/\n{3,}/g, '\n\n')
      .trim()
  }
}

export const attachmentParser = new AttachmentParserService()
