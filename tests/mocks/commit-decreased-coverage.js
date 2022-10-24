const baseCommit = require('@tests/mocks/commit');
const testResults = require('@tests/fixtures/test-results-schema');

module.exports = {
  ...baseCommit,

  getComment: jest.fn(() => ({
    body: JSON.stringify({
      ...testResults,
      coverage: {
        ...testResults.coverage,
        percentage: 5
      }
    })
  }))
};