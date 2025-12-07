import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import Event, { IEvent } from '@/database/event.model';

describe('Event Model', () => {
  let mongoServer: MongoMemoryServer;

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

  // Clear database between tests
  afterEach(async () => {
    await Event.deleteMany({});
  });

  describe('Schema Validation', () => {
    it('should create a valid event with all required fields', async () => {
      const validEvent = {
        title: 'React Conference 2024',
        description: 'Annual React conference',
        overview: 'Learn about the latest in React',
        image: 'https://example.com/image.jpg',
        venue: 'Convention Center',
        location: 'San Francisco, CA',
        date: '2024-06-15',
        time: '09:00',
        mode: 'In-person',
        audience: 'Developers',
        agenda: ['Keynote', 'Workshop', 'Networking'],
        organizer: 'React Community',
        tags: ['react', 'javascript', 'frontend'],
      };

      const event = new Event(validEvent);
      const savedEvent = await event.save();

      expect(savedEvent._id).toBeDefined();
      expect(savedEvent.title).toBe(validEvent.title);
      expect(savedEvent.description).toBe(validEvent.description);
      expect(savedEvent.createdAt).toBeDefined();
      expect(savedEvent.updatedAt).toBeDefined();
    });

    it('should fail validation when title is missing', async () => {
      const eventWithoutTitle = {
        description: 'Conference description',
        overview: 'Conference overview',
        image: 'https://example.com/image.jpg',
        venue: 'Convention Center',
        location: 'San Francisco, CA',
        date: '2024-06-15',
        time: '09:00',
        mode: 'In-person',
        audience: 'Developers',
        agenda: ['Keynote'],
        organizer: 'Organizer Name',
        tags: ['tag1'],
      };

      const event = new Event(eventWithoutTitle);

      await expect(event.save()).rejects.toThrow(/Title is required/);
    });

    it('should fail validation when description is missing', async () => {
      const eventWithoutDescription = {
        title: 'Event Title',
        overview: 'Conference overview',
        image: 'https://example.com/image.jpg',
        venue: 'Convention Center',
        location: 'San Francisco, CA',
        date: '2024-06-15',
        time: '09:00',
        mode: 'In-person',
        audience: 'Developers',
        agenda: ['Keynote'],
        organizer: 'Organizer Name',
        tags: ['tag1'],
      };

      const event = new Event(eventWithoutDescription);

      await expect(event.save()).rejects.toThrow(/Description is required/);
    });

    it('should fail validation when overview is missing', async () => {
      const eventWithoutOverview = {
        title: 'Event Title',
        description: 'Event description',
        image: 'https://example.com/image.jpg',
        venue: 'Convention Center',
        location: 'San Francisco, CA',
        date: '2024-06-15',
        time: '09:00',
        mode: 'In-person',
        audience: 'Developers',
        agenda: ['Keynote'],
        organizer: 'Organizer Name',
        tags: ['tag1'],
      };

      const event = new Event(eventWithoutOverview);

      await expect(event.save()).rejects.toThrow(/Overview is required/);
    });

    it('should fail validation when agenda is empty', async () => {
      const eventWithEmptyAgenda = {
        title: 'Event Title',
        description: 'Event description',
        overview: 'Event overview',
        image: 'https://example.com/image.jpg',
        venue: 'Convention Center',
        location: 'San Francisco, CA',
        date: '2024-06-15',
        time: '09:00',
        mode: 'In-person',
        audience: 'Developers',
        agenda: [],
        organizer: 'Organizer Name',
        tags: ['tag1'],
      };

      const event = new Event(eventWithEmptyAgenda);

      await expect(event.save()).rejects.toThrow(/Agenda must contain at least one item/);
    });

    it('should fail validation when tags array is empty', async () => {
      const eventWithEmptyTags = {
        title: 'Event Title',
        description: 'Event description',
        overview: 'Event overview',
        image: 'https://example.com/image.jpg',
        venue: 'Convention Center',
        location: 'San Francisco, CA',
        date: '2024-06-15',
        time: '09:00',
        mode: 'In-person',
        audience: 'Developers',
        agenda: ['Keynote'],
        organizer: 'Organizer Name',
        tags: [],
      };

      const event = new Event(eventWithEmptyTags);

      await expect(event.save()).rejects.toThrow(/Tags must contain at least one item/);
    });
  });

  describe('Slug Generation', () => {
    it('should auto-generate slug from title on save', async () => {
      const event = new Event({
        title: 'React Conference 2024',
        description: 'Conference description',
        overview: 'Conference overview',
        image: 'https://example.com/image.jpg',
        venue: 'Convention Center',
        location: 'San Francisco, CA',
        date: '2024-06-15',
        time: '09:00',
        mode: 'In-person',
        audience: 'Developers',
        agenda: ['Keynote'],
        organizer: 'Organizer Name',
        tags: ['react'],
      });

      const savedEvent = await event.save();
      expect(savedEvent.slug).toBe('react-conference-2024');
    });

    it('should convert title to lowercase for slug', async () => {
      const event = new Event({
        title: 'UPPERCASE TITLE',
        description: 'Conference description',
        overview: 'Conference overview',
        image: 'https://example.com/image.jpg',
        venue: 'Convention Center',
        location: 'San Francisco, CA',
        date: '2024-06-15',
        time: '09:00',
        mode: 'In-person',
        audience: 'Developers',
        agenda: ['Keynote'],
        organizer: 'Organizer Name',
        tags: ['tag1'],
      });

      const savedEvent = await event.save();
      expect(savedEvent.slug).toBe('uppercase-title');
    });

    it('should replace spaces with hyphens in slug', async () => {
      const event = new Event({
        title: 'Multiple Word Title Here',
        description: 'Conference description',
        overview: 'Conference overview',
        image: 'https://example.com/image.jpg',
        venue: 'Convention Center',
        location: 'San Francisco, CA',
        date: '2024-06-15',
        time: '09:00',
        mode: 'In-person',
        audience: 'Developers',
        agenda: ['Keynote'],
        organizer: 'Organizer Name',
        tags: ['tag1'],
      });

      const savedEvent = await event.save();
      expect(savedEvent.slug).toBe('multiple-word-title-here');
    });

    it('should remove special characters from slug', async () => {
      const event = new Event({
        title: 'Event!@#$%^&*()Title',
        description: 'Conference description',
        overview: 'Conference overview',
        image: 'https://example.com/image.jpg',
        venue: 'Convention Center',
        location: 'San Francisco, CA',
        date: '2024-06-15',
        time: '09:00',
        mode: 'In-person',
        audience: 'Developers',
        agenda: ['Keynote'],
        organizer: 'Organizer Name',
        tags: ['tag1'],
      });

      const savedEvent = await event.save();
      expect(savedEvent.slug).toBe('eventtitle');
    });

    it('should handle multiple consecutive hyphens in slug', async () => {
      const event = new Event({
        title: 'Event    With    Multiple    Spaces',
        description: 'Conference description',
        overview: 'Conference overview',
        image: 'https://example.com/image.jpg',
        venue: 'Convention Center',
        location: 'San Francisco, CA',
        date: '2024-06-15',
        time: '09:00',
        mode: 'In-person',
        audience: 'Developers',
        agenda: ['Keynote'],
        organizer: 'Organizer Name',
        tags: ['tag1'],
      });

      const savedEvent = await event.save();
      expect(savedEvent.slug).toBe('event-with-multiple-spaces');
    });

    it('should remove leading and trailing hyphens from slug', async () => {
      const event = new Event({
        title: '   Event Title   ',
        description: 'Conference description',
        overview: 'Conference overview',
        image: 'https://example.com/image.jpg',
        venue: 'Convention Center',
        location: 'San Francisco, CA',
        date: '2024-06-15',
        time: '09:00',
        mode: 'In-person',
        audience: 'Developers',
        agenda: ['Keynote'],
        organizer: 'Organizer Name',
        tags: ['tag1'],
      });

      const savedEvent = await event.save();
      expect(savedEvent.slug).toBe('event-title');
    });

    it('should regenerate slug when title is modified', async () => {
      const event = new Event({
        title: 'Original Title',
        description: 'Conference description',
        overview: 'Conference overview',
        image: 'https://example.com/image.jpg',
        venue: 'Convention Center',
        location: 'San Francisco, CA',
        date: '2024-06-15',
        time: '09:00',
        mode: 'In-person',
        audience: 'Developers',
        agenda: ['Keynote'],
        organizer: 'Organizer Name',
        tags: ['tag1'],
      });

      const savedEvent = await event.save();
      expect(savedEvent.slug).toBe('original-title');

      savedEvent.title = 'Updated Title';
      const updatedEvent = await savedEvent.save();
      expect(updatedEvent.slug).toBe('updated-title');
    });
  });

  describe('Date Normalization', () => {
    it('should normalize date to ISO format (YYYY-MM-DD)', async () => {
      const event = new Event({
        title: 'Event Title',
        description: 'Conference description',
        overview: 'Conference overview',
        image: 'https://example.com/image.jpg',
        venue: 'Convention Center',
        location: 'San Francisco, CA',
        date: 'June 15, 2024',
        time: '09:00',
        mode: 'In-person',
        audience: 'Developers',
        agenda: ['Keynote'],
        organizer: 'Organizer Name',
        tags: ['tag1'],
      });

      const savedEvent = await event.save();
      expect(savedEvent.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(savedEvent.date).toBe('2024-06-15');
    });

    it('should reject invalid date format', async () => {
      const event = new Event({
        title: 'Event Title',
        description: 'Conference description',
        overview: 'Conference overview',
        image: 'https://example.com/image.jpg',
        venue: 'Convention Center',
        location: 'San Francisco, CA',
        date: 'invalid-date',
        time: '09:00',
        mode: 'In-person',
        audience: 'Developers',
        agenda: ['Keynote'],
        organizer: 'Organizer Name',
        tags: ['tag1'],
      });

      await expect(event.save()).rejects.toThrow(/Date must be a valid date string/);
    });

    it('should handle various date string formats', async () => {
      const testCases = [
        { input: '2024-06-15', expected: '2024-06-15' },
        { input: '2024/06/15', expected: '2024-06-15' },
        { input: 'Dec 25, 2024', expected: '2024-12-25' },
      ];

      for (const testCase of testCases) {
        const event = new Event({
          title: `Event ${testCase.input}`,
          description: 'Conference description',
          overview: 'Conference overview',
          image: 'https://example.com/image.jpg',
          venue: 'Convention Center',
          location: 'San Francisco, CA',
          date: testCase.input,
          time: '09:00',
          mode: 'In-person',
          audience: 'Developers',
          agenda: ['Keynote'],
          organizer: 'Organizer Name',
          tags: ['tag1'],
        });

        const savedEvent = await event.save();
        expect(savedEvent.date).toBe(testCase.expected);
      }
    });
  });

  describe('Time Validation', () => {
    it('should accept valid 24-hour time format (HH:MM)', async () => {
      const validTimes = ['00:00', '09:30', '13:45', '23:59', '9:00'];

      for (const time of validTimes) {
        const event = new Event({
          title: `Event ${time}`,
          description: 'Conference description',
          overview: 'Conference overview',
          image: 'https://example.com/image.jpg',
          venue: 'Convention Center',
          location: 'San Francisco, CA',
          date: '2024-06-15',
          time,
          mode: 'In-person',
          audience: 'Developers',
          agenda: ['Keynote'],
          organizer: 'Organizer Name',
          tags: ['tag1'],
        });

        const savedEvent = await event.save();
        expect(savedEvent.time).toBe(time);
      }
    });

    it('should reject invalid time formats', async () => {
      const invalidTimes = ['25:00', '12:60', '9:5', '9', 'abc', '12:00 PM'];

      for (const time of invalidTimes) {
        const event = new Event({
          title: 'Event Title',
          description: 'Conference description',
          overview: 'Conference overview',
          image: 'https://example.com/image.jpg',
          venue: 'Convention Center',
          location: 'San Francisco, CA',
          date: '2024-06-15',
          time,
          mode: 'In-person',
          audience: 'Developers',
          agenda: ['Keynote'],
          organizer: 'Organizer Name',
          tags: ['tag1'],
        });

        await expect(event.save()).rejects.toThrow(/Time must be in HH:MM format \(24-hour\)/);
      }
    });
  });

  describe('String Trimming', () => {
    it('should trim whitespace from string fields', async () => {
      const event = new Event({
        title: '  Event Title  ',
        description: '  Conference description  ',
        overview: '  Conference overview  ',
        image: '  https://example.com/image.jpg  ',
        venue: '  Convention Center  ',
        location: '  San Francisco, CA  ',
        date: '2024-06-15',
        time: '09:00',
        mode: '  In-person  ',
        audience: '  Developers  ',
        agenda: ['Keynote'],
        organizer: '  Organizer Name  ',
        tags: ['tag1'],
      });

      const savedEvent = await event.save();
      expect(savedEvent.title).toBe('Event Title');
      expect(savedEvent.description).toBe('Conference description');
      expect(savedEvent.venue).toBe('Convention Center');
      expect(savedEvent.organizer).toBe('Organizer Name');
    });
  });

  describe('Timestamps', () => {
    it('should automatically set createdAt and updatedAt timestamps', async () => {
      const event = new Event({
        title: 'Event Title',
        description: 'Conference description',
        overview: 'Conference overview',
        image: 'https://example.com/image.jpg',
        venue: 'Convention Center',
        location: 'San Francisco, CA',
        date: '2024-06-15',
        time: '09:00',
        mode: 'In-person',
        audience: 'Developers',
        agenda: ['Keynote'],
        organizer: 'Organizer Name',
        tags: ['tag1'],
      });

      const savedEvent = await event.save();
      expect(savedEvent.createdAt).toBeInstanceOf(Date);
      expect(savedEvent.updatedAt).toBeInstanceOf(Date);
      expect(savedEvent.createdAt.getTime()).toBeLessThanOrEqual(savedEvent.updatedAt.getTime());
    });

    it('should update updatedAt timestamp on modification', async () => {
      const event = new Event({
        title: 'Event Title',
        description: 'Conference description',
        overview: 'Conference overview',
        image: 'https://example.com/image.jpg',
        venue: 'Convention Center',
        location: 'San Francisco, CA',
        date: '2024-06-15',
        time: '09:00',
        mode: 'In-person',
        audience: 'Developers',
        agenda: ['Keynote'],
        organizer: 'Organizer Name',
        tags: ['tag1'],
      });

      const savedEvent = await event.save();
      const originalUpdatedAt = savedEvent.updatedAt;

      // Wait a bit to ensure timestamp difference
      await new Promise((resolve) => setTimeout(resolve, 10));

      savedEvent.description = 'Updated description';
      const updatedEvent = await savedEvent.save();

      expect(updatedEvent.updatedAt.getTime()).toBeGreaterThan(originalUpdatedAt.getTime());
    });
  });

  describe('Unique Slug Index', () => {
    it('should enforce unique slug constraint', async () => {
      const event1 = new Event({
        title: 'React Conference',
        description: 'Conference description',
        overview: 'Conference overview',
        image: 'https://example.com/image.jpg',
        venue: 'Convention Center',
        location: 'San Francisco, CA',
        date: '2024-06-15',
        time: '09:00',
        mode: 'In-person',
        audience: 'Developers',
        agenda: ['Keynote'],
        organizer: 'Organizer Name',
        tags: ['tag1'],
      });

      await event1.save();

      const event2 = new Event({
        title: 'React Conference',
        description: 'Different description',
        overview: 'Different overview',
        image: 'https://example.com/image2.jpg',
        venue: 'Another Center',
        location: 'New York, NY',
        date: '2024-07-20',
        time: '10:00',
        mode: 'Virtual',
        audience: 'Engineers',
        agenda: ['Panel'],
        organizer: 'Another Organizer',
        tags: ['tag2'],
      });

      await expect(event2.save()).rejects.toThrow(/duplicate key/);
    });
  });

  describe('Edge Cases', () => {
    it('should handle very long strings within limits', async () => {
      const longString = 'a'.repeat(1000);
      const event = new Event({
        title: longString,
        description: longString,
        overview: longString,
        image: 'https://example.com/image.jpg',
        venue: longString,
        location: longString,
        date: '2024-06-15',
        time: '09:00',
        mode: longString,
        audience: longString,
        agenda: ['Keynote'],
        organizer: longString,
        tags: ['tag1'],
      });

      const savedEvent = await event.save();
      expect(savedEvent.title.length).toBe(1000);
    });

    it('should handle multiple agenda items', async () => {
      const event = new Event({
        title: 'Event Title',
        description: 'Conference description',
        overview: 'Conference overview',
        image: 'https://example.com/image.jpg',
        venue: 'Convention Center',
        location: 'San Francisco, CA',
        date: '2024-06-15',
        time: '09:00',
        mode: 'In-person',
        audience: 'Developers',
        agenda: ['Keynote', 'Workshop', 'Panel Discussion', 'Networking', 'Closing'],
        organizer: 'Organizer Name',
        tags: ['tag1'],
      });

      const savedEvent = await event.save();
      expect(savedEvent.agenda).toHaveLength(5);
      expect(savedEvent.agenda).toContain('Workshop');
    });

    it('should handle multiple tags', async () => {
      const event = new Event({
        title: 'Event Title',
        description: 'Conference description',
        overview: 'Conference overview',
        image: 'https://example.com/image.jpg',
        venue: 'Convention Center',
        location: 'San Francisco, CA',
        date: '2024-06-15',
        time: '09:00',
        mode: 'In-person',
        audience: 'Developers',
        agenda: ['Keynote'],
        organizer: 'Organizer Name',
        tags: ['react', 'javascript', 'typescript', 'nextjs', 'frontend'],
      });

      const savedEvent = await event.save();
      expect(savedEvent.tags).toHaveLength(5);
      expect(savedEvent.tags).toContain('typescript');
    });

    it('should handle unicode characters in title', async () => {
      const event = new Event({
        title: 'Event 🎉 Conference 2024 中文',
        description: 'Conference description',
        overview: 'Conference overview',
        image: 'https://example.com/image.jpg',
        venue: 'Convention Center',
        location: 'San Francisco, CA',
        date: '2024-06-15',
        time: '09:00',
        mode: 'In-person',
        audience: 'Developers',
        agenda: ['Keynote'],
        organizer: 'Organizer Name',
        tags: ['tag1'],
      });

      const savedEvent = await event.save();
      expect(savedEvent.title).toContain('🎉');
      expect(savedEvent.slug).toBe('event-conference-2024');
    });
  });

  describe('Query Operations', () => {
    it('should find event by slug', async () => {
      const event = new Event({
        title: 'Searchable Event',
        description: 'Conference description',
        overview: 'Conference overview',
        image: 'https://example.com/image.jpg',
        venue: 'Convention Center',
        location: 'San Francisco, CA',
        date: '2024-06-15',
        time: '09:00',
        mode: 'In-person',
        audience: 'Developers',
        agenda: ['Keynote'],
        organizer: 'Organizer Name',
        tags: ['tag1'],
      });

      await event.save();

      const foundEvent = await Event.findOne({ slug: 'searchable-event' });
      expect(foundEvent).toBeDefined();
      expect(foundEvent?.title).toBe('Searchable Event');
    });

    it('should find events by tags', async () => {
      await Event.create([
        {
          title: 'React Event',
          description: 'React description',
          overview: 'React overview',
          image: 'https://example.com/image.jpg',
          venue: 'Venue 1',
          location: 'Location 1',
          date: '2024-06-15',
          time: '09:00',
          mode: 'In-person',
          audience: 'Developers',
          agenda: ['Keynote'],
          organizer: 'Organizer 1',
          tags: ['react', 'javascript'],
        },
        {
          title: 'Vue Event',
          description: 'Vue description',
          overview: 'Vue overview',
          image: 'https://example.com/image2.jpg',
          venue: 'Venue 2',
          location: 'Location 2',
          date: '2024-07-20',
          time: '10:00',
          mode: 'Virtual',
          audience: 'Developers',
          agenda: ['Workshop'],
          organizer: 'Organizer 2',
          tags: ['vue', 'javascript'],
        },
      ]);

      const jsEvents = await Event.find({ tags: 'javascript' });
      expect(jsEvents).toHaveLength(2);

      const reactEvents = await Event.find({ tags: 'react' });
      expect(reactEvents).toHaveLength(1);
      expect(reactEvents[0].title).toBe('React Event');
    });
  });
});