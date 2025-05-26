const { ipcRenderer, contextBridge } = require('electron');

const allowedChannels = [
    // List allowed channels here
    'code-someMethod',
    'org-someMethod',
    'util-someMethod',
    // Add more as needed
];

contextBridge.exposeInMainWorld('electron', {
    ipcRenderer:{
        invoke: (channel, args) => {
            return ipcRenderer.invoke(channel, args);
        }
    },
    listener_on: (channel,callback) => ipcRenderer.on(channel, (_event, value) => callback(value)),
    listener_off: (channel) => ipcRenderer.removeAllListeners(channel)
})