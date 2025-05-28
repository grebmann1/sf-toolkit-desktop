const { createInstanceWindow, browserWindows } = require('../../libs/window.js');
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
        'global.openSfToolkit',
        `Open SF Toolkit with the given org`,
        {
            alias: z.string().describe('Alias of the org'),},
        async (params, _ctx) => {
            // Send IPC message to frontend to trigger toolkitOpening
            if (context && context.ipcMainManager && context.mainWindow && context.mainWindow.webContents) {
                context.ipcMainManager.send('toolkitOpening', [params.alias], context.mainWindow.webContents);
            }
            return {
                content: [
                    {
                        type: 'text',
                        text: 'sf-toolkit opened (stub)',
                    },
                ],
            };
        },
    );
}

module.exports = { register };
