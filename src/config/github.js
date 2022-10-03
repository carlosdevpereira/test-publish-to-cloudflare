import core from '@actions/core'

export default {
  token: core.getInput('githubToken', { required: true }),
  branch: core.getInput('branchName', { required: true })
}