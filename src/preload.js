const { ipcRenderer, contextBridge } = require('electron');

contextBridge.exposeInMainWorld('electron', {
    ipcRenderer: {
        invoke: (channel, args) => {
            return ipcRenderer.invoke(channel, args);
        },
    },
    listener_on: (channel, callback) => ipcRenderer.on(channel, (_event, value) => callback(value)),
    listener_off: (channel) => ipcRenderer.removeAllListeners(channel),
});
