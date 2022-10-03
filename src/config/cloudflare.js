import core from '@actions/core'

export default {
  cloudflareProjectName: core.getInput('cloudflareProjectName', { required: true }),
  cloudflareApiToken: core.getInput('cloudflareApiToken', { required: true }),
  cloudflareAccountId: core.getInput('cloudflareAccountId', { required: true }),
  baseCloudflareDeploymentUrl: core.getInput('baseCloudflareDeploymentUrl')
}