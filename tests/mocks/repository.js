const buildPullRequestCommentMock = jest.fn(() => 'pull-request-comment');
const addPullRequestCommentMock = jest.fn();

module.exports = {
  name: 'repository-name',
  owner: 'carlosdevpereira',

  testFramework: {
    runTests: jest.fn(() => (require('@tests/fixtures/test-results-schema'))),
  },

  addCommitComment: jest.fn(),

  getPullRequests: jest.fn(() => {
    return require('@tests/fixtures/pull-requests').map((prData) => ({
      ...prData,
      buildComment: buildPullRequestCommentMock,
      addComment: addPullRequestCommentMock
    }));
  }),

  buildPullRequestCommentMock,

  addPullRequestCommentMock
};