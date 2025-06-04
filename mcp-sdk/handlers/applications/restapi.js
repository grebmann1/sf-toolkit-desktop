const fetch = require('node-fetch');
const { handleFetchWithToolkitCheck } = require('../util');

function register(server, context) {
    server.tool('RestAPI_restAPI', {}, async (params) => {
        const result = await handleFetchWithToolkitCheck(fetch(`${context.apiUrl}/restapi/rest-api`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(params)
        }));
        if (result.content) return result;
        return {
            content: [
                {
                    type: 'text',
                    text: JSON.stringify(result.data.response),
                },
            ],
        };
    });
    server.tool('RestAPI_getListOfSavedAPIScripts', {}, async (params) => {
        const result = await handleFetchWithToolkitCheck(fetch(`${context.apiUrl}/restapi/get-list-of-saved-api-scripts`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(params)
        }));
        if (result.content) return result;
        return {
            content: [
                {
                    type: 'text',
                    text: JSON.stringify(result.data.scripts),
                },
            ],
        };
    });
}

module.exports = { register };
