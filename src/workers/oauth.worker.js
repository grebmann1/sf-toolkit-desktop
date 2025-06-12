const { exec } = require('node:child_process');
const encodeError = (errors) => {
    console.error('Inner: ', errors);
    // we only handle 1 error for now !! (we could send an array, that's not a problem !)
    let e = [].concat(errors)[0];
    let res = { name: e.name, message: e.message };
    return res;
};
const execShellCommand = (cmd, { parseJson = false } = {}) => {
    return new Promise((resolve, reject) => {
        exec(cmd, (error, stdout, stderr) => {
            if (error) {
                reject(stderr || error);
                return;
            }
            if (parseJson) {
                try {
                    resolve(JSON.parse(stdout));
                } catch (e) {
                    reject(`Failed to parse JSON: ${e.message}\nOutput: ${stdout}`);
                }
            } else {
                resolve(stdout);
            }
        });
    });
};
const killProcessOnPort = async (port) => {
    const cmd = `lsof -ti:${port} | xargs kill -9`;
    try {
        await execShellCommand(cmd);
    } catch (e) {
        // It's okay if nothing was running on the port
        if (process.env.NODE_ENV === 'development') {
            console.log(`No process to kill on port ${port} or error:`, e);
        }
    }
};
createNewOrgAlias = async ({ alias, instanceurl }) => {
    try {
        // Kill any process running on port 1717 before starting auth
        //await killProcessOnPort(1717);
        const cmd = `sfdx auth:web:login --setalias ${alias} --instanceurl ${instanceurl}`;
        const res = await execShellCommand(cmd);
        process.parentPort.postMessage({ res });
    } catch (e) {
        console.log('inner error');
        process.parentPort.postMessage({ error: encodeError(e) });
    }
};

// Child process
process.parentPort.once('message', async (e) => {
    const { action, params } = e.data;

    if (action === 'oauth') {
        await createNewOrgAlias(params);
    }
});
