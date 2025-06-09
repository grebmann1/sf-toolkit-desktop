const fetch = require('node-fetch');
const { handleFetchWithToolkitCheck } = require('../util');
const { z } = require('zod');
const { ENDPOINTS } = require('../../../../shared');

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
            tabId: z.string().describe('The ID of the SOQL tab to navigate to').optional(),
        },
        async (params) => {
            const result = await handleFetchWithToolkitCheck(fetch(`${context.apiUrl}${ENDPOINTS.SOQL_QUERY}`, {
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

    server.tool(
        'SOQL_navigateTab',
        `Navigate to a specific SOQL tab in the SF Toolkit for a given org alias and tabId`,
        {
            tabId: z.string().describe('The ID of the SOQL tab to navigate to'),
            alias: z.string().describe('The alias of the org'),
        },
        async (params) => {
            const result = await handleFetchWithToolkitCheck(fetch(`${context.apiUrl}${ENDPOINTS.SOQL_NAVIGATE_TAB}`, {
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
                            text: result.data.message || 'Tab navigation successful',
                        },
                    ],
                };
            } else {
                return {
                    content: [
                        {
                            type: 'text',
                            text: result.data.message || 'Tab navigation failed',
                        },
                    ],
                };
            }
        }
    );

    server.tool(
        'SOQL_fetchQueries',
        `Fetch the list of SOQL queries for a given org alias in the SF Toolkit`,
        {
            alias: z.string().describe('The alias of the org'),
        },
        async (params) => {
            const result = await handleFetchWithToolkitCheck(fetch(`${context.apiUrl}${ENDPOINTS.SOQL_FETCH_QUERIES}`, {
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
                            text: JSON.stringify(result.data),
                        },
                    ],
                };
            } else {
                return {
                    content: [
                        {
                            type: 'text',
                            text: result.data.message || 'Fetch queries failed',
                        },
                    ],
                };
            }
        }
    );
}

module.exports = { register };
