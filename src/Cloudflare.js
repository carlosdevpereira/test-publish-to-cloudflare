import shellac from 'shellac';

const COVERAGE_OUTPUT_FOLDER = './coverage';

export default class Cloudflare {
  constructor(config) {
    this.apiToken = config.apiToken;
    this.accountId = config.accountId;
    this.projectName = config.projectName;
    this.baseUrl = config.baseUrl;
  }

  async publish(commitSha) {
    await shellac`
    $ export CLOUDFLARE_API_TOKEN="${this.apiToken}"
    $ export CLOUDFLARE_ACCOUNT_ID="${this.accountId}"

    $$ npx wrangler@2 pages publish "${COVERAGE_OUTPUT_FOLDER}" --project-name="${this.projectName}" --branch="${commitSha}"
    `;

    return `https://${commitSha}.${this.baseUrl}`;
  }
}