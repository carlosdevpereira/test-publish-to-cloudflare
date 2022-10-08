const { execSync } = require('child_process');

const COVERAGE_OUTPUT_FOLDER = './coverage';

class Cloudflare {
  constructor(config) {
    this.apiToken = config.apiToken;
    this.accountId = config.accountId;
    this.projectName = config.projectName;
    this.baseUrl = config.baseUrl;
  }

  publish(commitSha) {
    execSync(`npx wrangler@2 pages publish "${COVERAGE_OUTPUT_FOLDER}" --project-name="${this.projectName}" --branch="${commitSha}"`, {
      env: {
        CLOUDFLARE_API_TOKEN: this.apiToken,
        CLOUDFLARE_ACCOUNT_ID: this.accountId
      }
    });

    return `https://${commitSha}.${this.baseUrl}`;
  }
}

module.exports = Cloudflare;