// booking.model.ts
import { Schema, model, models, Document, Types } from 'mongoose';

// TypeScript interface for Booking document
export interface IBooking extends Document {
  eventId: Types.ObjectId;
  email: string;
  createdAt: Date;
  updatedAt: Date;
}

const bookingSchema = new Schema<IBooking>(
  {
// ... (schema definition remains the same)
    eventId: {
      type: Schema.Types.ObjectId,
      ref: 'Event',
      required: [true, 'Event ID is required'],
    },
    email: {
// ... (email validation remains the same)
      type: String,
      required: [true, 'Email is required'],
      trim: true,
      lowercase: true,
      validate: {
        validator: function (v: string) {
          // RFC 5322 compliant email regex
          return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
        },
        message: 'Please provide a valid email address',
      },
    },
  },
  {
    timestamps: true,
  }
);

// Create index on eventId for faster queries
bookingSchema.index({ eventId: 1 });

/**
 * Pre-save hook to validate that the referenced event exists
 */
// Removed 'next' parameter and fixed logic to THROW errors
bookingSchema.pre('save', async function () { 
  // Only validate eventId if it's modified or document is new
  if (this.isModified('eventId') || this.isNew) {
    try {
      // Dynamically import Event model to avoid circular dependency
      const Event = models.Event || (await import('./event.model')).default;
      
      const eventExists = await Event.findById(this.eventId);
      
      if (!eventExists) {
        // FIX: Throw the error instead of calling next(new Error(...))
        throw new Error('Referenced event does not exist');
      }
    } catch (error) {
      // FIX: Throw the error instead of calling next(new Error(...))
      throw new Error('Failed to validate event reference');
    }
  }
});

// Use existing model if available (prevents OverwriteModelError in development)
const Booking = models.Booking || model<IBooking>('Booking', bookingSchema);

export default Booking;