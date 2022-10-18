const buildPullRequestCommentMock = jest.fn(() => 'pull-request-comment');
const addPullRequestCommentMock = jest.fn();

module.exports = {
  name: 'repository-name',
  owner: 'carlosdevpereira',

  testFramework: {
    runTests: jest.fn(() => ({
      stats: require('@tests/fixtures/test-stats'),
      summary: require('@tests/fixtures/coverage-summary')
    })),
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