// Setup global mocks
const mockGithubActionsCore = require('@tests/mocks/github-actions-core');
jest.mock('@actions/core', () => mockGithubActionsCore);

const githubActionContextFixture = require('@tests/fixtures/github-action-context');
jest.mock('@actions/github', () => ({
  context: githubActionContextFixture,
  getOctokit: jest.fn()
}));