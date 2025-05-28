const { z } = require('zod');

function register(server, context) {
    server.tool('Documentation.searchDocumentation', {}, async (params) => {
        // TODO: Implement logic to search documentation
        return { results: [] };
    });
}

module.exports = { register };
