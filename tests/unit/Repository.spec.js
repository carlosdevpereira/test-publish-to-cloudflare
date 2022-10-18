const mockGithubApi = require('@tests/mocks/github-api');
const mockTestingFramework = require('@tests/mocks/testing-framework');
const mockPullRequest = require('@tests/mocks/pull-request');
const mockRepositoryConfig = {
  testing: {
    framework: 'jest'
  },
  github: {
    branch: 'main'
  }
};

// Mock dependencies
jest.mock('@/Framework', () => jest.fn(() => mockTestingFramework));
jest.mock('@/PullRequest', () => jest.fn(() => mockPullRequest));

describe('Repository', () => {
  const TestingFramework = require('@/Framework');
  const Repository = require('@/Repository');
  const repositoryInstance = new Repository(
    'repo-name',
    'carlosdevpereira',
    mockGithubApi,
    mockRepositoryConfig
  );

  it('returns an instance of a repository', () => {
    expect(repositoryInstance.name).toBe('repo-name');
    expect(repositoryInstance.owner).toBe('carlosdevpereira');
    expect(repositoryInstance.github).toStrictEqual(mockGithubApi);
    expect(repositoryInstance.config).toStrictEqual(mockRepositoryConfig);
    expect(repositoryInstance.testFramework).toStrictEqual(mockTestingFramework);
    expect(TestingFramework).toHaveBeenCalledWith('jest');

    expect(typeof repositoryInstance.getPullRequests).toBe('function');
  });

  describe('getPullRequests method', () => {
    let result;
    beforeAll(async () => {
      result = await repositoryInstance.getPullRequests();
    });

    it('requests pull request list', () => {
      expect(mockGithubApi.rest.search.issuesAndPullRequests)
        .toHaveBeenCalledWith({
          q: 'is:pr state:open repo:carlosdevpereira/repo-name head:main'
        });
    });

    it('retrieves detailed pull request information', () => {
      expect(mockGithubApi.rest.pulls.get).toHaveBeenCalledWith({
        owner: 'carlosdevpereira',
        repo: 'repo-name',
        pull_number: 1347
      });
    });

    it('returns the array of pull requests', () => {
      expect(result).toStrictEqual([mockPullRequest]);
    });
  });
});