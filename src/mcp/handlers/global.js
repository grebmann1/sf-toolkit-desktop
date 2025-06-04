const { createInstanceWindow, browserWindows, getHomeWindow } = require('../../libs/window.js');
const { z } = require('zod');

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
        "Get list of opened windows (sf-toolkit). Call this tool to check if a window is already open for the alias.",
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
        `Launch the SF Toolkit using a specified org alias.
        Ensure the alias is valid before invoking this tool. 
        Utilize the Org.getListOfOrgs tool to retrieve and verify the desired alias from the list of orgs.
        Determine if a window is already open for the alias by using the global.listOfWindows tool.
        - If a window is open, return a status of Success and proceed.
        - If not, initiate the Salesforce Toolkit for the org by invoking the internal.openSfToolkit tool with the org's alias and username.
            - Only the alias and username parameters should be provided.
            - Exclude serverUrl and sessionId when using the alias.
        `,
        {
            alias: z.string().describe('Alias of the org'),
            username: z.string().describe('Username of the org').optional(),
            //serverUrl: z.string().describe('Server url of the org').optional(),
            //sessionId: z.string().describe('Session id of the org').optional(),
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
            
            try {
                await new Promise((resolve,reject) => {
                    createInstanceWindow({
                        parent: getHomeWindow(),
                        isDev: context.isDev,
                        alias: params.alias,
                        username: params.username,
                        serverUrl: params.serverUrl,
                        sessionId: params.sessionId,
                    }, ({result,error}) => {
                        if(result){
                            resolve(result);
                        } else {
                            reject(error);
                        }
                    });
                })
            } catch (err) {
                return {
                    content: [
                        {
                            type: 'text',
                            text: 'Error: ' + err.message,
                        },
                    ],
                };
            }

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