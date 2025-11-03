const path = require('path');
const baseConfig = require('../../jest.config.base');

module.exports = {
  ...baseConfig,
  displayName: 'dashboard-app-shell',
  rootDir: path.resolve(__dirname, '../../'),
  roots: ['<rootDir>/apps/dashboard-app-shell'],
  // Override collectCoverageFrom to use the correct path relative to rootDir
  collectCoverageFrom: [
    'apps/dashboard-app-shell/src/**/*.{ts,tsx}',
    '!apps/dashboard-app-shell/src/**/*.d.ts',
    '!apps/dashboard-app-shell/src/**/__tests__/**',
    '!apps/dashboard-app-shell/src/**/*.test.{ts,tsx}',
    '!apps/dashboard-app-shell/src/**/*.spec.{ts,tsx}',
  ],
  // Generate coverage in app-specific directory
  coverageDirectory: '<rootDir>/coverage/apps/dashboard-app-shell',
  // Mock Module Federation remotes for testing
  moduleNameMapper: {
    ...baseConfig.moduleNameMapper,
    '^task_manager/Module$': '<rootDir>/apps/dashboard-app-shell/src/__mocks__/TaskManager.tsx',
    '^time_tracker/Module$': '<rootDir>/apps/dashboard-app-shell/src/__mocks__/TimeTracker.tsx',
    '^analytics/Module$': '<rootDir>/apps/dashboard-app-shell/src/__mocks__/Analytics.tsx',
  },
};

