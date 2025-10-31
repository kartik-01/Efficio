const path = require('path');
const baseConfig = require('../../jest.config.base');

module.exports = {
  ...baseConfig,
  displayName: 'task-manager',
  rootDir: path.resolve(__dirname, '../../'),
  roots: ['<rootDir>/apps/task-manager'],
};

