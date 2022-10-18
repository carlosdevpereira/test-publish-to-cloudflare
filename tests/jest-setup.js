// Setup global mocks
const mockGithubActionsCore = require('@tests/mocks/github-actions-core');
jest.mock('@actions/core', () => mockGithubActionsCore);