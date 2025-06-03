const { z } = require('zod');
const { getWindowByAlias } = require('../../../libs/window.js');

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
        'SOQL.displayQueryInSFToolkit',
        `Display the query (SOQL) in the SF Toolkit
        ## Instructions to follow: 
            Follow the steps to display the query result:
            1. Check if a window is already open for the alias
                -  If a window is not open, then open the SF Toolkit with the alias before calling this tool.
            2. Display the query in the SF Toolkit by calling this tool
        `,
        {
            query: z.string().describe('The query to display'),
            alias: z.string().describe('The alias of the org'),
        }, 
        async (params) => {
            const { query, alias } = params;
            // Get the window for the alias
            const window = getWindowByAlias(alias);
            if (window && window.webContents) {
                await context.ipcMainManager.send('electron-soql-call', { query, alias }, window.webContents);
            } else {
                return {
                    content: [
                        {
                            type: 'text',
                            text: `
                                # Status : Error
                                # Message : No window found for alias: ${alias}. 
                                # Instructions:
                                - Open the SF Toolkit for the alias: ${alias} before calling this tool.
                                - Call this tool again after opening the SF Toolkit for the alias: ${alias}
                            `,
                        },
                    ],
                };
            }
            return {
                content: [
                    {
                        type: 'text',
                        text: `Status : Success, Message : Displaying the query result for the alias: ${alias}\n`,
                    },
                ],
            };
        }
    );
}

module.exports = { register };
