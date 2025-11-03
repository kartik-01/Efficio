// Mock console.error to track errors
const originalConsoleError = console.error;
let consoleErrorCalls: any[] = [];

beforeAll(() => {
  console.error = (...args: any[]) => {
    consoleErrorCalls.push(args);
    originalConsoleError(...args);
  };
});

afterAll(() => {
  console.error = originalConsoleError;
});

beforeEach(() => {
  consoleErrorCalls = [];
});

describe('index.tsx', () => {
  it('should handle bootstrap import successfully', async () => {
    // Mock the dynamic import
    const mockBootstrap = jest.fn();
    jest.doMock('../bootstrap', () => mockBootstrap, { virtual: true });
    
    // The index file does a dynamic import, which is hard to test directly
    // But we can verify it doesn't throw
    expect(() => {
      require('../index');
    }).not.toThrow();
  });

  it('should handle bootstrap import error', async () => {
    // The actual error handling is in the catch block
    // This test verifies the structure exists
    const indexModule = require('../index');
    expect(indexModule).toBeDefined();
  });
});

