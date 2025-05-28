const { z } = require('zod');

function register(server, context) {
    server.tool(
        'Navigation.navigate',
        `Navigate to a specific application in the SF Toolkit`,
        {
            targetApp: z
                .string()
                .describe('Target application to navigate to (REST_API, SOQL, APEX, METADATA_EXPLORER)'),
        },
        async (params) => {
            const validApps = ['REST_API', 'SOQL', 'APEX', 'METADATA_EXPLORER'];
            if (!params.targetApp || !validApps.includes(params.targetApp)) {
                return {
                    content: [
                        {
                            type: 'text',
                            text: `Invalid or missing targetApp. Valid options: ${validApps.join(', ')}`,
                        },
                    ],
                };
            }
            // TODO: Implement actual navigation logic
            return {
                content: [
                    {
                        type: 'text',
                        text: `Navigated to ${params.targetApp}`,
                    },
                ],
            };
        },
    );
}

module.exports = { register };
