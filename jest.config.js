module.exports = {
  // Use projects to run tests across the monorepo
  projects: [
    '<rootDir>/apps/dashboard-app-shell',
    '<rootDir>/apps/task-manager',
    '<rootDir>/apps/time-tracker',
    '<rootDir>/apps/analytics',
    '<rootDir>/packages/ui',
    '<rootDir>/packages/theme',
  ],
  
  // Global coverage settings
  collectCoverageFrom: [
    '**/src/**/*.{ts,tsx}',
    '!**/src/**/*.d.ts',
    '!**/src/**/*.stories.{ts,tsx}',
    '!**/src/**/__tests__/**',
    '!**/src/**/*.test.{ts,tsx}',
    '!**/src/**/*.spec.{ts,tsx}',
  ],
  
  coveragePathIgnorePatterns: [
    '/node_modules/',
    '/dist/',
    '/build/',
    '/.next/',
    '/coverage/',
  ],
  
  // Test match patterns
  testMatch: [
    '**/__tests__/**/*.[jt]s?(x)',
    '**/?(*.)+(spec|test).[jt]s?(x)',
  ],
  
  // Coverage report settings
  coverageReporters: ['text', 'lcov', 'html'],
  
  // Coverage thresholds 
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
  },
  
  // Ignore patterns
  testPathIgnorePatterns: [
    '/node_modules/',
    '/dist/',
    '/build/',
  ],
};

