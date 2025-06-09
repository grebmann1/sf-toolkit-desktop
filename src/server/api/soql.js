const { getWindowByAlias } = require('../../libs/window.js');
const { ipcMainManager } = require('../../libs/ipc.js');
const { ENDPOINTS } = require('../../../shared');

module.exports = function(app) {
    app.post(ENDPOINTS.SOQL_QUERY, async (req, res) => {
        const { query, alias } = req.body;
        const window = getWindowByAlias(alias);
        if (window && window.webContents) {
            let result = await ipcMainManager.send(ENDPOINTS.SOQL_QUERY, { query, alias }, window.webContents);
            res.json(result);
        } else {
            res.status(404).json({
                status: 'error',
                message: `No window found for alias: ${alias}. Open the SF Toolkit for the alias before calling this endpoint.`,
            });
        }
    });

    app.post(ENDPOINTS.SOQL_NAVIGATE_TAB, async (req, res) => {
        const { tabId, alias } = req.body;
        const window = getWindowByAlias(alias);
        if (window && window.webContents) {
            let result = await ipcMainManager.send(ENDPOINTS.SOQL_NAVIGATE_TAB, { tabId, alias }, window.webContents);
            res.json(result);
        } else {
            res.status(404).json({
                status: 'error',
                message: `No window found for alias: ${alias}. Open the SF Toolkit for the alias before calling this endpoint.`,
            });
        }
    });

    app.post(ENDPOINTS.SOQL_FETCH_QUERIES, async (req, res) => {
        const { alias } = req.body;
        const window = getWindowByAlias(alias);
        if (window && window.webContents) {
            let result = await ipcMainManager.send(ENDPOINTS.SOQL_FETCH_QUERIES, { alias }, window.webContents);
            res.json(result);
        } else {
            res.status(404).json({
                status: 'error',
                message: `No window found for alias: ${alias}. Open the SF Toolkit for the alias before calling this endpoint.`,
            });
        }
    });


}; 