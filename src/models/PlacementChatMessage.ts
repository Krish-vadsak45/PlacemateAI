import mongoose, { Schema, Document, Model } from 'mongoose'

export interface IProposedChange {
  field: string
  label: string
  oldValue: any
  newValue: any
  applied: boolean
}

export interface IPlacementChatMessage extends Document {
  placementId: mongoose.Types.ObjectId
  userId: mongoose.Types.ObjectId
  role: 'user' | 'assistant'
  content: string
  isUpdateAnnouncement?: boolean
  summary?: string
  proposedChanges?: IProposedChange[]
  createdAt: Date
  updatedAt: Date
}

const ProposedChangeSchema = new Schema<IProposedChange>(
  {
    field: { type: String, required: true },
    label: { type: String, required: true },
    oldValue: { type: Schema.Types.Mixed, default: null },
    newValue: { type: Schema.Types.Mixed, default: null },
    applied: { type: Boolean, default: false }
  },
  { _id: false }
)

const PlacementChatMessageSchema = new Schema<IPlacementChatMessage>(
  {
    placementId: {
      type: Schema.Types.ObjectId,
      ref: 'Placement',
      required: true,
      index: true
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    role: {
      type: String,
      enum: ['user', 'assistant'],
      required: true
    },
    content: {
      type: String,
      required: true
    },
    isUpdateAnnouncement: {
      type: Boolean,
      default: false
    },
    summary: {
      type: String
    },
    proposedChanges: {
      type: [ProposedChangeSchema],
      default: []
    }
  },
  {
    timestamps: true
  }
)

PlacementChatMessageSchema.index({ placementId: 1, createdAt: 1 })

const PlacementChatMessage: Model<IPlacementChatMessage> =
  mongoose.models.PlacementChatMessage ||
  mongoose.model<IPlacementChatMessage>('PlacementChatMessage', PlacementChatMessageSchema)

export default PlacementChatMessage
