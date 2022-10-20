const core = require('@actions/core');
const context = require('@tests/fixtures/github-action-context');

describe('Action Setup -> Happy path', () => {
  const mockAction = require('@tests/mocks/action');
  jest.mock('@/Action', () => jest.fn(() => mockAction));

  const GithubAction = require('@/Action');

  const setupEnvironmentVariables = () => {
    process.env.INPUT_GITHUBTOKEN = '1234';
    process.env.INPUT_CLOUDFLAREPROJECTNAME = 'my-cloudflare-project';
    process.env.INPUT_CLOUDFLAREAPITOKEN = 'cloudflare-api-token';
    process.env.INPUT_CLOUDFLAREACCOUNTID = 'cloudflare-account-id';
  };

  describe('Requirements', () => {
    beforeAll(() => {
      setupEnvironmentVariables();

      require('@/index');
    });

    it('checks if a github token was defined', () => {
      expect(core.getInput).toHaveBeenCalledWith('githubToken', {
        required: true,
      });
    });

    it('checks if the cloudflare project name was defined', () => {
      expect(core.getInput).toHaveBeenCalledWith('cloudflareProjectName', {
        required: true,
      });
    });

    it('checks if the cloudflare api token was defined', () => {
      expect(core.getInput).toHaveBeenCalledWith('cloudflareApiToken', {
        required: true,
      });
    });

    it('checks if the cloudflare account id was defined', () => {
      expect(core.getInput).toHaveBeenCalledWith('cloudflareAccountId', {
        required: true,
      });
    });
  });

  describe('Runs the action', () => {
    beforeAll(async () => {
      setupEnvironmentVariables();

      require('@/index');
    });

    it('initializes the github action instance', () => {
      expect(GithubAction).toHaveBeenCalled();
      expect(GithubAction).toHaveBeenCalledWith(context, expect.objectContaining({
        github: {
          branch: 'github-branch-name'
        }
      }));
    });

    it('runs the unit tests of the project', () => {
      expect(mockAction.runTests).toHaveBeenCalled();
    });

    it('saves the test results', () => {
      expect(mockAction.saveTestResults).toHaveBeenCalled();
    });

    it('publishes the results to cloudflare', () => {
      expect(mockAction.publishToCloudflare).toHaveBeenCalled();
    });

    it('comments the results in available pull requests', () => {
      expect(mockAction.commentOnAvailablePullRequests).toHaveBeenCalled();
    });
  });
});