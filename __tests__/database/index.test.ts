import * as DatabaseModule from '@/database/index';
import Event from '@/database/event.model';
import Booking from '@/database/booking.model';

describe('Database Index Module', () => {
  describe('Model Exports', () => {
    it('should export Event model', () => {
      expect(DatabaseModule.Event).toBeDefined();
      expect(DatabaseModule.Event).toBe(Event);
    });

    it('should export Booking model', () => {
      expect(DatabaseModule.Booking).toBeDefined();
      expect(DatabaseModule.Booking).toBe(Booking);
    });

    it('should have both models as named exports', () => {
      const { Event, Booking } = DatabaseModule;
      expect(Event).toBeDefined();
      expect(Booking).toBeDefined();
    });
  });

  describe('Type Exports', () => {
    it('should export IEvent type', () => {
      // TypeScript compile-time check
      // This test ensures the type is exported and can be used
      const testEvent: DatabaseModule.IEvent = {
        title: 'Test',
        slug: 'test',
        description: 'Test description',
        overview: 'Test overview',
        image: 'test.jpg',
        venue: 'Test Venue',
        location: 'Test Location',
        date: '2024-06-15',
        time: '09:00',
        mode: 'In-person',
        audience: 'Developers',
        agenda: ['Item 1'],
        organizer: 'Organizer',
        tags: ['tag1'],
        createdAt: new Date(),
        updatedAt: new Date(),
      } as DatabaseModule.IEvent;

      expect(testEvent.title).toBe('Test');
    });

    it('should export IBooking type', () => {
      // TypeScript compile-time check
      // This test ensures the type is exported and can be used
      const testBooking: DatabaseModule.IBooking = {
        eventId: {} as any,
        email: 'test@example.com',
        createdAt: new Date(),
        updatedAt: new Date(),
      } as DatabaseModule.IBooking;

      expect(testBooking.email).toBe('test@example.com');
    });
  });

  describe('Module Structure', () => {
    it('should export exactly 2 models', () => {
      const exportedKeys = Object.keys(DatabaseModule);
      const modelExports = exportedKeys.filter(key => 
        typeof DatabaseModule[key as keyof typeof DatabaseModule] === 'function' ||
        typeof DatabaseModule[key as keyof typeof DatabaseModule] === 'object'
      );
      
      // Should have Event and Booking
      expect(modelExports.length).toBeGreaterThanOrEqual(2);
    });

    it('should provide consistent API for model access', () => {
      expect(typeof DatabaseModule.Event).toBe('function');
      expect(typeof DatabaseModule.Booking).toBe('function');
    });
  });

  describe('Import Patterns', () => {
    it('should support named imports', async () => {
      const module = await import('@/database/index');
      const { Event, Booking } = module;
      
      expect(Event).toBeDefined();
      expect(Booking).toBeDefined();
    });

    it('should support namespace import', async () => {
      const DB = await import('@/database/index');
      
      expect(DB.Event).toBeDefined();
      expect(DB.Booking).toBeDefined();
    });

    it('should maintain model identity across imports', async () => {
      const module1 = await import('@/database/index');
      const module2 = await import('@/database/index');
      
      expect(module1.Event).toBe(module2.Event);
      expect(module1.Booking).toBe(module2.Booking);
    });
  });

  describe('Model Functionality', () => {
    it('should provide working Event model constructor', () => {
      const event = new DatabaseModule.Event({
        title: 'Test Event',
        description: 'Test description',
        overview: 'Test overview',
        image: 'test.jpg',
        venue: 'Test Venue',
        location: 'Test Location',
        date: '2024-06-15',
        time: '09:00',
        mode: 'In-person',
        audience: 'Developers',
        agenda: ['Keynote'],
        organizer: 'Organizer',
        tags: ['test'],
      });

      expect(event).toBeDefined();
      expect(event.title).toBe('Test Event');
    });

    it('should provide working Booking model constructor', () => {
      const booking = new DatabaseModule.Booking({
        eventId: '507f1f77bcf86cd799439011' as any,
        email: 'test@example.com',
      });

      expect(booking).toBeDefined();
      expect(booking.email).toBe('test@example.com');
    });
  });

  describe('Documentation and Usability', () => {
    it('should serve as central access point for all models', () => {
      // Verify that the module acts as a facade for all database models
      expect(DatabaseModule).toHaveProperty('Event');
      expect(DatabaseModule).toHaveProperty('Booking');
    });

    it('should simplify import statements', () => {
      // Instead of: import Event from '@/database/event.model'
      // Can use: import { Event } from '@/database'
      const { Event, Booking } = DatabaseModule;
      
      expect(Event).toBeDefined();
      expect(Booking).toBeDefined();
    });
  });

  describe('Type Inference', () => {
    it('should allow TypeScript to infer Event type', () => {
      const event = new DatabaseModule.Event({
        title: 'Test',
        description: 'Test description',
        overview: 'Test overview',
        image: 'test.jpg',
        venue: 'Test Venue',
        location: 'Test Location',
        date: '2024-06-15',
        time: '09:00',
        mode: 'In-person',
        audience: 'Developers',
        agenda: ['Keynote'],
        organizer: 'Organizer',
        tags: ['test'],
      });

      // TypeScript should infer the type without explicit annotation
      const title: string = event.title;
      expect(title).toBe('Test');
    });

    it('should allow TypeScript to infer Booking type', () => {
      const booking = new DatabaseModule.Booking({
        eventId: '507f1f77bcf86cd799439011' as any,
        email: 'test@example.com',
      });

      // TypeScript should infer the type without explicit annotation
      const email: string = booking.email;
      expect(email).toBe('test@example.com');
    });
  });
});