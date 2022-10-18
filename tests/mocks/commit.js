const commit = require('@tests/fixtures/github-action-context');
const testStatsFixture = require('@tests/fixtures/test-stats');
const coverageSummaryFixture = require('@tests/fixtures/coverage-summary');

module.exports = {
  hash: commit.sha,
  shortHash: jest.fn(() => {
    return commit.sha.slice(0, 7);
  }),
  addComment: jest.fn(),
  getComment: jest.fn(() => ({
    body: JSON.stringify({
      stats: testStatsFixture,
      summary: coverageSummaryFixture
    })
  }))
};