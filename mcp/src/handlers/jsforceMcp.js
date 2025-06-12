// JSforce MCP Implementation
// This file will contain all MCP integration points for interacting with Salesforce using JSforce.
// Authentication is handled externally; sessionId and serverUrl will be provided for each operation.
import { z } from 'zod';
import jsforce from 'jsforce';

/**
 * Utility: Create a JSforce connection from sessionId and serverUrl
 */
function createConnection({ sessionId, serverUrl }) {
    return new jsforce.Connection({
        instanceUrl: serverUrl,
        accessToken: sessionId,
    });
}

/**
 * Register JSforce MCP tools with the MCP server
 */
function register(server) {
    server.tool(
        'Query.querySOQL',
        'Run a SOQL query on the Salesforce org',
        {
            sessionId: z.string().describe('Salesforce session ID'),
            serverUrl: z.string().describe('Salesforce instance URL'),
            soql: z.string().describe('Salesforce SOQL query string'),
        },
        async (params) => {
            return await soqlQuery(params);
        },
    );
    server.tool(
        'RestApi.call',
        'Call Salesforce REST API with arbitrary method, path, body, and headers on the Salesforce org',
        {
            sessionId: z.string().describe('Salesforce session ID'),
            serverUrl: z.string().describe('Salesforce instance URL'),
            method: z.enum(['GET', 'POST', 'PUT', 'PATCH', 'DELETE']).describe('HTTP method'),
            path: z.string().describe('REST API path (e.g. /services/data/vXX.X/sobjects/Account)'),
            body: z.any().optional().describe('Request body (for POST, PUT, PATCH)'),
            headers: z.record(z.string()).optional().describe('Additional HTTP headers'),
        },
        async (params) => {
            return await restApiCall(params);
        },
    );
    server.tool(
        'Metadata.operation',
        'Perform a Metadata API operation (describe, list, read, create, update, upsert, delete, rename) on the Salesforce org',
        {
            sessionId: z.string().describe('Salesforce session ID'),
            serverUrl: z.string().describe('Salesforce instance URL'),
            operation: z
                .enum(['describe', 'list', 'read', 'create', 'update', 'upsert', 'delete', 'rename'])
                .describe('Metadata operation'),
            metadataType: z.string().optional().describe('Metadata type (e.g. CustomObject, ApexClass, etc.)'),
            version: z.string().optional().describe('API version (for describe/list)'),
            queries: z
                .array(z.object({ type: z.string(), folder: z.string().optional() }))
                .optional()
                .describe('List queries (for list)'),
            fullNames: z
                .union([z.string(), z.array(z.string())])
                .optional()
                .describe('Full names (for read/delete)'),
            metadata: z.any().optional().describe('Metadata object(s) (for create/update/upsert)'),
            oldFullName: z.string().optional().describe('Old full name (for rename)'),
            newFullName: z.string().optional().describe('New full name (for rename)'),
        },
        async (params) => {
            return await metadataOperation(params);
        },
    );
    server.tool(
        'Apex.executeAnonymous',
        'Execute anonymous Apex code in Salesforce. apexCode is required. logLevel is optional (defaults to DEBUG).',
        {
            sessionId: z.string().describe('Salesforce session ID'),
            serverUrl: z.string().describe('Salesforce instance URL'),
            apexCode: z.string().describe('Apex code to execute anonymously'),
            logLevel: z
                .enum(['NONE', 'ERROR', 'WARN', 'INFO', 'DEBUG', 'FINE', 'FINER', 'FINEST'])
                .optional()
                .describe('Log level for debug logs (optional, defaults to DEBUG)'),
        },
        async (params) => {
            return await executeApex(params);
        },
    );
    server.tool(
        'SObject.describe',
        'Get detailed schema metadata including all fields, relationships, and field properties of any Salesforce object.',
        {
            sessionId: z.string().describe('Salesforce session ID'),
            serverUrl: z.string().describe('Salesforce instance URL'),
            sobjectType: z.string().describe("API name of the object (e.g., 'Account', 'Contact', 'Custom_Object__c')"),
        },
        async (params) => {
            return await describeSObject(params);
        },
    );
    server.tool(
        'User.getInfo',
        'Get current Salesforce user info for the session.',
        {
            sessionId: z.string().describe('Salesforce session ID'),
            serverUrl: z.string().describe('Salesforce instance URL'),
        },
        async (params) => {
            return await getUserInfo(params);
        },
    );
    server.tool(
        'SObject.listAll',
        'List all SObjects in the org, including both standard and tooling API objects.',
        {
            sessionId: z.string().describe('Salesforce session ID'),
            serverUrl: z.string().describe('Salesforce instance URL'),
        },
        async (params) => {
            return await listSObjects(params);
        },
    );
    server.tool(
        'Deployment.getLatest',
        'Fetch the latest 20 deployment requests from this week, ordered by CreatedDate DESC.',
        {
            sessionId: z.string().describe('Salesforce session ID'),
            serverUrl: z.string().describe('Salesforce instance URL'),
        },
        async (params) => {
            return await getLatestDeployments(params);
        },
    );
    // Add more tool registrations here as you implement them
}

const soqlQuery = async ({ sessionId, serverUrl, soql }) => {
    try {
        const conn = createConnection({ sessionId, serverUrl });
        const result = await conn.query(soql);
        const response = { success: true, records: result.records, totalSize: result.totalSize };
        return {
            content: [
                {
                    type: 'text',
                    text: JSON.stringify(response),
                },
            ],
        };
    } catch (error) {
        const response = { success: false, error: error.message || error.toString() };
        return {
            content: [
                {
                    type: 'text',
                    text: JSON.stringify(response),
                },
            ],
        };
    }
};

const restApiCall = async ({ sessionId, serverUrl, method, path, body, headers }) => {
    try {
        const conn = createConnection({ sessionId, serverUrl });
        // Prepare request options
        const options = {
            method: method.toUpperCase(),
            url: path,
        };
        if (headers) {
            options.headers = headers;
        }
        if (body && !['GET', 'DELETE'].includes(method.toUpperCase())) {
            options.body = body;
        }
        const result = await conn.request(options);
        const response = { success: true, status: result.status || 200, data: result };
        return {
            content: [
                {
                    type: 'text',
                    text: JSON.stringify(response),
                },
            ],
        };
    } catch (error) {
        const response = { success: false, error: error.message || error.toString() };
        return {
            content: [
                {
                    type: 'text',
                    text: JSON.stringify(response),
                },
            ],
        };
    }
};

const metadataOperation = async ({ sessionId, serverUrl, operation, metadataType, ...args }) => {
    try {
        const conn = createConnection({ sessionId, serverUrl });
        let result;
        switch (operation) {
            case 'describe':
                // args.version is optional
                result = await conn.metadata.describe(args.version);
                break;
            case 'list':
                // args.queries (array of {type, folder?}), args.version optional
                result = await conn.metadata.list(args.queries, args.version);
                break;
            case 'read':
                // args.fullNames (string or array)
                result = await conn.metadata.read(metadataType, args.fullNames);
                break;
            case 'create':
                // args.metadata (object or array)
                result = await conn.metadata.create(metadataType, args.metadata);
                break;
            case 'update':
                // args.metadata (object or array)
                result = await conn.metadata.update(metadataType, args.metadata);
                break;
            case 'upsert':
                // args.metadata (object or array)
                result = await conn.metadata.upsert(metadataType, args.metadata);
                break;
            case 'delete':
                // args.fullNames (string or array)
                result = await conn.metadata.delete(metadataType, args.fullNames);
                break;
            case 'rename':
                // args.oldFullName, args.newFullName
                result = await conn.metadata.rename(metadataType, args.oldFullName, args.newFullName);
                break;
            default:
                throw new Error(`Unsupported metadata operation: ${operation}`);
        }
        const response = { success: true, result };
        return {
            content: [
                {
                    type: 'text',
                    text: JSON.stringify(response),
                },
            ],
        };
    } catch (error) {
        const response = { success: false, error: error.message || error.toString() };
        return {
            content: [
                {
                    type: 'text',
                    text: JSON.stringify(response),
                },
            ],
        };
    }
};

const executeApex = async ({ sessionId, serverUrl, apexCode, logLevel }) => {
    try {
        if (!apexCode || apexCode.trim() === '') {
            throw new Error('apexCode is required and cannot be empty');
        }
        const conn = createConnection({ sessionId, serverUrl });
        const level = logLevel || 'DEBUG';
        // Execute anonymous Apex
        const result = await conn.tooling.executeAnonymous(apexCode);
        let responseText = '';
        if (result.compiled) {
            responseText += `**Compilation:** Success\n`;
        } else {
            responseText += `**Compilation:** Failed\n`;
            responseText += `**Line:** ${result.line}\n`;
            responseText += `**Column:** ${result.column}\n`;
            responseText += `**Error:** ${result.compileProblem}\n\n`;
        }
        if (result.compiled && result.success) {
            responseText += `**Execution:** Success\n`;
        } else if (result.compiled) {
            responseText += `**Execution:** Failed\n`;
            responseText += `**Error:** ${result.exceptionMessage}\n`;
            if (result.exceptionStackTrace) {
                responseText += `**Stack Trace:**\n${result.exceptionStackTrace}\n\n`;
            }
        }
        // Attempt to fetch the latest debug log
        if (result.compiled) {
            try {
                const logs = await conn.query(`SELECT Id FROM ApexLog ORDER BY LastModifiedDate DESC LIMIT 1`);
                if (logs.records.length > 0) {
                    const logId = logs.records[0].Id;
                    const logBody = await conn.tooling.request({
                        method: 'GET',
                        url: `/services/data/v58.0/tooling/sobjects/ApexLog/${logId}/Body`,
                    });
                    responseText += `\n**Debug Log:**\n${logBody}\n`;
                } else {
                    responseText += `\n**Debug Log:** No logs available. Ensure debug logs are enabled for your user.`;
                }
            } catch (logError) {
                responseText += `\n**Debug Log:** Unable to retrieve debug logs: ${logError instanceof Error ? logError.message : String(logError)}`;
            }
        }
        return {
            content: [
                {
                    type: 'text',
                    text: responseText,
                },
            ],
        };
    } catch (error) {
        return {
            content: [
                {
                    type: 'text',
                    text: `Error executing anonymous Apex: ${error instanceof Error ? error.message : String(error)}`,
                },
            ],
            isError: true,
        };
    }
};

const describeSObject = async ({ sessionId, serverUrl, sobjectType }) => {
    try {
        if (!sobjectType || sobjectType.trim() === '') {
            throw new Error('sobjectType is required and cannot be empty');
        }
        const conn = createConnection({ sessionId, serverUrl });
        const describe = await conn.describe(sobjectType);
        const formattedDescription = `
            Object: ${describe.name} (${describe.label})${describe.custom ? ' (Custom Object)' : ''}
            Fields:
            ${describe.fields
                .map(
                    (field) =>
                        `  - ${field.name} (${field.label})\n    Type: ${field.type}${field.length ? `, Length: ${field.length}` : ''}\n    Required: ${!field.nillable}\n    ${field.referenceTo && field.referenceTo.length > 0 ? `References: ${field.referenceTo.join(', ')}` : ''}\n    ${field.picklistValues && field.picklistValues.length > 0 ? `Picklist Values: ${field.picklistValues.map((v) => v.value).join(', ')}` : ''}`,
                )
                .join('\n')}`;
        return {
            content: [
                {
                    type: 'text',
                    text: formattedDescription,
                },
            ],
            isError: false,
        };
    } catch (error) {
        return {
            content: [
                {
                    type: 'text',
                    text: `Error describing SObject: ${error instanceof Error ? error.message : String(error)}`,
                },
            ],
            isError: true,
        };
    }
};

const getUserInfo = async ({ sessionId, serverUrl }) => {
    try {
        const conn = createConnection({ sessionId, serverUrl });
        const userInfo = await conn.identity();
        return {
            content: [
                {
                    type: 'text',
                    text: JSON.stringify(userInfo, null, 2),
                },
            ],
            isError: false,
        };
    } catch (error) {
        return {
            content: [
                {
                    type: 'text',
                    text: `Error fetching user info: ${error instanceof Error ? error.message : String(error)}`,
                },
            ],
            isError: true,
        };
    }
};

const listSObjects = async ({ sessionId, serverUrl }) => {
    try {
        const conn = createConnection({ sessionId, serverUrl });
        // Standard SObjects
        const standard = await conn.describeGlobal();
        // Tooling SObjects
        const tooling = await conn.tooling.describeGlobal();
        return {
            content: [
                {
                    type: 'text',
                    text: `Standard SObjects (${standard.sobjects.length}):\n${standard.sobjects.map((s) => s.name).join(', ')}\n\nTooling SObjects (${tooling.sobjects.length}):\n${tooling.sobjects.map((s) => s.name).join(', ')}`,
                },
            ],
            isError: false,
        };
    } catch (error) {
        return {
            content: [
                {
                    type: 'text',
                    text: `Error listing SObjects: ${error instanceof Error ? error.message : String(error)}`,
                },
            ],
            isError: true,
        };
    }
};

const getLatestDeployments = async ({ sessionId, serverUrl }) => {
    try {
        const conn = createConnection({ sessionId, serverUrl });
        const query = `
            SELECT Id, Type, Status, NumberTestErrors, NumberTestsCompleted, NumberComponentsTotal,
                NumberComponentErrors, NumberComponentsDeployed, StartDate, CompletedDate, ErrorMessage, CreatedDate, NumberTestsTotal,
                LastModifiedDate, IsDeleted, ChangeSetName, StateDetail, ErrorStatusCode, RunTestsEnabled, RollbackOnError,
                IgnoreWarnings, CheckOnly, CanceledById, CanceledBy.Name, AllowMissingFiles, AutoUpdatePackage, PurgeOnDelete, SinglePackage,
                TestLevel, LastModifiedBy.Name, CreatedBy.Name
            FROM DeployRequest
            WHERE CreatedDate = THIS_WEEK
            ORDER BY CreatedDate DESC
            LIMIT 20
        `;
        const result = await conn.tooling.query(query);
        return {
            content: [
                {
                    type: 'text',
                    text: JSON.stringify(result.records, null, 2),
                },
            ],
            isError: false,
        };
    } catch (error) {
        return {
            content: [
                {
                    type: 'text',
                    text: `Error fetching latest deployments: ${error instanceof Error ? error.message : String(error)}`,
                },
            ],
            isError: true,
        };
    }
};

// Export stubs for each integration point (to be implemented one by one)
export {
    createConnection,
    soqlQuery,
    restApiCall,
    metadataOperation,
    executeApex,
    toolingQuery,
    bulkOperation,
    describeSObject,
    listSObjects,
    getUserInfo,
    getLatestDeployments,
};
export default { register };
