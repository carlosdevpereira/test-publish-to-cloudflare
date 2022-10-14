const contextFixture = require('@tests/fixtures/github-action-context.json');

describe('Commit', () => {
  const Commit = require('@/Commit');
  const commitInstance = new Commit(contextFixture.sha);

  it('returns an instance of a Commit', () => {
    expect(commitInstance.hash).toBeDefined();
    expect(typeof commitInstance.shortHash).toBe('function');
  });

  describe('shortHash method', () => {
    it('returns the short hash of a commit full sha hash', () => {
      expect(
        commitInstance.shortHash()
      ).toBe(contextFixture.sha.slice(0, 7));
    });
  });
});