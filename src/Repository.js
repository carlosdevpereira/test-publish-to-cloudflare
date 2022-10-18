const core = require('@actions/core');

const Framework = require('./Framework');
const PullRequest = require('./PullRequest');

class Repository {
  constructor(name, owner, github, config) {
    this.name = name;
    this.owner = owner;
    this.github = github;
    this.config = config;

    this.testFramework = new Framework(config.testing.framework);

    // @TODO: Get this from context directly
    this.branch = config.github.branch;
  }

  async getPullRequests() {
    core.info('Searching for available pull requests...');

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

      pullRequests.push(new PullRequest(pullRequest, this, this.github));
    }

    core.info('Found ' + pullRequests.length + ' pull requests available for adding the coverage comment!');

    return pullRequests;
  }
}

module.exports = Repository;