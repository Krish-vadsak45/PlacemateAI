import mongoose, { Schema, Document, Model } from 'mongoose';

export interface ICalendarEvent extends Document {
  placementId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  eventType: 'APPLICATION_REMINDER' | 'ASSESSMENT' | 'INTERVIEW' | 'DOCUMENT_SUBMISSION' | 'OFFER_DEADLINE';
  googleCalendarEventId: string;
  eventDate: Date;
  eventIdempotencyKey: string;
  createdAt: Date;
}

const CalendarEventSchema = new Schema<ICalendarEvent>(
  {
    placementId: {
      type: Schema.Types.ObjectId,
      ref: 'Placement',
      required: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    eventType: {
      type: String,
      enum: ['APPLICATION_REMINDER', 'ASSESSMENT', 'INTERVIEW', 'DOCUMENT_SUBMISSION', 'OFFER_DEADLINE'],
      required: true,
    },
    googleCalendarEventId: {
      type: String,
      required: true,
    },
    eventDate: {
      type: Date,
      required: true,
    },
    eventIdempotencyKey: {
      type: String,
      required: true,
      unique: true,
    },
  },
  {
    timestamps: true,
  }
);

const CalendarEvent: Model<ICalendarEvent> = mongoose.models.CalendarEvent || mongoose.model<ICalendarEvent>('CalendarEvent', CalendarEventSchema);

export default CalendarEvent;
