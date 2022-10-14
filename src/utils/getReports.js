function TotalPercentagesAverage(report) {
  const percentages = [
    report.summary.total.lines.pct,
    report.summary.total.statements.pct,
    report.summary.total.functions.pct,
    report.summary.total.branches.pct,
  ];

  return (
    percentages.reduce((a, b) => {
      return a + b;
    }, 0) / percentages.length
  );
}

module.exports = {
  TotalPercentagesAverage,
};