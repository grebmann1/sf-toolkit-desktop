import { z } from 'zod';
import fetch from 'node-fetch';
import { exec } from 'child_process';
import { handleFetchWithToolkitCheck } from './util.js';
import { ENDPOINTS } from '../../../shared.js';

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
        'global_listOfWindows',
        'Get list of opened windows (sf-toolkit). Call this tool to check if a window is already open for the alias.',
        {},
        async (params, _ctx) => {
            const result = await handleFetchWithToolkitCheck(
                fetch(`${context.apiUrl}${ENDPOINTS.LIST_OF_WINDOWS}`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                }),
            );
            if (result.content) return result;
            return {
                content: [
                    {
                        type: 'text',
                        text: `List of windows:\n${result.data.windows.map((key) => `- ${key}`).join('\n')}`,
                    },
                ],
            };
        },
    );

    server.tool(
        'global_openSpecificOrg',
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
        },
        async (params, _ctx) => {
            const result = await handleFetchWithToolkitCheck(
                fetch(`${context.apiUrl}${ENDPOINTS.OPEN_INSTANCE}`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(params),
                }),
            );
            if (result.content) return result;
            if (!result.response.ok) {
                return {
                    content: [
                        {
                            type: 'text',
                            text: typeof result.data === 'string' ? result.data : 'Failed to open instance',
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

    server.tool(
        'global_openToolkitProtocol',
        `Open the SF Toolkit using the 'sf-toolkit://' protocol. If the toolkit is not already open, this will launch it via the OS shell.`,
        {},
        async (_params) => {
            return new Promise((resolve) => {
                exec('open "sf-toolkit://"', (error, stdout, stderr) => {
                    if (error) {
                        resolve({
                            content: [
                                {
                                    type: 'text',
                                    text: `Failed to open SF Toolkit: ${stderr || error.message}`,
                                },
                            ],
                        });
                    } else {
                        resolve({
                            content: [
                                {
                                    type: 'text',
                                    text: 'SF Toolkit has been opened using the sf-toolkit:// protocol.',
                                },
                            ],
                        });
                    }
                });
            });
        },
    );
}

export default { register };

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
