const core = require('@actions/core');

class Commit {
  constructor(hash, repository, github) {
    this.hash = hash;
    this.repository = repository;
    this.github = github;
  }

  /**
   *  Returns the short version of the commit hash.
   * (The first 7 characters)
   */
  shortHash() {
    return this.hash.slice(0, 7);
  }

  async getComment() {
    core.info('Retrieving comments for commit `' + this.hash + '`...');

    const comments = await this.github.rest.repos.listCommentsForCommit({
      owner: this.repository.owner,
      repo: this.repository.name,
      commit_sha: this.hash
    });

    if (!comments.data.length) {
      core.info('Commit `' + this.hash + '` doesnt have comments yet!');
      return null;
    }

    core.info('Found comments for commit `' + this.hash + '`!');
    return comments.data[0];
  }

  async addComment(comment) {
    const commitComment = await this.getComment();

    if (commitComment) {
      core.info('Updating existing commit comment `' + commitComment.id + '`...');

      await this.github.rest.repos.updateCommitComment({
        owner: this.repository.owner,
        repo: this.repository.name,
        comment_id: commitComment.id,
        body: comment
      });

      core.info('Comment `' + commitComment.id + '` updated!');
    }
    else {
      core.info('Creating a new commit comment...');

      await this.github.rest.repos.createCommitComment({
        owner: this.repository.owner,
        repo: this.repository.name,
        commit_sha: this.hash,
        body: comment
      });

      core.info('Added comment to commit `' + this.hash + '`!');
    }
  }
}

module.exports = Commit;