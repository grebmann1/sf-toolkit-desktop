'use strict';
var __createBinding =
    (this && this.__createBinding) ||
    (Object.create
        ? function (o, m, k, k2) {
              if (k2 === undefined) k2 = k;
              var desc = Object.getOwnPropertyDescriptor(m, k);
              if (!desc || ('get' in desc ? !m.__esModule : desc.writable || desc.configurable)) {
                  desc = {
                      enumerable: true,
                      get: function () {
                          return m[k];
                      },
                  };
              }
              Object.defineProperty(o, k2, desc);
          }
        : function (o, m, k, k2) {
              if (k2 === undefined) k2 = k;
              o[k2] = m[k];
          });
var __setModuleDefault =
    (this && this.__setModuleDefault) ||
    (Object.create
        ? function (o, v) {
              Object.defineProperty(o, 'default', { enumerable: true, value: v });
          }
        : function (o, v) {
              o['default'] = v;
          });
var __importStar =
    (this && this.__importStar) ||
    function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null)
            for (var k in mod)
                if (k !== 'default' && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
        __setModuleDefault(result, mod);
        return result;
    };
var __importDefault =
    (this && this.__importDefault) ||
    function (mod) {
        return mod && mod.__esModule ? mod : { default: mod };
    };
Object.defineProperty(exports, '__esModule', { value: true });
exports.Connection = void 0;
/**
 *
 */
const events_1 = require('events');
const jsforce_1 = __importDefault(require('./jsforce'));
const transport_1 = __importStar(require('./transport'));
const logger_1 = require('./util/logger');
const oauth2_1 = __importDefault(require('./oauth2'));
const cache_1 = __importDefault(require('./cache'));
const http_api_1 = __importDefault(require('./http-api'));
const session_refresh_delegate_1 = __importDefault(require('./session-refresh-delegate'));
const query_1 = __importDefault(require('./query'));
const sobject_1 = __importDefault(require('./sobject'));
const quick_action_1 = __importDefault(require('./quick-action'));
const process_1 = __importDefault(require('./process'));
const formatter_1 = require('./util/formatter');
const form_data_1 = __importDefault(require('form-data'));
/**
 *
 */
const defaultConnectionConfig = {
    loginUrl: 'https://login.salesforce.com',
    instanceUrl: '',
    version: '50.0',
    logLevel: 'NONE',
    maxRequest: 10,
};
/**
 *
 */
function esc(str) {
    return String(str || '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}
/**
 *
 */
function parseSignedRequest(sr) {
    if (typeof sr === 'string') {
        if (sr.startsWith('{')) {
            // might be JSON
            return JSON.parse(sr);
        } // might be original base64-encoded signed request
        const msg = sr.split('.').pop(); // retrieve latter part
        if (!msg) {
            throw new Error('Invalid signed request');
        }
        const json = Buffer.from(msg, 'base64').toString('utf-8');
        return JSON.parse(json);
    }
    return sr;
}
/** @private **/
function parseIdUrl(url) {
    const [organizationId, id] = url.split('/').slice(-2);
    return { id, organizationId, url };
}
/**
 * Session Refresh delegate function for OAuth2 authz code flow
 * @private
 */
async function oauthRefreshFn(conn, callback) {
    try {
        if (!conn.refreshToken) {
            throw new Error('No refresh token found in the connection');
        }
        const res = await conn.oauth2.refreshToken(conn.refreshToken);
        const userInfo = parseIdUrl(res.id);
        conn._establish({
            instanceUrl: res.instance_url,
            accessToken: res.access_token,
            userInfo,
        });
        callback(undefined, res.access_token, res);
    } catch (err) {
        if (err instanceof Error) {
            callback(err);
        } else {
            throw err;
        }
    }
}
/**
 * Session Refresh delegate function for username/password login
 * @private
 */
function createUsernamePasswordRefreshFn(username, password) {
    return async (conn, callback) => {
        try {
            await conn.login(username, password);
            if (!conn.accessToken) {
                throw new Error('Access token not found after login');
            }
            callback(null, conn.accessToken);
        } catch (err) {
            if (err instanceof Error) {
                callback(err);
            } else {
                throw err;
            }
        }
    };
}
/**
 * @private
 */
function toSaveResult(err) {
    return {
        success: false,
        errors: [err],
    };
}
/**
 *
 */
function raiseNoModuleError(name) {
    throw new Error(`API module '${name}' is not loaded, load 'jsforce/api/${name}' explicitly`);
}
/*
 * Constant of maximum records num in DML operation (update/delete)
 */
const MAX_DML_COUNT = 200;
/**
 *
 */
class Connection extends events_1.EventEmitter {
    static _logger = (0, logger_1.getLogger)('connection');
    version;
    loginUrl;
    instanceUrl;
    accessToken;
    refreshToken;
    userInfo;
    limitInfo = {};
    oauth2;
    sobjects = {};
    cache;
    _callOptions;
    _maxRequest;
    _logger;
    _logLevel;
    _transport;
    _sessionType;
    _refreshDelegate;
    // describe: (name: string) => Promise<DescribeSObjectResult>;
    describe$;
    describe$$;
    describeSObject;
    describeSObject$;
    describeSObject$$;
    // describeGlobal: () => Promise<DescribeGlobalResult>;
    describeGlobal$;
    describeGlobal$$;
    // API libs are not instantiated here so that core module to remain without dependencies to them
    // It is responsible for developers to import api libs explicitly if they are using 'jsforce/core' instead of 'jsforce'.
    get analytics() {
        return raiseNoModuleError('analytics');
    }
    get apex() {
        return raiseNoModuleError('apex');
    }
    get bulk() {
        return raiseNoModuleError('bulk');
    }
    get bulk2() {
        return raiseNoModuleError('bulk2');
    }
    get chatter() {
        return raiseNoModuleError('chatter');
    }
    get metadata() {
        return raiseNoModuleError('metadata');
    }
    get soap() {
        return raiseNoModuleError('soap');
    }
    get streaming() {
        return raiseNoModuleError('streaming');
    }
    get tooling() {
        return raiseNoModuleError('tooling');
    }
    /**
     *
     */
    constructor(config = {}) {
        super();
        const { loginUrl, instanceUrl, version, oauth2, maxRequest, logLevel, proxyUrl, httpProxy } = config;
        this.loginUrl = loginUrl || defaultConnectionConfig.loginUrl;
        this.instanceUrl = instanceUrl || defaultConnectionConfig.instanceUrl;
        if (this.isLightningInstance()) {
            throw new Error('lightning URLs are not valid as instance URLs');
        }
        this.version = version || defaultConnectionConfig.version;
        this.oauth2 =
            oauth2 instanceof oauth2_1.default
                ? oauth2
                : new oauth2_1.default({
                      loginUrl: this.loginUrl,
                      proxyUrl,
                      httpProxy,
                      ...oauth2,
                  });
        let refreshFn = config.refreshFn;
        if (!refreshFn && this.oauth2.clientId) {
            refreshFn = oauthRefreshFn;
        }
        if (refreshFn) {
            this._refreshDelegate = new session_refresh_delegate_1.default(this, refreshFn);
        }
        this._maxRequest = maxRequest || defaultConnectionConfig.maxRequest;
        this._logger = logLevel ? Connection._logger.createInstance(logLevel) : Connection._logger;
        this._logLevel = logLevel;
        this._transport = proxyUrl
            ? new transport_1.XdProxyTransport(proxyUrl)
            : httpProxy
              ? new transport_1.HttpProxyTransport(httpProxy)
              : new transport_1.default();
        this._callOptions = config.callOptions;
        this.cache = new cache_1.default();
        const describeCacheKey = (type) => (type ? `describe.${type}` : 'describe');
        const describe = Connection.prototype.describe;
        this.describe = this.cache.createCachedFunction(describe, this, {
            key: describeCacheKey,
            strategy: 'NOCACHE',
        });
        this.describe$ = this.cache.createCachedFunction(describe, this, {
            key: describeCacheKey,
            strategy: 'HIT',
        });
        this.describe$$ = this.cache.createCachedFunction(describe, this, {
            key: describeCacheKey,
            strategy: 'IMMEDIATE',
        });
        this.describeSObject = this.describe;
        this.describeSObject$ = this.describe$;
        this.describeSObject$$ = this.describe$$;
        const describeGlobal = Connection.prototype.describeGlobal;
        this.describeGlobal = this.cache.createCachedFunction(describeGlobal, this, {
            key: 'describeGlobal',
            strategy: 'NOCACHE',
        });
        this.describeGlobal$ = this.cache.createCachedFunction(describeGlobal, this, {
            key: 'describeGlobal',
            strategy: 'HIT',
        });
        this.describeGlobal$$ = this.cache.createCachedFunction(describeGlobal, this, {
            key: 'describeGlobal',
            strategy: 'IMMEDIATE',
        });
        const { accessToken, refreshToken, sessionId, serverUrl, signedRequest } = config;
        this._establish({
            accessToken,
            refreshToken,
            instanceUrl,
            sessionId,
            serverUrl,
            signedRequest,
        });
        jsforce_1.default.emit('connection:new', this);
    }
    /* @private */
    _establish(options) {
        const { accessToken, refreshToken, instanceUrl, sessionId, serverUrl, signedRequest, userInfo } = options;
        this.instanceUrl = serverUrl ? serverUrl.split('/').slice(0, 3).join('/') : instanceUrl || this.instanceUrl;
        this.accessToken = sessionId || accessToken || this.accessToken;
        this.refreshToken = refreshToken || this.refreshToken;
        if (this.refreshToken && !this._refreshDelegate) {
            throw new Error('Refresh token is specified without oauth2 client information or refresh function');
        }
        const signedRequestObject = signedRequest && parseSignedRequest(signedRequest);
        if (signedRequestObject) {
            this.accessToken = signedRequestObject.client.oauthToken;
            if (transport_1.CanvasTransport.supported) {
                this._transport = new transport_1.CanvasTransport(signedRequestObject);
            }
        }
        this.userInfo = userInfo || this.userInfo;
        this._sessionType = sessionId ? 'soap' : 'oauth2';
        this._resetInstance();
    }
    /* @priveate */
    _clearSession() {
        this.accessToken = null;
        this.refreshToken = null;
        this.instanceUrl = defaultConnectionConfig.instanceUrl;
        this.userInfo = null;
        this._sessionType = null;
    }
    /* @priveate */
    _resetInstance() {
        this.limitInfo = {};
        this.sobjects = {};
        // TODO impl cache
        this.cache.clear();
        this.cache.get('describeGlobal').removeAllListeners('value');
        this.cache.get('describeGlobal').on('value', ({ result }) => {
            if (result) {
                for (const so of result.sobjects) {
                    this.sobject(so.name);
                }
            }
        });
        /*
        if (this.tooling) {
          this.tooling._resetInstance();
        }
        */
    }
    /**
     * Authorize the connection using OAuth2 flow.
     * Typically, just pass the code returned from authorization server in the first argument to complete authorization.
     * If you want to authorize with grant types other than `authorization_code`, you can also pass params object with the grant type.
     *
     * @returns {Promise<UserInfo>} An object that contains the user ID, org ID and identity URL.
     *
     */
    async authorize(codeOrParams, params = {}) {
        const res = await this.oauth2.requestToken(codeOrParams, params);
        const userInfo = parseIdUrl(res.id);
        this._establish({
            instanceUrl: res.instance_url,
            accessToken: res.access_token,
            refreshToken: res.refresh_token,
            userInfo,
        });
        this._logger.debug(`<login> completed. user id = ${userInfo.id}, org id = ${userInfo.organizationId}`);
        return userInfo;
    }
    /**
     *
     */
    async login(username, password) {
        this._refreshDelegate = new session_refresh_delegate_1.default(
            this,
            createUsernamePasswordRefreshFn(username, password),
        );
        if (this.oauth2?.clientId && this.oauth2.clientSecret) {
            return this.loginByOAuth2(username, password);
        }
        return this.loginBySoap(username, password);
    }
    /**
     * Login by OAuth2 username & password flow
     */
    async loginByOAuth2(username, password) {
        const res = await this.oauth2.authenticate(username, password);
        const userInfo = parseIdUrl(res.id);
        this._establish({
            instanceUrl: res.instance_url,
            accessToken: res.access_token,
            userInfo,
        });
        this._logger.info(`<login> completed. user id = ${userInfo.id}, org id = ${userInfo.organizationId}`);
        return userInfo;
    }
    /**
     *
     */
    async loginBySoap(username, password) {
        if (!username || !password) {
            return Promise.reject(new Error('no username password given'));
        }
        const body = [
            '<se:Envelope xmlns:se="http://schemas.xmlsoap.org/soap/envelope/">',
            '<se:Header/>',
            '<se:Body>',
            '<login xmlns="urn:partner.soap.sforce.com">',
            `<username>${esc(username)}</username>`,
            `<password>${esc(password)}</password>`,
            '</login>',
            '</se:Body>',
            '</se:Envelope>',
        ].join('');
        const soapLoginEndpoint = [this.loginUrl, 'services/Soap/u', this.version].join('/');
        const response = await this._transport.httpRequest({
            method: 'POST',
            url: soapLoginEndpoint,
            body,
            headers: {
                'Content-Type': 'text/xml',
                SOAPAction: '""',
                'Content-Length': Buffer.byteLength(body),
            },
        });
        let m;
        if (response.statusCode >= 400) {
            m = response.body.match(/<faultstring>([^<]+)<\/faultstring>/);
            const faultstring = m && m[1];
            throw new Error(faultstring || response.body);
        }
        // the API will return 200 and a restriced token when using an expired password:
        // https://developer.salesforce.com/docs/atlas.en-us.api.meta/api/sforce_api_calls_login_loginresult.htm
        //
        // we need to throw here to avoid a possible infinite loop with session refresh where:
        //  1. login happens, `this.accessToken` is set to the restricted token
        //  2. requests happen, get back 401
        //  3. trigger session-refresh (username/password login has a default session refresh delegate function)
        //  4. gets stuck refreshing a restricted token
        if (response.body.match(/<passwordExpired>true<\/passwordExpired>/g)) {
            throw new Error('Unable to login because the used password has expired.');
        }
        this._logger.debug(`SOAP response = ${response.body}`);
        m = response.body.match(/<serverUrl>([^<]+)<\/serverUrl>/);
        const serverUrl = m && m[1];
        m = response.body.match(/<sessionId>([^<]+)<\/sessionId>/);
        const sessionId = m && m[1];
        m = response.body.match(/<userId>([^<]+)<\/userId>/);
        const userId = m && m[1];
        m = response.body.match(/<organizationId>([^<]+)<\/organizationId>/);
        const organizationId = m && m[1];
        if (!serverUrl || !sessionId || !userId || !organizationId) {
            throw new Error('could not extract session information from login response');
        }
        const idUrl = [this.loginUrl, 'id', organizationId, userId].join('/');
        const userInfo = { id: userId, organizationId, url: idUrl };
        this._establish({
            serverUrl: serverUrl.split('/').slice(0, 3).join('/'),
            sessionId,
            userInfo,
        });
        this._logger.info(`<login> completed. user id = ${userId}, org id = ${organizationId}`);
        return userInfo;
    }
    /**
     * Logout the current session
     */
    async logout(revoke) {
        this._refreshDelegate = undefined;
        if (this._sessionType === 'oauth2') {
            return this.logoutByOAuth2(revoke);
        }
        return this.logoutBySoap(revoke);
    }
    /**
     * Logout the current session by revoking access token via OAuth2 session revoke
     */
    async logoutByOAuth2(revoke) {
        const token = revoke ? this.refreshToken : this.accessToken;
        if (token) {
            await this.oauth2.revokeToken(token);
        }
        // Destroy the session bound to this connection
        this._clearSession();
        this._resetInstance();
    }
    /**
     * Logout the session by using SOAP web service API
     */
    async logoutBySoap(revoke) {
        const body = [
            '<se:Envelope xmlns:se="http://schemas.xmlsoap.org/soap/envelope/">',
            '<se:Header>',
            '<SessionHeader xmlns="urn:partner.soap.sforce.com">',
            `<sessionId>${esc(revoke ? this.refreshToken : this.accessToken)}</sessionId>`,
            '</SessionHeader>',
            '</se:Header>',
            '<se:Body>',
            '<logout xmlns="urn:partner.soap.sforce.com"/>',
            '</se:Body>',
            '</se:Envelope>',
        ].join('');
        const response = await this._transport.httpRequest({
            method: 'POST',
            url: [this.instanceUrl, 'services/Soap/u', this.version].join('/'),
            body,
            headers: {
                'Content-Type': 'text/xml',
                SOAPAction: '""',
            },
        });
        this._logger.debug(`SOAP statusCode = ${response.statusCode}, response = ${response.body}`);
        if (response.statusCode >= 400) {
            const m = response.body.match(/<faultstring>([^<]+)<\/faultstring>/);
            const faultstring = m && m[1];
            throw new Error(faultstring || response.body);
        }
        // Destroy the session bound to this connection
        this._clearSession();
        this._resetInstance();
    }
    /**
     * Send REST API request with given HTTP request info, with connected session information.
     *
     * Endpoint URL can be absolute URL ('https://na1.salesforce.com/services/data/v32.0/sobjects/Account/describe')
     * , relative path from root ('/services/data/v32.0/sobjects/Account/describe')
     * , or relative path from version root ('/sobjects/Account/describe').
     */
    request(request, options = {}) {
        // if request is simple string, regard it as url in GET method
        let request_ = typeof request === 'string' ? { method: 'GET', url: request } : request;
        // if url is given in relative path, prepend base url or instance url before.
        request_ = {
            ...request_,
            url: this._normalizeUrl(request_.url),
        };
        const httpApi = new http_api_1.default(this, options);
        // log api usage and its quota
        httpApi.on('response', (response) => {
            if (response.headers && response.headers['sforce-limit-info']) {
                const apiUsage = response.headers['sforce-limit-info'].match(/api-usage=(\d+)\/(\d+)/);
                if (apiUsage) {
                    this.limitInfo = {
                        apiUsage: {
                            used: parseInt(apiUsage[1], 10),
                            limit: parseInt(apiUsage[2], 10),
                        },
                    };
                }
            }
        });
        return httpApi.request(request_);
    }
    /**
     * Send HTTP GET request
     *
     * Endpoint URL can be absolute URL ('https://na1.salesforce.com/services/data/v32.0/sobjects/Account/describe')
     * , relative path from root ('/services/data/v32.0/sobjects/Account/describe')
     * , or relative path from version root ('/sobjects/Account/describe').
     */
    requestGet(url, options) {
        const request = { method: 'GET', url };
        return this.request(request, options);
    }
    /**
     * Send HTTP POST request with JSON body, with connected session information
     *
     * Endpoint URL can be absolute URL ('https://na1.salesforce.com/services/data/v32.0/sobjects/Account/describe')
     * , relative path from root ('/services/data/v32.0/sobjects/Account/describe')
     * , or relative path from version root ('/sobjects/Account/describe').
     */
    requestPost(url, body, options) {
        const request = {
            method: 'POST',
            url,
            body: JSON.stringify(body),
            headers: { 'content-type': 'application/json' },
        };
        return this.request(request, options);
    }
    /**
     * Send HTTP PUT request with JSON body, with connected session information
     *
     * Endpoint URL can be absolute URL ('https://na1.salesforce.com/services/data/v32.0/sobjects/Account/describe')
     * , relative path from root ('/services/data/v32.0/sobjects/Account/describe')
     * , or relative path from version root ('/sobjects/Account/describe').
     */
    requestPut(url, body, options) {
        const request = {
            method: 'PUT',
            url,
            body: JSON.stringify(body),
            headers: { 'content-type': 'application/json' },
        };
        return this.request(request, options);
    }
    /**
     * Send HTTP PATCH request with JSON body
     *
     * Endpoint URL can be absolute URL ('https://na1.salesforce.com/services/data/v32.0/sobjects/Account/describe')
     * , relative path from root ('/services/data/v32.0/sobjects/Account/describe')
     * , or relative path from version root ('/sobjects/Account/describe').
     */
    requestPatch(url, body, options) {
        const request = {
            method: 'PATCH',
            url,
            body: JSON.stringify(body),
            headers: { 'content-type': 'application/json' },
        };
        return this.request(request, options);
    }
    /**
     * Send HTTP DELETE request
     *
     * Endpoint URL can be absolute URL ('https://na1.salesforce.com/services/data/v32.0/sobjects/Account/describe')
     * , relative path from root ('/services/data/v32.0/sobjects/Account/describe')
     * , or relative path from version root ('/sobjects/Account/describe').
     */
    requestDelete(url, options) {
        const request = { method: 'DELETE', url };
        return this.request(request, options);
    }
    /** @private **/
    _baseUrl() {
        return [this.instanceUrl, 'services/data', `v${this.version}`].join('/');
    }
    /**
     * Convert path to absolute url
     * @private
     */
    _normalizeUrl(url) {
        if (url.startsWith('/')) {
            if (url.startsWith(this.instanceUrl + '/services/')) {
                return url;
            }
            if (url.startsWith('/services/')) {
                return this.instanceUrl + url;
            }
            return this._baseUrl() + url;
        }
        return url;
    }
    /**
     *
     */
    query(soql, options) {
        return new query_1.default(this, soql, options);
    }
    /**
     * Execute search by SOSL
     *
     * @param {String} sosl - SOSL string
     * @param {Callback.<Array.<RecordResult>>} [callback] - Callback function
     * @returns {Promise.<Array.<RecordResult>>}
     */
    search(sosl) {
        const url = this._baseUrl() + '/search?q=' + encodeURIComponent(sosl);
        return this.request(url);
    }
    /**
     *
     */
    queryMore(locator, options) {
        return new query_1.default(this, { locator }, options);
    }
    /* */
    _ensureVersion(majorVersion) {
        const versions = this.version.split('.');
        return parseInt(versions[0], 10) >= majorVersion;
    }
    /* */
    _supports(feature) {
        switch (feature) {
            case 'sobject-collection': // sobject collection is available only in API ver 42.0+
                return this._ensureVersion(42);
            default:
                return false;
        }
    }
    async retrieve(type, ids, options = {}) {
        return Array.isArray(ids)
            ? // check the version whether SObject collection API is supported (42.0)
              this._ensureVersion(42)
                ? this._retrieveMany(type, ids, options)
                : this._retrieveParallel(type, ids, options)
            : this._retrieveSingle(type, ids, options);
    }
    /** @private */
    async _retrieveSingle(type, id, options) {
        if (!id) {
            throw new Error('Invalid record ID. Specify valid record ID value');
        }
        let url = [this._baseUrl(), 'sobjects', type, id].join('/');
        const { fields, headers } = options;
        if (fields) {
            url += `?fields=${fields.join(',')}`;
        }
        return this.request({ method: 'GET', url, headers });
    }
    /** @private */
    async _retrieveParallel(type, ids, options) {
        if (ids.length > this._maxRequest) {
            throw new Error('Exceeded max limit of concurrent call');
        }
        return Promise.all(
            ids.map((id) =>
                this._retrieveSingle(type, id, options).catch((err) => {
                    if (options.allOrNone || err.errorCode !== 'NOT_FOUND') {
                        throw err;
                    }
                    return null;
                }),
            ),
        );
    }
    /** @private */
    async _retrieveMany(type, ids, options) {
        if (ids.length === 0) {
            return [];
        }
        const url = [this._baseUrl(), 'composite', 'sobjects', type].join('/');
        const fields = options.fields || (await this.describe$(type)).fields.map((field) => field.name);
        return this.request({
            method: 'POST',
            url,
            body: JSON.stringify({ ids, fields }),
            headers: {
                ...(options.headers || {}),
                'content-type': 'application/json',
            },
        });
    }
    /**
     * @param type
     * @param records
     * @param options
     */
    async create(type, records, options = {}) {
        const ret = Array.isArray(records)
            ? // check the version whether SObject collection API is supported (42.0)
              this._ensureVersion(42)
                ? await this._createMany(type, records, options)
                : await this._createParallel(type, records, options)
            : await this._createSingle(type, records, options);
        return ret;
    }
    /** @private */
    async _createSingle(type, record, options) {
        const { Id, type: rtype, attributes, ...rec } = record;
        const sobjectType = type || attributes?.type || rtype;
        if (!sobjectType) {
            throw new Error('No SObject Type defined in record');
        }
        const url = [this._baseUrl(), 'sobjects', sobjectType].join('/');
        let contentType, body;
        if (options?.multipartFileFields) {
            // Send the record as a multipart/form-data request. Useful for fields containing large binary blobs.
            const form = new form_data_1.default();
            // Extract the fields requested to be sent separately from the JSON
            Object.entries(options.multipartFileFields).forEach(([fieldName, fileDetails]) => {
                form.append(fieldName, Buffer.from(rec[fieldName], 'base64'), fileDetails);
                delete rec[fieldName];
            });
            // Serialize the remaining fields as JSON
            form.append(type, JSON.stringify(rec), {
                contentType: 'application/json',
            });
            contentType = form.getHeaders()['content-type']; // This is necessary to ensure the 'boundary' is present
            body = form;
        } else {
            // Default behavior: send the request as JSON
            contentType = 'application/json';
            body = JSON.stringify(rec);
        }
        return this.request({
            method: 'POST',
            url,
            body: body,
            headers: {
                ...(options.headers || {}),
                'content-type': contentType,
            },
        });
    }
    /** @private */
    async _createParallel(type, records, options) {
        if (records.length > this._maxRequest) {
            throw new Error('Exceeded max limit of concurrent call');
        }
        return Promise.all(
            records.map((record) =>
                this._createSingle(type, record, options).catch((err) => {
                    // be aware that allOrNone in parallel mode will not revert the other successful requests
                    // it only raises error when met at least one failed request.
                    if (options.allOrNone || !err.errorCode) {
                        throw err;
                    }
                    return toSaveResult(err);
                }),
            ),
        );
    }
    /** @private */
    async _createMany(type, records, options) {
        if (records.length === 0) {
            return Promise.resolve([]);
        }
        if (records.length > MAX_DML_COUNT && options.allowRecursive) {
            return [
                ...(await this._createMany(type, records.slice(0, MAX_DML_COUNT), options)),
                ...(await this._createMany(type, records.slice(MAX_DML_COUNT), options)),
            ];
        }
        const _records = records.map((record) => {
            const { Id, type: rtype, attributes, ...rec } = record;
            const sobjectType = type || attributes?.type || rtype;
            if (!sobjectType) {
                throw new Error('No SObject Type defined in record');
            }
            return { attributes: { type: sobjectType }, ...rec };
        });
        const url = [this._baseUrl(), 'composite', 'sobjects'].join('/');
        return this.request({
            method: 'POST',
            url,
            body: JSON.stringify({
                allOrNone: options.allOrNone || false,
                records: _records,
            }),
            headers: {
                ...(options.headers || {}),
                'content-type': 'application/json',
            },
        });
    }
    /**
     * Synonym of Connection#create()
     */
    insert = this.create;
    /**
     * @param type
     * @param records
     * @param options
     */
    update(type, records, options = {}) {
        return Array.isArray(records)
            ? // check the version whether SObject collection API is supported (42.0)
              this._ensureVersion(42)
                ? this._updateMany(type, records, options)
                : this._updateParallel(type, records, options)
            : this._updateSingle(type, records, options);
    }
    /** @private */
    async _updateSingle(type, record, options) {
        const { Id: id, type: rtype, attributes, ...rec } = record;
        if (!id) {
            throw new Error('Record id is not found in record.');
        }
        const sobjectType = type || attributes?.type || rtype;
        if (!sobjectType) {
            throw new Error('No SObject Type defined in record');
        }
        const url = [this._baseUrl(), 'sobjects', sobjectType, id].join('/');
        return this.request(
            {
                method: 'PATCH',
                url,
                body: JSON.stringify(rec),
                headers: {
                    ...(options.headers || {}),
                    'content-type': 'application/json',
                },
            },
            {
                noContentResponse: { id, success: true, errors: [] },
            },
        );
    }
    /** @private */
    async _updateParallel(type, records, options) {
        if (records.length > this._maxRequest) {
            throw new Error('Exceeded max limit of concurrent call');
        }
        return Promise.all(
            records.map((record) =>
                this._updateSingle(type, record, options).catch((err) => {
                    // be aware that allOrNone in parallel mode will not revert the other successful requests
                    // it only raises error when met at least one failed request.
                    if (options.allOrNone || !err.errorCode) {
                        throw err;
                    }
                    return toSaveResult(err);
                }),
            ),
        );
    }
    /** @private */
    async _updateMany(type, records, options) {
        if (records.length === 0) {
            return [];
        }
        if (records.length > MAX_DML_COUNT && options.allowRecursive) {
            return [
                ...(await this._updateMany(type, records.slice(0, MAX_DML_COUNT), options)),
                ...(await this._updateMany(type, records.slice(MAX_DML_COUNT), options)),
            ];
        }
        const _records = records.map((record) => {
            const { Id: id, type: rtype, attributes, ...rec } = record;
            if (!id) {
                throw new Error('Record id is not found in record.');
            }
            const sobjectType = type || attributes?.type || rtype;
            if (!sobjectType) {
                throw new Error('No SObject Type defined in record');
            }
            return { id, attributes: { type: sobjectType }, ...rec };
        });
        const url = [this._baseUrl(), 'composite', 'sobjects'].join('/');
        return this.request({
            method: 'PATCH',
            url,
            body: JSON.stringify({
                allOrNone: options.allOrNone || false,
                records: _records,
            }),
            headers: {
                ...(options.headers || {}),
                'content-type': 'application/json',
            },
        });
    }
    /**
     *
     * @param type
     * @param records
     * @param extIdField
     * @param options
     */
    async upsert(type, records, extIdField, options = {}) {
        const isArray = Array.isArray(records);
        const _records = Array.isArray(records) ? records : [records];
        if (_records.length > this._maxRequest) {
            throw new Error('Exceeded max limit of concurrent call');
        }
        const results = await Promise.all(
            _records.map((record) => {
                const { [extIdField]: extId, type: rtype, attributes, ...rec } = record;
                const url = [this._baseUrl(), 'sobjects', type, extIdField, extId].join('/');
                return this.request(
                    {
                        method: 'PATCH',
                        url,
                        body: JSON.stringify(rec),
                        headers: {
                            ...(options.headers || {}),
                            'content-type': 'application/json',
                        },
                    },
                    {
                        noContentResponse: { success: true, errors: [] },
                    },
                ).catch((err) => {
                    // Be aware that `allOrNone` option in upsert method
                    // will not revert the other successful requests.
                    // It only raises error when met at least one failed request.
                    if (!isArray || options.allOrNone || !err.errorCode) {
                        throw err;
                    }
                    return toSaveResult(err);
                });
            }),
        );
        return isArray ? results : results[0];
    }
    /**
     * @param type
     * @param ids
     * @param options
     */
    async destroy(type, ids, options = {}) {
        return Array.isArray(ids)
            ? // check the version whether SObject collection API is supported (42.0)
              this._ensureVersion(42)
                ? this._destroyMany(type, ids, options)
                : this._destroyParallel(type, ids, options)
            : this._destroySingle(type, ids, options);
    }
    /** @private */
    async _destroySingle(type, id, options) {
        const url = [this._baseUrl(), 'sobjects', type, id].join('/');
        return this.request(
            {
                method: 'DELETE',
                url,
                headers: options.headers || {},
            },
            {
                noContentResponse: { id, success: true, errors: [] },
            },
        );
    }
    /** @private */
    async _destroyParallel(type, ids, options) {
        if (ids.length > this._maxRequest) {
            throw new Error('Exceeded max limit of concurrent call');
        }
        return Promise.all(
            ids.map((id) =>
                this._destroySingle(type, id, options).catch((err) => {
                    // Be aware that `allOrNone` option in parallel mode
                    // will not revert the other successful requests.
                    // It only raises error when met at least one failed request.
                    if (options.allOrNone || !err.errorCode) {
                        throw err;
                    }
                    return toSaveResult(err);
                }),
            ),
        );
    }
    /** @private */
    async _destroyMany(type, ids, options) {
        if (ids.length === 0) {
            return [];
        }
        if (ids.length > MAX_DML_COUNT && options.allowRecursive) {
            return [
                ...(await this._destroyMany(type, ids.slice(0, MAX_DML_COUNT), options)),
                ...(await this._destroyMany(type, ids.slice(MAX_DML_COUNT), options)),
            ];
        }
        let url = [this._baseUrl(), 'composite', 'sobjects?ids='].join('/') + ids.join(',');
        if (options.allOrNone) {
            url += '&allOrNone=true';
        }
        return this.request({
            method: 'DELETE',
            url,
            headers: options.headers || {},
        });
    }
    /**
     * Synonym of Connection#destroy()
     */
    delete = this.destroy;
    /**
     * Synonym of Connection#destroy()
     */
    del = this.destroy;
    /**
     * Describe SObject metadata
     */
    async describe(type) {
        const url = [this._baseUrl(), 'sobjects', type, 'describe'].join('/');
        const body = await this.request(url);
        return body;
    }
    /**
     * Describe global SObjects
     */
    async describeGlobal() {
        const url = `${this._baseUrl()}/sobjects`;
        const body = await this.request(url);
        return body;
    }
    sobject(type) {
        const so = this.sobjects[type] || new sobject_1.default(this, type);
        this.sobjects[type] = so;
        return so;
    }
    /**
     * Get identity information of current user
     */
    async identity(options = {}) {
        let url = this.userInfo?.url;
        if (!url) {
            const res = await this.request({
                method: 'GET',
                url: this._baseUrl(),
                headers: options.headers,
            });
            url = res.identity;
        }
        url += '?format=json';
        if (this.accessToken) {
            url += `&oauth_token=${encodeURIComponent(this.accessToken)}`;
        }
        const res = await this.request({ method: 'GET', url });
        this.userInfo = {
            id: res.user_id,
            organizationId: res.organization_id,
            url: res.id,
        };
        return res;
    }
    /**
     * List recently viewed records
     */
    async recent(type, limit) {
        /* eslint-disable no-param-reassign */
        if (typeof type === 'number') {
            limit = type;
            type = undefined;
        }
        let url;
        if (type) {
            url = [this._baseUrl(), 'sobjects', type].join('/');
            const { recentItems } = await this.request(url);
            return limit ? recentItems.slice(0, limit) : recentItems;
        }
        url = `${this._baseUrl()}/recent`;
        if (limit) {
            url += `?limit=${limit}`;
        }
        return this.request(url);
    }
    /**
     * Retrieve updated records
     */
    async updated(type, start, end) {
        /* eslint-disable no-param-reassign */
        let url = [this._baseUrl(), 'sobjects', type, 'updated'].join('/');
        if (typeof start === 'string') {
            start = new Date(start);
        }
        start = (0, formatter_1.formatDate)(start);
        url += `?start=${encodeURIComponent(start)}`;
        if (typeof end === 'string') {
            end = new Date(end);
        }
        end = (0, formatter_1.formatDate)(end);
        url += `&end=${encodeURIComponent(end)}`;
        const body = await this.request(url);
        return body;
    }
    /**
     * Retrieve deleted records
     */
    async deleted(type, start, end) {
        /* eslint-disable no-param-reassign */
        let url = [this._baseUrl(), 'sobjects', type, 'deleted'].join('/');
        if (typeof start === 'string') {
            start = new Date(start);
        }
        start = (0, formatter_1.formatDate)(start);
        url += `?start=${encodeURIComponent(start)}`;
        if (typeof end === 'string') {
            end = new Date(end);
        }
        end = (0, formatter_1.formatDate)(end);
        url += `&end=${encodeURIComponent(end)}`;
        const body = await this.request(url);
        return body;
    }
    /**
     * Returns a list of all tabs
     */
    async tabs() {
        const url = [this._baseUrl(), 'tabs'].join('/');
        const body = await this.request(url);
        return body;
    }
    /**
     * Returns current system limit in the organization
     */
    async limits() {
        const url = [this._baseUrl(), 'limits'].join('/');
        const body = await this.request(url);
        return body;
    }
    /**
     * Returns a theme info
     */
    async theme() {
        const url = [this._baseUrl(), 'theme'].join('/');
        const body = await this.request(url);
        return body;
    }
    /**
     * Returns all registered global quick actions
     */
    async quickActions() {
        const body = await this.request('/quickActions');
        return body;
    }
    /**
     * Get reference for specified global quick action
     */
    quickAction(actionName) {
        return new quick_action_1.default(this, `/quickActions/${actionName}`);
    }
    /**
     * Module which manages process rules and approval processes
     */
    process = new process_1.default(this);
    isLightningInstance() {
        return (
            this.instanceUrl.includes('.lightning.force.com') ||
            this.instanceUrl.includes('.lightning.crmforce.mil') ||
            this.instanceUrl.includes('.lightning.sfcrmapps.cn')
        );
    }
}
exports.Connection = Connection;
exports.default = Connection;
