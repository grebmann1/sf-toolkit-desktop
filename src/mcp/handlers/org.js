const { getAllOrgs } = require('../../libs/modules/org');
const { z } = require('zod');
const { isNotUndefinedOrNull, isEmpty } = require('../../utils/utils');
const jsforce = require('jsforce');

function register(server, context) {
    server.tool('Org.getListOfOrgs', `Get list of orgs`, async (params) => {
        // TODO: Implement logic to get list of orgs
        const {sfdxOrgs,storedOrgs} = await getAllOrgs();
        let orgs = [].concat(
            sfdxOrgs.result.nonScratchOrgs.map(x => ({
                ...x,
                credentialType: 'OAUTH',
            })),
            sfdxOrgs.result.scratchOrgs.map(x => ({
                ...x,
                credentialType: 'OAUTH',
            })),
            storedOrgs.map(x => ({
                ...x,
                credentialType: x.credentialType || 'USERNAME',
            }))
        );
        return {
            content: [
                {
                    type: 'text',
                    text: JSON.stringify(orgs),
                },
            ],
        };
    });
    server.tool(
        'Org.getSessionIdAndServerUrl',
        `Fetch sessionId and serverUrl for a given org or alias`,
        {
            alias: z.string().describe('Alias of the org'),
        },
        async (params) => {
            try{
                const {sfdxOrgs,storedOrgs} = await getAllOrgs();
                let orgs = [].concat(
                    sfdxOrgs.result.nonScratchOrgs,
                    sfdxOrgs.result.scratchOrgs,
                    storedOrgs
                );
                orgs = orgs.filter(x => isNotUndefinedOrNull(x.alias));
                const selectedOrg = orgs.find(x => x.alias === params.alias);
                let sessionId,serverUrl;
                if(selectedOrg.credentialType === 'USERNAME'){
                    process.env.NODE_DEBUG = 'http';

                    // Username/Password stored in the store
                    const connection = new jsforce.Connection({
                        loginUrl : isEmpty(selectedOrg.instanceUrl) ? selectedOrg.loginUrl : selectedOrg.instanceUrl,
                        version: '60.0' // to be changed later
                    });
                      
                    const userInfo = await connection.login(selectedOrg.username, selectedOrg.password);
                    sessionId = connection.accessToken;
                    serverUrl = connection.instanceUrl;
                }else{
                    // Coming from SFDX !!!
                    sessionId = selectedOrg.accessToken;
                    serverUrl = selectedOrg.instanceUrl;
                }
                return {
                    content: [
                        {
                            type: 'text',
                            text: JSON.stringify({sessionId,serverUrl}),
                        },
                    ],
                };
            }catch(e){
                return {
                    content: [
                        {
                            type: 'text',
                            text: JSON.stringify({
                                success: false,
                                error: e.message || e.toString()
                            }),
                        },
                    ],
                };
            }
        },
    );
}

module.exports = { register };
