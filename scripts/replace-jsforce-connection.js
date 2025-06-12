const fs = require('fs');
const path = require('path');

const source = path.resolve(__dirname, '../replace/jsforce.connection.js');
const target = path.resolve(__dirname, '../node_modules/jsforce/lib/connection.js');

fs.copyFile(source, target, (err) => {
    if (err) {
        console.error('Error replacing connection.js:', err);
        process.exit(1);
    } else {
        console.log('connection.js has been replaced successfully.');
    }
});
