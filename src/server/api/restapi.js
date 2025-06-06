module.exports = function(app) {
    app.post('/restapi/rest-api', async (req, res) => {
        // TODO: Implement logic for REST API
        res.json({ response: 'stub' });
    });

    app.post('/restapi/get-list-of-saved-api-scripts', async (req, res) => {
        // TODO: Implement logic to get list of saved API scripts
        res.json({ scripts: [] });
    });
}; 