import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IEmailProcessing extends Document {
  userId: mongoose.Types.ObjectId;
  gmailMessageId: string;
  subject: string;
  from: string;
  processedAt: Date;
  isPlacementEmail: boolean;
  classificationConfidence: number;
  placementId?: mongoose.Types.ObjectId;
  status: 'PENDING' | 'PROCESSED' | 'IGNORED';
  createdAt: Date;
}

const EmailProcessingSchema = new Schema<IEmailProcessing>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    gmailMessageId: {
      type: String,
      required: true,
      unique: true,
    },
    subject: {
      type: String,
      required: true,
    },
    from: {
      type: String,
      required: true,
    },
    processedAt: Date,
    isPlacementEmail: {
      type: Boolean,
      default: false,
    },
    classificationConfidence: {
      type: Number,
      default: 0,
      min: 0,
      max: 1,
    },
    placementId: {
      type: Schema.Types.ObjectId,
      ref: 'Placement',
    },
    status: {
      type: String,
      enum: ['PENDING', 'PROCESSED', 'IGNORED'],
      default: 'PENDING',
    },
  },
  {
    timestamps: true,
  }
);

const EmailProcessing: Model<IEmailProcessing> = mongoose.models.EmailProcessing || mongoose.model<IEmailProcessing>('EmailProcessing', EmailProcessingSchema);

export default EmailProcessing;
