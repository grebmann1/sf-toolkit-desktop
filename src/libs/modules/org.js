const sfdx = require('sfdx-node');
const path = require('path');
const { app,shell,utilityProcess } = require('electron');
const { execSync } = require('child_process');
const { encodeError } = require('../../utils/errors.js');


/** Worker Processing **/
const workers = {};

_handleOAuthInWorker = ({alias,instanceurl,webContents}) => {
    // Kill child process in case it's too long
    const workerKey = 'oauth';
    const timeout = setTimeout(() => {
        if(workers[workerKey]){
            console.log(workers[workerKey])
            workers[workerKey].kill();
        }
    }, 15000*2);

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
    try{
        const command = 'sfdx force:org:list --json --verbose';
        let res = execSync(command,{cwd: app.getAppPath()}).toString();
        return JSON.parse(res);//{result:JSON.parse(res).result};
    }catch(e){
        return {error: encodeError(e)}
    }
}

seeDetails = async (_,{alias}) => {
    try{
        let res = await sfdx.force.org.display({
            _quiet:true,
            json:true,
            verbose:true,
            _rejectOnError: true,
            targetusername: alias
        });
        /** Catch it directly */
        let loginObject = await sfdx.force.org.open({
            targetusername:alias,
            urlonly:true
        });
        res = {
            ...res,
            ...{
                loginUrl:loginObject.url,
                orgId:res.id
            }
        };
        return {res};
    }catch(e){
        console.error(e);
        return {error: encodeError(e)}
    }
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
        let res = execSync(command,{cwd: app.getAppPath()}).toString();
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