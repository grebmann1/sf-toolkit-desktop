const fetch = require('node-fetch');
const { handleFetchWithToolkitCheck } = require('./util');

function register(server, context) {
    server.tool('Documentation_searchDocumentation', {}, async (params) => {
        const result = await handleFetchWithToolkitCheck(fetch(`${context.apiUrl}/documentation/search`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(params)
        }));
        if (result.content) return result;
        return {
            content: [
                {
                    type: 'text',
                    text: JSON.stringify(result.data.results),
                },
            ],
        };
    });
}

module.exports = { register };
