const mockCloudflare = require('@tests/mocks/cloudflare');
const mockCommit = require('@tests/mocks/commit');
const mockRepository = require('@tests/mocks/repository');

jest.mock('../src/Repository', () => {
  return jest.fn(() => {
    return mockRepository;
  });
});
jest.mock('../src/Commit', () => {
  return jest.fn(() => {
    return mockCommit;
  });
});
jest.mock('../src/Cloudflare', () => {
  return jest.fn(() => {
    return mockCloudflare;
  });
});

const Commit = require('../src/Commit');
const Repository = require('../src/Repository');

describe('Action', () => {
  const GithubAction = require('../src/Action');
  const action = new GithubAction(
    {
      payload: {
        repository: {
          name: 'my-repository',
          owner: {
            login: 'carlosdevpereira',
          },
        },
      },
    },
    {
      cloudflare: {
        accountId: '1',
        apiToken: '1234',
        baseUrl: 'project-base-url.pages.dev',
        projectName: 'my-project',
      },
      github: {
        branch: 'main',
        token: '1234',
      },
      testing: {
        framework: 'jest',
      },
    }
  );

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