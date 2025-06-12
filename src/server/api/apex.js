const { getWindowByAlias } = require('../../libs/window.js');
const { ipcMainManager } = require('../../libs/ipc.js');
const { ENDPOINTS } = require('../../../shared');

module.exports = function (app) {
    app.post(ENDPOINTS.ANONYMOUS_APEX_EXECUTE, async (req, res) => {
        try {
            const { alias, body, tabId } = req.body; // logLevel
            const window = getWindowByAlias(alias);
            if (window && window.webContents) {
                let result = await ipcMainManager.send(
                    ENDPOINTS.ANONYMOUS_APEX_EXECUTE,
                    { alias, body, tabId },
                    window.webContents,
                );
                res.json(result);
            } else {
                res.status(404).json({
                    status: 'error',
                    message: `No window found for alias: ${alias}. Open the SF Toolkit for the alias before calling this endpoint.`,
                });
            }
        } catch (error) {
            res.status(500).json({ status: 'error', message: error.message || error.toString() });
        }
    });
    app.post(ENDPOINTS.ANONYMOUS_APEX_SCRIPTS, async (req, res) => {
        try {
            const { alias } = req.body;
            const window = getWindowByAlias(alias);
            if (window && window.webContents) {
                let result = await ipcMainManager.send(
                    ENDPOINTS.ANONYMOUS_APEX_SCRIPTS,
                    { alias },
                    window.webContents,
                );
                res.json(result);
            } else {
                res.status(404).json({
                    status: 'error',
                    message: `No window found for alias: ${alias}. Open the SF Toolkit for the alias before calling this endpoint.`,
                });
            }
        } catch (error) {
            res.status(500).json({ status: 'error', message: error.message || error.toString() });
        }
    });
};
