const { ipcMain } = require('electron');
const { EventEmitter } = require('events');

class IpcMainManager extends EventEmitter {
    constructor() {
        super();
        this.readyWebContents = new WeakSet();
        this.messageQueue = new WeakMap();
    }

    send(channel, args, target) {
        const _target = target;
        const _args = Array.isArray(args) ? args : [args];

        if (!this.readyWebContents.has(_target)) {
            const existing = this.messageQueue.get(_target) || [];
            this.messageQueue.set(_target, [...existing, [channel, _args]]);
            return;
        }
        console.log('Sending message to window', _target);
        _target.send(channel, ..._args);
    }

    // Call this when the window's webContents is ready (e.g., on 'dom-ready')
    markWebContentsReady(webContents) {
        this.readyWebContents.add(webContents);
        const queued = this.messageQueue.get(webContents) || [];
        for (const [channel, args] of queued) {
            webContents.send(channel, ...args);
        }
        this.messageQueue.delete(webContents);
    }

    handle(channel, listener) {
        // there can be only one, so remove previous one first
        ipcMain.removeHandler(channel);
        ipcMain.handle(channel, listener);
    }

    handleOnce(channel, listener) {
        ipcMain.handleOnce(channel, listener);
    }
}

exports.ipcMainManager = new IpcMainManager();

/*
// Usage example in your window creation code:
// const { ipcMainManager } = require('./ipc.js');
// browserWindow.webContents.once('dom-ready', () => {
//     ipcMainManager.markWebContentsReady(browserWindow.webContents);
// });
*/
