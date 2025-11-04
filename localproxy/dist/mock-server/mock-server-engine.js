"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MockServerEngine = void 0;
const http_1 = require("http");
const https_1 = require("https");
const events_1 = require("events");
class MockServerEngine extends events_1.EventEmitter {
    constructor() {
        super();
        this.server = null;
        this.isRunning = false;
        this.currentConfig = null;
        this.requestCounter = 0;
        this.activeRequests = new Map();
        this.maxConcurrentRequests = 3;
    }
    async start(config) {
        if (this.isRunning) {
            throw new Error('Mock server is already running');
        }
        this.currentConfig = config;
        if (config.protocol === 'https') {
            // 对于HTTPS，需要提供证书和密钥，这里简化处理
            this.server = (0, https_1.createServer)({}, (req, res) => {
                this.handleRequest(req, res);
            });
        }
        else {
            this.server = (0, http_1.createServer)((req, res) => {
                this.handleRequest(req, res);
            });
        }
        return new Promise((resolve, reject) => {
            if (!this.server) {
                reject(new Error('Server not initialized'));
                return;
            }
            this.server.listen(config.port, (err) => {
                if (err) {
                    reject(err);
                    return;
                }
                this.isRunning = true;
                this.emit('serverStarted', config);
                resolve();
            });
        });
    }
    async stop() {
        if (!this.isRunning || !this.server) {
            return;
        }
        return new Promise((resolve) => {
            this.server.close(() => {
                this.isRunning = false;
                this.server = null;
                this.currentConfig = null;
                this.activeRequests.clear();
                this.emit('serverStopped');
                resolve();
            });
        });
    }
    getStatus() {
        return {
            isRunning: this.isRunning,
            config: this.currentConfig
        };
    }
    async handleRequest(req, res) {
        // 检查并发请求限制
        if (this.activeRequests.size >= this.maxConcurrentRequests) {
            res.writeHead(503, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Service unavailable - too many concurrent requests' }));
            return;
        }
        const requestId = `req_${Date.now()}_${++this.requestCounter}`;
        const request = {
            id: requestId,
            timestamp: new Date(),
            method: req.method || 'GET',
            url: req.url || '/',
            headers: this.parseHeaders(req.headers)
        };
        this.activeRequests.set(requestId, request);
        try {
            // 读取请求体
            const body = await this.readRequestBody(req);
            request.body = body;
            // 查找匹配的路由
            const route = this.findMatchingRoute(request);
            if (route) {
                // 设置响应头
                Object.entries(route.headers).forEach(([key, value]) => {
                    res.setHeader(key, value);
                });
                // 设置状态码并发送响应
                res.writeHead(route.statusCode);
                res.end(JSON.stringify(route.body));
                const response = {
                    id: requestId,
                    timestamp: new Date(),
                    statusCode: route.statusCode,
                    headers: route.headers,
                    body: route.body
                };
                this.emit('requestHandled', { request, response });
            }
            else {
                // 没有找到匹配的路由，返回404
                res.writeHead(404, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: 'Route not found' }));
                const response = {
                    id: requestId,
                    timestamp: new Date(),
                    statusCode: 404,
                    headers: { 'Content-Type': 'application/json' },
                    body: { error: 'Route not found' }
                };
                this.emit('requestHandled', { request, response });
            }
        }
        catch (error) {
            // 处理错误
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Internal server error' }));
            const response = {
                id: requestId,
                timestamp: new Date(),
                statusCode: 500,
                headers: { 'Content-Type': 'application/json' },
                body: { error: 'Internal server error' }
            };
            this.emit('requestHandled', { request, response });
        }
        finally {
            this.activeRequests.delete(requestId);
        }
    }
    findMatchingRoute(request) {
        if (!this.currentConfig) {
            return null;
        }
        return this.currentConfig.routes.find(route => {
            const methodMatches = route.method === request.method;
            const pathMatches = route.path === request.url;
            return methodMatches && pathMatches;
        }) || null;
    }
    parseHeaders(headers) {
        const result = {};
        Object.entries(headers).forEach(([key, value]) => {
            if (Array.isArray(value)) {
                result[key] = value.join(', ');
            }
            else if (value) {
                result[key] = value;
            }
        });
        return result;
    }
    readRequestBody(req) {
        return new Promise((resolve, reject) => {
            let body = '';
            req.on('data', (chunk) => {
                body += chunk.toString();
            });
            req.on('end', () => {
                try {
                    if (body) {
                        resolve(JSON.parse(body));
                    }
                    else {
                        resolve(null);
                    }
                }
                catch (error) {
                    resolve(body); // 如果不是JSON，返回原始字符串
                }
            });
            req.on('error', reject);
        });
    }
}
exports.MockServerEngine = MockServerEngine;
//# sourceMappingURL=mock-server-engine.js.map