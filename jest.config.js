module.exports = {
  testEnvironment: 'node',
  moduleFileExtensions: ['js', 'jsx', 'json'],
  transform: {},
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@tests/(.*)$': '<rootDir>/tests/$1'
  },
  testMatch: [
    '**/tests/**/*.spec.(js|jsx)|**/__tests__/*.(js|jsx)'
  ],
  transformIgnorePatterns: ['/node_modules/'],
  coverageReporters: ['json-summary', 'html'],
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
    '!**/dist/**'
  ],
  coverageThreshold: {
    global: {
      statements: 0,
      branches: 0,
      functions: 0,
      lines: 0
    }
  }
};