module.exports = {
  collectCoverageFrom: [
    'src/**/*.{js,jsx,ts,tsx}',
    '!**/*.config.js',
    '!**/*.spec.js',
    '!**/node_modules/**',
    '!**/.github/**',
    '!**/.vscode/**',
    '!**/public/**',
    '!**/coverage/**',
    '!**/tests/**',
    '!**/dist/**',
  ],
  coverageReporters: ['json-summary', 'html'],
  coverageThreshold: {
    global: {
      branches: 0,
      functions: 0,
      lines: 0,
      statements: 0,
    },
  },
  moduleFileExtensions: ['js', 'jsx', 'json'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@tests/(.*)$': '<rootDir>/tests/$1',
  },
  testEnvironment: 'node',
  testMatch: ['**/tests/**/*.spec.(js|jsx)|**/__tests__/*.(js|jsx)'],
  transform: {},
  transformIgnorePatterns: ['/node_modules/'],
  setupFilesAfterEnv: ['<rootDir>/tests/jest-setup.js'],
};