const path = require('path');
const baseConfig = require('../../jest.config.base');

module.exports = {
  ...baseConfig,
  displayName: 'time-tracker',
  rootDir: path.resolve(__dirname, '../../'),
  roots: ['<rootDir>/apps/time-tracker'],
};

