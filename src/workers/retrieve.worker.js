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

retrieve = async ({ alias, manifestPath }) => {
    try {
        const cmd = `sfdx force:source:retrieve --targetusername ${alias} --manifest ${manifestPath}`;
        const res = await execShellCommand(cmd);
        process.parentPort.postMessage({ res });
    } catch (e) {
        process.parentPort.postMessage({ error: encodeError(e) });
    }
};

// Child process
process.parentPort.once('message', async (e) => {
    const { params } = e.data;
    retrieve(params);
});
