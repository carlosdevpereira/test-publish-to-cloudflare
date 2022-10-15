const coverageSummaryFixture = require('@tests/fixtures/coverage-summary.json');

describe('Framework -> Happy path', () => {
  const fs = require('node:fs');
  jest.spyOn(fs, 'readFileSync').mockImplementation(() => {
    return coverageSummaryFixture;
  });

  const Framework = require('@/Framework');
  const testingFrameworkInstance = new Framework('jest');

  it('returns an instance of a Framework', () => {
    expect(testingFrameworkInstance.name).toBe('jest');
    expect(testingFrameworkInstance.testResults).toBe(null);

    expect(typeof testingFrameworkInstance.runTests).toBe('function');
  });
});