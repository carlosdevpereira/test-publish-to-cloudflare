const baseCommit = require('@tests/mocks/commit');
const coverageSummaryDecreasedFixture = require('@tests/fixtures/coverage-summary-decreased');
const testStatsFixture = require('@tests/fixtures/test-stats');

module.exports = {
  ...baseCommit,
  getComment: jest.fn(() => ({
    body: JSON.stringify({
      stats: testStatsFixture,
      summary: coverageSummaryDecreasedFixture
    })
  }))
};