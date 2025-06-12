// Shared API endpoint contracts and schemas for sf-toolkit-desktop and mcp

const { z } = require('zod');

// Endpoint names
const ENDPOINTS = {
    OPEN_INSTANCE: '/electron/open-instance',
    LIST_OF_WINDOWS: '/electron/list-of-windows',
    GET_LIST_OF_ORGS: '/org/list',
    GET_SESSION_ID_AND_SERVER_URL: '/org/session',
    SOQL_QUERY: '/soql/query',
    SOQL_QUERIES: '/soql/queries',
    REST_API_EXECUTE: '/api/execute',
    REST_API_SCRIPTS: '/api/scripts',
    SOQL_NAVIGATE_TAB: '/soql/navigate-tab',
    NAVIGATION_NAVIGATE: '/navigation/navigate',
    ANONYMOUS_APEX_EXECUTE: '/apex/execute',
    ANONYMOUS_APEX_SCRIPTS: '/apex/scripts',
};

module.exports = {
    ENDPOINTS,
};
