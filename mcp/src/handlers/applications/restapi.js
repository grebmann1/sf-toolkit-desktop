import fetch from 'node-fetch';
import { handleFetchWithToolkitCheck } from '../util.js';
import { ENDPOINTS } from '../../../../shared.js';
import { z } from 'zod';

function register(server, context) {
    server.tool(
        'API_execute',
        `Execute a REST API call for a given org alias in the SF Toolkit`,
        {
            alias: z.string().describe('The alias of the org'),
            method: z.string().describe('The HTTP method to use (GET, POST, PUT, DELETE)'),
            endpoint: z.string().describe('The endpoint to call, e.g. /services/data/v63.0/sobjects/Account'),
            headers: z.record(z.string()).optional().describe('Headers as a key-value object'),
            body: z.string().optional().describe('The body of the request'),
            tabId: z.string().optional().describe('The ID of the REST API tab to navigate to'),
        },
        async (params) => {
            const result = await handleFetchWithToolkitCheck(
                fetch(`${context.apiUrl}${ENDPOINTS.REST_API_EXECUTE}`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(params),
                }),
            );
            if (result.content) return result;
            if (result.response.ok) {
                return {
                    content: [
                        {
                            type: 'text',
                            text: JSON.stringify(result.data),
                        },
                    ],
                };
            } else {
                return {
                    content: [
                        {
                            type: 'text',
                            text: result.data.message || 'Run API failed',
                        },
                    ],
                };
            }
        },
    );
    server.tool(
        'API_scripts',
        `Fetch the list of saved API scripts for a given org alias in the SF Toolkit`,
        {
            alias: z.string().describe('The alias of the org'),
        },
        async (params) => {
            const result = await handleFetchWithToolkitCheck(
                fetch(`${context.apiUrl}${ENDPOINTS.REST_API_SCRIPTS}`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(params),
                }),
            );
            if (result.content) return result;
            if (result.response.ok) {
                return {
                    content: [
                        {
                            type: 'text',
                            text: JSON.stringify(result.data),
                        },
                    ],
                };
            } else {
                return {
                    content: [
                        {
                            type: 'text',
                            text: result.data.message || 'Fetch scripts failed',
                        },
                    ],
                };
            }
        },
    );
}

export default { register };
