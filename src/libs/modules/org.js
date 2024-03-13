const sfdx = require('sfdx-node');
const path = require('path');
const { app,shell,utilityProcess } = require('electron');
const { exec, execSync } = require('child_process');
const { encodeError } = require('../../utils/errors.js');


/** Worker Processing **/
const workers = {};

_handleOAuthInWorker = ({alias,instanceurl,webContents}) => {
    // Kill child process in case it's too long
    const workerKey = 'oauth';
    const timeout = setTimeout(() => {
        if(workers[workerKey]){
            console.log('kill from setTimeout')
            workers[workerKey].kill();
        }
    }, 60000*2);

    workers[workerKey] = utilityProcess.fork(path.join(__dirname, '../../workers/oauth.js'))
    workers[workerKey].postMessage({action:'oauth',params:{alias,instanceurl}});
    workers[workerKey].once('exit',  () => {
        clearTimeout(timeout);
        console.log('exit');
        webContents.send('oauth',{type:'oauth',action:'exit'});
        workers[workerKey] = null;
    })
    workers[workerKey].once('message', async ({res,error}) => {
        console.log('message',res,error);
        clearTimeout(timeout);
        if(res){
            webContents.send('oauth',{type:'oauth',action:'done',data:res});
        }else{
            webContents.send('oauth',{type:'oauth',action:'error',error});
        }
        workers[workerKey].kill();
    });
}

/** Methods **/

killOauth = async (_) => {
    console.log('killOauth');
    const workerKey = 'oauth';
    try{
        if(workers[workerKey]){
            workers[workerKey].kill();
        }
        return {res:'success'};
    }catch(e){
        return {error: encodeError(e)}
    }
}


getAllOrgs = async (_) => {
    console.log('getAllOrgs');
    const command = 'sfdx force:org:list --json --verbose';
    return new Promise((resolve,reject) => {
        exec(command, (error, stdout, stderr) => {
            if(error){
                resolve({error: encodeError(error)});
            }else{
                resolve(JSON.parse(stdout.toString()))
            }
        })
    })
}

seeDetails = async (_,{alias}) => {
    console.log('seeDetails');
    return new Promise((resolve,reject) => {
        Promise.all([
            sfdx.force.org.display({
                _quiet:true,
                json:true,
                verbose:true,
                _rejectOnError: true,
                targetusername: alias
            }),
            sfdx.force.org.open({
                targetusername:alias,
                urlonly:true
            })
        ]).then((results) => {
            res = {
                ...results[0],
                ...{
                    loginUrl:results[1].url,
                    orgId:results[0].id
                }
            };
            resolve({res});
        }).catch(e => {
            resolve({error: encodeError(e)});
        })
    })
}

openOrgUrl = async (_,{alias,redirectUrl}) => {
    const result = await sfdx.force.org.open({
        targetusername:alias,
        urlonly:true
    });
    if(result){
        let url = result.url+(redirectUrl?`&retURL=${encodeURIComponent(redirectUrl)}`:'');
        shell.openExternal(url);
    }
}



createNewOrgAlias = async (event,{alias,instanceurl}) => {
    const webContents = event.sender;
    try{
        _handleOAuthInWorker({
            alias,
            instanceurl,
            webContents,
        });
        return {res:'success'};
    }catch(e){
        console.error('error',e);
        webContents.send('oauth',{type:'oauth',action:'error',error});
        return {error: encodeError(e)}
    }
}

unsetAlias = async (_,{alias}) => {
    try{
        let res = await sfdx.alias.unset({
            _quiet:true,
            _rejectOnError: true,
        },{args: [`${alias}`]});
        return {res};
    }catch(e){
        return {error: encodeError(e)}
    }
}

logout = async (_,{alias}) => {
    /** To Refactore later **/
    try{
        const command = `sf org logout -o ${alias} -p --json`;
        let res = execSync(command).toString();
        return {res}
    }catch(e){
        return {res:null}
        //return {error: encodeError(e)}
    }
}

setAlias = async (_,{alias,username}) => {
    try{
        let response = await sfdx.alias.set({
            _quiet:true,
            _rejectOnError: true,
        },{args: [`${alias}=${username}`]});
        return {result:response};
    }catch(e){
        return {error: encodeError(e)}
    }
}

module.exports = {
    killOauth,
    getAllOrgs,
    openOrgUrl,
    createNewOrgAlias,
    seeDetails,
    unsetAlias,
    setAlias,
    logout
}