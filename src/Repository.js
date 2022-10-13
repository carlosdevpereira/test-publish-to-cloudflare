const github = require('@actions/github');
const Framework = require('./Framework');
const { BuildCommentBody } = require('./utils/buildComment');
const { GetReport, TotalPercentagesAverage } = require('./utils/getReports');

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

  async commentPullRequest(pullRequest, testResults, fullReportUrl) {
    const { data: comments } = await this.github.rest.issues.listComments({
      issue_number: pullRequest.number,
      owner: this.owner,
      repo: this.name,
    });
    const botComment = comments.find((comment) => {
      return comment.user.id === 41_898_282;
    });

    const headResult = await GetReport({
      reportUrl: `${fullReportUrl}/coverage-summary.json`,
    });
    const baseResult = await GetReport({
      ignoreErrors: true,
      reportUrl: `https://${pullRequest.baseBranchShortSha}.${this.config.cloudflare.baseUrl}/coverage-summary.json`,
      retryCount: 0,
    });

    const commentBody = await BuildCommentBody({
      baseAvgPercentage: TotalPercentagesAverage(baseResult),
      baseRef: pullRequest.baseRef,
      baseShortHash: pullRequest.baseBranchShortSha,
      baseTotals: baseResult.total,
      branchName: this.branch,
      fullReportUrl,
      hasBaseResults: Boolean(baseResult),
      headAvgPercentage: TotalPercentagesAverage(headResult),
      headShortHash: pullRequest.headBranchShortSha,
      headTotals: headResult.total,
      testResults,
    });

    if (botComment) {
      await this.github.rest.issues.updateComment({
        body: commentBody,
        comment_id: botComment.id,
        owner: this.owner,
        repo: this.name,
      });
    } else {
      await this.github.rest.issues.createComment({
        body: commentBody,
        issue_number: pullRequest.number,
        owner: this.owner,
        repo: this.name,
      });
    }
  }
}

module.exports = Repository;