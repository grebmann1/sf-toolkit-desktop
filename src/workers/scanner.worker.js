const { exec } = require('node:child_process');
const encodeError = (errors) => {
    console.error('Inner: ', errors);
    // we only handle 1 error for now !! (we could send an array, that's not a problem !)
    let e = [].concat(errors)[0];
    let res = { name: e.name, message: e.message };
    console.error({ ...e });
    return res;
};

scanner = async ({ alias, command }) => {
    try {
        const childProcess = exec(command);

        // Handle standard output data
        childProcess.stdout.on('data', (data) => {});

        // Handle standard error data
        childProcess.stderr.on('data', (data) => {
            console.error(`stderr: ${data}`);
        });

        // Handle on close
        childProcess.on('close', (code) => {
            const res = {
                status: 'finished',
                code,
            };
            process.parentPort.postMessage({ res });
        });

        // Handle errors
        childProcess.on('error', (error) => {
            console.error(error);
            console.error(`Error: ${error.message}`);
        });
    } catch (e) {
        process.parentPort.postMessage({ error: encodeError(e) });
    }
};

// Child process
process.parentPort.once('message', async (e) => {
    const { params } = e.data;
    scanner(params);
});
