const markdownTable = require('../lib/markdownTable').markdownTable;

async function BuildCommentBody({
  baseBranchName,
  headBranchName,
  headAvgPercentage,
  baseAvgPercentage,
  hasBaseResults,
  headTotals,
  baseTotals,
  testResults,
  headShortHash,
  baseShortHash,
  fullReportUrl,
}) {
  const coverageMessage = BuildCommentHeadMessage({
    baseAvgPercentage,
    baseBranchName,
    headBranchName,
    headAvgPercentage,
  });

  const coverageSummaryTable = await BuildCoverageSummaryTable({
    baseTotals,
    hasBaseResults,
    headTotals,
  });

  const timeTaken = CalculateTimeTaken(
    testResults.startTime,
    testResults.testResults[testResults.testResults.length - 1].endTime
  );

  const commentBody = `## 🔖 Coverage Report

${coverageMessage}

${coverageSummaryTable}

<details>
<summary>Metrics</summary>

- Test Suites: **${testResults.numPassedTestSuites} passed**, ${
  testResults.numTotalTestSuites
} total
- Tests: **${testResults.numPassedTests} passed**, ${testResults.numTotalTests} total
- Snapshots: **${testResults.snapshot.total} total**
- Time: **${timeTaken}**
</details>
    
> Coverage data is based on head branch **${headBranchName}** (\`${headShortHash}\`) compared to base branch **${baseBranchName}** (\`${baseShortHash}\`).
    
[View full coverage report 🔗](${fullReportUrl})`;

  return commentBody;
}

function BuildCommentHeadMessage({
  baseBranchName,
  headBranchName,
  headAvgPercentage,
  baseAvgPercentage,
}) {
  let coverageMessage;

  if (headAvgPercentage > baseAvgPercentage) {
    coverageMessage = `> Wooo 🎉, the tests are passing and the coverage percentage **increased**, well done! 👏\n> ${baseBranchName}: **${Math.round(
      baseAvgPercentage,
      -1
    )}%** | ${headBranchName}: **${Math.round(headAvgPercentage, -1)}%**`;
  } else if (headAvgPercentage === baseAvgPercentage) {
    coverageMessage
      = '> Good job 👌, the tests are passing and the coverage percentage remained intact.';
  } else {
    coverageMessage = `> Tests are passing but the coverage percentage **decreased** 😱, read coverage report below for more details.\n\n🔻 ${baseBranchName}: **${Math.round(
      baseAvgPercentage,
      -1
    )}%** | ${headBranchName}: **${Math.round(headAvgPercentage, -1)}%** 🔻`;
  }

  return coverageMessage;
}

async function BuildCoverageSummaryTable({ hasBaseResults, headTotals, baseTotals }) {
  let coverageSummaryTable = `\`\`\`diff
@@                        Coverage Summary                     @@\n  ---------------------------------------------------------------\n`;

  let mdTable = await markdownTable(
    [
      ['Category', 'Master Branch', 'Current Branch', 'Covered / Total'],
      [
        'Statements',
        baseTotals.statements.pct + '%',
        headTotals.statements.pct + '%',
        headTotals.statements.covered + '/' + headTotals.statements.total,
      ],
      [
        'Branches',
        baseTotals.branches.pct + '%',
        headTotals.branches.pct + '%',
        headTotals.branches.covered + '/' + headTotals.branches.total,
      ],
      [
        'Functions',
        baseTotals.functions.pct + '%',
        headTotals.functions.pct + '%',
        headTotals.functions.covered + '/' + headTotals.functions.total,
      ],
      [
        'Lines',
        baseTotals.lines.pct + '%',
        headTotals.lines.pct + '%',
        headTotals.lines.covered + '/' + headTotals.lines.total,
      ],
    ],
    {
      align: ['l', 'c', 'c', 'c'],
    }
  );

  mdTable = mdTable.replaceAll(':', '-');
  mdTable = mdTable.replace('| Category', ' | Category');
  mdTable = mdTable.replace(
    '| ---------- | ------------- | -------------- | --------------- |',
    ' | ---------- | ------------- | -------------- | --------------- |'
  );
  mdTable = highlightRow(
    mdTable,
    'Statements',
    hasBaseResults,
    baseTotals.statements.pct,
    headTotals.statements.pct
  );
  mdTable = highlightRow(
    mdTable,
    'Branches',
    hasBaseResults,
    baseTotals.branches.pct,
    headTotals.branches.pct
  );
  mdTable = highlightRow(
    mdTable,
    'Functions',
    hasBaseResults,
    baseTotals.functions.pct,
    headTotals.functions.pct
  );
  mdTable = highlightRow(
    mdTable,
    'Lines',
    hasBaseResults,
    baseTotals.lines.pct,
    headTotals.lines.pct
  );

  coverageSummaryTable
    += mdTable + '\n  ---------------------------------------------------------------\n```';

  return coverageSummaryTable;
}

function CalculateTimeTaken(startedAt, endedAt) {
  const msDifference = endedAt - startedAt;
  const secondsTaken = Math.floor(msDifference / 1_000);
  const minutesTaken = Math.floor(msDifference / 1_000 / 60);
  const hoursTaken = Math.floor(msDifference / 1_000 / 60 / 60);

  let timeTaken = '';
  if (hoursTaken > 0) {
    timeTaken = `${hoursTaken} hours, `;
  }

  if (minutesTaken > 0) {
    timeTaken += `${minutesTaken} minutes and `;
  }

  if (secondsTaken > 0) {
    timeTaken += `${secondsTaken} seconds`;
  }

  return timeTaken;
}

function highlightRow(table, category, hasResults, basePercentage, headPercentage) {
  // Set row colors based on coverage changes
  if (!hasResults || headPercentage > basePercentage) {
    table = table.replace(`| ${category}`, `+| ${category}`);
  } else if (basePercentage === headPercentage) {
    table = table.replace(`| ${category}`, ` | ${category}`);
  } else {
    table = table.replace(`| ${category}`, `-| ${category}`);
  }

  return table;
}

module.exports = {
  BuildCommentBody,
  BuildCommentHeadMessage,
  BuildCoverageSummaryTable,
  CalculateTimeTaken,
};