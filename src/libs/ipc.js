const { ipcMain } = require('electron');
const { EventEmitter } = require('events');
const { guid, promiseWithTimeout } = require('../utils/utils.js');
class IpcMainManager extends EventEmitter {
    constructor() {
        super();
        this.readyWebContents = new WeakSet();
        this.messageQueue = new WeakMap();
    }

    send(channel, args, target) {
        const _target = target;
        let attributes = args == null ? {} : (Array.isArray(args) ? args[0] : args);

        let responseChannel = `${channel}-response-${guid()}`;

        return new Promise((resolve, reject) => {
            ipcMain.once(responseChannel, (event, ...responseArgs) => resolve(...responseArgs));

            if (!this.readyWebContents.has(_target)) {
                const existing = this.messageQueue.get(_target) || [];
                this.messageQueue.set(_target, [...existing, [channel, [attributes,responseChannel]]]);
                return;
            }
            console.log('send', channel, [attributes,responseChannel]);
            _target.send(channel, [attributes,responseChannel]);
            // Use promiseWithTimeout to reject if not resolved in time
            promiseWithTimeout(
                new Promise((resolve2) => {
                    ipcMain.once(responseChannel, (event, ...responseArgs) => resolve2(...responseArgs));
                }),
                90000, // 90 seconds timeout (in case it's a long running query)
                'Timeout: No response from client.'
            ).then((...args) => {
                //ipcMain.removeListener(responseChannel, handler);
                resolve(...args);
            }).catch((err) => {
                //ipcMain.removeListener(responseChannel, handler);
                reject(err);
            });
        });
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
