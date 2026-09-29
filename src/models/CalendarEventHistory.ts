import mongoose, { Schema, Document, Model } from 'mongoose';

export interface ICalendarEventHistory extends Document {
  placementId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  eventType: 'deadline' | 'assessment' | 'interview';
  operation: 'create' | 'update' | 'delete';
  eventData: {
    summary?: string;
    description?: string;
    start?: { dateTime?: string; date?: string };
    end?: { dateTime?: string; date?: string };
    reminders?: { useDefault: boolean; overrides?: Array<{ method: string; minutes: number }> };
  };
  changes?: {
    field: string;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    oldValue: any;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    newValue: any;
  }[];
  timestamp: Date;
}

const CalendarEventHistorySchema = new Schema<ICalendarEventHistory>(
  {
    placementId: {
      type: Schema.Types.ObjectId,
      ref: 'Placement',
      required: true,
      index: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    eventType: {
      type: String,
      enum: ['deadline', 'assessment', 'interview'],
      required: true,
    },
    operation: {
      type: String,
      enum: ['create', 'update', 'delete'],
      required: true,
    },
    eventData: {
      summary: String,
      description: String,
      start: {
        dateTime: String,
        date: String,
      },
      end: {
        dateTime: String,
        date: String,
      },
      reminders: {
        useDefault: Boolean,
        overrides: [{
          method: String,
          minutes: Number,
        }],
      },
    },
    changes: [{
      field: { type: String, required: true },
      oldValue: Schema.Types.Mixed,
      newValue: Schema.Types.Mixed,
    }],
    timestamp: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// Index for efficient queries
CalendarEventHistorySchema.index({ placementId: 1, timestamp: -1 });
CalendarEventHistorySchema.index({ userId: 1, timestamp: -1 });

const CalendarEventHistory: Model<ICalendarEventHistory> = mongoose.models.CalendarEventHistory || mongoose.model<ICalendarEventHistory>('CalendarEventHistory', CalendarEventHistorySchema);

export default CalendarEventHistory;
