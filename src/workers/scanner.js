const sfdx = require('sfdx-node');
const path = require('node:path');
const { exec  } = require('child_process');
const { encodeError } = require('../utils/errors.js');

scanner = async ({alias,command}) => {
    console.log('scanner - start',alias);
    try{
        console.log('command',command);
        const childProcess = exec(command);

        // Handle standard output data
        childProcess.stdout.on('data', (data) => {
            console.log(`stdout: ${data}`);
        });
    
        // Handle standard error data
        childProcess.stderr.on('data', (data) => {
            console.error(`stderr: ${data}`);
        });
    
        // Handle on close
        childProcess.on('close', (code) => {
            console.log(`Child process exited with code ${code}`);
            const res = {
                status:'finished',
                code
            }
            process.parentPort.postMessage({res})
        });
    
        // Handle errors
        childProcess.on('error', (error) => {
            console.error(error);
            console.error(`Error: ${error.message}`);
        });

        
    }catch(e){
        process.parentPort.postMessage({error: encodeError(e)})
    }
}

// Child process
process.parentPort.once('message', async (e) => {
    console.log('scanner - message')
    const { params } = e.data;
    scanner(params);
})
