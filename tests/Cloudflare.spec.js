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

  it('publishes to cloudflare', async () => {
    await cloudflareInstance.publish('1234');

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

  it('returns the report url', async () => {
    const reportUrl = await cloudflareInstance.publish('1234');

    expect(reportUrl).toBe('https://1234.project-url.pages.dev');
  });
});