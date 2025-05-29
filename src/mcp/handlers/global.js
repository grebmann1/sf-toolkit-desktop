const { createInstanceWindow, browserWindows, getHomeWindow } = require('../../libs/window.js');
const { z } = require('zod');
const { ResourceTemplate } = require('@modelcontextprotocol/sdk/server/mcp.js');

function register(server, context) {
    /* server.prompt(
        'Global.openSfToolkit',
        `When you are asked to open the SF Toolkit, please follow the instructions below:`,
        { alias: z.string() },
        ({ alias }) => ({
        messages: [
            {
                role: 'user',
                content: {
                    type: 'text',
                    text: `
                    Please follow the instructions to open the SF Toolkit for the org ${alias}.
                    You can use the following tools to open the SF Toolkit:
                    1. Fetch the list of orgs using the tool Org.getListOfOrgs
                    2. Select the org you want to open the SF Toolkit
                    - If the credentialType is USERNAME, then do the following:
                        1. Call the Org.generateAccessToken tool to generate the access token
                        2. Use the following parameters to call the global.openSfToolkit tool:
                            - alias: the alias of the org
                            - username: the username of the org
                            - serverUrl: the instance url of the org
                            - sessionId: the newly generated access token
                    - Otherwise do the following:
                        1. Use the following parameters to call the global.openSfToolkit tool:
                            - alias: the alias of the org
                            - serverUrl: the instance url of the org
                            - sessionId: the session id of the org
                    `,
                },
            },
        ],
    })); */



    server.tool(
        "global.listOfWindows",
        "Get list of opened windows",
        {},
        async (params, _ctx) => {
            return {
                content: [
                    {
                        type: 'text',
                        text: `
                            List of windows:
                            ${Object.keys(browserWindows).map(key => `- ${key}`).join('\n')}
                        `,
                    },
                ],
            };
        },
    );


    server.tool(
        'global.openSfToolkit',
        `Open SF Toolkit with a specific org alias`,
        {
            alias: z.string().describe('Alias of the org'),
        },
        async (params, _ctx) => {
            return {
                content: [
                    {
                        type: 'text',
                        text: `
                            1. Fetch the list of orgs using the Org.getListOfOrgs tool.
                            2. Find the org that matches the desired alias.
                            3. Check the window is already open for the alias by calling the global.listOfWindows tool.
                                - If the window is already open, then return the status as Success and move to the next step.
                                - Otherwise, open the Salesforce Toolkit for that org by calling the internal.openSfToolkit tool with the org's alias and username.
                                    - Only provide the alias and username parameters.
                                    - Do not include serverUrl or sessionId when using the alias.
                        `,
                    },
                ],
            };
        },
    );

    server.tool(
        'internal.openSfToolkit',
        {
            alias: z.string().describe('Alias of the org'),
            username: z.string().describe('Username of the org').optional(),
            serverUrl: z.string().describe('Server url of the org').optional(),
            sessionId: z.string().describe('Session id of the org').optional(),
        },
        async (params, _ctx) => {
            // Send IPC message to frontend to trigger toolkitOpening
            if(browserWindows[params.alias]){
                return {
                    content: [
                        {
                            type: 'text',
                            text: 'Status : Success',
                        },
                    ],
                };
            }

            createInstanceWindow({
                parent: getHomeWindow(),
                isDev: context.isDev,
                alias: params.alias,
                username: params.username,
                serverUrl: params.serverUrl,
                sessionId: params.sessionId,
            });
            return {
                content: [
                    {
                        type: 'text',
                        text: 'Status : Success',
                    },
                ],
            };
        },
    );
}

module.exports = { register };


/* - If the credentialType is USERNAME, then do the following:
1. Call the Org.generateAccessToken tool to generate the access token
2. Use the following parameters to call the internal.openSfToolkit tool:
    - alias: the alias of the org
    - username: the username of the org
    - serverUrl: the instance url of the org
    - sessionId: the newly generated access token
- Otherwise do the following:
1. Use the following parameters to call the internal.openSfToolkit tool:
    - alias: the alias of the org
    - serverUrl: the instance url of the org
    - sessionId: the session id of the org */