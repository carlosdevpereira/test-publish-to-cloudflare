import fs from 'fs';
import { exec } from '@actions/exec';

const SUPPORTED_TEST_FRAMEWORKS = ['jest'];
const COVERAGE_OUTPUT_FOLDER = './coverage';

/**
 * Represents a testing framework
 */
export default class Framework {
  constructor(frameworkName) {
    if (!SUPPORTED_TEST_FRAMEWORKS.includes(frameworkName)) {
      throw new Error(
        'Unsupported test framework selected. Valid options are: ' + SUPPORTED_TEST_FRAMEWORKS.join(', ')
      );
    }

    this.name = frameworkName;
    this.testResults = '';
  }

  /**
   * Runs the unit tests for the selected test framework.
   *
   * (If you use a different framework, and would like
   * to use this action, feel free to open a feature request
   * in this repository 😉).
   **/
  async runTests() {
    const JEST_PATH = './node_modules/jest/bin/jest.js';
    const JEST_FLAGS = '--no-cache --detectOpenHandles --coverage --json';
    const RESULT_OUTPUT_FILE = `${COVERAGE_OUTPUT_FOLDER}/test-results.json`;

    let results = '';
    await exec(`${JEST_PATH} ${JEST_FLAGS}`, undefined, {
      listeners: {
        stdout: data => {
          results += data.toString();
        }
      }
    });

    fs.writeFileSync(RESULT_OUTPUT_FILE, results);
    this.testResults = JSON.parse(results);

    return this.testResults;
  }
}