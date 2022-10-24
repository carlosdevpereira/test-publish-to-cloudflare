const fs = require('node:fs');
const { exec } = require('@actions/exec');

const SUPPORTED_TEST_FRAMEWORKS = ['jest'];
const COVERAGE_OUTPUT_FOLDER = './coverage';

class Framework {
  constructor(frameworkName) {
    if (!SUPPORTED_TEST_FRAMEWORKS.includes(frameworkName)) {
      throw new Error(
        'Unsupported test framework selected. Valid options are: '
        + SUPPORTED_TEST_FRAMEWORKS.join(', ')
      );
    }

    this.name = frameworkName;
    this.testResults = null;
  }

  /**
   * Runs the unit tests for the selected test framework.
   *
   * (If you use a different framework, and would like
   * to use this action, feel free to open a feature request
   * in this repository 😉).
   */
  async runTests() {
    const JEST_PATH = 'node --experimental-vm-modules ./node_modules/jest/bin/jest.js';
    const JEST_FLAGS = '--no-cache --detectOpenHandles --coverage --json';

    let testRunStats = '';
    await exec(`${JEST_PATH} ${JEST_FLAGS}`, undefined, {
      listeners: {
        stdout: (data) => {
          testRunStats += data.toString();
        },
      },
    });

    const coverageSummary = fs.readFileSync(`${COVERAGE_OUTPUT_FOLDER}/coverage-summary.json`, 'utf-8');

    this.testResults = parseTestResults(
      JSON.parse(testRunStats),
      JSON.parse(coverageSummary)
    );

    return this.testResults;
  }
}

const parseTestResults = (testRunStats, coverageSummary) => {
  const percentage = Math.floor([
    coverageSummary.total.lines.pct,
    coverageSummary.total.statements.pct,
    coverageSummary.total.functions.pct,
    coverageSummary.total.branches.pct,
  ].reduce((a, b) => {
    return a + b;
  }, 0) / 4);

  const summary = {
    statements: {
      total: coverageSummary.total.statements.total,
      covered: coverageSummary.total.statements.covered,
      skipped: coverageSummary.total.statements.skipped,
      percentage: coverageSummary.total.statements.pct,
    },
    lines: {
      total: coverageSummary.total.lines.total,
      covered: coverageSummary.total.lines.covered,
      skipped: coverageSummary.total.lines.skipped,
      percentage: coverageSummary.total.lines.pct,
    },
    functions: {
      total: coverageSummary.total.functions.total,
      covered: coverageSummary.total.functions.covered,
      skipped: coverageSummary.total.functions.skipped,
      percentage: coverageSummary.total.functions.pct,
    },
    branches: {
      total: coverageSummary.total.branches.total,
      covered: coverageSummary.total.branches.covered,
      skipped: coverageSummary.total.branches.skipped,
      percentage: coverageSummary.total.branches.pct,
    },
  };

  const stats = {
    startTime: testRunStats.startTime,
    endTime: testRunStats.testResults[testRunStats.testResults.length - 1].endTime,
    testSuites: {
      total: testRunStats.numTotalTestSuites,
      passed: testRunStats.numPassedTestSuites,
      failed: testRunStats.numFailedTestSuites
    },
    tests: {
      total: testRunStats.numTotalTests,
      passed: testRunStats.numPassedTests,
      failed: testRunStats.numFailedTests
    },
    snapshots: {
      total: testRunStats.snapshot.total
    }
  };

  return {
    coverage: {
      summary,
      percentage,
      badges: {
        coverage: createCoverageBadge(percentage),
        tests: createTestsBadge(stats.tests),
      }
    },

    stats
  };
};

const createCoverageBadge = (percentage) => {
  let color = 'lightgrey';

  if (percentage >= 90) color = 'brightgreen';
  else if (percentage >= 75) color = 'green';
  else if (percentage >= 50) color = 'yellowgreen';
  else if (percentage >= 35) color = 'yellow';
  else color = 'red';

  return `https://img.shields.io/badge/Coverage-${percentage}&#65130;-${color}`;
};

const createTestsBadge = (tests) => {
  let color = 'lightgrey';

  if (tests.total === tests.passed) color = 'brightgreen';
  else if (tests.failed > 0) color = 'red';
  else color = 'yellow';

  return `https://img.shields.io/badge/Tests-%E2%9C%94%20${tests.passed}%20%7C%20%E2%9C%98%20${tests.failed}%20%7C%20%E2%8C%80%20${tests.total - tests.passed - tests.failed}-${color}`;
};

module.exports = Framework;