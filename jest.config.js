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
  transformIgnorePatterns: ['<rootDir>/node_modules/'],
  coverageReporters: ['json', 'html'],
  collectCoverageFrom: [
    '**/*.{js}',
    '!**/*.config.js',
    '!**/*.spec.js',
    '!**/node_modules/**',
    '!**/.github/**',
    '!**/.vscode/**',
    '!**/public/**',
    '!**/src/assets/**',
    '!**/src/**',
    '!**/coverage/**',
    '!**/tests/**',
    '!**/dist/**'
  ],
  coverageThreshold: {
    global: {
      statements: 15,
      branches: 15,
      functions: 15,
      lines: 15
    }
  }
};