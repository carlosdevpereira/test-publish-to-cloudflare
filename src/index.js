import Commit from './Commit';
import Cloudflare from './Cloudflare';
import cloudflareConfig from './config/cloudflare';
import Repository from './Repository';

export default class GithubAction {
  constructor(context) {
    this.context = context;
    this.repository = new Repository(context.repo.repo, context.repo.owner);
    this.commit = new Commit(context.sha, this.repository);

    this.testResults = null;
    this.coverageReportUrl = null;
  }

  async runTests() {
    this.testResults = await this.repository.testFramework.runTests();

    return this;
  }

  async publishToCloudflare() {
    const cloudflare = new Cloudflare(cloudflareConfig);
    this.coverageReportUrl = await cloudflare.publish(this.commit.shortHash());

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