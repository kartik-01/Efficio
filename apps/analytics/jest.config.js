const path = require('path');
const baseConfig = require('../../jest.config.base');

module.exports = {
  ...baseConfig,
  displayName: 'analytics',
  rootDir: path.resolve(__dirname, '../../'),
  roots: ['<rootDir>/apps/analytics'],
};

