// Jest setup file for configuring test environment
// Set test timeout for async operations
jest.setTimeout(30000);

// Mock environment variables
process.env.MONGODB_URI = 'mongodb://localhost:27017/test-db';

// Global test utilities can be added here
global.console = {
  ...console,
  // Suppress console errors in tests unless explicitly needed
  error: jest.fn(),
  warn: jest.fn(),
};