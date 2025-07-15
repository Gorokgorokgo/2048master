// Jest setup file for global test configuration

// Global test timeout
jest.setTimeout(10000);

// Mock console methods if needed
global.console = {
  ...console,
  // Suppress console.log in tests unless debugging
  log: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};

// Add custom matchers or global test utilities here
expect.extend({
  // Custom matchers can be added here
});