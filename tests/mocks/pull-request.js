const mockRepository = require('@tests/mocks/repository');
const mockCommit = require('@tests/mocks/commit');

module.exports = {
  number: '1',
  repository: mockRepository,
  baseBranchName: 'main',
  baseCommit: mockCommit,
  headBranchName: 'development',
  headCommit: mockCommit,
  getResults: jest.fn(),
  getComments: jest.fn(),
  buildComment: jest.fn(),
  addComment: jest.fn()
};