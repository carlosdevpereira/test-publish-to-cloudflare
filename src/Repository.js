import core from '@actions/core';
import github from '@actions/github';
import Framework from './Framework';
import frameworkConfig from './config/framework';
import githubConfig from './config/github';
import cloudflareConfig from './config/cloudflare';
import GetReport, { TotalPercentagesAverage } from './utils/getReports';
import { BuildCommentBody } from './utils/buildComment';

/**
 * Represents a Github repository
 */
export default class Repository {
  constructor(name, owner) {
    this.name = name;
    this.owner = owner;
    this.branch = githubConfig.branch;
    this.github = github.getOctokit(githubConfig.token);
    this.testFramework = new Framework(frameworkConfig.framework);
  }

  async getPullRequests() {
    const pullRequests = [];
    const { data: pulls } = await this.github.rest.search.issuesAndPullRequests({
      q: `is:pr state:open repo:${this.owner}/${this.repo} head:${this.branch}`
    });

    for (let i = 0; i < pulls.items.length; i++) {
      const { data: pullRequest } = await this.github.rest.pulls.get({
        owner: github.context.repo.owner,
        repo: github.context.repo.repo,
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
    core.startGroup('Comment on Pull Request or Commit...');

    const { data: comments } = await this.github.rest.issues.listComments({
      owner: this.owner,
      repo: this.repo,
      issue_number: pullRequest.number
    });
    const botComment = comments.find(comment => comment.user.id === 41898282);

    const headResult = await GetReport({ reportUrl: `${fullReportUrl}/coverage-summary.json` });
    const baseResult = await GetReport(
      {
        reportUrl: `https://${pullRequest.baseBranchShortSha}.${cloudflareConfig.baseCloudflareDeploymentUrl}/coverage-summary.json`,
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
        repo: this.repo,
        comment_id: botComment.id,
        body: commentBody
      });
    } else {
      await this.github.rest.issues.createComment({
        issue_number: pullRequest.number,
        owner: github.context.repo.owner,
        repo: github.context.repo.repo,
        body: commentBody
      });
    }

    core.endGroup();
  }
}