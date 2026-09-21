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
  placementCellFormLink?: string; // New: Placement cell specific form
  companyFormLink?: string; // New: Company specific form
  emailId?: string;
  status: 'NEW' | 'INTERESTED' | 'APPLIED' | 'ASSESSMENT_SCHEDULED' | 'INTERVIEW_SCHEDULED' | 'REJECTED' | 'SELECTED' | 'NOT_INTERESTED' | 'EXPIRED';
  extractedByAI: boolean;
  extractionProvider?: string;
  extractionConfidence: number;
  // Email detection fields
  emailFrom?: string;
  emailSubject?: string;
  emailBody?: string;
  emailDate?: Date;
  detectionReason?: string;
  // New fields for detail page
  notes?: Array<{
    id: string;
    content: string;
    createdAt: Date;
  }>;
  attachments?: Array<{
    id: string;
    name: string;
    url: string;
    type: string;
  }>;
  applicationHistory?: Array<{
    status: string;
    changedAt: Date;
    note?: string;
  }>;
  calendarEventId?: string;
  deadlineCalendarEventId?: string;
  assessmentCalendarEventId?: string;
  interviewCalendarEventId?: string;
  reminderSettings?: {
    deadlineReminder: boolean;
    interviewReminder: boolean;
  };
  aiSummary?: string; // AI-generated summary
  processingStatus?: 'RECEIVED' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
  processingAttempts?: number;
  lastProcessedAt?: Date;
  processingError?: string;
  // Job matching fields
  jobRequirements?: {
    requiredSkills: string[];
    preferredSkills: string[];
    responsibilities: string[];
    experienceLevel?: string;
    educationRequirements?: string;
    locationPreference?: string;
  };
  matchScore?: number; // 0-100
  matchBreakdown?: {
    skillsMatch: number; // 0-100
    cgpaMatch: number; // 0-100
    branchMatch: number; // 0-100
    experienceMatch: number; // 0-100
    locationMatch: number; // 0-100
    overallScore: number; // 0-100
  };
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
    placementCellFormLink: { type: String, default: null }, // New: Placement cell specific form
    companyFormLink: { type: String, default: null }, // New: Company specific form
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
    extractionProvider: String,
    extractionConfidence: {
      type: Number,
      default: 0,
      min: 0,
      max: 1,
    },
    // Email detection fields
    emailFrom: String,
    emailSubject: String,
    emailBody: String,
    emailDate: Date,
    detectionReason: String,
    // New fields for detail page
    notes: [{
      id: { type: String, required: true },
      content: { type: String, required: true },
      createdAt: { type: Date, default: Date.now }
    }],
    attachments: [{
      id: { type: String, required: true },
      name: { type: String, required: true },
      url: { type: String, required: true },
      type: { type: String, required: true }
    }],
    applicationHistory: [{
      status: { type: String, required: true },
      changedAt: { type: Date, default: Date.now },
      note: String
    }],
    calendarEventId: String,
    deadlineCalendarEventId: String,
    assessmentCalendarEventId: String,
    interviewCalendarEventId: String,
    reminderSettings: {
      deadlineReminder: { type: Boolean, default: true },
      interviewReminder: { type: Boolean, default: true }
    },
    aiSummary: { type: String, default: null }, // AI-generated summary
    processingStatus: {
      type: String,
      enum: ['RECEIVED', 'PROCESSING', 'COMPLETED', 'FAILED'],
      default: 'RECEIVED'
    },
    processingAttempts: { type: Number, default: 0 },
    lastProcessedAt: { type: Date },
    processingError: { type: String },
    // Job matching fields
    jobRequirements: {
      requiredSkills: { type: [String], default: [] },
      preferredSkills: { type: [String], default: [] },
      responsibilities: { type: [String], default: [] },
      experienceLevel: String,
      educationRequirements: String,
      locationPreference: String
    },
    matchScore: { type: Number, min: 0, max: 100 },
    matchBreakdown: {
      skillsMatch: { type: Number, min: 0, max: 100 },
      cgpaMatch: { type: Number, min: 0, max: 100 },
      branchMatch: { type: Number, min: 0, max: 100 },
      experienceMatch: { type: Number, min: 0, max: 100 },
      locationMatch: { type: Number, min: 0, max: 100 },
      overallScore: { type: Number, min: 0, max: 100 }
    }
  },
  {
    timestamps: true,
    strict: false // Allow fields that aren't in the schema
  }
);

const Placement: Model<IPlacement> = mongoose.models.Placement || mongoose.model<IPlacement>('Placement', PlacementSchema);

export default Placement;
