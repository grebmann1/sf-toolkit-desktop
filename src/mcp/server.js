// MCP server using Model Context Protocol SDK
const express = require('express');
const { randomUUID } = require('crypto');
const { McpServer } = require('@modelcontextprotocol/sdk/server/mcp.js');
const { StreamableHTTPServerTransport } = require('@modelcontextprotocol/sdk/server/streamableHttp.js');
const { isInitializeRequest } = require('@modelcontextprotocol/sdk/types.js');
const { z } = require('zod');
const globalHandler = require('./handlers/global');
const orgHandler = require('./handlers/org');
const applicationSOQLHandler = require('./handlers/application_SOQL');
const restapiHandler = require('./handlers/restapi');
const documentationHandler = require('./handlers/documentation');
const navigationHandler = require('./handlers/navigation');
const jsforceMcpHandler = require('./handlers/jsforceMcp');

function getServer({ mainWindow, isDev, ipcMainManager }) {
    const server = new McpServer({
        name: 'sf-toolkit-mcp-server',
        version: '1.0.0',
    });
    const context = { mainWindow, isDev, ipcMainManager };
    globalHandler.register(server, context);
    orgHandler.register(server, context);
    applicationSOQLHandler.register(server, context);
    //restapiHandler.register(server, context);
    //documentationHandler.register(server, context);
    //navigationHandler.register(server, context);
    jsforceMcpHandler.register(server, context);
    return server;
}

function startMCPServer({ mainWindow, isDev, ipcMainManager }) {
    const app = express();
    app.use(express.json());

    app.post('/mcp', async (req, res) => {
        try {
            const server = getServer({ mainWindow, isDev, ipcMainManager });
            const transport = new StreamableHTTPServerTransport({
                sessionIdGenerator: undefined,
            });
            res.on('close', () => {
                console.log('Request closed');
                transport.close();
                server.close();
            });
            await server.connect(transport);
            await transport.handleRequest(req, res, req.body);
        } catch (error) {
            console.error('Error handling MCP request:', error);
            if (!res.headersSent) {
                res.status(500).json({
                    jsonrpc: '2.0',
                    error: {
                        code: -32603,
                        message: 'Internal server error',
                    },
                    id: null,
                });
            }
        }
    });

    app.get('/mcp', async (req, res) => {
        console.log('Received GET MCP request');
        res.writeHead(405).end(
            JSON.stringify({
                jsonrpc: '2.0',
                error: {
                    code: -32000,
                    message: 'Method not allowed.',
                },
                id: null,
            }),
        );
    });

    app.delete('/mcp', async (req, res) => {
        console.log('Received DELETE MCP request');
        res.writeHead(405).end(
            JSON.stringify({
                jsonrpc: '2.0',
                error: {
                    code: -32000,
                    message: 'Method not allowed.',
                },
                id: null,
            }),
        );
    });

    app.listen(12346, () => {
        console.log('MCP Stateless Streamable HTTP Server listening on port 12346');
    });
}

module.exports = { startMCPServer };
