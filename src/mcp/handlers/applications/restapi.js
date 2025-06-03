const { z } = require('zod');

function register(server, context) {
    server.tool('RestAPI.restAPI', {}, async (params) => {
        // TODO: Implement logic for REST API
        return { response: 'stub' };
    });
    server.tool('RestAPI.getListOfSavedAPIScripts', {}, async (params) => {
        // TODO: Implement logic to get list of saved API scripts
        return { scripts: [] };
    });
}

module.exports = { register };
