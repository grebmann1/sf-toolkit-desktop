# SF Toolkit Electron

## How To Start

### Connecting Your Orgs

- When you first launch SF Toolkit, you should connect your Salesforce orgs.
- If you already have orgs connected through the Salesforce CLI, they will automatically appear in the app.
- To connect a new org, use the built-in options in the app or the Salesforce CLI (`sfdx force:auth:web:login`).

### Using the MCP Server

- To use the MCP server, you need to install and configure it.
- In SF Toolkit, go to the menu at the top left of the screen: **SF Toolkit Menu → MCP Config → Copy Config**.
- Follow the instructions provided to install and set up the MCP server using the copied configuration.

### Example MCP Server Configuration

Below is an example of what your MCP server configuration might look like. You can obtain your actual config by using **SF Toolkit Menu → MCP Config → Copy Config** in the app.

```json
{
    "sf-toolkit-mcp": {
        "command": "node",
        "args": ["/Applications/sf-toolkit-desktop.app/Contents/Resources/mcp.js"],
        "env": {}
    }
}
```

> **Note:** Never share your real access tokens or sensitive information publicly.

## Installation

Install dependencies:

1. Run `npm install`

## Running the App

### Development Mode

Start both Electron and the MCP server in development mode:

1. Run `npm run start:dev:all`

To run only Electron in development mode:

- Run `npm run start:dev:electron`

To run only the MCP server in development mode:

- Run `npm run start:dev:mcp`

> **Note:** If you have a separate client, add its start instructions here.

### Production Build

Build the MCP server for production:

- Run `npm run build:prod:mcp`

Package the Electron app for production:

- Run `npm run build:prod:package`

> **Note:** The production Electron app does not automatically start the MCP server. If you need the MCP server in production, make sure to build and run it separately.

## Publishing a Release

1. Run a dry run to verify the publish process:
    - `npm run publish:dry`
2. If the dry run succeeds, publish the release:
    - `npm run publish:run`

## Formatting

- Format code: `npm run format`
- Check formatting: `npm run format:check`
