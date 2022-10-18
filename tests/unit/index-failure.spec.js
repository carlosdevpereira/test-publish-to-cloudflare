const errorMessage = 'Unexpected error occurred';

jest.mock('@/Action', () => jest.fn(() => {
  return {
    ...require('@tests/mocks/action'),
    runTests: () => {
      throw new Error(errorMessage);
    }
  };
}));

describe('Action Setup -> failure', () => {
  const core = require('@actions/core');

  it('reports to github that the action failed', () => {
    try {
      require('@/index');
    } catch (e) {
      expect(core.setFailed).toHaveBeenCalledWith(errorMessage);
    }
  });
});