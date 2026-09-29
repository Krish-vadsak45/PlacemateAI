import mongoose, { Schema, Document, Model } from 'mongoose'

export interface ISearchLog extends Document {
  userId: mongoose.Types.ObjectId
  query: string
  filters: {
    status?: string[]
    company?: string[]
    location?: string[]
    cgpaMin?: number
    cgpaMax?: number
    matchScoreMin?: number
    matchScoreMax?: number
    deadlineFrom?: string
    deadlineTo?: string
    hasAttachments?: boolean
    hasCalendarEvent?: boolean
  }
  resultsCount: number
  timestamp: Date
}

const SearchLogSchema = new Schema<ISearchLog>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    query: {
      type: String,
      default: '',
    },
    filters: {
      status: [String],
      company: [String],
      location: [String],
      cgpaMin: Number,
      cgpaMax: Number,
      matchScoreMin: Number,
      matchScoreMax: Number,
      deadlineFrom: String,
      deadlineTo: String,
      hasAttachments: Boolean,
      hasCalendarEvent: Boolean,
    },
    resultsCount: {
      type: Number,
      default: 0,
    },
    timestamp: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  {
    timestamps: true,
  }
)

// Create index for efficient queries
SearchLogSchema.index({ userId: 1, timestamp: -1 })
SearchLogSchema.index({ timestamp: -1 })

const SearchLog: Model<ISearchLog> = mongoose.models.SearchLog || mongoose.model<ISearchLog>('SearchLog', SearchLogSchema)

export default SearchLog
