module.exports = {
  testFramework: {
    runTests: jest.fn(() => ({
      stats: require('@tests/fixtures/test-stats.json'),
      summary: require('@tests/fixtures/coverage-summary.json')
    })),
  },
  addCommitComment: jest.fn()
};