const core = require('@actions/core');

const Commit = require('./Commit');
const markdownTable = require('./lib/markdownTable').markdownTable;

class PullRequest {
  constructor(pullRequest, repository, github) {
    this.number = pullRequest.number;
    this.repository = repository;
    this.github = github;

    this.baseBranchName = pullRequest.base.ref;
    this.baseCommit = new Commit(pullRequest.base.sha, repository);

    this.headBranchName = pullRequest.head.ref;
    this.headCommit = new Commit(pullRequest.head.sha, repository);
  }

  async getResults() {
    const results = await Promise.all([
      this.baseCommit.getComment(),
      this.headCommit.getComment(),
    ]);

    const baseResult = JSON.parse(results[0].body);
    const headResult = JSON.parse(results[1].body);

    return {
      base: baseResult,
      head: headResult
    };
  }

  async getComments() {
    core.info('Searching for comments on pull request #`' + this.number + '`...');

    const { data: comments } = await this.github.rest.issues.listComments({
      issue_number: this.number,
      owner: this.repository.owner,
      repo: this.repository.name,
    });

    return comments;
  }

  async buildComment(coverageReportUrl) {
    const results = await this.getResults();

    const timeTaken = calculateTimeTaken(
      results.head.stats.startTime,
      results.head.stats.testResults[results.head.stats.testResults.length - 1].endTime
    );

    const comment = await buildCommentBody({
      results,
      timeTaken,
      coverageReportUrl,
      baseBranchName: this.baseBranchName,
      headBranchName: this.headBranchName,
      baseCommit: this.baseCommit.shortHash(),
      headCommit: this.headCommit.shortHash(),
    });

    return comment;
  }

  async addComment(comment) {
    const comments = await this.getComments();
    const botComment = comments.find((comment) => {
      return comment.user.id === 41_898_282;
    });

    if (botComment) {
      core.info('Updating comment for pull request #`' + this.number + '`...');

      await this.github.rest.issues.updateComment({
        body: comment,
        comment_id: botComment.id,
        owner: this.repository.owner,
        repo: this.repository.name,
      });

      core.info('Comment for pull request #`' + this.number + '` updated successfully!');
    } else {
      core.info('Creating a new comment for pull request #`' + this.number + '`...');

      await this.github.rest.issues.createComment({
        body: comment,
        issue_number: this.number,
        owner: this.repository.owner,
        repo: this.repository.name,
      });

      core.info('Comment for pull request #`' + this.number + '` created successfully!');
    }
  }
}

const getResultAverage = (result) => {
  const percentages = [
    result.summary.total.lines.pct,
    result.summary.total.statements.pct,
    result.summary.total.functions.pct,
    result.summary.total.branches.pct,
  ];

  return (
    percentages.reduce((a, b) => {
      return a + b;
    }, 0) / percentages.length
  );
};

const buildCommentHead = (results, baseBranch, headBranch) => {
  const headCoverage = getResultAverage(results.head);
  const baseCoverage = getResultAverage(results.base);

  let headMessage;

  if (headCoverage > baseCoverage) {
    headMessage = '> Wooo 🎉, the tests are passing and the coverage percentage **increased**, well done! 👏\n';
    headMessage += `> ${baseBranch}: **${Math.round(baseCoverage, -1)}%** | ${headBranch}: **${Math.round(headCoverage, -1)}%**`;
  } else if (headCoverage === baseCoverage) {
    headMessage = '> Good job 👌, the tests are passing and the coverage percentage remained intact.';
  } else {
    headMessage = '> Tests are passing but the coverage percentage **decreased** 😱, read coverage report below for more details.\n\n';
    headMessage += `🔻 ${baseBranch}: **${Math.round(baseCoverage, -1)}%** | ${headBranch}: **${Math.round(headCoverage, -1)}%** 🔻`;
  }

  return headMessage;
};

const buildCommentSummaryTable = async (results) => {
  let coverageSummaryTable = `\`\`\`diff
  @@                        Coverage Summary                     @@\n  ---------------------------------------------------------------\n`;

  let mdTable = await markdownTable(
    [
      ['Category', 'Master Branch', 'Current Branch', 'Covered / Total'],
      [
        'Statements',
        results.base.summary.total.statements.pct + '%',
        results.head.summary.total.statements.pct + '%',
        results.head.summary.total.statements.covered + '/' + results.head.summary.total.statements.total,
      ],
      [
        'Branches',
        results.base.summary.total.branches.pct + '%',
        results.head.summary.total.branches.pct + '%',
        results.head.summary.total.branches.covered + '/' + results.head.summary.total.branches.total,
      ],
      [
        'Functions',
        results.base.summary.total.functions.pct + '%',
        results.head.summary.total.functions.pct + '%',
        results.head.summary.total.functions.covered + '/' + results.head.summary.total.functions.total,
      ],
      [
        'Lines',
        results.base.summary.total.lines.pct + '%',
        results.head.summary.total.lines.pct + '%',
        results.head.summary.total.lines.covered + '/' + results.head.summary.total.lines.total,
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
    Boolean(results.base),
    results.base.summary.total.statements.pct,
    results.head.summary.total.statements.pct
  );
  mdTable = highlightRow(
    mdTable,
    'Branches',
    Boolean(results.base),
    results.base.summary.total.branches.pct,
    results.head.summary.total.branches.pct
  );
  mdTable = highlightRow(
    mdTable,
    'Functions',
    Boolean(results.base),
    results.base.summary.total.functions.pct,
    results.head.summary.total.functions.pct
  );
  mdTable = highlightRow(
    mdTable,
    'Lines',
    Boolean(results.base),
    results.base.summary.total.lines.pct,
    results.head.summary.total.lines.pct
  );

  coverageSummaryTable
      += mdTable + '\n  ---------------------------------------------------------------\n```';

  return coverageSummaryTable;
};

const highlightRow = (table, category, hasResults, basePercentage, headPercentage) => {
  // Set row colors based on coverage changes
  if (!hasResults || headPercentage > basePercentage) {
    table = table.replace(`| ${category}`, `+| ${category}`);
  } else if (basePercentage === headPercentage) {
    table = table.replace(`| ${category}`, ` | ${category}`);
  } else {
    table = table.replace(`| ${category}`, `-| ${category}`);
  }

  return table;
};

const calculateTimeTaken = (startedAt, endedAt) => {
  const msDifference = endedAt - startedAt;
  const secondsTaken = Math.floor(msDifference / 1000);
  const minutesTaken = Math.floor(msDifference / 1000 / 60);
  const hoursTaken = Math.floor(msDifference / 1000 / 60 / 60);

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
};

const buildCommentBody = async ({
  results,
  headBranchName,
  baseBranchName,
  headCommit,
  baseCommit,
  timeTaken,
  coverageReportUrl
}) => {
  const headMessage = buildCommentHead(results, baseBranchName, headBranchName);
  const summaryTable = await buildCommentSummaryTable(results);

  const commentBody = `## 🔖 Coverage Report
  
  ${headMessage}
  
  ${summaryTable}
  
  <details>
  <summary>Metrics</summary>
  
  - Test Suites: **${results.head.stats.numPassedTestSuites} passed**, ${
  results.head.stats.numTotalTestSuites
} total
  - Tests: **${results.head.stats.numPassedTests} passed**, ${results.head.stats.numTotalTests} total
  - Snapshots: **${results.head.stats.snapshot.total} total**
  - Time: **${timeTaken}**
  </details>
      
  > Coverage data is based on head branch **${headBranchName}** (\`${headCommit}\`) compared to base branch **${baseBranchName}** (\`${baseCommit}\`).
      
  [View full coverage report 🔗](${coverageReportUrl})`;

  return commentBody;
};

module.exports = PullRequest;