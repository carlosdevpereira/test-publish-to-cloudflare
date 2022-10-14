const Cloudflare = require('./Cloudflare');
const Commit = require('./Commit');
const Repository = require('./Repository');

class Action {
  constructor(context, config) {
    this.config = config;

    this.repository = new Repository(
      context.payload.repository.name,
      context.payload.repository.owner.login,
      config
    );
    this.commit = new Commit(context.sha, this.repository);

    this.testResults = null;
    this.coverageReportUrl = null;
  }

  async runTests() {
    this.testResults = await this.repository.testFramework.runTests();

    return this;
  }

  async saveTestResults() {
    await this.repository.addCommitComment(
      this.commit.hash,
      JSON.stringify(this.testResults)
    );
  }

  async publishToCloudflare() {
    const cloudflare = new Cloudflare(this.config.cloudflare);
    const commitShortHash = this.commit.shortHash();
    this.coverageReportUrl = await cloudflare.publish(commitShortHash);

    return this;
  }

  async commentOnAvailablePullRequests() {
    const pullRequests = await this.repository.getPullRequests();

    for (const pullRequest of pullRequests) {
      await this.repository.commentPullRequest(pullRequest, this.coverageReportUrl);
    }

    return this;
  }
}

module.exports = Action;