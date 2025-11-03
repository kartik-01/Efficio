const path = require('path');
const baseConfig = require('../../jest.config.base');

module.exports = {
  ...baseConfig,
  displayName: 'task-manager',
  rootDir: path.resolve(__dirname, '../../'),
  roots: ['<rootDir>/apps/task-manager'],
  transformIgnorePatterns: [
    'node_modules/(?!(react-dnd|dnd-core|@react-dnd|framer-motion|react-dnd-html5-backend)/)',
  ],
  transform: {
    ...baseConfig.transform,
    '^.+\\.(js|jsx|mjs|cjs)$': ['babel-jest', {
      presets: [
        ["@babel/preset-env", { targets: "defaults" }],
        ["@babel/preset-react", { runtime: "automatic" }],
      ],
    }],
  },
};

