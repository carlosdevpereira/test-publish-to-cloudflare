const fs = require('node:fs');
const exec = require('@actions/exec');

const testResults = require('@tests/fixtures/test-stats.json');
const coverageSummaryFixture = require('@tests/fixtures/coverage-summary.json');

jest.spyOn(fs, 'readFileSync').mockImplementation(() => JSON.stringify(coverageSummaryFixture));
jest.spyOn(exec, 'exec').mockImplementation((commandToExecute, args, options) => {
  if (options && options.listeners && options.listeners.stdout) {
    options.listeners.stdout(JSON.stringify(testResults));
  }
});

describe('Framework -> Happy path', () => {
  const Framework = require('@/Framework');
  const testingFrameworkInstance = new Framework('jest');

  it('returns an instance of a Framework', () => {
    expect(testingFrameworkInstance.name).toBe('jest');
    expect(testingFrameworkInstance.testResults).toBe(null);

    expect(typeof testingFrameworkInstance.runTests).toBe('function');
  });

  describe('runTests method', () => {
    let results;
    beforeAll(async () => {
      results = await testingFrameworkInstance.runTests();
    });

    it('executes the jest command with correct options', () => {
      expect(exec.exec).toHaveBeenCalledWith('node --experimental-vm-modules ./node_modules/jest/bin/jest.js --no-cache --detectOpenHandles --coverage --json', undefined, expect.anything());
    });

    it('reads the coverage summary and returns the test results', () => {
      expect(fs.readFileSync).toHaveBeenCalledWith('./coverage/coverage-summary.json', 'utf-8');

      expect(results).toStrictEqual({
        stats: testResults,
        summary: coverageSummaryFixture
      });
    });
  });
});