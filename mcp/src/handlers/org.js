import fetch from 'node-fetch';
import { z } from 'zod';
import { handleFetchWithToolkitCheck } from './util.js';
import { ENDPOINTS } from '../../../shared.js';

function register(server, context) {
    server.tool(
        'Org_getListOfOrgs',
        `Get list of orgs that are stored in the local storage. The list of orgs includes the orgs that are stored in the local storage and the orgs that are stored in the sfdx orgs.`,
        async (params) => {
            const result = await handleFetchWithToolkitCheck(
                fetch(`${context.apiUrl}${ENDPOINTS.GET_LIST_OF_ORGS}`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                }),
            );
            if (result.content) return result;
            return {
                content: [
                    {
                        type: 'text',
                        text: JSON.stringify(result.data.orgs),
                    },
                ],
            };
        },
    );
    // If OAuth is disabled, we don't need to fetch the sessionId and serverUrl
    if (!context.isOauthDisabled) {
        server.tool(
            'Org_getSessionIdAndServerUrl',
            `Fetch sessionId and serverUrl for a given org or alias.`,
            {
                alias: z.string().describe('Alias of the org'),
            },
            async (params) => {
                const result = await handleFetchWithToolkitCheck(
                    fetch(`${context.apiUrl}${ENDPOINTS.GET_SESSION_ID_AND_SERVER_URL}`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(params),
                    }),
                );
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
}

export default { register };
