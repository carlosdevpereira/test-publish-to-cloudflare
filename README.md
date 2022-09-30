# Test & Publish to Cloudflare

> This is a Github action that runs the unit tests of a repository, generates a test coverage report, uploads the report to Cloudflare Pages and comments the results on available pull requests.

## Requirements:
1. A Javascript repository, hosted on Github, using Jest for unit testing
2. A Cloudflare account with access to Cloudflare Pages and:
    - A Cloudflare API Token
    - The Cloudflare Account ID
    - A Cloudflare Pages project (to upload coverage reports)

## How to use:
In your repository, add the following step to your branch pushes workflow:

```yaml
    - name: Test & Publish to Cloudflare 🧪
        uses: carlosdevpereira/test-publish-to-cloudflare@v1
        with:
          branchName: ${{ github.ref_name }}
          githubToken: ${{ secrets.GITHUB_TOKEN }}
          cloudflareProjectName: THE_NAME_OF_YOUR_CLOUDFLARE_PROJECT
          cloudflareApiToken: ${{ secrets.CLOUDFLARE_API_TOKEN }}
          cloudflareAccountId: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
          baseCloudflareDeploymentUrl: THE_NAME_OF_YOUR_CLOUDFLARE_PROJECT.pages.dev
```

### Example workflow

```yaml
name: Build

on:
  push:
    branches:
      - "**"

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: "16"
          cache: "npm"

      - name: Install dependencies 📦
        run: npm ci

      - name: Test & Publish to Cloudflare 🧪
        uses: carlosdevpereira/test-publish-to-cloudflare@v1
        with:
          branchName: ${{ github.ref_name }}
          githubToken: ${{ secrets.GITHUB_TOKEN }}
          cloudflareProjectName: THE_NAME_OF_YOUR_CLOUDFLARE_PROJECT
          cloudflareApiToken: ${{ secrets.CLOUDFLARE_API_TOKEN }}
          cloudflareAccountId: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
          baseCloudflareDeploymentUrl: THE_NAME_OF_YOUR_CLOUDFLARE_PROJECT.pages.dev

      - name: Build app
        run: npm run build
```

### Expected parameters:

- **framework**: Defines which testing framework this action should use to run the tests of your repository. For now the only valid value is `jest` but `vitest` support will be added soon.

- **branchName**: The name of the branch that triggered the workflow. By default you may want the value of this parameter to be equal to the value of the context variable `github.ref_name`.

- **githubToken**: The token that this action should use to authenticate requests to the Github API.

- **cloudflareApiToken**: The API Token generated on Cloudflare. Ideally this token should be saved in the repository secrets and shoudn't be shared.

- **cloudflareAccountId**: The Account ID of the Cloudflare account that matches the API Token passed in. This parameter should also be saves in a repository secret.

- **cloudflareProjectName**: The name of the project on Cloudflare Pages that will receive the coverage reports.

- **baseCloudflareDeploymentUrl**: The base URL for deployment previews of your Cloudflare Pages project. Example: If you create a project named `my-awesome-project` on Cloudflare Pages, by default, the base URL will be: `my-awesome-project.pages.dev`. This URL can also be a custom domain defined in Cloudflare.