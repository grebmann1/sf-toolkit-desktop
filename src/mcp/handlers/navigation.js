const { z } = require('zod');
const { getWindowByAlias } = require('../../libs/window.js');

function register(server, context) {
    server.tool(
        'Navigation.navigate',
        `Navigate to a specific application in the SF Toolkit`,
        {
            alias: z.string().describe('Alias of the org'),
            application: z.enum([
                'soql',
                'api',
                'anonymousapex',
                'org',
                'metadata',
                'access',
                'sobject',
                'documentation',
                'platformevent',
                'package',
            ])
            .describe('Target application to navigate to: soql (SOQL Editor), api (API Explorer), anonymousapex (Apex Editor), org (Org Overview), metadata (Metadata Explorer), access (Access Analyzer), sobject (SObject Explorer), documentation (Documentation), platformevent (Event Explorer), package (Deployment/Retrieve)'),
        },
        async (params) => {
            try {
                const { alias, application } = params;
                const window = getWindowByAlias(alias);
                if (window && window.webContents) {
                    await context.ipcMainManager.send('electron-navigate-to', { application }, window.webContents);
                    return {
                        content: [
                            {
                                type: 'text',
                                text: `Navigated to ${application}`,
                            },
                        ],
                    };
                }else{
                    return {
                        content: [
                            {
                                type: 'text',
                                text: `
                                    No window found for alias: ${alias}. 
                                    Please open the SF Toolkit for the alias before calling this tool.
                                `,
                            },
                        ],
                    };
                }
                
            } catch (error) {
                return {
                    content: [
                        {
                            type: 'text',
                            text: `Error: ${error.message}`,
                        },
                    ],
                };
            }
        },
    );
}

module.exports = { register };
