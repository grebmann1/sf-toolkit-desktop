const { getAllOrgs } = require('../../libs/modules/org');
const jsforce = require('jsforce');
const { isNotUndefinedOrNull, isEmpty } = require('../../utils/utils');
const { ipcMainManager } = require('../../libs/ipc.js');

module.exports = function(app) {
    app.post('/org/get-list-of-orgs', async (req, res) => {
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
        res.json({ orgs });
    });

    app.post('/org/get-session-id-and-server-url', async (req, res) => {
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
            res.status(500).json({ success: false, error: e.message || e.toString() });
        }
    });
}; 