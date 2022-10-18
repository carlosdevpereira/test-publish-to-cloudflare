const baseCommit = require('@tests/mocks/commit');
const coverageSummaryIncreasedFixture = require('@tests/fixtures/coverage-summary-increased');
const testStatsSlowFixture = require('@tests/fixtures/test-stats-slow');

module.exports = {
  ...baseCommit,

  getComment: jest.fn(() => ({
    body: JSON.stringify({
      stats: testStatsSlowFixture,
      summary: coverageSummaryIncreasedFixture
    })
  }))
};