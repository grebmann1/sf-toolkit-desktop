const { getWindowByAlias } = require('../../libs/window.js');
const { ipcMainManager } = require('../../libs/ipc.js');
const { ENDPOINTS } = require('../../../shared');

module.exports = function(app) {
    app.post(ENDPOINTS.NAVIGATION_NAVIGATE, async (req, res) => {
        try {
            const { alias, application } = req.body;
            const window = getWindowByAlias(alias);
            if (window && window.webContents) {
                await ipcMainManager.send('electron-navigate-to', { application }, window.webContents);
                res.json({ status: 'success', message: `Navigated to ${application}` });
            } else {
                res.status(404).json({
                    status: 'error',
                    message: `No window found for alias: ${alias}. Please open the SF Toolkit for the alias before calling this endpoint.`,
                });
            }
        } catch (error) {
            res.status(500).json({ status: 'error', message: error.message || error.toString() });
        }
    });
}; 