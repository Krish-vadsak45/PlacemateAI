import Groq from 'groq-sdk'
import connectDB from './mongodb'
import CompanyResearch, { ICompanyResearch, INewsArticle } from '@/models/CompanyResearch'

export class CompanyResearchService {
  private groqClient: Groq | null = null
  private groqModel: string

  constructor() {
    if (process.env.GROQ_API_KEY) {
      this.groqClient = new Groq({ apiKey: process.env.GROQ_API_KEY })
    }
    this.groqModel = process.env.GROQ_MODEL || 'llama3-70b-8192'
  }

  /**
   * Fetch company research, checking MongoDB cache first (14-day TTL)
   */
  async getCompanyResearch(
    companyName: string,
    role?: string,
    forceRefresh = false
  ): Promise<ICompanyResearch | any> {
    if (!companyName || !companyName.trim()) {
      throw new Error('Company name is required')
    }

    const companyKey = companyName.toLowerCase().trim()
    await connectDB()

    // 1. Check MongoDB Cache
    if (!forceRefresh) {
      const cached = await CompanyResearch.findOne({ companyKey })
      if (cached) {
        const ageMs = Date.now() - new Date(cached.lastUpdated).getTime()
        const fourteenDays = 14 * 24 * 60 * 60 * 1000
        if (ageMs < fourteenDays) {
          console.log(`Returning cached company research for: ${companyName}`)
          return cached
        }
      }
    }

    console.log(`Aggregating live company research for: ${companyName}...`)

    // 2. Derive Domain & Logo
    const domain = this.deriveDomain(companyName)
    const logoUrl = `https://www.google.com/s2/favicons?domain=${domain}&sz=128`

    // 3. Parallel Fetching: Wikipedia & Google News RSS
    const [wikiData, newsArticles] = await Promise.all([
      this.fetchWikipediaSummary(companyName),
      this.fetchGoogleNews(companyName),
    ])

    // 4. Synthesize Interview Prep Dossier with Groq
    const intel = await this.synthesizeWithGroq(companyName, role, wikiData?.extract)

    // 5. Build Document
    const updateData = {
      companyKey,
      displayName: companyName.trim(),
      domain,
      logoUrl: wikiData?.thumbnail || logoUrl,
      industry: wikiData?.description || 'Technology & Business',
      description: wikiData?.extract || `${companyName} is an active employer on campus drives.`,
      headquarters: intel.headquarters || 'Global',
      websiteUrl: `https://${domain}`,
      wikipediaUrl: wikiData?.pageUrl || '',
      recentNews: newsArticles,
      interviewIntel: {
        elevatorPitch: intel.elevatorPitch,
        keyProducts: intel.keyProducts,
        engineeringCulture: intel.engineeringCulture,
        interviewQuestionsToAsk: intel.interviewQuestionsToAsk,
      },
      lastUpdated: new Date(),
    }

    // 6. Upsert into MongoDB
    const record = await CompanyResearch.findOneAndUpdate(
      { companyKey },
      { $set: updateData },
      { upsert: true, new: true, runValidators: true }
    )

    return record
  }

  /**
   * Fetch company overview from Wikipedia REST API ($0, official, fast)
   */
  private async fetchWikipediaSummary(
    companyName: string
  ): Promise<{ extract: string; description: string; thumbnail?: string; pageUrl?: string } | null> {
    const cleanTitles = [
      companyName.trim(),
      companyName
        .replace(/\b(pvt|ltd|limited|private|technologies|solutions|services|india|inc|corp)\b/gi, '')
        .trim(),
      `${companyName.trim()} (company)`,
    ]

    for (const title of cleanTitles) {
      if (!title) continue
      try {
        const url = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title)}`
        const res = await fetch(url, {
          headers: { 'User-Agent': 'PlaceMateAI/1.0 (campus placement assistant)' },
          next: { revalidate: 86400 },
        })

        if (res.ok) {
          const data = await res.json()
          if (data.type === 'standard' && data.extract) {
            return {
              extract: data.extract,
              description: data.description || '',
              thumbnail: data.thumbnail?.source,
              pageUrl: data.content_urls?.desktop?.page,
            }
          }
        }
      } catch (err) {
        // Silently try next variation
      }
    }

    return null
  }

  /**
   * Fetch live company news from Google News RSS feed ($0, real-time)
   */
  private async fetchGoogleNews(companyName: string): Promise<INewsArticle[]> {
    try {
      const query = encodeURIComponent(`"${companyName}" hiring OR placement OR expansion`)
      const url = `https://news.google.com/rss/search?q=${query}&hl=en-IN&gl=IN&ceid=IN:en`

      const res = await fetch(url, {
        headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' },
        next: { revalidate: 3600 },
      })

      if (!res.ok) return []

      const xml = await res.text()
      const items: INewsArticle[] = []

      // Simple regex extraction to avoid heavy XML parser dependencies
      const itemRegex = /<item>[\s\S]*?<\/item>/gi
      const itemMatches = xml.match(itemRegex) || []

      for (const itemXml of itemMatches.slice(0, 5)) {
        const titleMatch = itemXml.match(/<title>([\s\S]*?)<\/title>/i)
        const linkMatch = itemXml.match(/<link>([\s\S]*?)<\/link>/i)
        const pubDateMatch = itemXml.match(/<pubDate>([\s\S]*?)<\/pubDate>/i)
        const sourceMatch = itemXml.match(/<source[^>]*>([\s\S]*?)<\/source>/i)

        if (titleMatch && linkMatch) {
          const rawTitle = titleMatch[1].replace(/<!\[CDATA\[(.*?)\]\]>/gi, '$1').trim()
          const link = linkMatch[1].trim()
          const source = sourceMatch ? sourceMatch[1].trim() : 'Google News'
          const pubDate = pubDateMatch ? new Date(pubDateMatch[1]).toLocaleDateString() : ''

          items.push({
            title: rawTitle,
            link,
            source,
            pubDate,
          })
        }
      }

      return items
    } catch (error) {
      console.error('Error fetching Google News RSS:', error)
      return []
    }
  }

  /**
   * Synthesize interview preparation insights using Groq
   */
  private async synthesizeWithGroq(
    companyName: string,
    role?: string,
    wikiExtract?: string
  ): Promise<{
    elevatorPitch: string
    headquarters: string
    keyProducts: string[]
    engineeringCulture: string
    interviewQuestionsToAsk: string[]
  }> {
    const fallback = {
      elevatorPitch: `${companyName} is an industry player focusing on scalable technology solutions and innovative products.`,
      headquarters: 'Global',
      keyProducts: ['Enterprise Solutions', 'Cloud Services', 'Software Platforms'],
      engineeringCulture: 'Collaborative, customer-centric engineering with emphasis on reliability.',
      interviewQuestionsToAsk: [
        'What tech stack and engineering practices does the team follow for this role?',
        'How does the team balance new feature velocity with technical debt?',
        'What does a typical onboarding trajectory look like for a new graduate joining this team?',
      ],
    }

    if (!this.groqClient) return fallback

    try {
      const prompt = `You are a campus placement career coach. Analyze the company "${companyName}" (Role: "${role || 'Software Engineer'}").
Additional Context: "${wikiExtract || 'Leading technology and services company'}"

Respond ONLY with valid JSON in this exact structure:
{
  "elevatorPitch": "2-3 sentences explaining what this company does and why it matters in the industry (ideal for 'What do you know about our company?').",
  "headquarters": "City, Country",
  "keyProducts": ["Flagship Product 1", "Product 2", "Product 3"],
  "engineeringCulture": "1-2 sentences describing their tech focus, engineering culture, or work style.",
  "interviewQuestionsToAsk": [
    "Question 1 candidate can ask the interviewer at the end of the interview.",
    "Question 2",
    "Question 3"
  ]
}`

      const completion = await this.groqClient.chat.completions.create({
        model: this.groqModel,
        messages: [
          { role: 'system', content: 'You are an expert placement analyst. Output only raw JSON.' },
          { role: 'user', content: prompt },
        ],
        response_format: { type: 'json_object' },
        temperature: 0.2,
      })

      const text = completion.choices[0]?.message?.content
      if (!text) return fallback

      const parsed = JSON.parse(text)
      return {
        elevatorPitch: parsed.elevatorPitch || fallback.elevatorPitch,
        headquarters: parsed.headquarters || fallback.headquarters,
        keyProducts: Array.isArray(parsed.keyProducts) ? parsed.keyProducts : fallback.keyProducts,
        engineeringCulture: parsed.engineeringCulture || fallback.engineeringCulture,
        interviewQuestionsToAsk: Array.isArray(parsed.interviewQuestionsToAsk)
          ? parsed.interviewQuestionsToAsk
          : fallback.interviewQuestionsToAsk,
      }
    } catch (err) {
      console.error('Error synthesizing company intel with Groq:', err)
      return fallback
    }
  }

  private deriveDomain(companyName: string): string {
    const clean = companyName
      .toLowerCase()
      .replace(/\b(pvt|ltd|limited|private|technologies|solutions|services|corp|inc|llc|india)\b/gi, '')
      .replace(/[^a-z0-9]/g, '')
      .trim()

    return clean ? `${clean}.com` : 'company.com'
  }
}

export const companyResearch = new CompanyResearchService()
