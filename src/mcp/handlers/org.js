const { getAllOrgs } = require('../../libs/modules/org');
const { z } = require('zod');

function register(server, context) {
    server.tool('Org.getListOfOrgs', `Get list of orgs`, async (params) => {
        // TODO: Implement logic to get list of orgs
        const orgs = await getAllOrgs();
        return {
            content: [
                {
                    type: 'text',
                    text: JSON.stringify(orgs),
                },
            ],
        };
    });
    /* server.tool(
        'Org.generateAccessToken',
        `Generate access token for the given org`,
        {
            alias: z.string().describe('Alias of the org'),
        },
        async (params) => {
            console.log('Org.generateAccessToken', params);
            // TODO: Implement logic to generate access token for specific org
            const token = '1234567890';
            return {
                content: [
                    {
                        type: 'text',
                        text: JSON.stringify(token),
                    },
                ],
            };
        },
    ); */
}

module.exports = { register };
