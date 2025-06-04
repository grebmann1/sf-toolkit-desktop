# MCP SDK

This package provides a command-line Model Context Protocol (MCP) server for use with the sf-toolkit-desktop Electron app or other Node.js projects.

## Quick Start

1. **Install dependencies:**
   ```sh
   npm install
   ```

2. **Set environment variables:**
   - `API_HOST`: The host (including protocol) of the Express API server (e.g., `http://localhost`)
   - `API_PORT`: The port of the Express API server (e.g., `12346`)

   You can set these in a `.env` file:
   ```env
   API_HOST=http://localhost
   API_PORT=12346
   ```

3. **Start the Express API server** (in your Electron main process or separately):
   ```js
   // In your Electron main process or a separate Node process
   require('../src/server/api');
   ```

4. **Run the MCP server from the command line:**
   ```sh
   node mcp-sdk/index.js
   ```

   The MCP server will start and use the API URL from your environment variables.

## How It Works

- The MCP server loads all handlers and passes them a context object with `apiUrl` built from `API_HOST` and `API_PORT`.
- Handlers are thin clients that call the Express API server for all business logic using `node-fetch`.
- You can add or remove handlers by editing `mcp-sdk/index.js`.

## Example index.js

```js
require('dotenv').config();
const { McpServer } = require('@modelcontextprotocol/sdk/server/mcp.js');
const applicationSOQLHandler = require('./handlers/applications/soql');
const globalHandler = require('./handlers/global');
const orgHandler = require('./handlers/org');
const navigationHandler = require('./handlers/navigation');

const server = new McpServer({
    name: "sf-toolkit-mcp-server",
    version: "1.0.0"
});
const context = {
    mainWindow: null,
    isDev: false,
    ipcMainManager: null,
    apiUrl: `${process.env.API_HOST}:${process.env.API_PORT}`
};

globalHandler.register(server, context);
orgHandler.register(server, context);
applicationSOQLHandler.register(server, context);
navigationHandler.register(server, context);
```

## Notes
- The MCP server is stateless and can be run as a background process or service.
- Handlers require the Express API server to be running and reachable at the configured `apiUrl`.
- You can extend the server by adding more handlers and corresponding API endpoints.

## Development
- Handlers are context-agnostic and check for the presence of Electron-specific objects before using them.
- All business logic should be implemented in the Express API server, not in the handlers.