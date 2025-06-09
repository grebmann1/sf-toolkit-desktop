require('dotenv').config();
const { BrowserWindow, shell,ipcMain } = require('electron');
const path = require('path');
const Store = require('./store.js');
const { ipcMainManager } = require('./ipc.js');


const store = new Store({
    configName: 'app-settings',
    defaults: {
        windowBounds: { width: 800, height: 600 }
    },
});

// Use a map for browser windows, keyed by alias. 'home' is the default/main window.
let browserWindows = { home: null };
exports.browserWindows = browserWindows;

const createWindow = ({ parent, alwaysOnTop, alias }) => {
    const windowBounds = store.get('windowBounds') || { width: 1400, height: 900 };
    let browserWindow = new BrowserWindow({
        width: windowBounds.width,
        height: windowBounds.height,
        parent: parent || null,
        alwaysOnTop: alwaysOnTop || false,
        minHeight: 600,
        minWidth: 600,
        acceptFirstMouse: true,
        backgroundColor: '#1d2427',
        icon: path.join(__dirname, '..', '..', 'public', 'sfdx_gui.icns'),
        show: false,
        webPreferences: {
            devTools: true,
            preload: path.join(__dirname, '..','renderer', 'lib', 'preload.js'),
            nodeIntegration: false,
            contextIsolation: true,
            webviewTag: false,
            webSecurity: false,
        },
    });

    browserWindow.webContents.once('dom-ready', () => {
        if (browserWindow) {
            browserWindow.show();
            /** To handle later to have right click menu */
            //createContextMenu(browserWindow);
        }
    });

    browserWindow.on('focus', () => {
        if (browserWindow) {
            //ipcMainManager.send(IpcEvents.SET_SHOW_ME_TEMPLATE);
        }
    });

    browserWindow.on('resize', () => {
        const { width, height } = browserWindow.getBounds();
        store.set('windowBounds', { width, height });
    });

    browserWindow.on('closed', () => {
        delete browserWindows[alias];
        browserWindow = null;
    });

    browserWindow.webContents.on('new-window', (event, url) => {
        event.preventDefault();
        shell.openExternal(url);
    });

    browserWindow.webContents.on('will-navigate', (event, url) => {
        event.preventDefault();
        shell.openExternal(url);
    });

    browserWindow.webContents.once('dom-ready', () => {
        ipcMainManager.markWebContentsReady(browserWindow.webContents);
    });
    // Store in map by alias, or as 'home' if no alias
    if (alias) {
        browserWindows[alias] = browserWindow;
    } else {
        browserWindows.home = browserWindow;
    }
    exports.browserWindows = browserWindows;
    return browserWindow;
};

// Helper to get a window by alias
exports.getWindowByAlias = (alias) => {
    return browserWindows[alias] || null;
};

// Helper to get the home window
exports.getHomeWindow = () => {
    return browserWindows.home;
};

exports.getBaseUrl = (isDev) => {
    return isDev ? process.env.DEV_URL : process.env.PROD_URL;
};

exports.createMainWindow = ({ isDev, url }) => {
    let browserWindow = createWindow({ url });
    browserWindow.loadURL(`${exports.getBaseUrl(isDev)}/app`);
    return browserWindow;
};

exports.createInstanceWindow = ({ isDev, alias, username, sessionId, serverUrl }, callback) => {
    
    console.log(`Creating Instance window`);
    let browserWindow = createWindow({ alias });
    const baseUrl = exports.getBaseUrl(isDev);

    if (alias) {
        browserWindow.loadURL(`${baseUrl}/extension?alias=${encodeURIComponent(alias)}`);
    } else {
        browserWindow.loadURL(`${baseUrl}/extension?sessionId=${sessionId}&serverUrl=${serverUrl}`);
    }

    browserWindow.webContents.once('dom-ready', () => {
        let title = alias;     
        if (username) {
            title = `${title}:${username}`;
        }
        browserWindow.setTitle(title);
    });

    // Send the channel name to the renderer after did-finish-load
    browserWindow.webContents.on('did-finish-load', () => {
        // Unique channel for this window    
        ipcMainManager.send('set-ready-channel',null, browserWindow.webContents)
        .then((result) => {
            if(callback){
                callback({result});
            }
            // Fake Loading for testing !!!
            //fakeCall();
        })
        .catch((error) => {
            if(callback){
                callback({error});
            }
        });

        
    });

    /* async function fakeCall() {
        const result = await ipcMainManager.send('electron-soql-call', { "query": "SELECT Id, Name FROM Account","alias": "default-toolkit"}, browserWindow.webContents);
    } */

    return browserWindow;
};
