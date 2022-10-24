const commit = require('@tests/fixtures/github-action-context');
const testResults = require('@tests/fixtures/test-results-schema');

module.exports = {
  hash: commit.sha,
  shortHash: jest.fn(() => {
    return commit.sha.slice(0, 7);
  }),
  addComment: jest.fn(),
  getComment: jest.fn(() => ({
    body: JSON.stringify(testResults)
  }))
};