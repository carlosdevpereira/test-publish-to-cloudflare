const pullRequestsFixture = require('@tests/fixtures/pull-requests');
const testStatsFixture = require('@tests/fixtures/test-stats');
const coverageSummaryFixture = require('@tests/fixtures/coverage-summary');

module.exports = {
  rest: {
    search: {
      issuesAndPullRequests: jest.fn(() => {
        return {
          data: {
            items: pullRequestsFixture
          }
        };
      })
    },
    pulls: {
      get: jest.fn(() => {
        return {
          data: pullRequestsFixture[0]
        };
      })
    },
    repos: {
      listCommentsForCommit: jest.fn(() => {
        return {
          data: [
            {
              id: 1,
              body: JSON.stringify({ stats: testStatsFixture, summary: coverageSummaryFixture })
            }
          ]
        };
      }),
      updateCommitComment: jest.fn(),
      createCommitComment: jest.fn()
    },
    issues: {
      listComments: jest.fn(() => {
        return {
          data: [
            {
              id: 1,
              user: {
                id: 41_898_282
              },
              body: JSON.stringify({ stats: testStatsFixture, summary: coverageSummaryFixture })
            }
          ]
        };
      }),
      updateComment: jest.fn(),
      createComment: jest.fn()
    }
  }
};