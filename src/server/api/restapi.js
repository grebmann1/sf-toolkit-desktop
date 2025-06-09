const { getWindowByAlias } = require('../../libs/window.js');
const { ipcMainManager } = require('../../libs/ipc.js');
const { ENDPOINTS } = require('../../../shared');

module.exports = function(app) {
    app.post(ENDPOINTS.REST_API_EXECUTE, async (req, res) => {
        const { alias, method,headers,endpoint,body,tabId } = req.body;
        const window = getWindowByAlias(alias);
        if (window && window.webContents) {
            let result = await ipcMainManager.send(ENDPOINTS.REST_API_EXECUTE, { alias, method,headers,endpoint,body,tabId }, window.webContents);
            console.log('result--> ', result);
            res.json(result);
        } else {
            res.status(404).json({
                status: 'error',
                message: `No window found for alias: ${alias}. Open the SF Toolkit for the alias before calling this endpoint.`,
            });
        }
    });

    app.post(ENDPOINTS.REST_API_SCRIPTS, async (req, res) => {
        console.log('ENDPOINTS.REST_API_SCRIPTS', req.body);
        const { alias } = req.body;
        const window = getWindowByAlias(alias);
        if (window && window.webContents) {
            let result = await ipcMainManager.send(ENDPOINTS.REST_API_SCRIPTS, { alias }, window.webContents);
            console.log('result--> ', result);
            res.json(result);
        } else {
            // TODO: Implement logic to get list of saved API scripts if window not found
            res.status(404).json({
                status: 'error',
                message: `No window found for alias: ${alias}. Open the SF Toolkit for the alias before calling this endpoint.`,
            });
        }
    });
}; 