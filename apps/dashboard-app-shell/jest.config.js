const path = require('path');
const baseConfig = require('../../jest.config.base');

module.exports = {
  ...baseConfig,
  displayName: 'dashboard-app-shell',
  rootDir: path.resolve(__dirname, '../../'),
  roots: ['<rootDir>/apps/dashboard-app-shell'],
  // Mock Module Federation remotes for testing
  moduleNameMapper: {
    ...baseConfig.moduleNameMapper,
    '^task_manager/Module$': '<rootDir>/apps/dashboard-app-shell/src/__mocks__/TaskManager.tsx',
    '^time_tracker/Module$': '<rootDir>/apps/dashboard-app-shell/src/__mocks__/TimeTracker.tsx',
    '^analytics/Module$': '<rootDir>/apps/dashboard-app-shell/src/__mocks__/Analytics.tsx',
  },
};

