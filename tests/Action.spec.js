const mockRepository = require('@tests/mocks/repository');
const mockCommit = require('@tests/mocks/commit');
const mockCloudflare = require('@tests/mocks/cloudflare');

jest.mock('../src/Repository', () =>  jest.fn(() => mockRepository));
jest.mock('../src/Commit', () => jest.fn(() => mockCommit));
jest.mock('../src/Cloudflare', () => jest.fn(() => mockCloudflare));

const Repository = require('../src/Repository');
const Commit = require('../src/Commit');

describe('Action', () => {
  const GithubAction = require('../src/Action');
  let action = new GithubAction({
    payload: {
      repository: {
        name: 'my-repository',
        owner: { login: 'carlosdevpereira' }
      }
    }
  },
  {
    testing: {
      framework: 'jest'
    },
    github: {
      token: '1234',
      branch: 'main'
    },
    cloudflare: {
      projectName: 'my-project',
      apiToken: '1234',
      accountId: '1',
      baseUrl: 'project-base-url.pages.dev'
    }
  });

  it('creates an instance of a repository', () => {
    expect(Repository).toHaveBeenCalled();
  });

  it('creates an instance of a repository', () => {
    expect(Commit).toHaveBeenCalled();
  });

  describe('Runs unit tests', () => {
    it('runs the unit tests from the test framework', async () => {
      await action.runTests();

      expect(mockRepository.testFramework.runTests).toHaveBeenCalled();
    });
  });

  describe('Publish results to cloudflare', () => {
    it('tries to publish results from specific commit to cloudflare', async () => {
      await action.publishToCloudflare();

      expect(mockCloudflare.publish).toHaveBeenCalledWith('1234');
    });
  });
});