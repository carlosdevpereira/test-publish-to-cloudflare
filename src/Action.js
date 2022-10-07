const Commit = require('./Commit');
const Cloudflare = require('./Cloudflare');
const Repository = require('./Repository');
const core = require('@actions/core');

class GithubAction {
  constructor(context, config) {
    this.context = context;
    this.config = config;

    this.repository = new Repository(context.repo.repo, context.repo.owner, config);
    this.commit = new Commit(context.sha, this.repository);

    this.testResults = null;
    this.coverageReportUrl = null;
  }

  async runTests() {
    this.testResults = await this.repository.testFramework.runTests();

    return this;
  }

  async publishToCloudflare() {
    const cloudflare = new Cloudflare(this.config.cloudflare);
    core.info('cloudflare: ');
    core.info(cloudflare);
    const commitShortHash = this.commit.shortHash();
    core.info('short hash: ');
    core.info(commitShortHash);

    this.coverageReportUrl = await cloudflare.publish(commitShortHash);

    return this;
  }

  async commentOnAvailablePullRequests() {
    const pullRequests = await this.repository.getPullRequests();

    pullRequests.forEach(async pullRequest => {
      await this.repository.commentPullRequests(pullRequest, this.testResults, this.coverageReportUrl);
    });

    return this;
  }
}

module.exports = GithubAction;