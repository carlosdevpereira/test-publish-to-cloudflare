const testRunStatsFixture = require('@tests/fixtures/test-stats');
const coverageSummaryFixture = require('@tests/fixtures/coverage-summary');

module.exports = {
  name: 'jest',
  runTests: jest.fn(() => {
    return {
      stats: JSON.parse(testRunStatsFixture),
      summary: JSON.parse(coverageSummaryFixture)
    };
  })
};