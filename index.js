const core = require("@actions/core");
const github = require("@actions/github");
const { exec } = require("@actions/exec");
const fs = require("fs");
const shellac = require("shellac");

const SUPPORTED_TEST_FRAMEWORKS = ["jest"];
const COVERAGE_OUTPUT_FOLDER = "./coverage";

// 🚀 Execute Github Action
(async () => {
  try {
    /**
     * Retrieve all input values provided to
     * the Github Action so that we can later use them
     **/
    const input = {
      framework: core.getInput("framework"),
      githubToken: core.getInput("githubToken", { required: true }),
      cloudflareProjectName: core.getInput("cloudflareProjectName", {
        required: true,
      }),
      cloudflareApiToken: core.getInput("cloudflareApiToken", {
        required: true,
      }),
      cloudflareAccountId: core.getInput("cloudflareAccountId", {
        required: true,
      }),
      baseCloudflareDeploymentUrl: core.getInput("baseCloudflareDeploymentUrl"),
    };

    /**
     * Check if requested test framework is supported
     *
     * (For now, the only test framwork supported is `Jest`,
     * but support for `Vitest` will be added soon.)
     **/
    if (!SUPPORTED_TEST_FRAMEWORKS.includes(input.framework)) {
      throw new Error(
        "Unsupported test framework selected. Valid options are: " +
          SUPPORTED_TEST_FRAMEWORKS.join(", ")
      );
    }

    /**
     * Runs the unit tests for the selected test framework.
     *
     * (If you use a different framework, and would like
     * to use this action, feel free to open a feature request
     * in this repository 😉).
     **/
    let testOutput = "";

    if (input.framework === "jest") {
      core.startGroup("Running Jest Tests...");
      const JEST_PATH = "./node_modules/jest/bin/jest.js";
      const JEST_FLAGS = "--no-cache --detectOpenHandles --coverage --json";
      const RESULT_OUTPUT_FILE = `${COVERAGE_OUTPUT_FOLDER}/test-results.json`;

      await exec(`${JEST_PATH} ${JEST_FLAGS}`, undefined, {
        listeners: {
          stdout: (data) => {
            testOutput += data.toString();
          },
        },
      });

      fs.writeFileSync(RESULT_OUTPUT_FILE, testOutput);

      core.info("Test output: ", testOutput);
      core.endGroup();
    }

    /**
     * Calculate short version of commit hash
     * to use as the Cloudflare preview alias
     **/
    core.startGroup("Calculating commit short hash...");

    const command = `git rev-parse --short ${github.context.sha}`;
    let commitShortHash = "";
    await exec(command, undefined, {
      listeners: {
        stdout: (data) => {
          commitShortHash += data.toString();
        },
      },
    });

    core.info("Calculated commit short hash: " + commitShortHash);
    core.endGroup();

    /**
     * Now that we have the coverage report and
     * summary file generated, we will upload them to
     * Cloudflare Pages.
     **/
    core.startGroup("Uploading to Cloudflare Pages...");

    await shellac`
    $ export CLOUDFLARE_API_TOKEN="${input.cloudflareApiToken}"
    $ export CLOUDFLARE_ACCOUNT_ID="${input.cloudflareAccountId}"

    $$ npx wrangler@2 pages publish "${COVERAGE_OUTPUT_FOLDER}" --project-name="${input.cloudflareProjectName}" --branch="${commitShortHash}"
    `;

    core.endGroup();
  } catch (error) {
    core.setFailed(error.message);
  }
})();
