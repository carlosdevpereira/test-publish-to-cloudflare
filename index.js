import fs from 'fs'
import { HttpClient } from '@actions/http-client'
import github from '@actions/github'
import core from '@actions/core'
import { exec } from '@actions/exec'
import shellac from 'shellac'

const SUPPORTED_TEST_FRAMEWORKS = ['jest']
const COVERAGE_OUTPUT_FOLDER = './coverage';

// 🚀 Execute Github Action
(async () => {
  try {
    /**
     * Retrieve all input values provided to
     * the Github Action so that we can later use them
     **/
    const input = {
      framework: core.getInput('framework'),
      githubToken: core.getInput('githubToken', { required: true }),
      branchName: core.getInput('branchName', { required: true }),
      cloudflareProjectName: core.getInput('cloudflareProjectName', { required: true }),
      cloudflareApiToken: core.getInput('cloudflareApiToken', { required: true }),
      cloudflareAccountId: core.getInput('cloudflareAccountId', { required: true }),
      baseCloudflareDeploymentUrl: core.getInput('baseCloudflareDeploymentUrl')
    }

    /**
     * Check if requested test framework is supported
     *
     * (For now, the only test framwork supported is `Jest`,
     * but support for `Vitest` will be added soon.)
     **/
    if (!SUPPORTED_TEST_FRAMEWORKS.includes(input.framework)) {
      throw new Error(
        'Unsupported test framework selected. Valid options are: ' + SUPPORTED_TEST_FRAMEWORKS.join(', ')
      )
    }

    /**
     * Runs the unit tests for the selected test framework.
     *
     * (If you use a different framework, and would like
     * to use this action, feel free to open a feature request
     * in this repository 😉).
     **/
    let statistics = ''

    if (input.framework === 'jest') {
      core.startGroup('Running Jest Tests...')
      const JEST_PATH = './node_modules/jest/bin/jest.js'
      const JEST_FLAGS = '--no-cache --detectOpenHandles --coverage --json'
      const RESULT_OUTPUT_FILE = `${COVERAGE_OUTPUT_FOLDER}/test-results.json`

      await exec(`${JEST_PATH} ${JEST_FLAGS}`, undefined, {
        listeners: {
          stdout: data => {
            statistics += data.toString()
          }
        }
      })

      fs.writeFileSync(RESULT_OUTPUT_FILE, statistics)

      core.debug('Test results: ', statistics)
      core.endGroup()
    }

    /**
     * Calculate short version of commit hash
     * to use as the Cloudflare preview alias
     **/
    core.startGroup('Calculating commit short hash...')

    let commitShortHash = github.context.sha.slice(0, 7)

    core.debug('Calculated commit short hash: ' + commitShortHash)
    core.endGroup()

    /**
     * Now that we have the coverage report and
     * summary file generated, we will upload them to
     * Cloudflare Pages.
     **/
    core.startGroup('Uploading to Cloudflare Pages...')

    await shellac`
    $ export CLOUDFLARE_API_TOKEN="${input.cloudflareApiToken}"
    $ export CLOUDFLARE_ACCOUNT_ID="${input.cloudflareAccountId}"

    $$ npx wrangler@2 pages publish "${COVERAGE_OUTPUT_FOLDER}" --project-name="${input.cloudflareProjectName}" --branch="${commitShortHash}"
    `

    core.endGroup()

    core.startGroup('Comment on available pull requests...')

    /**
     * Now we will create an instance of Octokit which
     * we will use to call GitHub's REST API.
     * To do that we need a Github Access Token to authenticate
     * our requests. More information regarding Octokit here:
     * https://octokit.github.io/rest.js/v19
     **/
    const octokit = github.getOctokit(input.githubToken)
    const UPLOAD_URL = `https://${commitShortHash}.${input.baseCloudflareDeploymentUrl}`

    const { data: pulls } = await octokit.rest.search.issuesAndPullRequests({
      q: `is:pr state:open repo:${github.context.repo.owner}/${github.context.repo.repo} head:${input.branchName}`
    })

    core.info(`Pull requests available: ${JSON.stringify(pulls)}`)

    if (pulls.total_count > 0) {
      pulls.items.forEach(async pull => {
        // Get the existing comments.
        const { data: pullRequest } = await octokit.rest.pulls.get({
          owner: github.context.repo.owner,
          repo: github.context.repo.repo,
          pull_number: pull.number
        })

        const shortBaseSha = pullRequest.base.sha.slice(0, 7)

        // Read current head results from disk
        const headResult = await getReport({ reportUrl: `${UPLOAD_URL}/coverage-summary.json` })
        const headTotals = headResult.data.total
        const headPercentages = [
          headTotals.lines.pct,
          headTotals.statements.pct,
          headTotals.functions.pct,
          headTotals.branches.pct
        ]
        const headAvgPercentage
          = headPercentages.reduce((a, b) => a + b, 0) / headPercentages.length

        // Retrieve base branch results from Cloudflare
        // to compare with head
        const baseResult = await getReport(
          {
            reportUrl: `https://${shortBaseSha}.${input.baseCloudflareDeploymentUrl}/coverage-summary.json`,
            retryCount: 0,
            ignoreErrors: true
          }
        )
        let baseTotals
        let basePercentages = [0, 0, 0, 0]
        let baseAvgPercentage = 0
        if (baseResult) {
          baseTotals = baseResult.data.total
          basePercentages = [
            baseTotals.lines.pct,
            baseTotals.statements.pct,
            baseTotals.functions.pct,
            baseTotals.branches.pct
          ]
          baseAvgPercentage
            = basePercentages.reduce((a, b) => a + b, 0) / basePercentages.length
        }

        statistics = statistics.data
        const startedAt = statistics.startTime
        const endedAt = statistics.testResults[statistics.testResults.length - 1].endTime
        const timeTaken = getTimeTaken(startedAt, endedAt)

        // Get the existing comments.
        const { data: comments } = await octokit.rest.issues.listComments({
          owner: github.context.repo.owner,
          repo: github.context.repo.repo,
          issue_number: pullRequest.number
        })
        const botComment = comments.find(
          comment => comment.user.id === 41898282
        )

        let coverageMessage
        if (headAvgPercentage > baseAvgPercentage) {
          coverageMessage = `\n> Wooo 🎉, the tests are passing and the coverage percentage **increased** with this pull request, well done! 👏\n> ${
            pullRequest.base.ref
          }: **${Math.round(baseAvgPercentage, -1)}%** | ${
            input.branchName
          }: **${Math.round(headAvgPercentage, -1)}%**`
        } else if (headAvgPercentage === baseAvgPercentage) {
          coverageMessage = '\n> Good job 👌, the tests are passing and the coverage percentage remained intact.'
        } else {
          coverageMessage = `\n> Tests are passing but the coverage percentage **is decreased** 😱 by this pull request, read coverage report below for more details.\n\n🔻 ${
            pullRequest.base.ref
          }: **${Math.round(baseAvgPercentage, -1)}%** | ${
            input.branchName
          }: **${Math.round(headAvgPercentage, -1)}%** 🔻`
        }

        let coverageSummaryTable = `
\`\`\`diff
@@                             Coverage Summary                          @@
   -----------------------------------------------------------------------
  |   Category   |  Master Branch  |  Current Branch  |  Covered / Total  |
  | ------------ | --------------- | ---------------- | ----------------- |`

        coverageSummaryTable += `\n${
          !baseResult || headTotals.statements.pct > baseTotals.statements.pct
            ? '+'
            : baseTotals.statements.pct === headTotals.statements.pct
              ? ' '
              : '-'
        } `
        coverageSummaryTable += `| Statements   |     ${
          baseResult ? baseTotals.statements.pct.toString() + '%' : '   -  '
        }      |      ${headTotals.statements.pct}%      |       ${
          headTotals.statements.covered
        }/${headTotals.statements.total}     |`
        coverageSummaryTable += `\n${
          !baseResult || headTotals.branches.pct > baseTotals.branches.pct
            ? '+'
            : baseTotals.branches.pct === headTotals.branches.pct
              ? ' '
              : '-'
        } `
        coverageSummaryTable += `| Branches     |     ${
          baseResult ? baseTotals.branches.pct.toString() + '%' : '   -  '
        }      |      ${headTotals.branches.pct}%      |       ${
          headTotals.branches.covered
        }/${headTotals.branches.total}     |`
        coverageSummaryTable += `\n${
          !baseResult || headTotals.functions.pct > baseTotals.functions.pct
            ? '+'
            : baseTotals.functions.pct === headTotals.functions.pct
              ? ' '
              : '-'
        } `
        coverageSummaryTable += `| Functions    |     ${
          baseResult ? baseTotals.functions.pct.toString() + '%' : '   -  '
        }      |      ${headTotals.functions.pct}%      |       ${
          headTotals.functions.covered
        }/${headTotals.functions.total}     |`
        coverageSummaryTable += `\n${
          !baseResult || headTotals.lines.pct > baseTotals.lines.pct
            ? '+'
            : baseTotals.lines.pct === headTotals.lines.pct
              ? ' '
              : '-'
        } `
        coverageSummaryTable += `| Lines        |     ${
          baseResult ? baseTotals.lines.pct.toString() + '%' : '   -  '
        }      |      ${headTotals.lines.pct}%      |       ${
          headTotals.lines.covered
        }/${headTotals.lines.total}     |`

        coverageSummaryTable += '\n  -------------------------------------------------------------------------\n```'

        const commentBody = `## 🔖 Coverage Report
${coverageMessage}

${coverageSummaryTable}

<details>
<summary>Metrics</summary>
        
- Test Suites: **${statistics.numPassedTestSuites} passed**, ${statistics.numTotalTestSuites} total
- Tests: **${statistics.numPassedTests} passed**, ${statistics.numTotalTests} total
- Snapshots: **${statistics.snapshot.total} total**
- Time: **${timeTaken}**
</details>

> Coverage data is based on head **${input.branchName}** (\`${commitShortHash}\`) compared to base **${pullRequest.base.ref}** (\`${shortBaseSha}\`).

[View full coverage report 🔗](${UPLOAD_URL})`

        if (botComment) {
          await octokit.rest.issues.updateComment({
            owner: github.context.repo.owner,
            repo: github.context.repo.repo,
            comment_id: botComment.id,
            body: commentBody
          })
        } else {
          await octokit.rest.issues.createComment({
            issue_number: pullRequest.number,
            owner: github.context.repo.owner,
            repo: github.context.repo.repo,
            body: commentBody
          })
        }
      })
    }

    core.endGroup()
  } catch (error) {
    core.setFailed(error.message)
  }
})()

const getReport = async ({ reportUrl, retryCount = 3, ignoreErrors = false } = {}) => {
  try {
    const http = new HttpClient()
    const res = await http.get(reportUrl)
    const body = await res.readBody()

    return JSON.parse(body)
  } catch (error) {
    if (retryCount === 0) {
      if (!ignoreErrors) throw error
    } else {
      core.warning('Cloudflare pages request failed. Retrying...')
      await new Promise(resolve => setTimeout(resolve, 2000))
      return await getReport({
        reportUrl,
        retryCount: retryCount - 1
      })
    }
  }
}

const getTimeTaken = (startedAt, endedAt) => {
  const msDifference = endedAt - startedAt
  const secondsTaken = Math.floor(msDifference / 1000)
  const minutesTaken = Math.floor(msDifference / 1000 / 60)
  const hoursTaken = Math.floor(msDifference / 1000 / 60 / 60)

  let timeTaken = ''
  if (hoursTaken > 0) timeTaken = `${hoursTaken} hours, `
  if (minutesTaken > 0) timeTaken += `${minutesTaken} minutes and `
  if (secondsTaken > 0) timeTaken += `${secondsTaken} seconds`

  return timeTaken
}