import core from '@actions/core'
import shellac from 'shellac'

const COVERAGE_OUTPUT_FOLDER = './coverage'

export default class Cloudflare {
  constructor(config) {
    this.token = config.token
    this.accountId = config.accountId
    this.projectName = config.projectName
    this.baseUrl = config.baseCloudflareDeploymentUrl
  }

  async publish(commitSha) {

    core.startGroup('Uploading to Cloudflare Pages...')

    await shellac`
    $ export CLOUDFLARE_API_TOKEN="${this.token}"
    $ export CLOUDFLARE_ACCOUNT_ID="${this.accountId}"

    $$ npx wrangler@2 pages publish "${COVERAGE_OUTPUT_FOLDER}" --project-name="${this.projectName}" --branch="${commitSha}"
    `

    core.endGroup()

    return `https://${commitSha}.${this.baseUrl}`
  }
}