export function BuildCommentBody({
  baseRef, branchName, headAvgPercentage, baseAvgPercentage,
  hasBaseResults, headTotals, baseTotals, testResults, headShortHash,
  baseShortHash, fullReportUrl
}) {
  const coverageMessage = BuildCommentHeadMessage({
    baseRef,
    branchName,
    headAvgPercentage,
    baseAvgPercentage
  })

  const coverageSummaryTable = BuildCoverageSummaryTable({
    hasBaseResults,
    headTotals,
    baseTotals
  })

  const timeTaken = CalculateTimeTaken(testResults.startTime, testResults.testResults[testResults.testResults.length - 1].endTime)

  const commentBody = `## 🔖 Coverage Report
    ${coverageMessage}
    
    ${coverageSummaryTable}
    
    <details>
    <summary>Metrics</summary>
            
    - Test Suites: **${testResults.numPassedTestSuites} passed**, ${testResults.numTotalTestSuites} total
    - Tests: **${testResults.numPassedTests} passed**, ${testResults.numTotalTests} total
    - Snapshots: **${testResults.snapshot.total} total**
    - Time: **${timeTaken}**
    </details>
    
    > Coverage data is based on head **${branchName}** (\`${headShortHash, baseShortHash}\`) compared to base **${baseRef}** (\`${baseShortHash}\`).
    
    [View full coverage report 🔗](${fullReportUrl})`

  return commentBody
}

export function BuildCommentHeadMessage({
  baseRef, branchName, headAvgPercentage, baseAvgPercentage
}) {
  let coverageMessage

  if (headAvgPercentage > baseAvgPercentage) {
    coverageMessage = `\n> Wooo 🎉, the tests are passing and the coverage percentage **increased**, well done! 👏\n> ${
      baseRef
    }: **${Math.round(baseAvgPercentage, -1)}%** | ${
      branchName
    }: **${Math.round(headAvgPercentage, -1)}%**`
  } else if (headAvgPercentage === baseAvgPercentage) {
    coverageMessage = '\n> Good job 👌, the tests are passing and the coverage percentage remained intact.'
  } else {
    coverageMessage = `\n> Tests are passing but the coverage percentage **decreased** 😱, read coverage report below for more details.\n\n🔻 ${
      baseRef
    }: **${Math.round(baseAvgPercentage, -1)}%** | ${
      branchName
    }: **${Math.round(headAvgPercentage, -1)}%** 🔻`
  }

  return coverageMessage
}

export function BuildCoverageSummaryTable({
  hasBaseResults, headTotals, baseTotals
}) {
  let coverageSummaryTable = `
\`\`\`diff
@@                             Coverage Summary                          @@
   -----------------------------------------------------------------------
  |   Category   |  Master Branch  |  Current Branch  |  Covered / Total  |
  | ------------ | --------------- | ---------------- | ----------------- |`

  coverageSummaryTable += `\n${
    !hasBaseResults || headTotals.statements.pct > baseTotals.statements.pct
      ? '+'
      : baseTotals.statements.pct === headTotals.statements.pct
        ? ' '
        : '-'
  } `

  coverageSummaryTable += `| Statements   |     ${
    hasBaseResults ? baseTotals.statements.pct.toString() + '%' : '   -  '
  }      |      ${headTotals.statements.pct}%      |       ${
    headTotals.statements.covered
  }/${headTotals.statements.total}     |`

  coverageSummaryTable += `\n${
    !hasBaseResults || headTotals.branches.pct > baseTotals.branches.pct
      ? '+'
      : baseTotals.branches.pct === headTotals.branches.pct
        ? ' '
        : '-'
  } `

  coverageSummaryTable += `| Branches     |     ${
    hasBaseResults ? baseTotals.branches.pct.toString() + '%' : '   -  '
  }      |      ${headTotals.branches.pct}%      |       ${
    headTotals.branches.covered
  }/${headTotals.branches.total}     |`

  coverageSummaryTable += `\n${
    !hasBaseResults || headTotals.functions.pct > baseTotals.functions.pct
      ? '+'
      : baseTotals.functions.pct === headTotals.functions.pct
        ? ' '
        : '-'
  } `

  coverageSummaryTable += `| Functions    |     ${
    hasBaseResults ? baseTotals.functions.pct.toString() + '%' : '   -  '
  }      |      ${headTotals.functions.pct}%      |       ${
    headTotals.functions.covered
  }/${headTotals.functions.total}     |`

  coverageSummaryTable += `\n${
    !hasBaseResults || headTotals.lines.pct > baseTotals.lines.pct
      ? '+'
      : baseTotals.lines.pct === headTotals.lines.pct
        ? ' '
        : '-'
  } `

  coverageSummaryTable += `| Lines        |     ${
    hasBaseResults ? baseTotals.lines.pct.toString() + '%' : '   -  '
  }      |      ${headTotals.lines.pct}%      |       ${
    headTotals.lines.covered
  }/${headTotals.lines.total}     |`

  coverageSummaryTable += '\n  -------------------------------------------------------------------------\n```'

  return coverageSummaryTable
}

export function CalculateTimeTaken(startedAt, endedAt) {
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