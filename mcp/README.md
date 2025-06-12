# SF Toolkit MCP

Model Context Protocol (MCP) SDK and server for the Salesforce Toolkit (SF Toolkit).

## Overview

**sf-toolkit-mcp** is a Node.js server that implements the Model Context Protocol (MCP) to provide a bridge between the SF Toolkit and Salesforce orgs. It exposes a set of tools and APIs for interacting with Salesforce, managing orgs, running SOQL queries, navigating toolkit applications, and more. The server is designed to be extensible and integrates with the SF Toolkit via the MCP protocol over stdio.

## Features

- **MCP Server**: Implements the Model Context Protocol for tool-based automation and integration.
- **Salesforce Org Management**: List orgs, fetch session IDs, and manage org windows.
- **SOQL Query Execution**: Display SOQL queries in the SF Toolkit.
- **Navigation**: Programmatically navigate to different applications within the SF Toolkit.
- **REST API & Metadata Operations**: (Extensible) Support for REST API calls and metadata operations via JSforce.
- **Extensible Handlers**: Modular handler system for adding new tools and integrations.

## Installation

1. Clone the repository:
    ```sh
    git clone https://github.com/grebmann1/sf-toolkit-mcp.git
    cd sf-toolkit-mcp
    ```
2. Install dependencies:
    ```sh
    npm install
    ```
3. (Optional) Configure environment variables in a `.env` file:
    - `API_HOST` (default: `http://localhost`)
    - `API_PORT` (default: `12346`)
    - `OAUTH_DISABLED` (default: `false`)

## Build

Before running as a CLI or using with `npx`, build the project:

```sh
npm run build
```

This will generate the bundled output in the `dist/` directory.

## Usage

### As a Node.js Server

Start the MCP server:

```sh
npm start
```

### As a CLI (via npx or globally)

You can run the server as a CLI tool after building:

#### Locally (after build)

```sh
npx ./
```

Or, if you have linked the package globally:

```sh
sf-toolkit-mcp
```

#### After Publishing to npm

Once published, you (or others) can run:

```sh
npx sf-toolkit-mcp
```

### Development Mode

To start in watch mode (auto-rebuild on changes):

```sh
npm run dev
```

## Architecture

- **Entry Point**: `src/index.js` initializes the MCP server, registers handlers, and starts the stdio transport.
- **Handlers**: Located in `src/handlers/`, each handler registers a set of tools with the MCP server. Handlers include:
    - `global`: Tools for window management and launching the SF Toolkit.
    - `org`: Tools for org listing and session management.
    - `navigation`: Tools for navigating to specific applications in the SF Toolkit.
    - `applications/soql`: Tool for displaying SOQL queries in the SF Toolkit.
    - (Extensible) `applications/restapi`, `documentation`, `jsforceMcp` for advanced Salesforce operations.
- **Utilities**: Common utilities for error handling and fetch response management.

## Handlers & Tools

### Global Handler

- `global_listOfWindows`: List open SF Toolkit windows.
- `global_openSpecificOrg`: Open the SF Toolkit for a specific org alias.
- `global_openToolkitProtocol`: Launch the SF Toolkit using the OS protocol.

### Org Handler

- `Org_getListOfOrgs`: List all locally stored and SFDX orgs.
- `Org_getSessionIdAndServerUrl`: Fetch sessionId and serverUrl for an org (if OAuth enabled).

### Navigation Handler

- `Navigation_navigate`: Navigate to a specific application (soql, api, anonymousapex, org, metadata, etc.) in the SF Toolkit.

### SOQL Application Handler

- `SOQL_displayQueryInSFToolkit`: Display a SOQL query in the SF Toolkit for a given org alias.

### (Optional/Extensible Handlers)

- **REST API Handler**: Run REST API calls and manage saved API scripts.
- **Documentation Handler**: Search documentation.
- **JSforce MCP Handler**: Advanced Salesforce operations (SOQL, REST, Metadata, Apex, SObject, User, Deployment, etc.).

## Development

- Handlers are modular and can be extended by adding new files in `src/handlers/` and registering them in `src/index.js`.
- Utilities for error logging and fetch handling are in `src/handlers/util.js`.
- The project uses [zod](https://github.com/colinhacks/zod) for schema validation and [jsforce](https://jsforce.github.io/) for Salesforce API integration.

## License

- This project is licensed under the MIT License. See [LICENSE](LICENSE) for the full license text.
