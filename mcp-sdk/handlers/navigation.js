const fetch = require('node-fetch');
const { z } = require('zod');
const { handleFetchWithToolkitCheck } = require('./util');

function register(server, context) {
    server.tool(
        'Navigation_navigate',
        `This tool allows you to navigate to a specific application within the SF Toolkit. 
        Ensure that the SF Toolkit is open for the specified alias before using this tool to successfully direct the navigation.`,
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
            ]).describe('Target application to navigate to'),
        },
        async (params) => {
            const result = await handleFetchWithToolkitCheck(fetch(`${context.apiUrl}/navigation/navigate`, {
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
                            text: result.data.message || 'Navigation failed',
                        },
                    ],
                };
            }
        },
    );
}

module.exports = { register };
