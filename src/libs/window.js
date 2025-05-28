const { BrowserWindow, shell } = require('electron');
const path = require('path');
const Store = require('./store.js');

const store = new Store({
    configName: 'app-settings',
    defaults: {
        windowBounds: { width: 800, height: 600 },
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
            preload: path.join(__dirname, '..', 'preload.js'),
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
        browserWindows = browserWindows.filter((bw) => browserWindow !== bw);
        exports.browserWindows = browserWindows;
        browserWindow = null;
    });

    browserWindow.webContents.on('new-window', (event, url) => {
        console.log('new-window', event, url);
        event.preventDefault();
        shell.openExternal(url);
    });

    browserWindow.webContents.on('will-navigate', (event, url) => {
        console.log('will-navigate', event, url);
        event.preventDefault();
        shell.openExternal(url);
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
    return isDev ? 'http://localhost:3000' : 'https://sf-toolkit.com';
};

exports.createMainWindow = ({ isDev, url }) => {
    let browserWindow = createWindow({ url });
    browserWindow.loadURL(`${exports.getBaseUrl(isDev)}/app`);
    return browserWindow;
};

exports.createInstanceWindow = ({ isDev, alias, username, sessionId, serverUrl }) => {
    console.log(`Creating Instance window`);
    let browserWindow = createWindow({ alias });
    const baseUrl = exports.getBaseUrl(isDev);

    if (serverUrl && sessionId) {
        // TODO: check if sessionId can be removed and use accessToken only
        browserWindow.loadURL(`${baseUrl}/extension?sessionId=${sessionId}&serverUrl=${serverUrl}`);
    } else {
        browserWindow.loadURL(`${baseUrl}/extension?alias=${encodeURIComponent(alias)}`);
    }

    browserWindow.webContents.once('dom-ready', () => {
        browserWindow.setTitle(`${alias}:${username}`);
    });
    return browserWindow;
};
