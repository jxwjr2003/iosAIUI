import { createServer, Server, IncomingMessage, ServerResponse } from 'http';
import { createServer as createHttpsServer } from 'https';
import { EventEmitter } from 'events';

export interface MockServerConfig {
    id: string;
    name: string;
    port: number;
    protocol: 'http' | 'https';
    routes: RouteConfig[];
    description?: string;
    createdAt?: Date;
    updatedAt?: Date;
}

export interface RouteConfig {
    id: string;
    path: string;
    method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' | 'OPTIONS' | 'HEAD';
    headers: Record<string, string>;
    body: any;
    statusCode: number;
    description?: string;
}

export interface JsonField {
    key: string;
    value: any;
    type: 'string' | 'number' | 'boolean' | 'object' | 'array';
}

export interface MockServerRequest {
    id: string;
    timestamp: Date;
    method: string;
    url: string;
    headers: Record<string, string>;
    body?: any;
}

export interface MockServerResponse {
    id: string;
    timestamp: Date;
    statusCode: number;
    headers: Record<string, string>;
    body?: any;
}

export class MockServerEngine extends EventEmitter {
    private server: Server | null = null;
    private isRunning: boolean = false;
    private currentConfig: MockServerConfig | null = null;
    private requestCounter: number = 0;
    private activeRequests: Map<string, MockServerRequest> = new Map();
    private maxConcurrentRequests: number = 3;

    constructor() {
        super();
    }

    public async start(config: MockServerConfig): Promise<void> {
        if (this.isRunning) {
            throw new Error('Mock server is already running');
        }

        this.currentConfig = config;

        if (config.protocol === 'https') {
            // 对于HTTPS，需要提供证书和密钥，这里简化处理
            this.server = createHttpsServer({}, (req: IncomingMessage, res: ServerResponse) => {
                this.handleRequest(req, res);
            });
        } else {
            this.server = createServer((req: IncomingMessage, res: ServerResponse) => {
                this.handleRequest(req, res);
            });
        }

        return new Promise((resolve, reject) => {
            if (!this.server) {
                reject(new Error('Server not initialized'));
                return;
            }

            this.server.listen(config.port, (err?: Error) => {
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

    public async stop(): Promise<void> {
        if (!this.isRunning || !this.server) {
            return;
        }

        return new Promise((resolve) => {
            this.server!.close(() => {
                this.isRunning = false;
                this.server = null;
                this.currentConfig = null;
                this.activeRequests.clear();
                this.emit('serverStopped');
                resolve();
            });
        });
    }

    public getStatus(): { isRunning: boolean; config: MockServerConfig | null } {
        return {
            isRunning: this.isRunning,
            config: this.currentConfig
        };
    }

    private async handleRequest(req: IncomingMessage, res: ServerResponse): Promise<void> {
        // 检查并发请求限制
        if (this.activeRequests.size >= this.maxConcurrentRequests) {
            res.writeHead(503, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Service unavailable - too many concurrent requests' }));
            return;
        }

        const requestId = `req_${Date.now()}_${++this.requestCounter}`;
        const request: MockServerRequest = {
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

                const response: MockServerResponse = {
                    id: requestId,
                    timestamp: new Date(),
                    statusCode: route.statusCode,
                    headers: route.headers,
                    body: route.body
                };

                this.emit('requestHandled', { request, response });
            } else {
                // 没有找到匹配的路由，返回404
                res.writeHead(404, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: 'Route not found' }));

                const response: MockServerResponse = {
                    id: requestId,
                    timestamp: new Date(),
                    statusCode: 404,
                    headers: { 'Content-Type': 'application/json' },
                    body: { error: 'Route not found' }
                };

                this.emit('requestHandled', { request, response });
            }
        } catch (error) {
            // 处理错误
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Internal server error' }));

            const response: MockServerResponse = {
                id: requestId,
                timestamp: new Date(),
                statusCode: 500,
                headers: { 'Content-Type': 'application/json' },
                body: { error: 'Internal server error' }
            };

            this.emit('requestHandled', { request, response });
        } finally {
            this.activeRequests.delete(requestId);
        }
    }

    private findMatchingRoute(request: MockServerRequest): RouteConfig | null {
        if (!this.currentConfig) {
            return null;
        }

        return this.currentConfig.routes.find(route => {
            const methodMatches = route.method === request.method;
            const pathMatches = route.path === request.url;
            return methodMatches && pathMatches;
        }) || null;
    }

    private parseHeaders(headers: NodeJS.Dict<string | string[]>): Record<string, string> {
        const result: Record<string, string> = {};

        Object.entries(headers).forEach(([key, value]) => {
            if (Array.isArray(value)) {
                result[key] = value.join(', ');
            } else if (value) {
                result[key] = value;
            }
        });

        return result;
    }

    private readRequestBody(req: IncomingMessage): Promise<any> {
        return new Promise((resolve, reject) => {
            let body = '';

            req.on('data', (chunk: Buffer) => {
                body += chunk.toString();
            });

            req.on('end', () => {
                try {
                    if (body) {
                        resolve(JSON.parse(body));
                    } else {
                        resolve(null);
                    }
                } catch (error) {
                    resolve(body); // 如果不是JSON，返回原始字符串
                }
            });

            req.on('error', reject);
        });
    }
}
