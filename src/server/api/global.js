const { getWindowByAlias, createInstanceWindow, browserWindows,getHomeWindow } = require('../../libs/window.js');
const { app } = require('electron');
const isDev = !app.isPackaged;
const { ENDPOINTS } = require('../../../shared');

module.exports = function(app) {
    app.post(ENDPOINTS.OPEN_INSTANCE, async (req, res) => {
        const { alias, username, serverUrl, sessionId } = req.body;
        if (!alias && !username) {
            return res.status(400).json({ 
                status: 'error', 
                message: 'alias or username is required' 
            });
        }

        if(browserWindows[alias]){
            return res.json({ status: 'success' });
        }
        
        try {
            await new Promise((resolve,reject) => {
                createInstanceWindow({
                    parent: getHomeWindow(),
                    isDev: isDev,
                    alias: alias,
                    username: username,
                    serverUrl: serverUrl,
                    sessionId: sessionId,
                }, ({result,error}) => {
                    if(result){
                        resolve(result);
                    } else {
                        reject(error);
                    }
                });
            })
            res.json({ status: 'success' });
        } catch (err) {
            res.status(500).json({ 
                status: 'error', 
                message: err.message || err.toString() 
            });
        }
    });

    app.post(ENDPOINTS.LIST_OF_WINDOWS, (req, res) => {
        res.json({
            windows: Object.keys(browserWindows)
        });
    });
}; 