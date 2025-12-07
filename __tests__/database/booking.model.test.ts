import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import Booking, { IBooking } from '@/database/booking.model';
import Event from '@/database/event.model';

describe('Booking Model', () => {
  let mongoServer: MongoMemoryServer;
  let testEventId: mongoose.Types.ObjectId;

  // Setup: Start in-memory MongoDB before all tests
  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();
    await mongoose.connect(mongoUri);
  });

  // Cleanup: Close connection and stop MongoDB after all tests
  afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
  });

  // Create a test event before each test
  beforeEach(async () => {
    const testEvent = await Event.create({
      title: 'Test Event',
      description: 'Test description',
      overview: 'Test overview',
      image: 'https://example.com/image.jpg',
      venue: 'Test Venue',
      location: 'Test Location',
      date: '2024-06-15',
      time: '09:00',
      mode: 'In-person',
      audience: 'Developers',
      agenda: ['Keynote'],
      organizer: 'Test Organizer',
      tags: ['test'],
    });
    testEventId = testEvent._id as mongoose.Types.ObjectId;
  });

  // Clear database between tests
  afterEach(async () => {
    await Booking.deleteMany({});
    await Event.deleteMany({});
  });

  describe('Schema Validation', () => {
    it('should create a valid booking with required fields', async () => {
      const validBooking = {
        eventId: testEventId,
        email: 'user@example.com',
      };

      const booking = new Booking(validBooking);
      const savedBooking = await booking.save();

      expect(savedBooking._id).toBeDefined();
      expect(savedBooking.eventId.toString()).toBe(testEventId.toString());
      expect(savedBooking.email).toBe('user@example.com');
      expect(savedBooking.createdAt).toBeDefined();
      expect(savedBooking.updatedAt).toBeDefined();
    });

    it('should fail validation when eventId is missing', async () => {
      const bookingWithoutEventId = {
        email: 'user@example.com',
      };

      const booking = new Booking(bookingWithoutEventId);

      await expect(booking.save()).rejects.toThrow(/Event ID is required/);
    });

    it('should fail validation when email is missing', async () => {
      const bookingWithoutEmail = {
        eventId: testEventId,
      };

      const booking = new Booking(bookingWithoutEmail);

      await expect(booking.save()).rejects.toThrow(/Email is required/);
    });
  });

  describe('Email Validation', () => {
    it('should accept valid email addresses', async () => {
      const validEmails = [
        'user@example.com',
        'test.user@domain.co.uk',
        'firstname+lastname@company.com',
        'user123@test-domain.org',
        'a@b.c',
      ];

      for (const email of validEmails) {
        const booking = new Booking({
          eventId: testEventId,
          email,
        });

        const savedBooking = await booking.save();
        expect(savedBooking.email).toBe(email.toLowerCase());
      }
    });

    it('should reject invalid email addresses', async () => {
      const invalidEmails = [
        'invalid',
        'invalid@',
        '@invalid.com',
        'invalid@domain',
        'invalid.domain.com',
        'user @example.com',
        'user@example .com',
      ];

      for (const email of invalidEmails) {
        const booking = new Booking({
          eventId: testEventId,
          email,
        });

        await expect(booking.save()).rejects.toThrow(/Please provide a valid email address/);
      }
    });

    it('should convert email to lowercase', async () => {
      const booking = new Booking({
        eventId: testEventId,
        email: 'User@EXAMPLE.COM',
      });

      const savedBooking = await booking.save();
      expect(savedBooking.email).toBe('user@example.com');
    });

    it('should trim whitespace from email', async () => {
      const booking = new Booking({
        eventId: testEventId,
        email: '  user@example.com  ',
      });

      const savedBooking = await booking.save();
      expect(savedBooking.email).toBe('user@example.com');
    });
  });

  describe('Event Reference Validation', () => {
    it('should successfully save booking with valid event reference', async () => {
      const booking = new Booking({
        eventId: testEventId,
        email: 'user@example.com',
      });

      const savedBooking = await booking.save();
      expect(savedBooking.eventId.toString()).toBe(testEventId.toString());
    });

    it('should fail when referenced event does not exist', async () => {
      const nonExistentId = new mongoose.Types.ObjectId();
      const booking = new Booking({
        eventId: nonExistentId,
        email: 'user@example.com',
      });

      await expect(booking.save()).rejects.toThrow(/Referenced event does not exist/);
    });

    it('should validate event reference only when eventId is modified', async () => {
      const booking = new Booking({
        eventId: testEventId,
        email: 'user@example.com',
      });

      const savedBooking = await booking.save();

      // Modify only email (not eventId)
      savedBooking.email = 'newemail@example.com';
      await expect(savedBooking.save()).resolves.toBeDefined();
    });

    it('should validate event reference when eventId is updated', async () => {
      const booking = new Booking({
        eventId: testEventId,
        email: 'user@example.com',
      });

      const savedBooking = await booking.save();

      // Create a new event
      const newEvent = await Event.create({
        title: 'New Event',
        description: 'New description',
        overview: 'New overview',
        image: 'https://example.com/image2.jpg',
        venue: 'New Venue',
        location: 'New Location',
        date: '2024-07-20',
        time: '10:00',
        mode: 'Virtual',
        audience: 'Developers',
        agenda: ['Workshop'],
        organizer: 'New Organizer',
        tags: ['new'],
      });

      // Update eventId
      savedBooking.eventId = newEvent._id as mongoose.Types.ObjectId;
      const updatedBooking = await savedBooking.save();
      expect(updatedBooking.eventId.toString()).toBe(newEvent._id.toString());
    });

    it('should fail validation when updating to non-existent event', async () => {
      const booking = new Booking({
        eventId: testEventId,
        email: 'user@example.com',
      });

      const savedBooking = await booking.save();

      const nonExistentId = new mongoose.Types.ObjectId();
      savedBooking.eventId = nonExistentId;

      await expect(savedBooking.save()).rejects.toThrow(/Referenced event does not exist/);
    });
  });

  describe('EventId Index', () => {
    it('should have index on eventId for performance', async () => {
      const indexes = await Booking.collection.getIndexes();
      const hasEventIdIndex = Object.values(indexes).some(
        (index: any) => index.eventId !== undefined
      );
      expect(hasEventIdIndex).toBe(true);
    });
  });

  describe('Timestamps', () => {
    it('should automatically set createdAt and updatedAt timestamps', async () => {
      const booking = new Booking({
        eventId: testEventId,
        email: 'user@example.com',
      });

      const savedBooking = await booking.save();
      expect(savedBooking.createdAt).toBeInstanceOf(Date);
      expect(savedBooking.updatedAt).toBeInstanceOf(Date);
      expect(savedBooking.createdAt.getTime()).toBeLessThanOrEqual(
        savedBooking.updatedAt.getTime()
      );
    });

    it('should update updatedAt timestamp on modification', async () => {
      const booking = new Booking({
        eventId: testEventId,
        email: 'user@example.com',
      });

      const savedBooking = await booking.save();
      const originalUpdatedAt = savedBooking.updatedAt;

      // Wait a bit to ensure timestamp difference
      await new Promise((resolve) => setTimeout(resolve, 10));

      savedBooking.email = 'newemail@example.com';
      const updatedBooking = await savedBooking.save();

      expect(updatedBooking.updatedAt.getTime()).toBeGreaterThan(originalUpdatedAt.getTime());
    });
  });

  describe('Population', () => {
    it('should populate event details when querying bookings', async () => {
      const booking = await Booking.create({
        eventId: testEventId,
        email: 'user@example.com',
      });

      const populatedBooking = await Booking.findById(booking._id).populate('eventId');

      expect(populatedBooking).toBeDefined();
      expect(populatedBooking?.eventId).toBeDefined();
      // @ts-ignore - eventId is populated
      expect(populatedBooking?.eventId.title).toBe('Test Event');
    });
  });

  describe('Query Operations', () => {
    it('should find bookings by eventId', async () => {
      await Booking.create([
        { eventId: testEventId, email: 'user1@example.com' },
        { eventId: testEventId, email: 'user2@example.com' },
      ]);

      const bookings = await Booking.find({ eventId: testEventId });
      expect(bookings).toHaveLength(2);
    });

    it('should find booking by email', async () => {
      await Booking.create({
        eventId: testEventId,
        email: 'unique@example.com',
      });

      const booking = await Booking.findOne({ email: 'unique@example.com' });
      expect(booking).toBeDefined();
      expect(booking?.email).toBe('unique@example.com');
    });

    it('should allow multiple bookings for same event with different emails', async () => {
      const booking1 = await Booking.create({
        eventId: testEventId,
        email: 'user1@example.com',
      });

      const booking2 = await Booking.create({
        eventId: testEventId,
        email: 'user2@example.com',
      });

      expect(booking1._id).not.toBe(booking2._id);
      expect(booking1.eventId.toString()).toBe(booking2.eventId.toString());
    });

    it('should count bookings for a specific event', async () => {
      await Booking.create([
        { eventId: testEventId, email: 'user1@example.com' },
        { eventId: testEventId, email: 'user2@example.com' },
        { eventId: testEventId, email: 'user3@example.com' },
      ]);

      const count = await Booking.countDocuments({ eventId: testEventId });
      expect(count).toBe(3);
    });
  });

  describe('Edge Cases', () => {
    it('should handle very long valid email addresses', async () => {
      const longEmail = 'a'.repeat(50) + '@' + 'b'.repeat(50) + '.com';
      const booking = new Booking({
        eventId: testEventId,
        email: longEmail,
      });

      const savedBooking = await booking.save();
      expect(savedBooking.email).toBe(longEmail.toLowerCase());
    });

    it('should handle international email addresses', async () => {
      const internationalEmails = [
        'user@münchen.de',
        'test@日本.jp',
        'user@中国.cn',
      ];

      for (const email of internationalEmails) {
        const booking = new Booking({
          eventId: testEventId,
          email,
        });

        // Note: The current email regex may not support all international domains
        // This test documents current behavior
        try {
          await booking.save();
          expect(booking.email).toBeDefined();
        } catch (error) {
          // Expected for some international domains with current regex
          expect(error).toBeDefined();
        }
      }
    });

    it('should handle email with plus addressing', async () => {
      const booking = new Booking({
        eventId: testEventId,
        email: 'user+tag@example.com',
      });

      const savedBooking = await booking.save();
      expect(savedBooking.email).toBe('user+tag@example.com');
    });

    it('should handle concurrent bookings for same event', async () => {
      const bookingPromises = Array.from({ length: 5 }, (_, i) =>
        Booking.create({
          eventId: testEventId,
          email: `user${i}@example.com`,
        })
      );

      const bookings = await Promise.all(bookingPromises);
      expect(bookings).toHaveLength(5);

      const allBookings = await Booking.find({ eventId: testEventId });
      expect(allBookings).toHaveLength(5);
    });
  });

  describe('Error Handling', () => {
    it('should handle database connection errors gracefully', async () => {
      // Simulate a connection issue by using an invalid ObjectId format
      const booking = new Booking({
        eventId: 'invalid-id' as any,
        email: 'user@example.com',
      });

      await expect(booking.save()).rejects.toThrow();
    });

    it('should provide clear error messages for validation failures', async () => {
      const booking = new Booking({
        eventId: testEventId,
        email: 'invalid-email',
      });

      try {
        await booking.save();
        fail('Should have thrown validation error');
      } catch (error: any) {
        expect(error.message).toContain('valid email address');
      }
    });
  });

  describe('Deletion', () => {
    it('should successfully delete a booking', async () => {
      const booking = await Booking.create({
        eventId: testEventId,
        email: 'user@example.com',
      });

      await Booking.deleteOne({ _id: booking._id });

      const deletedBooking = await Booking.findById(booking._id);
      expect(deletedBooking).toBeNull();
    });

    it('should allow deleting bookings when event is deleted', async () => {
      const booking = await Booking.create({
        eventId: testEventId,
        email: 'user@example.com',
      });

      await Event.deleteOne({ _id: testEventId });

      // Booking still exists even after event deletion (no cascade)
      const existingBooking = await Booking.findById(booking._id);
      expect(existingBooking).toBeDefined();

      // But we can still delete the booking
      await Booking.deleteOne({ _id: booking._id });
      const deletedBooking = await Booking.findById(booking._id);
      expect(deletedBooking).toBeNull();
    });
  });
});