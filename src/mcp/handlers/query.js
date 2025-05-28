const { z } = require('zod');

function register(server, context) {
    server.tool('Query.querySOQL', {}, async (params) => {
        // TODO: Implement logic to query SOQL
        return { records: [] };
    });
    server.tool('Query.getListOfSavedQueries', {}, async (params) => {
        // TODO: Implement logic to get list of saved queries
        return { queries: [] };
    });
}

module.exports = { register };
