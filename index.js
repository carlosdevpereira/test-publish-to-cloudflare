import core from '@actions/core'
import github from '@actions/github'
import GithubAction from './src/index'

// 🚀 Execute Github Action
(async () => {
  try {
    const Action = new GithubAction(github.context)

    await Action.runTests()
      .publishToCloudflare()
      .commentOnAvailablePullRequests()

  } catch (error) {
    core.setFailed(error.message)
  }
})()