const path = require('path');
const { app, shell, utilityProcess } = require('electron');
const { exec, execSync } = require('child_process');
const { encodeError } = require('../../utils/errors.js');
const Store = require('../store.js');
const { execShellCommand,killProcessOnPort } = require('../../utils/utils.js');

//require('../../workers/oauth.worker.js');
/** Worker Processing **/
const workers = {};
const orgsStore = new Store({ configName: 'orgs', defaults: {} });

_handleOAuthInWorker = ({ alias, instanceurl, webContents }) => {
    // Kill child process in case it's too long
    const workerKey = 'oauth';
    const timeout = setTimeout(() => {
        if (workers[workerKey]) {
            console.log('kill from setTimeout');
            workers[workerKey].kill();
        }
    }, 60000 * 2);

    workers[workerKey] = utilityProcess.fork(path.join(__dirname, 'workers/oauth.worker.js'));
    workers[workerKey].postMessage({
        action: 'oauth',
        params: { alias, instanceurl },
    });
    workers[workerKey].once('exit', () => {
        clearTimeout(timeout);
        console.log('exit');
        killProcessOnPort(1717);
        webContents.send('oauth', { type: 'oauth', action: 'exit' });
        workers[workerKey] = null;
    });
    workers[workerKey].once('message', async ({ res, error }) => {
        console.log('message', res, error);
        clearTimeout(timeout);
        if (res) {
            webContents.send('oauth', { type: 'oauth', action: 'done', data: res });
        } else {
            webContents.send('oauth', { type: 'oauth', action: 'error', error });
        }
        workers[workerKey].kill();
    });
};

/** Methods **/

killOauth = async (_) => {
    const workerKey = 'oauth';
    try {
        if (workers[workerKey]) {
            workers[workerKey].kill();
        }
        return { res: 'success' };
    } catch (e) {
        return { error: encodeError(e) };
    }
};

saveOrgInfo = async (_, { alias, configuration }) => {
    try {
        orgsStore.set(alias, configuration);
        return { res: 'success' };
    } catch (e) {
        return { error: encodeError(e) };
    }
};

getStoredOrgs = async () => {
    try {
        const data = orgsStore.data || {};
        return { res: Object.values(data) };
    } catch (e) {
        return { error: encodeError(e) };
    }
};

// Update getAllOrgs to return both SFDX and stored orgs
getAllOrgs = async (_) => {
    const command = 'sfdx force:org:list --json --verbose';
    try {
        const sfdxOrgs = await execShellCommand(command, { parseJson: true });
        // Fetch stored orgs
        const stored = await getStoredOrgs();
        return {
            sfdxOrgs,
            storedOrgs: stored.res || [],
        };
    } catch (error) {
        // If error, still try to fetch stored orgs
        const stored = await getStoredOrgs();
        return {
            sfdxOrgs: { error: encodeError(error) },
            storedOrgs: stored.res || [],
        };
    }
};

seeDetails = async (_, { alias }) => {
    // First, check if the org exists in the store
    if (orgsStore.contains(alias)) {
        const org = orgsStore.get(alias);
        // Try to provide a similar structure as the sfdx result
        const res = {
            ...org,
            loginUrl: org.loginUrl || org.instanceUrl || org.instanceurl || '',
            orgId: org.orgId || org.organizationId || org.org_id || '',
            credentialType: org.credentialType || 'USERNAME',
        };
        return { res };
    }
    // Fallback to shell if not in store
    try {
        const [orgDisplay, orgOpen] = await Promise.all([
            execShellCommand(`sfdx force:org:display --json --targetusername ${alias} --verbose`, { parseJson: true }),
            execShellCommand(`sfdx force:org:open --urlonly --targetusername ${alias} --json`, { parseJson: true })
        ]);
        const res = {
            ...orgDisplay.result,
            loginUrl: orgOpen.result.url,
            orgId: orgDisplay.result.id,
        };
        return { res };
    } catch (e) {
        return { error: encodeError(e) };
    }
};

openOrgUrl = async (_, { alias, redirectUrl }) => {
    try {
        const result = await execShellCommand(`sfdx force:org:open --urlonly --targetusername ${alias} --json`, { parseJson: true });
        if (result && result.result && result.result.url) {
            let url = result.result.url + (redirectUrl ? `&retURL=${encodeURIComponent(redirectUrl)}` : '');
            shell.openExternal(url);
        }
    } catch (e) {
        // Optionally handle error
    }
};

createNewOrgAlias = async (event, { alias, instanceurl }) => {
    const webContents = event.sender;
    try {
        _handleOAuthInWorker({
            alias,
            instanceurl,
            webContents,
        });
        return { res: 'success' };
    } catch (e) {
        console.error('error', e);
        webContents.send('oauth', { type: 'oauth', action: 'error', error });
        return { error: encodeError(e) };
    }
};

unsetAlias = async (_, { alias }) => {
    try {
        // Remove from orgsStore if present
        if (orgsStore.contains(alias)) {
            delete orgsStore.data[alias];
            orgsStore.set(null, orgsStore.data); // Save updated data
        } else {
            // Remove from sfdx aliases
            await execShellCommand(`sfdx force:alias:unset ${alias} --json`, { parseJson: true });
        }
        return null;
    } catch (e) {
        return { error: encodeError(e) };
    }
};

logout = async (_, { alias }) => {
    /** To Refactore later **/
    try {
        const command = `sf org logout -o ${alias} -p --json`;
        let res = execSync(command).toString();
        return { res };
    } catch (e) {
        return { res: null };
        //return {error: encodeError(e)}
    }
};

setAlias = async (_, { alias, username }) => {
    try {
        let response = await execShellCommand(`sfdx force:alias:set ${alias}=${username} --json`, { parseJson: true });
        return { result: response };
    } catch (e) {
        return { error: encodeError(e) };
    }
};

module.exports = {
    killOauth,
    getAllOrgs,
    openOrgUrl,
    createNewOrgAlias,
    seeDetails,
    unsetAlias,
    setAlias,
    logout,
    saveOrgInfo,
    getStoredOrgs,
};
