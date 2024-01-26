/** Fix Path **/
require('fix-path')();

const { app,nativeImage } = require('electron');
const { browserWindows,createMainWindow,createInstanceWindow } = require('./libs/window.js');
const { ipcMainManager } = require('./libs/ipc.js');
const { enableEventListeners } = require('./libs/connector.js');




/** Menu **/
//require('./utils/menu.js');

/** Auto Updater **/
const isDev = !app.isPackaged;
console.log('---> isDev   <---',isDev);
console.log('---> version <---',app.getVersion());


/** Dev Mode  **/
if(isDev) {
    /*require('electron-reload')(__dirname, {
      electron: path.join(__dirname,'node_modules', '.bin', 'electron')
    })*/
}else{

    const { updateElectronApp } = require('update-electron-app');
    updateElectronApp(); // additional configuration options available
}
/** Store **/

/** IPC Manager **/
try{
    enableEventListeners(require('./libs/modules/code.js')  ,'code' ,ipcMainManager);
    enableEventListeners(require('./libs/modules/org.js')   ,'org'  ,ipcMainManager);
    enableEventListeners(require('./libs/modules/util.js')  ,'util' ,ipcMainManager);

    ipcMainManager.handle('OPEN_INSTANCE', (_,{alias,username}) => {
        createInstanceWindow({
            parent:browserWindows[0],
            isDev,alias,username
        });
    });

}catch(e){
    console.error('Issue in IPC Manager',e);
}

/** Execute **/
app.whenReady().then(async () => {
    //Add Image to dock
    app.dock.setIcon(nativeImage.createFromPath(app.getAppPath() + "/public/sfdx_gui.png"));

    // Main Window
    createMainWindow({isDev});

});

app.on('window-all-closed', () => {
    app.quit();
})




