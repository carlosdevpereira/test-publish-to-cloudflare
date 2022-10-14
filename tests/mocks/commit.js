const commit = require('@tests/fixtures/github-action-context.json');

module.exports = {
  hash: commit.sha,
  shortHash: () => {
    return commit.sha.slice(0, 7);
  },
};