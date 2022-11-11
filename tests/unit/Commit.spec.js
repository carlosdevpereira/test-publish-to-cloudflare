const mockRepository = require('@tests/mocks/repository');
const mockGithubApi = require('@tests/mocks/github-api');

const contextFixture = require('@tests/fixtures/github-action-context');
const testStatsFixture = require('@tests/fixtures/test-stats');
const coverageSummaryFixture = require('@tests/fixtures/coverage-summary');

describe('Commit', () => {
  const Commit = require('@/Commit');
  const commitInstance = new Commit(contextFixture.sha, mockRepository, mockGithubApi);

  it('returns an instance of a Commit', () => {
    expect(commitInstance.hash).toBeDefined();
    expect(typeof commitInstance.shortHash).toBe('function');
  });

  describe('shortHash method', () => {
    it('returns the short hash of a commit sha hash', () => {
      expect(
        commitInstance.shortHash()
      ).toBe(contextFixture.sha.slice(0, 7));
    });
  });

  describe('getComment method', () => {
    describe('when it returns comments', () => {
      it('returns the first comment received', async () => {
        const comment = await commitInstance.getComment();

        expect(comment.body).toBe(JSON.stringify({ stats: testStatsFixture, summary: coverageSummaryFixture }));
      });
    });

    describe('when it doesnt return any comments', () => {
      it('returns the first comment received', async () => {
        mockGithubApi.rest.repos.listCommentsForCommit.mockReturnValueOnce({ data: [] });

        const comment = await commitInstance.getComment();
        expect(comment).toBe(null);
      });
    });
  });

  describe('addComment method', () => {
    describe('when there is a comment already', () => {
      beforeAll(async () => {
        await commitInstance.addComment('commit-comment');
      });

      it('skips comment creation', () => {
        expect(mockGithubApi.rest.repos.createCommitComment).not.toHaveBeenCalled();
      });
    });

    describe('when comment doesnt have a comment yet', () => {
      beforeAll(async () => {
        mockGithubApi.rest.repos.listCommentsForCommit.mockReturnValueOnce({ data: [] });
        await commitInstance.addComment('commit-comment');
      });

      it('creates the new comment', () => {
        expect(mockGithubApi.rest.repos.createCommitComment)
          .toHaveBeenCalledWith({
            owner: commitInstance.repository.owner,
            repo: commitInstance.repository.name,
            commit_sha: commitInstance.hash,
            body: 'commit-comment'
          });
      });
    });
  });
});