import mongoose, { Schema, Document, Model } from 'mongoose';

export type SharedPermission = 'viewer' | 'editor';
export type SharedStatus = 'pending' | 'accepted' | 'revoked';

export interface ISharedAccess extends Document {
  ownerId: mongoose.Types.ObjectId;
  ownerName: string;
  ownerEmail: string;
  ownerImage?: string;
  sharedWithId?: mongoose.Types.ObjectId; // Populated when user accepts / already has account
  sharedWithEmail: string; // Always stored — used for pending invites before signup
  sharedWithName?: string;
  sharedWithImage?: string;
  permission: SharedPermission;
  status: SharedStatus;
  acceptedAt?: Date;
  revokedAt?: Date;
  lastAccessedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const SharedAccessSchema = new Schema<ISharedAccess>(
  {
    ownerId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    ownerName: {
      type: String,
      required: true,
    },
    ownerEmail: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },
    ownerImage: String,
    sharedWithId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      index: true,
    },
    sharedWithEmail: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },
    sharedWithName: String,
    sharedWithImage: String,
    permission: {
      type: String,
      enum: ['viewer', 'editor'],
      default: 'viewer',
      required: true,
    },
    status: {
      type: String,
      enum: ['pending', 'accepted', 'revoked'],
      default: 'pending',
      required: true,
    },
    acceptedAt: Date,
    revokedAt: Date,
    lastAccessedAt: Date,
  },
  {
    timestamps: true,
  }
);

// Prevent duplicate invites: one owner can only invite a specific email once
SharedAccessSchema.index(
  { ownerId: 1, sharedWithEmail: 1 },
  { unique: true }
);

// Fast lookup: "dashboards shared with me"
SharedAccessSchema.index({ sharedWithEmail: 1, status: 1 });
SharedAccessSchema.index({ sharedWithId: 1, status: 1 });

// Fast lookup: "my sent invitations"
SharedAccessSchema.index({ ownerId: 1, status: 1 });

const SharedAccess: Model<ISharedAccess> =
  mongoose.models.SharedAccess ||
  mongoose.model<ISharedAccess>('SharedAccess', SharedAccessSchema);

export default SharedAccess;
