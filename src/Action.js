const github = require('@actions/github');

const Cloudflare = require('./Cloudflare');
const Commit = require('./Commit');
const Repository = require('./Repository');

class Action {
  constructor(context, config) {
    this.config = config;
    this.github = github.getOctokit(config.github.token);

    this.repository = new Repository(context.payload.repository.name, context.payload.repository.owner.login, this.github, config);
    this.commit = new Commit(context.sha, this.repository, this.github);

    this.testResults = null;
    this.coverageReportUrl = null;
  }

  async runTests() {
    this.testResults = await this.repository.testFramework.runTests();

    return this.testResults;
  }

  async publishToCloudflare() {
    const cloudflare = new Cloudflare(this.config.cloudflare);
    const commitShortHash = this.commit.shortHash();
    this.coverageReportUrl = await cloudflare.publish(commitShortHash);

    return this.coverageReportUrl;
  }

  async saveTestResults() {
    this.testResults.coverage.report = {
      url: this.coverageReportUrl
    };

    await this.commit.addComment(JSON.stringify(this.testResults));
  }

  async commentOnAvailablePullRequests() {
    const pullRequests = await this.repository.getPullRequests();

    for (const pullRequest of pullRequests) {
      const comment = await pullRequest.buildComment(this.coverageReportUrl);

      if (comment) {
        await pullRequest.addComment(comment);
      }
    }
  }
}

module.exports = Action;