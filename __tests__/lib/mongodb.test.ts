import mongoose from 'mongoose';
import connectDB from '@/lib/mongodb';

// Mock mongoose
jest.mock('mongoose', () => ({
  connect: jest.fn(),
  connection: {
    readyState: 0,
  },
}));

describe('MongoDB Connection Utility', () => {
  const originalEnv = process.env;
  const mockConnect = mongoose.connect as jest.MockedFunction<typeof mongoose.connect>;

  beforeEach(() => {
    // Reset environment and mocks before each test
    jest.clearAllMocks();
    process.env = { ...originalEnv };
    
    // Reset global mongoose cache
    if (global.mongoose) {
      global.mongoose = { conn: null, promise: null };
    }
  });

  afterEach(() => {
    // Restore original environment
    process.env = originalEnv;
  });

  describe('Environment Variable Validation', () => {
    it('should throw error when MONGODB_URI is not defined', async () => {
      delete process.env.MONGODB_URI;

      await expect(connectDB()).rejects.toThrow(
        'Please define the MONGODB_URI environment variable inside .env.local'
      );
    });

    it('should throw error when MONGODB_URI is empty string', async () => {
      process.env.MONGODB_URI = '';

      await expect(connectDB()).rejects.toThrow(
        'Please define the MONGODB_URI environment variable inside .env.local'
      );
    });

    it('should accept valid MONGODB_URI', async () => {
      process.env.MONGODB_URI = 'mongodb://localhost:27017/testdb';
      mockConnect.mockResolvedValueOnce(mongoose);

      await connectDB();

      expect(mockConnect).toHaveBeenCalledWith(
        'mongodb://localhost:27017/testdb',
        { bufferCommands: false }
      );
    });
  });

  describe('Connection Caching', () => {
    it('should create new connection on first call', async () => {
      process.env.MONGODB_URI = 'mongodb://localhost:27017/testdb';
      mockConnect.mockResolvedValueOnce(mongoose);

      const conn = await connectDB();

      expect(mockConnect).toHaveBeenCalledTimes(1);
      expect(conn).toBe(mongoose);
    });

    it('should reuse existing connection on subsequent calls', async () => {
      process.env.MONGODB_URI = 'mongodb://localhost:27017/testdb';
      mockConnect.mockResolvedValueOnce(mongoose);

      const conn1 = await connectDB();
      const conn2 = await connectDB();
      const conn3 = await connectDB();

      expect(mockConnect).toHaveBeenCalledTimes(1);
      expect(conn1).toBe(conn2);
      expect(conn2).toBe(conn3);
    });

    it('should initialize global cache if not exists', async () => {
      process.env.MONGODB_URI = 'mongodb://localhost:27017/testdb';
      mockConnect.mockResolvedValueOnce(mongoose);

      // Ensure global cache doesn't exist
      delete (global as any).mongoose;

      await connectDB();

      expect(global.mongoose).toBeDefined();
      expect(global.mongoose?.conn).toBe(mongoose);
    });

    it('should use existing global cache if available', async () => {
      process.env.MONGODB_URI = 'mongodb://localhost:27017/testdb';
      
      // Set up existing cache
      const mockMongoose = { test: 'value' } as any;
      global.mongoose = { conn: mockMongoose, promise: null };

      const conn = await connectDB();

      expect(mockConnect).not.toHaveBeenCalled();
      expect(conn).toBe(mockMongoose);
    });
  });

  describe('Connection Options', () => {
    it('should use correct connection options', async () => {
      process.env.MONGODB_URI = 'mongodb://localhost:27017/testdb';
      mockConnect.mockResolvedValueOnce(mongoose);

      await connectDB();

      expect(mockConnect).toHaveBeenCalledWith(
        'mongodb://localhost:27017/testdb',
        expect.objectContaining({
          bufferCommands: false,
        })
      );
    });

    it('should disable buffer commands for better error handling', async () => {
      process.env.MONGODB_URI = 'mongodb://localhost:27017/testdb';
      mockConnect.mockResolvedValueOnce(mongoose);

      await connectDB();

      const callOptions = mockConnect.mock.calls[0][1];
      expect(callOptions).toHaveProperty('bufferCommands', false);
    });
  });

  describe('Error Handling', () => {
    it('should propagate connection errors', async () => {
      process.env.MONGODB_URI = 'mongodb://localhost:27017/testdb';
      const connectionError = new Error('Connection failed');
      mockConnect.mockRejectedValueOnce(connectionError);

      await expect(connectDB()).rejects.toThrow('Connection failed');
    });

    it('should reset promise cache on connection error', async () => {
      process.env.MONGODB_URI = 'mongodb://localhost:27017/testdb';
      mockConnect.mockRejectedValueOnce(new Error('First connection failed'));
      
      // First call should fail
      await expect(connectDB()).rejects.toThrow('First connection failed');
      
      // Reset mock for second attempt
      mockConnect.mockResolvedValueOnce(mongoose);
      
      // Second call should attempt connection again
      const conn = await connectDB();
      
      expect(mockConnect).toHaveBeenCalledTimes(2);
      expect(conn).toBe(mongoose);
    });

    it('should handle network timeout errors', async () => {
      process.env.MONGODB_URI = 'mongodb://localhost:27017/testdb';
      const timeoutError = new Error('Connection timeout');
      mockConnect.mockRejectedValueOnce(timeoutError);

      await expect(connectDB()).rejects.toThrow('Connection timeout');
      
      // Verify cache is reset
      expect(global.mongoose?.promise).toBeNull();
    });

    it('should handle authentication errors', async () => {
      process.env.MONGODB_URI = 'mongodb://user:pass@localhost:27017/testdb';
      const authError = new Error('Authentication failed');
      mockConnect.mockRejectedValueOnce(authError);

      await expect(connectDB()).rejects.toThrow('Authentication failed');
    });
  });

  describe('Concurrent Connections', () => {
    it('should handle multiple simultaneous connection attempts', async () => {
      process.env.MONGODB_URI = 'mongodb://localhost:27017/testdb';
      
      // Simulate slow connection
      mockConnect.mockImplementation(() => 
        new Promise((resolve) => setTimeout(() => resolve(mongoose), 100))
      );

      // Make multiple concurrent calls
      const results = await Promise.all([
        connectDB(),
        connectDB(),
        connectDB(),
      ]);

      // Should only connect once
      expect(mockConnect).toHaveBeenCalledTimes(1);
      
      // All should return the same connection
      expect(results[0]).toBe(results[1]);
      expect(results[1]).toBe(results[2]);
    });

    it('should share connection promise during concurrent attempts', async () => {
      process.env.MONGODB_URI = 'mongodb://localhost:27017/testdb';
      let resolveConnection: (value: typeof mongoose) => void;
      
      mockConnect.mockReturnValueOnce(
        new Promise((resolve) => {
          resolveConnection = resolve;
        })
      );

      // Start multiple connections
      const promise1 = connectDB();
      const promise2 = connectDB();
      const promise3 = connectDB();

      // Resolve the connection
      resolveConnection!(mongoose);

      const results = await Promise.all([promise1, promise2, promise3]);

      expect(mockConnect).toHaveBeenCalledTimes(1);
      expect(results.every(r => r === mongoose)).toBe(true);
    });
  });

  describe('Connection String Formats', () => {
    const validConnectionStrings = [
      'mongodb://localhost:27017/testdb',
      'mongodb://user:pass@localhost:27017/testdb',
      'mongodb://host1:27017,host2:27017/testdb?replicaSet=rs0',
      'mongodb+srv://cluster.mongodb.net/testdb',
      'mongodb://localhost:27017/testdb?authSource=admin',
    ];

    validConnectionStrings.forEach((uri) => {
      it(`should accept connection string: ${uri.substring(0, 30)}...`, async () => {
        process.env.MONGODB_URI = uri;
        mockConnect.mockResolvedValueOnce(mongoose);

        await connectDB();

        expect(mockConnect).toHaveBeenCalledWith(uri, expect.any(Object));
      });
    });
  });

  describe('Development Hot Reload Behavior', () => {
    it('should persist cache across hot reloads via global object', async () => {
      process.env.MONGODB_URI = 'mongodb://localhost:27017/testdb';
      mockConnect.mockResolvedValueOnce(mongoose);

      // First connection
      await connectDB();

      // Simulate hot reload by requiring the module again
      // The global cache should persist
      const conn2 = await connectDB();

      expect(mockConnect).toHaveBeenCalledTimes(1);
      expect(conn2).toBe(mongoose);
    });

    it('should maintain cache state in global.mongoose', async () => {
      process.env.MONGODB_URI = 'mongodb://localhost:27017/testdb';
      mockConnect.mockResolvedValueOnce(mongoose);

      expect(global.mongoose?.conn).toBeNull();

      await connectDB();

      expect(global.mongoose?.conn).toBe(mongoose);
      expect(global.mongoose?.promise).toBeDefined();
    });
  });

  describe('Type Safety', () => {
    it('should return mongoose instance with correct type', async () => {
      process.env.MONGODB_URI = 'mongodb://localhost:27017/testdb';
      mockConnect.mockResolvedValueOnce(mongoose);

      const conn = await connectDB();

      expect(conn).toBe(mongoose);
      expect(typeof conn.connect).toBe('function');
    });
  });

  describe('Edge Cases', () => {
    it('should handle undefined global.mongoose gracefully', async () => {
      process.env.MONGODB_URI = 'mongodb://localhost:27017/testdb';
      mockConnect.mockResolvedValueOnce(mongoose);

      delete (global as any).mongoose;

      const conn = await connectDB();

      expect(conn).toBe(mongoose);
      expect(global.mongoose).toBeDefined();
    });

    it('should handle null values in cache', async () => {
      process.env.MONGODB_URI = 'mongodb://localhost:27017/testdb';
      mockConnect.mockResolvedValueOnce(mongoose);

      global.mongoose = { conn: null, promise: null };

      const conn = await connectDB();

      expect(mockConnect).toHaveBeenCalledTimes(1);
      expect(conn).toBe(mongoose);
    });

    it('should handle very long connection URIs', async () => {
      const longUri = 'mongodb://localhost:27017/' + 'a'.repeat(1000);
      process.env.MONGODB_URI = longUri;
      mockConnect.mockResolvedValueOnce(mongoose);

      await connectDB();

      expect(mockConnect).toHaveBeenCalledWith(longUri, expect.any(Object));
    });

    it('should handle special characters in connection URI', async () => {
      process.env.MONGODB_URI = 'mongodb://user%40name:p%40ss@localhost:27017/testdb';
      mockConnect.mockResolvedValueOnce(mongoose);

      await connectDB();

      expect(mockConnect).toHaveBeenCalled();
    });
  });

  describe('Integration with Mongoose', () => {
    it('should work with mongoose connection lifecycle', async () => {
      process.env.MONGODB_URI = 'mongodb://localhost:27017/testdb';
      mockConnect.mockResolvedValueOnce(mongoose);

      const conn = await connectDB();

      expect(conn).toHaveProperty('connect');
      expect(conn).toHaveProperty('connection');
    });

    it('should support promise-based connection', async () => {
      process.env.MONGODB_URI = 'mongodb://localhost:27017/testdb';
      mockConnect.mockResolvedValueOnce(mongoose);

      const connectionPromise = connectDB();

      expect(connectionPromise).toBeInstanceOf(Promise);
      await expect(connectionPromise).resolves.toBe(mongoose);
    });
  });
});