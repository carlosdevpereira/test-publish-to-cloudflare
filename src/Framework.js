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

    this.testResults = {
      stats: JSON.parse(testRunStats),
      summary: JSON.parse(coverageSummary)
    };

    return this.testResults;
  }
}

module.exports = Framework;