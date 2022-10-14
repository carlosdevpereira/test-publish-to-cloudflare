const mockCloudflare = require('@tests/mocks/cloudflare');
const mockCommit = require('@tests/mocks/commit');
const mockRepository = require('@tests/mocks/repository');

jest.mock('@/Repository', () => jest.fn(() => mockRepository));
jest.mock('@/Commit', () => jest.fn(() => mockCommit));
jest.mock('@/Cloudflare', () => jest.fn(() => mockCloudflare));

const Commit = require('@/Commit');
const Repository = require('@/Repository');
const githubActionContextFixture = require('@tests/fixtures/github-action-context.json');
const githubActionConfigFixture = require('@tests/fixtures/github-action-config.json');
const pullRequestsFixture = require('@tests/fixtures/pull-requests.json');

describe('Action', () => {
  const GithubAction = require('@/Action');
  const action = new GithubAction(githubActionContextFixture, githubActionConfigFixture);

  it('creates an instance of a repository', () => {
    expect(Repository).toHaveBeenCalled();
  });

  it('creates an instance of a repository', () => {
    expect(Commit).toHaveBeenCalled();
  });

  it('runs the unit tests from the test framework', async () => {
    await action.runTests();

    expect(mockRepository.testFramework.runTests).toHaveBeenCalled();
  });

  describe('when running the unit tests', () => {
    it('adds the test results comment to the head commit', async () => {
      await action.saveTestResults();

      expect(mockRepository.addCommitComment).toHaveBeenCalledWith(
        mockCommit.hash,
        JSON.stringify(action.testResults)
      );
    });
  });

  it('tries to publish results from specific commit to cloudflare', async () => {
    await action.publishToCloudflare();

    expect(mockCloudflare.publish).toHaveBeenCalledWith(mockCommit.shortHash());
  });

  describe('when commenting pull requests', () => {
    beforeAll(async () => {
      await action.commentOnAvailablePullRequests();
    });

    it('retrieves pull requests that can be commented on', () => {
      expect(mockRepository.getPullRequests).toHaveBeenCalled();
    });

    it('tries to comment on retrieved pull requests', () => {
      expect(mockRepository.commentPullRequest).toHaveBeenCalledWith(
        pullRequestsFixture[0],
        `https://${action.commit.shortHash()}.${githubActionConfigFixture.cloudflare.baseUrl}`
      );
    });
  });
});