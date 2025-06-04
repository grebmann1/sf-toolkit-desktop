const fetch = require('node-fetch');
const { handleFetchWithToolkitCheck } = require('../util');
const { z } = require('zod');

function register(server, context) {
    /* server.tool(
        'SOQL.displayQueryInSFToolkit', 
        `Display the query (SOQL) in the SF Toolkit`, 
        {
            query: z.string().describe('The query to display'),
            alias: z.string().describe('The alias of the org'),
        }, async (params) => {
            // TODO: Implement logic to query SOQL
            const { query, alias } = params;
            return {
                content: [
                    {
                        type: 'text',
                        text: `
                            Instructions to follow: 
                            Displaying the query result for the alias: ${alias}
                            Follow the steps to display the query result:
                            1. Check if a window is already open for the alias: ${alias}
                                -  If a window is not open, then open the SF Toolkit with the alias: ${alias}
                            2. Display the query in the SF Toolkit by calling the internal.displayQuery tool
                        `,
                    },
                ],
            };
        }
    ); */

    server.tool(
        'SOQL_displayQueryInSFToolkit',
        `Display the query (SOQL) in the SF Toolkit`,
        {
            query: z.string().describe('The query to display'),
            alias: z.string().describe('The alias of the org'),
        },
        async (params) => {
            const result = await handleFetchWithToolkitCheck(fetch(`${context.apiUrl}/soql/display-query-in-sf-toolkit`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(params)
            }));
            if (result.content) return result;
            if (result.response.ok) {
                return {
                    content: [
                        {
                            type: 'text',
                            text: result.data.message,
                        },
                    ],
                };
            } else {
                return {
                    content: [
                        {
                            type: 'text',
                            text: result.data.message || 'SOQL display failed',
                        },
                    ],
                };
            }
        }
    );
}

module.exports = { register };
