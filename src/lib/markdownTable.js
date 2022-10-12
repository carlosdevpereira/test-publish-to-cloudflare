module.exports = {
    markdownTable: async (table, options) => {
        // Dynamic import() works in function awaits or promises
        // NOTE: Could memoize the `import()` to cache after 1st call.
        const { markdownTable } = await import("markdown-table");

        return markdownTable(table, options)
    }
};