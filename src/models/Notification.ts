import mongoose, { Schema, Document, Model } from 'mongoose';

export type NotificationType =
  | 'NEW_DRIVE'
  | 'DEADLINE_URGENT'
  | 'HIGH_MATCH'
  | 'STATUS_CHANGE'
  | 'SHARED_ACCESS'
  | 'SYSTEM';

export interface INotification extends Document {
  userId: mongoose.Types.ObjectId;
  title: string;
  message: string;
  type: NotificationType;
  link?: string;
  placementId?: mongoose.Types.ObjectId;
  read: boolean;
  readAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const NotificationSchema = new Schema<INotification>(
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
      maxlength: 200,
    },
    message: {
      type: String,
      required: true,
      trim: true,
      maxlength: 1000,
    },
    type: {
      type: String,
      enum: ['NEW_DRIVE', 'DEADLINE_URGENT', 'HIGH_MATCH', 'STATUS_CHANGE', 'SHARED_ACCESS', 'SYSTEM'],
      default: 'SYSTEM',
      index: true,
    },
    link: {
      type: String,
      trim: true,
    },
    placementId: {
      type: Schema.Types.ObjectId,
      ref: 'Placement',
      index: true,
    },
    read: {
      type: Boolean,
      default: false,
      index: true,
    },
    readAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

// Compound indexes for optimal queries
NotificationSchema.index({ userId: 1, createdAt: -1 });
NotificationSchema.index({ userId: 1, read: 1, createdAt: -1 });
NotificationSchema.index({ userId: 1, placementId: 1, type: 1 });

const Notification: Model<INotification> =
  mongoose.models.Notification || mongoose.model<INotification>('Notification', NotificationSchema);

export default Notification;

