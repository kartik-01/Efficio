const path = require('path');
const baseConfig = require('../../jest.config.base');

module.exports = {
  ...baseConfig,
  displayName: 'theme',
  rootDir: path.resolve(__dirname, '../../'),
  roots: ['<rootDir>/packages/theme'],
};

