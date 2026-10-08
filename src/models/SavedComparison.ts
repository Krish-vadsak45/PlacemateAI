import mongoose, { Schema, Document, Model } from 'mongoose';

export interface ISavedComparison extends Document {
  userId: mongoose.Types.ObjectId;
  title: string;
  placementIds: mongoose.Types.ObjectId[];
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const SavedComparisonSchema = new Schema<ISavedComparison>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    placementIds: [
      {
        type: Schema.Types.ObjectId,
        ref: 'Placement',
        required: true,
      },
    ],
    notes: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

const SavedComparison: Model<ISavedComparison> =
  mongoose.models.SavedComparison ||
  mongoose.model<ISavedComparison>('SavedComparison', SavedComparisonSchema);

export default SavedComparison;
