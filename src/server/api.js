require('dotenv').config();

const express = require('express');
const app = express();
app.use(express.json());

// Import and use modular route handlers
require('./api/global')(app);
require('./api/org')(app);
require('./api/soql')(app);
require('./api/restapi')(app);
require('./api/navigation')(app);
require('./api/documentation')(app);

app.listen(process.env.API_PORT, () => {
    console.log(`API server listening on ${process.env.API_HOST}:${process.env.API_PORT}`);
});

module.exports = app; 