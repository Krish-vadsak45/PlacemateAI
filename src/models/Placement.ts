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
  reminderSettings?: {
    deadlineReminder: boolean;
    interviewReminder: boolean;
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
    reminderSettings: {
      deadlineReminder: { type: Boolean, default: true },
      interviewReminder: { type: Boolean, default: true }
    }
  },
  {
    timestamps: true,
  }
);

const Placement: Model<IPlacement> = mongoose.models.Placement || mongoose.model<IPlacement>('Placement', PlacementSchema);

export default Placement;
