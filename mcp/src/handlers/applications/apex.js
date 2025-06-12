import fetch from 'node-fetch';
import { handleFetchWithToolkitCheck } from '../util.js';
import { ENDPOINTS } from '../../../../shared.js';
import { z } from 'zod';

function register(server, context) {
    server.tool(
        'Apex_executeAnonymous',
        `Execute anonymous Apex code for a given org alias in the SF Toolkit`,
        {
            alias: z.string().describe('The alias of the org'),
            body: z.string().describe('Apex code to execute anonymously'),
            //logLevel: z.string().optional().describe('Log level for execution (defaults to DEBUG)'),
            tabId: z.string().optional().describe('The ID of the Apex tab to navigate to'),
        },
        async (params) => {
            const result = await handleFetchWithToolkitCheck(
                fetch(`${context.apiUrl}${ENDPOINTS.ANONYMOUS_APEX_EXECUTE}`, {
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
                            text: result.data.message || 'Apex execution failed',
                        },
                    ],
                };
            }
        },
    );
}

export default { register };
