# Test & Publish to Cloudflare

> This is a Github action that runs the unit tests of a repository, generates a test coverage report, uploads the report to Cloudflare Pages and comments the results on available pull requests.

## Requirements:
1. A Javascript repository, hosted on Github, using Jest for unit testing
2. A Cloudflare account with access to Cloudflare Pages and:
    - A Cloudflare API Token
    - The Cloudflare Account ID

