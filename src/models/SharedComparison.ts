import mongoose, { Schema, Document, Model } from 'mongoose';

export interface ISharedComparison extends Document {
  shareId: string;
  userId?: mongoose.Types.ObjectId;
  creatorName: string;
  title: string;
  placements: Array<{
    _id: string;
    companyName: string;
    jobRole: string;
    package?: string;
    location?: string;
    eligibility?: {
      minimumCGPA?: number;
      allowedBranches?: string[];
    };
    applicationDeadline?: string;
    assessmentDate?: string;
    interviewDate?: string;
    status: string;
    applicationLink?: string;
    matchScore?: number;
    matchBreakdown?: {
      skillsMatch: number;
      cgpaMatch: number;
      branchMatch: number;
      experienceMatch: number;
      locationMatch: number;
      overallScore: number;
    };
    jobRequirements?: {
      requiredSkills?: string[];
      preferredSkills?: string[];
      responsibilities?: string[];
    };
    tags?: string[];
  }>;
  userProfile?: {
    skills?: string[];
    cgpa?: number;
    branch?: string;
  };
  views: number;
  createdAt: Date;
  updatedAt: Date;
}

const SharedComparisonSchema = new Schema<ISharedComparison>(
  {
    shareId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      index: true,
    },
    creatorName: {
      type: String,
      default: 'PlaceMate Student',
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    placements: {
      type: [Schema.Types.Mixed] as any,
      default: [],
    },
    userProfile: {
      type: Schema.Types.Mixed as any,
      default: {},
    },
    views: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

const SharedComparison: Model<ISharedComparison> =
  mongoose.models.SharedComparison ||
  mongoose.model<ISharedComparison>('SharedComparison', SharedComparisonSchema);

export default SharedComparison;
