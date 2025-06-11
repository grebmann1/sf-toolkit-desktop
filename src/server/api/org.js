const { getAllOrgs } = require('../../libs/modules/org');
const jsforce = require('jsforce');
const { isNotUndefinedOrNull, isEmpty } = require('../../utils/utils');
const { ipcMainManager } = require('../../libs/ipc.js');
const { ENDPOINTS } = require('../../../shared');

module.exports = function(app) {
    app.post(ENDPOINTS.GET_LIST_OF_ORGS, async (req, res) => {
        try {
            const { sfdxOrgs, storedOrgs } = await getAllOrgs();
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
            console.log('orgs', orgs);
            res.json({ orgs });
        } catch (e) {   
            res.status(500).json({ 
                status: 'error', 
                message: e.message || e.toString() 
            });
        }
    });

    app.post(ENDPOINTS.GET_SESSION_ID_AND_SERVER_URL, async (req, res) => {
        const { alias } = req.body;
        try {
            const { sfdxOrgs, storedOrgs } = await getAllOrgs();
            let orgs = [].concat(
                sfdxOrgs.result.nonScratchOrgs,
                sfdxOrgs.result.scratchOrgs,
                storedOrgs
            );
            orgs = orgs.filter(x => isNotUndefinedOrNull(x.alias));
            const selectedOrg = orgs.find(x => x.alias === alias);
            let sessionId, serverUrl;
            if (selectedOrg.credentialType === 'USERNAME') {
                const connection = new jsforce.Connection({
                    loginUrl: isEmpty(selectedOrg.instanceUrl) ? selectedOrg.loginUrl : selectedOrg.instanceUrl,
                    version: '60.0'
                });
                await connection.login(selectedOrg.username, selectedOrg.password);
                sessionId = connection.accessToken;
                serverUrl = connection.instanceUrl;
            } else {
                sessionId = selectedOrg.accessToken;
                serverUrl = selectedOrg.instanceUrl;
            }
            res.json({ sessionId, serverUrl });
        } catch (e) {
            res.status(500).json({ 
                status: 'error', 
                message: e.message || e.toString() 
            });
        }
    });
}; 