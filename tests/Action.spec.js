const repository = {
  testFramework: {
    runTests: jest.fn()
  }
};
const commit = {
  shortHash: () => '1234'
};
const cloudflare = {
  publish: jest.fn()
};
jest.mock('../src/Repository', () =>  jest.fn(() => {
  return repository;
}));
jest.mock('../src/Commit', () => jest.fn(() => {
  return commit;
}));
jest.mock('../src/Cloudflare', () => jest.fn(() => {
  return cloudflare;
}));

const Repository = require('../src/Repository');
const Commit = require('../src/Commit');
const Cloudflare = require('../src/Cloudflare');

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

      expect(repository.testFramework.runTests).toHaveBeenCalled();
    });
  });

  describe('Publish results to cloudflare', () => {
    it('tries to publish results from specific commit to cloudflare', async () => {
      await action.publishToCloudflare();

      expect(cloudflare.publish).toHaveBeenCalledWith('1234');
    });
  });
});