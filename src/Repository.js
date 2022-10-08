const github = require('@actions/github');
const Framework = require('./Framework');
const { GetReport, TotalPercentagesAverage } = require('./utils/getReports');
const { BuildCommentBody } = require('./utils/buildComment');
const core = require('@actions/core');

/**
 * Represents a Github repository
 */
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
      q: `is:pr state:open repo:${this.owner}/${this.name} head:${this.branch}`
    });
    core.info('pull requests: ' + JSON.stringify(pulls));

    for (let i = 0; i < pulls.items.length; i++) {
      const { data: pullRequest } = await this.github.rest.pulls.get({
        repo: this.name,
        owner: this.owner,
        pull_number: pulls.items[i].number
      });

      pullRequests.push({
        number: pullRequest.number,
        headBranchSha: pullRequest.head.sha,
        headBranchShortSha: pullRequest.head.sha.slice(0, 7),
        baseBranchSha: pullRequest.base.sha,
        baseBranchShortSha: pullRequest.base.sha.slice(0, 7),
        baseRef: pullRequest.base.ref
      });
    }

    return pullRequests;
  }

  async commentPullRequest(pullRequest, testResults, fullReportUrl) {
    const { data: comments } = await this.github.rest.issues.listComments({
      owner: this.owner,
      repo: this.name,
      issue_number: pullRequest.number
    });
    const botComment = comments.find(comment => comment.user.id === 41898282);

    const headResult = await GetReport({ reportUrl: `${fullReportUrl}/coverage-summary.json` });
    const baseResult = await GetReport(
      {
        reportUrl: `https://${pullRequest.baseBranchShortSha}.${this.config.cloudflare.baseUrl}/coverage-summary.json`,
        retryCount: 0,
        ignoreErrors: true
      }
    );

    const commentBody = BuildCommentBody({
      baseRef: pullRequest.baseRef,
      branchName: this.branch,
      headAvgPercentage: TotalPercentagesAverage(headResult),
      baseAvgPercentage: TotalPercentagesAverage(baseResult),
      headTotals: headResult.total,
      baseTotals: baseResult.total,
      testResults,
      headShortHash: pullRequest.headBranchShortSha,
      baseShortHash: pullRequest.baseBranchShortSha,
      fullReportUrl,
      hasBaseResults: !!baseResult
    });

    if (botComment) {
      await this.github.rest.issues.updateComment({
        owner: this.owner,
        repo: this.name,
        comment_id: botComment.id,
        body: commentBody
      });
    } else {
      await this.github.rest.issues.createComment({
        issue_number: pullRequest.number,
        owner: this.owner,
        repo: this.name,
        body: commentBody
      });
    }
  }
}

module.exports = Repository;