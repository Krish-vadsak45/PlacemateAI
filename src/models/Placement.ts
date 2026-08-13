import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IPlacement extends Document {
  userId: mongoose.Types.ObjectId;
  companyName: string;
  jobRole: string;
  package?: string;
  location?: string;
  eligibility: {
    minimumCGPA?: number;
    allowedBranches: string[];
  };
  applicationDeadline?: Date;
  assessmentDate?: Date;
  interviewDate?: Date;
  applicationLink?: string;
  googleFormLink?: string;
  emailId?: string;
  status: 'NEW' | 'INTERESTED' | 'APPLIED' | 'ASSESSMENT_SCHEDULED' | 'INTERVIEW_SCHEDULED' | 'REJECTED' | 'SELECTED' | 'NOT_INTERESTED' | 'EXPIRED';
  extractedByAI: boolean;
  extractionConfidence: number;
  createdAt: Date;
  updatedAt: Date;
}

const PlacementSchema = new Schema<IPlacement>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    companyName: {
      type: String,
      required: true,
    },
    jobRole: {
      type: String,
      required: true,
    },
    package: String,
    location: String,
    eligibility: {
      minimumCGPA: Number,
      allowedBranches: {
        type: [String],
        default: [],
      },
    },
    applicationDeadline: Date,
    assessmentDate: Date,
    interviewDate: Date,
    applicationLink: String,
    googleFormLink: String,
    emailId: String,
    status: {
      type: String,
      enum: ['NEW', 'INTERESTED', 'APPLIED', 'ASSESSMENT_SCHEDULED', 'INTERVIEW_SCHEDULED', 'REJECTED', 'SELECTED', 'NOT_INTERESTED', 'EXPIRED'],
      default: 'NEW',
    },
    extractedByAI: {
      type: Boolean,
      default: false,
    },
    extractionConfidence: {
      type: Number,
      default: 0,
      min: 0,
      max: 1,
    },
  },
  {
    timestamps: true,
  }
);

const Placement: Model<IPlacement> = mongoose.models.Placement || mongoose.model<IPlacement>('Placement', PlacementSchema);

export default Placement;
