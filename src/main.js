require('fix-path')();

const { app, nativeImage } = require('electron');
const { browserWindows, createMainWindow, createInstanceWindow, getWindowByAlias } = require('./libs/window.js');
const { ipcMainManager } = require('./libs/ipc.js');
const { enableEventListeners } = require('./libs/connector.js');
const path = require('path');
const Store = require('./libs/store.js');
const expressApiServer = require('./server/api');

/** Menu **/
//require('./utils/menu.js');

/** Auto Updater **/
const isDev = process.env.NODE_ENV === 'development';
console.log('process.env.PROD_URL',process.env.PROD_URL);
console.log('---> isDev   <---', isDev);
console.log('---> isPackaged   <---', app.isPackaged);

/** Dev Mode  **/
if (app.isPackaged) {
    const { updateElectronApp } = require('update-electron-app');
    updateElectronApp(); // additional configuration options available
    
} else {
    /*require('electron-reload')(__dirname, {
      electron: path.join(__dirname,'node_modules', '.bin', 'electron')
    })*/
}
/** Store **/

const store = new Store({
    configName: 'app-settings',
    defaults: {
        mcpPort: 12346,
    },
});

/** IPC Manager **/
try {
    enableEventListeners(require('./libs/modules/code.js'), 'code', ipcMainManager);
    enableEventListeners(require('./libs/modules/org.js'), 'org', ipcMainManager);
    enableEventListeners(require('./libs/modules/util.js'), 'util', ipcMainManager);

    ipcMainManager.handle('OPEN_INSTANCE', (_, { alias, username, serverUrl, sessionId }) => {
        createInstanceWindow({
            parent: getWindowByAlias(alias || username),
            isDev,
            alias,
            username,
            serverUrl,
            sessionId,
        });
    });
} catch (e) {
    console.error('Issue in IPC Manager', e);
}

// Register protocol handler (macOS)
if (process.defaultApp) {
    if (process.argv.length >= 2) {
        app.setAsDefaultProtocolClient('sf-toolkit', process.execPath, [path.resolve(process.argv[1])]);
    }
} else {
    app.setAsDefaultProtocolClient('sf-toolkit');
}


// Handle protocol URLs (macOS)
app.on('open-url', (event, url) => {
    event.preventDefault();
    console.log('App opened with URL:', url);
    // TODO: Add your logic here (e.g., send to renderer)
});

/** Execute **/
app.whenReady().then(async () => {
    //Add Image to dock
    app.dock.setIcon(nativeImage.createFromPath(app.getAppPath() + '/public/sfdx_gui.png'));

    // Main Window
    const mainWindow = createMainWindow({ isDev });
    // Set the home window in the browserWindows map
    browserWindows.home = mainWindow;

    // Start Express REST API server for window management
    expressApiServer; // Just require to start the server
});

app.on('window-all-closed', () => {
    // On macOS, apps generally stay open until the user explicitly quits
    app.quit();
});
