const { getWindowByAlias } = require('../../libs/window.js');
const { ipcMainManager } = require('../../libs/ipc.js');
module.exports = function(app) {
    app.post('/soql/display-query-in-sf-toolkit', async (req, res) => {
        const { query, alias } = req.body;
        const window = getWindowByAlias(alias);
        if (window && window.webContents) {
            await ipcMainManager.send('electron-soql-call', { query, alias }, window.webContents);
            res.json({ status: 'success', message: `Displaying the query result for the alias: ${alias}` });
        } else {
            res.status(404).json({
                status: 'error',
                message: `No window found for alias: ${alias}. Open the SF Toolkit for the alias before calling this endpoint.`,
            });
        }
    });
}; 