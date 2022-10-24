const mockRepository = require('@tests/mocks/repository');
const mockGithubApi = require('@tests/mocks/github-api');
const mockCommit = require('@tests/mocks/commit');
const mockCommitIncreasedCoverage = require('@tests/mocks/commit-increased-coverage');
const mockCommitDecreasedCoverage = require('@tests/mocks/commit-decreased-coverage');
const mockMarkdownTable = require('@tests/mocks/markdown-table');

const testResults = require('@tests/fixtures/test-results-schema');
const testStatsFixture = require('@tests/fixtures/test-stats');
const testStatsSlowFixture = require('@tests/fixtures/test-stats-slow');
const coverageSummaryFixture = require('@tests/fixtures/coverage-summary');
const pullRequestsFixture = require('@tests/fixtures/pull-requests');

jest.mock('@/Commit', () => jest.fn(() => mockCommit));
jest.mock('@/lib/markdownTable', () => mockMarkdownTable);

describe('PullRequest', () => {
  const PullRequest = require('@/PullRequest');
  const pullRequestInstance = new PullRequest(pullRequestsFixture[0], mockRepository, mockGithubApi);

  it('returns an instance of a pull request', () => {
    expect(pullRequestInstance.number).toBe(1347);
    expect(pullRequestInstance.repository).toStrictEqual(mockRepository);
    expect(pullRequestInstance.baseBranchName).toBe('master');
    expect(pullRequestInstance.baseCommit).toStrictEqual(mockCommit);
    expect(pullRequestInstance.headBranchName).toBe('development');
    expect(pullRequestInstance.headCommit).toStrictEqual(mockCommit);

    expect(typeof pullRequestInstance.getResults).toBe('function');
    expect(typeof pullRequestInstance.getComments).toBe('function');
    expect(typeof pullRequestInstance.buildComment).toBe('function');
    expect(typeof pullRequestInstance.addComment).toBe('function');
  });

  describe('getResults method', () => {
    it('returns results', async () => {
      const results = await pullRequestInstance.getResults();

      expect(results).toStrictEqual({
        base: testResults,
        head: testResults
      });
    });
  });

  describe('getComments method', () => {
    it('returns comments', async () => {
      const results = await pullRequestInstance.getComments();

      expect(results).toStrictEqual([{
        id: 1,
        user: {
          id: 41_898_282
        },
        body: JSON.stringify({
          stats: testStatsFixture,
          summary: coverageSummaryFixture
        })
      }]);
    });
  });

  describe('buildComment method', () => {
    describe('when coverage percentage is kept', () => {
      it('returns the "coverage remained intact" comment', async () => {
        const comment = await pullRequestInstance.buildComment('coverage-report-url');

        expect(comment).toContain('> Good job 👌, the tests are passing and the coverage percentage remained intact.');
        expect(comment).toContain('$markdown-table');
        expect(comment).toContain('Test Suites: **3 passed**, 3 total');
        expect(comment).toContain('Tests: **17 passed**, 17 total');
        expect(comment).toContain('Snapshots: **0 total**');
        expect(comment).toContain('Time: **4 seconds**');
        expect(comment).toContain('[View full coverage report 🔗](coverage-report-url)');
      });
    });

    describe('when coverage percentage increases', () => {
      it('returns the "coverage remained intact" comment', async () => {
        pullRequestInstance.headCommit = mockCommitIncreasedCoverage;
        const comment = await pullRequestInstance.buildComment('coverage-report-url');

        expect(comment).toContain('> Wooo 🎉, the tests are passing and the coverage percentage **increased**, well done! 👏');
        expect(comment).toContain('$markdown-table');
        expect(comment).toContain('Test Suites: **3 passed**, 3 total');
        expect(comment).toContain('Tests: **17 passed**, 17 total');
        expect(comment).toContain('Snapshots: **0 total**');
        expect(comment).toContain('Time: **1 hours, 66 minutes and 4004 seconds**');
        expect(comment).toContain('[View full coverage report 🔗](coverage-report-url)');
      });
    });

    describe('when coverage percentage decreases', () => {
      it('returns the "coverage remained intact" comment', async () => {
        pullRequestInstance.headCommit = mockCommitDecreasedCoverage;
        const comment = await pullRequestInstance.buildComment('coverage-report-url');

        expect(comment).toContain('> Tests are passing but the coverage percentage **decreased** 😱, read coverage report below for more details.');
        expect(comment).toContain('$markdown-table');
        expect(comment).toContain('Test Suites: **3 passed**, 3 total');
        expect(comment).toContain('Tests: **17 passed**, 17 total');
        expect(comment).toContain('Snapshots: **0 total**');
        expect(comment).toContain('Time: **4 seconds**');
        expect(comment).toContain('[View full coverage report 🔗](coverage-report-url)');
      });
    });
  });

  describe('addComment method', () => {
    describe('when there is a comment already', () => {
      beforeAll(async () => {
        await pullRequestInstance.addComment('pr-comment');
      });

      it('updates the commit comment', () => {
        expect(mockGithubApi.rest.issues.updateComment)
          .toHaveBeenCalledWith({
            owner: pullRequestInstance.repository.owner,
            repo: pullRequestInstance.repository.name,
            comment_id: 1,
            body: 'pr-comment'
          });
      });
    });

    describe('when comment doesnt have a comment yet', () => {
      beforeAll(async () => {
        mockGithubApi.rest.issues.listComments.mockReturnValueOnce({ data: [] });
        await pullRequestInstance.addComment('pr-comment');
      });

      it('creates the new comment', () => {
        expect(mockGithubApi.rest.issues.createComment)
          .toHaveBeenCalledWith({
            owner: pullRequestInstance.repository.owner,
            repo: pullRequestInstance.repository.name,
            issue_number: 1347,
            body: 'pr-comment'
          });
      });
    });
  });
});