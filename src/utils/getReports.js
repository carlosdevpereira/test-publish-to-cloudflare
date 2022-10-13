const core = require('@actions/core');
const { HttpClient } = require('@actions/http-client');

async function GetReport({ reportUrl, retryCount = 3, ignoreErrors = false } = {}) {
  try {
    const http = new HttpClient();
    const res = await http.get(reportUrl);
    const body = await res.readBody();

    return JSON.parse(body);
  } catch (error) {
    if (retryCount === 0) {
      if (!ignoreErrors) {
        throw error;
      }
    } else {
      core.warning('Cloudflare pages request failed. Retrying...');
      await new Promise((resolve) => {
        return setTimeout(resolve, 2_500);
      });

      return await GetReport({
        reportUrl,
        retryCount: retryCount - 1,
      });
    }
  }
}

function TotalPercentagesAverage(report) {
  const percentages = [
    report.total.lines.pct,
    report.total.statements.pct,
    report.total.functions.pct,
    report.total.branches.pct,
  ];

  return (
    percentages.reduce((a, b) => {
      return a + b;
    }, 0) / percentages.length
  );
}

module.exports = {
  GetReport,
  TotalPercentagesAverage,
};