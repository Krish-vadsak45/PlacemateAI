import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IUser extends Document {
  name: string;
  email: string;
  image?: string;
  profile: {
    phone?: string;
    college?: string;
    collegeEmail: string;
    branch?: string;
    semester?: number;
    year?: string; // Added for form pre-fill
    cgpa?: number;
    graduationYear?: number;
    linkedin?: string;
    github?: string;
    portfolio?: string;
    skills: string[];
    resume?: string;
    resumeUrl?: string; // Added for form pre-fill
    experience?: string; // Added for form pre-fill
    placementCellEmail: string;
  };
  googleTokens: {
    accessToken?: string;
    refreshToken?: string;
    calendarToken?: string;
    gmailWatchEnabled?: boolean;
    gmailWatchHistoryId?: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    name: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    image: {
      type: String,
    },
    profile: {
      phone: String,
      college: String,
      collegeEmail: {
        type: String,
        required: true,
        lowercase: true,
        trim: true,
      },
      branch: String,
      semester: Number,
      year: String, // Added for form pre-fill
      cgpa: Number,
      graduationYear: Number,
      linkedin: String,
      github: String,
      portfolio: String,
      skills: {
        type: [String],
        default: [],
      },
      resume: String,
      resumeUrl: String, // Added for form pre-fill
      experience: String, // Added for form pre-fill
      placementCellEmail: {
        type: String,
        required: true,
        lowercase: true,
        trim: true,
      },
    },
    googleTokens: {
      accessToken: String,
      refreshToken: String,
      calendarToken: String,
      gmailWatchEnabled: { type: Boolean, default: false },
      gmailWatchHistoryId: String,
    },
  },
  {
    timestamps: true,
  }
);

const User: Model<IUser> = mongoose.models.User || mongoose.model<IUser>('User', UserSchema);

export default User;
