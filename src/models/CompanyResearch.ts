import mongoose, { Schema, Document, Model } from 'mongoose'

export interface INewsArticle {
  title: string
  link: string
  source: string
  pubDate: string
}

export interface IInterviewIntel {
  elevatorPitch: string
  keyProducts: string[]
  engineeringCulture: string
  interviewQuestionsToAsk: string[]
}

export interface ICompanyResearch extends Document {
  companyKey: string // Lowercase normalized name e.g. "goldman sachs"
  displayName: string
  domain?: string
  logoUrl?: string
  industry?: string
  description?: string
  headquarters?: string
  websiteUrl?: string
  wikipediaUrl?: string
  recentNews: INewsArticle[]
  interviewIntel: IInterviewIntel
  lastUpdated: Date
  createdAt: Date
  updatedAt: Date
}

const NewsArticleSchema = new Schema<INewsArticle>(
  {
    title: { type: String, required: true },
    link: { type: String, required: true },
    source: { type: String, default: 'Google News' },
    pubDate: { type: String, default: '' },
  },
  { _id: false }
)

const InterviewIntelSchema = new Schema<IInterviewIntel>(
  {
    elevatorPitch: { type: String, default: '' },
    keyProducts: { type: [String], default: [] },
    engineeringCulture: { type: String, default: '' },
    interviewQuestionsToAsk: { type: [String], default: [] },
  },
  { _id: false }
)

const CompanyResearchSchema = new Schema<ICompanyResearch>(
  {
    companyKey: {
      type: String,
      required: true,
      unique: true,
      index: true,
      lowercase: true,
      trim: true,
    },
    displayName: {
      type: String,
      required: true,
    },
    domain: { type: String, default: '' },
    logoUrl: { type: String, default: '' },
    industry: { type: String, default: 'Technology & Business' },
    description: { type: String, default: '' },
    headquarters: { type: String, default: '' },
    websiteUrl: { type: String, default: '' },
    wikipediaUrl: { type: String, default: '' },
    recentNews: {
      type: [NewsArticleSchema],
      default: [],
    },
    interviewIntel: {
      type: InterviewIntelSchema,
      default: () => ({}),
    },
    lastUpdated: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
)

const CompanyResearch: Model<ICompanyResearch> =
  mongoose.models.CompanyResearch ||
  mongoose.model<ICompanyResearch>('CompanyResearch', CompanyResearchSchema)

export default CompanyResearch
