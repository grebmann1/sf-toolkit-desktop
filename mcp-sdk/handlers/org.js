const fetch = require('node-fetch');
const { z } = require('zod');
const { handleFetchWithToolkitCheck } = require('./util');

function register(server, context) {
    server.tool('Org_getListOfOrgs', `Get list of orgs that are stored in the local storage. The list of orgs includes the orgs that are stored in the local storage and the orgs that are stored in the sfdx orgs.`, async (params) => {
        const result = await handleFetchWithToolkitCheck(fetch(`${context.apiUrl}/org/get-list-of-orgs`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
        }));
        if (result.content) return result;
        return {
            content: [
                {
                    type: 'text',
                    text: JSON.stringify(result.data.orgs),
                },
            ],
        };
    });
    server.tool(
        'Org_getSessionIdAndServerUrl',
        `Fetch sessionId and serverUrl for a given org or alias.`,
        {
            alias: z.string().describe('Alias of the org'),
        },
        async (params) => {
            const result = await handleFetchWithToolkitCheck(fetch(`${context.apiUrl}/org/get-session-id-and-server-url`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(params)
            }));
            if (result.content) return result;
            return {
                content: [
                    {
                        type: 'text',
                        text: JSON.stringify(result.data),
                    },
                ],
            };
        },
    );
}

module.exports = { register };
