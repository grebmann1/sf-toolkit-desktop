const { getWindowByAlias, createInstanceWindow, browserWindows,getHomeWindow } = require('../../libs/window.js');
const { app } = require('electron');
const isDev = !app.isPackaged;
module.exports = function(app) {
    app.post('/electron/open-instance', async (req, res) => {
        const { alias, username, serverUrl, sessionId } = req.body;
        if (!alias && !username) {
            return res.status(400).json({ error: 'alias or username is required' });
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
            res.status(500).json({ error: err.message });
        }
    });

    app.post('/electron/list-of-windows', (req, res) => {
        res.json({
            windows: Object.keys(browserWindows)
        });
    });
}; 