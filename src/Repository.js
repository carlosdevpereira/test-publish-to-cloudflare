const core = require('@actions/core');
const github = require('@actions/github');
const Framework = require('./Framework');
const { BuildCommentBody } = require('./utils/buildComment');
const { TotalPercentagesAverage } = require('./utils/getReports');

class Repository {
  constructor(name, owner, config) {
    this.name = name;
    this.owner = owner;
    this.config = config;

    this.branch = config.github.branch;
    this.github = github.getOctokit(config.github.token);
    this.testFramework = new Framework(config.testing.framework);
  }

  async getPullRequests() {
    const pullRequests = [];
    const { data: pulls } = await this.github.rest.search.issuesAndPullRequests({
      q: `is:pr state:open repo:${this.owner}/${this.name} head:${this.branch}`,
    });

    for (let index = 0; index < pulls.items.length; index++) {
      const { data: pullRequest } = await this.github.rest.pulls.get({
        owner: this.owner,
        pull_number: pulls.items[index].number,
        repo: this.name,
      });

      pullRequests.push({
        baseBranchSha: pullRequest.base.sha,
        baseBranchShortSha: pullRequest.base.sha.slice(0, 7),
        baseRef: pullRequest.base.ref,
        headBranchSha: pullRequest.head.sha,
        headBranchShortSha: pullRequest.head.sha.slice(0, 7),
        number: pullRequest.number,
      });
    }

    return pullRequests;
  }

  async addCommitComment(commitSha, comment) {
    const commitComment = await this.getCommitComment(commitSha);

    if (commitComment) {
      core.info('Updating existing commit comment `' + commitComment.id + '`...');

      await this.github.rest.repos.updateCommitComment({
        owner: this.owner,
        repo: this.name,
        comment_id: commitComment.id,
        body: comment
      });

      core.info('Comment `' + commitComment.id + '` updated!');
    }
    else {
      core.info('Creating a new commit comment...');

      const createdComment = await this.github.rest.repos.createCommitComment({
        owner: this.owner,
        repo: this.name,
        commit_sha: commitSha,
        body: comment
      });

      core.info('Added comment `' + createdComment.id + '` to commit `' + commitSha + '`!');
    }
  }

  async getCommitComment(commitSha) {
    core.info('Retrieving comments for commit `' + commitSha + '`...');

    const comments = await this.github.rest.repos.listCommentsForCommit({
      owner: this.owner,
      repo: this.name,
      commit_sha: commitSha
    });

    if (!comments.data.length) {
      core.info('Commit `' + commitSha + '` doesnt have comments yet!');
      return null;
    }

    core.info('Found comments for commit `' + commitSha + '`!');
    return comments.data[0];
  }

  async commentPullRequest(pullRequest, fullReportUrl) {
    const results = await Promise.all([
      this.getCommitComment(pullRequest.headBranchSha),
      this.getCommitComment(pullRequest.baseBranchSha)
    ]);

    const headResult = JSON.parse(results[0].body);
    const baseResult = JSON.parse(results[1].body);

    const commentBody = await BuildCommentBody({
      baseAvgPercentage: TotalPercentagesAverage(baseResult),
      baseRef: pullRequest.baseRef,
      baseShortHash: pullRequest.baseBranchShortSha,
      baseTotals: baseResult.summary.total,
      branchName: this.branch,
      fullReportUrl,
      hasBaseResults: Boolean(baseResult),
      headAvgPercentage: TotalPercentagesAverage(headResult),
      headShortHash: pullRequest.headBranchShortSha,
      headTotals: headResult.summary.total,
      testResults: headResult.stats,
    });

    await this.addPullRequestComment(pullRequest.number, commentBody);
  }

  async addPullRequestComment(pullRequestNumber, comment) {
    const comments = await this.getPullRequestComments(pullRequestNumber);
    const botComment = comments.find((comment) => {
      return comment.user.id === 41_898_282;
    });

    if (botComment) {
      core.info('Updating comment for pull request #`' + pullRequestNumber + '`...');

      await this.github.rest.issues.updateComment({
        body: comment,
        comment_id: botComment.id,
        owner: this.owner,
        repo: this.name,
      });
    } else {
      core.info('Creating a new comment for pull request #`' + pullRequestNumber + '`...');

      await this.github.rest.issues.createComment({
        body: comment,
        issue_number: pullRequestNumber,
        owner: this.owner,
        repo: this.name,
      });
    }
  }

  async getPullRequestComments(pullRequestNumber) {
    core.info('Searching for comments on pull request #`' + pullRequestNumber + '`...');

    const { data: comments } = await this.github.rest.issues.listComments({
      issue_number: pullRequestNumber,
      owner: this.owner,
      repo: this.name,
    });

    return comments;
  }
}

module.exports = Repository;