jest.mock('shellac', () => {
  return {
    default: jest.fn(),
  };
});

describe('Cloudflare', () => {
  const shellac = require('shellac').default;
  const Cloudflare = require('@/Cloudflare');
  const cloudflareInstance = new Cloudflare({
    accountId: 'account-id',
    apiToken: 'api-token',
    baseUrl: 'project-url.pages.dev',
    projectName: 'project-name',
  });

  it('returns an instance of Cloudflare', () => {
    expect(cloudflareInstance.apiToken).toBe('api-token');
    expect(cloudflareInstance.accountId).toBe('account-id');
    expect(cloudflareInstance.projectName).toBe('project-name');
    expect(cloudflareInstance.baseUrl).toBe('project-url.pages.dev');

    expect(typeof cloudflareInstance.publish).toBe('function');
  });

  describe('publish method', () => {
    let reportUrl;

    beforeAll(async () => {
      reportUrl = await cloudflareInstance.publish('1234');
    });

    it('publishes to cloudflare', () => {
      expect(shellac).toHaveBeenCalledWith(
        [
          '\n    $ export CLOUDFLARE_API_TOKEN="',
          '"\n    $ export CLOUDFLARE_ACCOUNT_ID="',
          '"\n    $$ npx wrangler@2 pages publish "',
          '" --project-name="',
          '" --branch="',
          '"',
        ],
        'api-token',
        'account-id',
        './coverage',
        'project-name',
        '1234'
      );
    });

    it('returns the report url', () => {
      expect(reportUrl).toBe('https://1234.project-url.pages.dev');
    });
  });
});