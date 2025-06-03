const path = require('path');
const fs = require('fs');
const moment = require('moment');
const { exec, execSync } = require('child_process');
const { app, shell, remote, dialog, utilityProcess } = require('electron');

/** Internal */
const Store = require('../store.js');
const { encodeError } = require('../../utils/errors.js');

const fileName = 'pmd-dist-7.0.0-rc4-bin.zip';
const fileUrl = 'https://github.com/pmd/pmd/releases/download/pmd_releases%2F7.0.0-rc4/';
const folderName = 'pmd-dist-7.0.0-rc4-bin';
const binPath = 'pmd-bin-7.0.0-rc4/bin/pmd';

const exportMap = {};

const upsert_toolkitPath = (projectPath) => {
    /** SF Tookit path */
    let sfToolkitPath = path.join(projectPath, '.sf-toolkit');
    if (!fs.existsSync(sfToolkitPath)) {
        fs.mkdirSync(sfToolkitPath, { recursive: true });
    }

    return sfToolkitPath;
};

exportMap.isPmdInstalled = async (_, { projectPath }) => {
    try {
        let pmdPath = path.join(projectPath, '.sf-toolkit', binPath);
        return { result: fs.existsSync(pmdPath) ? binPath : null };
    } catch (e) {
        return { error: encodeError(e) };
    }
};

exportMap.installLatestPmd = async (_, { projectPath }) => {
    try {
        // Create hidden toolkit folder
        let sfToolkitPath = upsert_toolkitPath(projectPath);

        // Download PMD file if not there
        if (!fs.existsSync(path.join(sfToolkitPath, binPath))) {
            execSync(`curl -OL ${fileUrl}/${fileName}`, {
                cwd: sfToolkitPath,
            }).toString();
            execSync(`unzip ${fileName}`, { cwd: sfToolkitPath }).toString();
            execSync(`rm ${fileName}`, { cwd: sfToolkitPath }).toString();
        }

        // Clone Rule Set (Force overwrite)
        const src_path = path.join(app.getAppPath(), 'public/templates/pmd');
        const dest_path = path.join(sfToolkitPath, 'pmd');
        fs.cpSync(src_path, dest_path, { recursive: true });

        return { result: binPath };
    } catch (e) {
        return { error: encodeError(e) };
    }
};

exportMap.createVSCodeProject = async (_, { defaultPath }) => {
    try {
        let options = {
            title: 'Select Folder',
            buttonLabel: 'Select',
            properties: ['openDirectory', 'createDirectory'],
        };

        if (defaultPath) {
            options['defaultPath'] = defaultPath;
        }
        let projectPaths = dialog.showOpenDialogSync(null, options);

        // if empty, return null
        if (projectPaths === undefined) return { result: null };

        const projectPath = projectPaths[0];
        const sfdxProjectJson_path = path.join(projectPath, 'sfdx-project.json');
        const packageXml_path = path.join(projectPath, 'manifest', 'package.xml');
        /** Check if contain sfdx-project.json **/
        if (!fs.existsSync(sfdxProjectJson_path)) {
            // Create force-app
            fs.mkdirSync(path.join(projectPath, 'force-app'), { recursive: true });
            // Create copy sfdx-project.json
            fs.writeFileSync(
                sfdxProjectJson_path,
                fs.readFileSync(path.join(app.getAppPath(), 'public/templates/sfdx-project.json')),
            );
            // Create copy package.xml
            fs.mkdirSync(path.dirname(packageXml_path), { recursive: true });
            fs.writeFileSync(
                packageXml_path,
                fs.readFileSync(path.join(app.getAppPath(), 'public/templates/package.xml')),
            );
        }

        // Create hidden toolkit folder
        upsert_toolkitPath(projectPath);

        return { result: { projectPath } };
    } catch (e) {
        return { error: encodeError(e) };
    }
};

exportMap.openVSCodeProject = async (_, { path }) => {
    execSync(`code .`, { cwd: path }).toString();
};

exportMap.getInitialConfig = (event, { alias }) => {
    try {
        const configName = `Metadata-${alias}`;
        const store = new Store({ configName });

        const userDataPath = (app || remote.app).getPath('userData');
        const project_path = path.join(userDataPath, 'Metadata', alias);

        return {
            result: {
                projectPath: project_path,
                metadataLoaded: !store.isEmpty(),
            },
        };
    } catch (e) {
        return { error: encodeError(e) };
    }
};

exportMap.retrieveCode = (event, { alias, targetPath, refresh }) => {
    try {
        const webContents = event.sender;
        const userDataPath = (app || remote.app).getPath('userData');
        const project_path = path.join(userDataPath, 'Metadata', alias);
        const sfdxProjectJson_path = path.join(project_path, 'sfdx-project.json');
        const packageXml_path = path.join(project_path, 'manifest', 'package.xml');

        const configName = `Metadata-${alias}`;
        const store = new Store({ configName });

        if (store.isEmpty() || refresh) {
            if (!fs.existsSync(project_path)) {
                fs.mkdirSync(project_path, { recursive: true });
                // Create force-app
                fs.mkdirSync(path.join(project_path, 'force-app'), { recursive: true });
                // Create copy sfdx-project.json
                fs.writeFileSync(
                    sfdxProjectJson_path,
                    fs.readFileSync(path.join(app.getAppPath(), 'public/templates/sfdx-project.json')),
                );
                // Create copy package.xml
                fs.mkdirSync(path.dirname(packageXml_path), { recursive: true });
                fs.writeFileSync(
                    packageXml_path,
                    fs.readFileSync(path.join(app.getAppPath(), 'public/templates/package.xml')),
                );
            }

            _retrieveCodeWorker({
                alias,
                targetPath: project_path,
                webContents,
                manifestPath: packageXml_path,
                configName,
            });

            return {
                result: {
                    targetPath: project_path,
                    runInWorker: true,
                },
            };
        } else {
            webContents.send('update-from-worker', {
                type: 'retrieveCode',
                action: 'done',
                data: store.data,
            });
            webContents.send('update-from-worker', {
                type: 'retrieveCode',
                action: 'exit',
            });
            return {
                result: {
                    targetPath: project_path,
                    runInWorker: false,
                },
            };
        }
    } catch (e) {
        return { error: encodeError(e) };
    }
};

exportMap.runSfdxAnalyzer = (event, { alias, listenerName, command }) => {
    const webContents = event.sender;
    const userDataPath = (app || remote.app).getPath('userData');
    const project_path = path.join(userDataPath, 'Metadata', alias);
    const sfdxProjectJson_path = path.join(project_path, 'sfdx-project.json');

    try {
        _scanCodeWorker({
            alias,
            targetPath: project_path,
            webContents,
            listenerName,
            command,
        });
        return { result: { runInWorker: true } };
    } catch (e) {
        console.error('error', e);
        webContents.send(listenerName, {
            type: 'codeScanner',
            action: 'error',
            error,
        });
        return { error: encodeError(e) };
    }
};

exportMap.runShell = (event, { alias, targetPath, listenerName, command }) => {
    const webContents = event.sender;

    try {
        _runShell({
            alias,
            targetPath,
            webContents,
            listenerName,
            command,
        });
    } catch (e) {
        console.error('error', e);
        webContents.send(listenerName, { type: 'shell', action: 'error', e });
    }
};

exportMap.exportMetadata = (event, { targetPath, alias }) => {
    const webContents = event.sender;
    try {
        var options = {
            title: 'Save Metadata',
            defaultPath: `package-${alias}-${moment().unix()}.zip`,
            buttonLabel: 'Save',
            properties: ['openFile', 'createDirectory'],
            filters: [{ name: 'Archives', extensions: ['zip'] }],
        };
        let filePath = dialog.showSaveDialogSync(null, options);
        if (filePath) {
            const zipcommand = `zip -r -X ${filePath} * -x ".*" -x "__MACOSX"`;
            execSync(zipcommand, { cwd: targetPath }).toString();
            shell.showItemInFolder(filePath);
        }
    } catch (e) {
        console.error('error', e);

        webContents.send('metadata', {
            type: 'download',
            action: 'error',
            error: e,
        });
        return { error: encodeError(e) };
    }
};

/** Worker Processing **/
const workers = {};

_retrieveCodeWorker = ({ alias, configName, targetPath, manifestPath, webContents }) => {
    const store = new Store({ configName });
    let workerKey = `retrieve-${alias}`;
    // Kill child process in case it's too long
    const timeout = setTimeout(() => {
        if (workers[workerKey]) {
            workers[workerKey].kill();
        }
    }, 60000 * 2);
    if (workers[workerKey]) throw new Error('Existing instance already processing');

    workers[workerKey] = utilityProcess.fork(path.join(__dirname, '../../workers/retrieve.js'), [], {
        cwd: targetPath,
    });
    workers[workerKey].postMessage({ params: { alias, manifestPath } });
    workers[workerKey].once('exit', () => {
        clearTimeout(timeout);
        webContents.send('update-from-worker', {
            type: 'retrieveCode',
            action: 'exit',
        });
        workers[workerKey] = null;
    });
    workers[workerKey].once('message', async (value) => {
        const { res, error } = value;
        if (res) {
            const data = res.response;
            store.set(null, data);
            webContents.send('update-from-worker', {
                type: 'retrieveCode',
                action: 'done',
                data,
            });
        } else {
            webContents.send('update-from-worker', {
                type: 'retrieveCode',
                action: 'error',
                error,
            });
        }
        clearTimeout(timeout);
        workers[workerKey].kill();
    });
};

_scanCodeWorker = ({ alias, targetPath, webContents, listenerName, command }) => {
    let workerKey = `scanner-${alias}`;
    // Kill child process in case it's too long
    const timeout = setTimeout(() => {
        if (workers[workerKey]) {
            workers[workerKey].kill();
        }
    }, 60000 * 2);
    if (workers[workerKey]) throw new Error('Existing instance already processing');

    workers[workerKey] = utilityProcess.fork(path.join(__dirname, '../../workers/scanner.js'), [], { cwd: targetPath });
    workers[workerKey].postMessage({ params: { alias, command } });
    workers[workerKey].once('exit', () => {
        clearTimeout(timeout);
        webContents.send(listenerName, { type: 'codeScanner', action: 'exit' });
        workers[workerKey] = null;
    });
    workers[workerKey].once('message', async (value) => {
        const { res, error } = value;
        if (res) {
            webContents.send(listenerName, {
                type: 'codeScanner',
                action: 'done',
                res,
            });
        } else {
            webContents.send(listenerName, {
                type: 'codeScanner',
                action: 'error',
                error,
            });
        }
        clearTimeout(timeout);
        workers[workerKey].kill();
    });
};

_runShell = ({ alias, targetPath, webContents, listenerName, command }) => {
    let workerKey = `shell-${alias}`;
    // Kill child process in case it's too long
    const timeout = setTimeout(() => {
        if (workers[workerKey]) {
            workers[workerKey].kill();
        }
    }, 60000 * 2);
    if (workers[workerKey]) {
        workers[workerKey].kill(); // for now i kill the existing one
    }

    workers[workerKey] = exec(command, { cwd: targetPath });

    // Handle standard output data
    workers[workerKey].stdout.on('data', (data) => {
        webContents.send(listenerName, formatResponse({ action: 'message', data }));
    });

    // Handle standard error data
    workers[workerKey].stderr.on('data', (data) => {
        webContents.send(listenerName, formatResponse({ action: 'error', data }));
    });

    // Handle on close
    workers[workerKey].on('close', (code) => {
        webContents.send(listenerName, formatResponse({ action: 'exit', data: '' }));
    });
};

formatResponse = ({ action, data, code, error }) => {
    return {
        action,
        data,
        code,
        error,
    };
};

module.exports = exportMap;
