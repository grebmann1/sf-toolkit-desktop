const fetch = require('node-fetch');
const fs = require('fs');
const path = require('path');

const addLog = (message) => {
    const logPath = path.join(__dirname, '../sf-toolkit-errors.log');
    const logMessage = `[${new Date().toISOString()}] ${message}\n`;
    try {
        fs.appendFileSync(logPath, logMessage);
    } catch (fileErr) {
        // If logging fails, fallback to console
        console.error('Failed to write to log file:', fileErr);
    }
}

/**
 * Utility to handle fetch responses and catch 404 errors for SF Toolkit API calls.
 * If a 404 is detected, returns a user-friendly message to open the SF Toolkit first.
 * Otherwise, returns the parsed JSON or throws the error.
 */
async function handleFetchWithToolkitCheck(fetchPromise) {
    try {
        const response = await fetchPromise;
        // Try to parse JSON, fallback to text if not JSON
        let data;
        try {
            data = await response.json();
        } catch (e) {
            data = await response.text();
        }
        if(data){
            addLog(JSON.stringify(data));
        }
        return { response, data };
    } catch (err) {
        // Write error to log file instead of console
        addLog(JSON.stringify(err));
        return {
            content: [
                {
                    type: 'text',
                    text: 'SF Toolkit is not open. Please open the SF Toolkit first using the global.openToolkitProtocol tool.',
                },
            ],
        };
    }
}

module.exports = { handleFetchWithToolkitCheck }; 