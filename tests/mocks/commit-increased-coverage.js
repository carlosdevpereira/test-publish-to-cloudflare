const baseCommit = require('@tests/mocks/commit');
const testResults = require('@tests/fixtures/test-results-schema');

module.exports = {
  ...baseCommit,

  getComment: jest.fn(() => ({
    body: JSON.stringify({
      ...testResults,
      stats: {
        ...testResults.stats,
        endTime: 1665768075668
      },
      coverage: {
        ...testResults.coverage,
        percentage: 100,
      }
    })
  }))
};