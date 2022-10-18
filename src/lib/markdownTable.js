/* istanbul ignore file */
module.exports = {
  markdownTable: async (table, options) => {
    const { markdownTable } = await import('markdown-table');
    return markdownTable(table, options);
  },
};