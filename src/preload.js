const { ipcRenderer, contextBridge } = require('electron');

contextBridge.exposeInMainWorld('electron', {
    invoke: (channel, args) => {
        return ipcRenderer.invoke(channel, args); // Investigate if we can use ...args here
    },
    send: (channel, args) => {
        return ipcRenderer.send(channel, args); // Investigate if we can use ...args here
    },
    sendSync: async (channel, args) => {
        return await ipcRenderer.sendSync(channel, args); // Investigate if we can use ...args here
    },
    listener_on: (channel, callback) => {
        ipcRenderer.on(channel, (event, ...args) => callback(...args));
    },
    listener_once: (channel, callback) => {
        ipcRenderer.once(channel, (event, ...args) => callback(...args));
    },
    listener_off: (channel) => ipcRenderer.removeAllListeners(channel),
    setChannel: (channel) => (this.channel = channel),
    getChannel: () => this.channel,
});
