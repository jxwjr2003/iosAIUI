"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProxyServerEngine = void 0;
const http_1 = require("http");
const https_1 = require("https");
const events_1 = require("events");
const http_2 = require("http");
const https_2 = require("https");
class ProxyServerEngine extends events_1.EventEmitter {
    constructor() {
        super();
        this.server = null;
        this.isRunning = false;
        this.currentConfig = null;
        this.requestCounter = 0;
    }
    async start(config) {
        if (this.isRunning) {
            throw new Error('Proxy server is already running');
        }
        this.currentConfig = config;
        if (config.protocol === 'https') {
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
        const requestId = `proxy_${Date.now()}_${++this.requestCounter}`;
        const proxyRequest = {
            id: requestId,
            timestamp: new Date(),
            method: req.method || 'GET',
            url: req.url || '/',
            headers: this.parseHeaders(req.headers)
        };
        try {
            // 读取请求体
            const body = await this.readRequestBody(req);
            proxyRequest.body = body;
            // 在控制台打印请求数据
            console.log(`[${proxyRequest.timestamp.toISOString()}] [PROXY REQUEST] ${proxyRequest.method} ${proxyRequest.url}`);
            console.log(`- 请求ID: ${proxyRequest.id}`);
            console.log(`- 方法: ${proxyRequest.method}`);
            console.log(`- URL: ${proxyRequest.url}`);
            console.log(`- 请求头:`, JSON.stringify(proxyRequest.headers, null, 2));
            if (body) {
                console.log(`- 请求体:`, body);
            }
            console.log('---');
            this.emit('requestReceived', proxyRequest);
            // 转发请求到目标服务器
            const targetUrl = new URL(this.currentConfig.target);
            const isTargetHttps = targetUrl.protocol === 'https:';
            const options = {
                hostname: targetUrl.hostname,
                port: targetUrl.port || (isTargetHttps ? 443 : 80),
                path: req.url,
                method: req.method,
                headers: { ...req.headers }
            };
            // 删除可能引起问题的头
            if (options.headers && typeof options.headers === 'object' && !Array.isArray(options.headers)) {
                delete options.headers['host'];
                delete options.headers['content-length'];
            }
            const requestMethod = isTargetHttps ? https_2.request : http_2.request;
            const proxyReq = requestMethod(options, (proxyRes) => {
                const responseData = [];
                proxyRes.on('data', (chunk) => {
                    responseData.push(chunk);
                });
                proxyRes.on('end', () => {
                    const responseBody = Buffer.concat(responseData).toString();
                    // 设置响应头
                    Object.entries(proxyRes.headers).forEach(([key, value]) => {
                        if (value !== undefined) {
                            res.setHeader(key, value);
                        }
                    });
                    // 发送响应
                    res.writeHead(proxyRes.statusCode || 200);
                    res.end(responseBody);
                    const proxyResponse = {
                        id: requestId,
                        timestamp: new Date(),
                        statusCode: proxyRes.statusCode || 200,
                        headers: this.parseHeaders(proxyRes.headers),
                        body: responseBody
                    };
                    // 在控制台打印响应数据
                    console.log(`[${proxyResponse.timestamp.toISOString()}] [PROXY RESPONSE] ${proxyResponse.statusCode} for ${proxyRequest.method} ${proxyRequest.url}`);
                    console.log(`- 请求ID: ${proxyResponse.id}`);
                    console.log(`- 状态码: ${proxyResponse.statusCode}`);
                    console.log(`- 响应头:`, JSON.stringify(proxyResponse.headers, null, 2));
                    if (responseBody) {
                        console.log(`- 响应体:`, responseBody);
                    }
                    console.log('---');
                    this.emit('responseSent', { request: proxyRequest, response: proxyResponse });
                });
            });
            proxyReq.on('error', (error) => {
                console.error('Proxy request error:', error);
                res.writeHead(502, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: 'Bad Gateway' }));
                const proxyResponse = {
                    id: requestId,
                    timestamp: new Date(),
                    statusCode: 502,
                    headers: { 'Content-Type': 'application/json' },
                    body: { error: 'Bad Gateway' }
                };
                this.emit('responseSent', { request: proxyRequest, response: proxyResponse });
            });
            // 如果有请求体，转发请求体
            if (body) {
                proxyReq.write(body);
            }
            proxyReq.end();
        }
        catch (error) {
            console.error('Proxy server error:', error);
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Internal server error' }));
            const proxyResponse = {
                id: requestId,
                timestamp: new Date(),
                statusCode: 500,
                headers: { 'Content-Type': 'application/json' },
                body: { error: 'Internal server error' }
            };
            this.emit('responseSent', { request: proxyRequest, response: proxyResponse });
        }
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
                resolve(body);
            });
            req.on('error', reject);
        });
    }
}
exports.ProxyServerEngine = ProxyServerEngine;
