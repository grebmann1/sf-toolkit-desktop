#!/usr/bin/env node
import dotenv from 'dotenv';
dotenv.config();
// MCP server using Model Context Protocol SDK
//const express = require('express');
//const { randomUUID } = require('crypto');
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
//const { StreamableHTTPServerTransport } = require('@modelcontextprotocol/sdk/server/streamableHttp.js');
//const { z } = require('zod');
// Applications
import application_soqlHandler from './handlers/applications/soql.js';
import application_restapiHandler from './handlers/applications/restapi.js';
import application_apexHandler from './handlers/applications/apex.js';
// Others
import globalHandler from './handlers/global.js';
import orgHandler from './handlers/org.js';
import documentationHandler from './handlers/documentation.js';
import navigationHandler from './handlers/navigation.js';

async function initializeMcpServer() {
    const server = new McpServer({
        name: 'sf-toolkit-mcp-server',
        version: '1.0.0',
    });
    const apiHost = process.env.API_HOST || 'http://localhost';
    const apiPort = process.env.API_PORT || 12346;
    const isOauthDisabled = process.env.OAUTH_DISABLED || false;
    const context = {
        mainWindow: null,
        isDev: false,
        ipcMainManager: null,
        apiUrl: `${apiHost}:${apiPort}`,
        isOauthDisabled,
    };

    globalHandler.register(server, context);
    orgHandler.register(server, context);
    navigationHandler.register(server, context);
    documentationHandler.register(server, context);
    application_soqlHandler.register(server, context);
    application_restapiHandler.register(server, context);
    application_apexHandler.register(server, context);

    const transport = new StdioServerTransport();
    await server.connect(transport);
    /* console.log(JSON.stringify({
        jsonrpc: "2.0",
        id: 1,
        method: "initialize",
        params: {
            _meta: {
                message: "MCP server started and communicating with the SF Toolkit on port " + apiPort,
                timestamp: new Date().toISOString(),
                version: "1.0.0"
            }
        },
      })); */
}

try {
    initializeMcpServer();
} catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
}

//jsforceMcpHandler.register(server, context);
/* 
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
    navigationHandler.register(server, context);
    jsforceMcpHandler.register(server, context);
    return server;
}

function startMCPServer({ mainWindow, isDev, ipcMainManager, port }) {
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
        //console.log('Received GET MCP request');
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
        //console.log('Received DELETE MCP request');
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

    const listenPort = port || 12346;
    app.listen(listenPort, () => {
        // Keep this log for diagnostics
        console.log(`MCP Stateless Streamable HTTP Server listening on port ${listenPort}`);
    });
}

module.exports = { startMCPServer }; */
