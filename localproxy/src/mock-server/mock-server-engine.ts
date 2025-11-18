import { createServer, Server, IncomingMessage, ServerResponse } from 'http';
import { createServer as createHttpsServer } from 'https';
import { EventEmitter } from 'events';

export interface MockServerConfig {
    id: string;
    name: string;
    port: number;
    protocol: 'http' | 'https';
    routes: RouteConfig[]; // 改为路由数组支持多路由
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
    isDefault?: boolean;
    priority?: number; // 路由匹配优先级，数字越大优先级越高
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

    public async updateRouteConfig(config: MockServerConfig): Promise<void> {
        if (!this.isRunning) {
            throw new Error('Mock server is not running');
        }

        this.currentConfig = config;
        this.emit('configUpdated', config);
    }

    public updateRoute(routeId: string, updatedRoute: Partial<RouteConfig>): void {
        if (!this.currentConfig) {
            throw new Error('No configuration loaded');
        }

        // 更新特定路由配置
        const routeIndex = this.currentConfig.routes.findIndex(route => route.id === routeId);
        if (routeIndex >= 0) {
            this.currentConfig.routes[routeIndex] = {
                ...this.currentConfig.routes[routeIndex],
                ...updatedRoute
            };
            this.emit('routeUpdated', { updatedRoute: this.currentConfig.routes[routeIndex] });
        }
    }

    public addRoute(newRoute: RouteConfig): void {
        if (!this.currentConfig) {
            throw new Error('No configuration loaded');
        }

        // 添加新路由
        this.currentConfig.routes.push(newRoute);
        this.emit('routeAdded', { newRoute });
    }

    public removeRoute(routeId: string): void {
        if (!this.currentConfig) {
            throw new Error('No configuration loaded');
        }

        // 移除路由
        this.currentConfig.routes = this.currentConfig.routes.filter(route => route.id !== routeId);
        this.emit('routeRemoved', { routeId });
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

                // 记录详细的路由匹配失败信息
                console.error(`[Mock Server] Route not found - Method: ${request.method}, URL: ${request.url}`);
                console.error(`[Mock Server] Available routes: ${JSON.stringify(this.getAvailableRoutes(), null, 2)}`);

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
        if (!this.currentConfig || this.currentConfig.routes.length === 0) {
            return null;
        }

        // 按优先级排序路由（优先级高的先匹配）
        const sortedRoutes = [...this.currentConfig.routes].sort((a, b) => {
            const priorityA = a.priority || 0;
            const priorityB = b.priority || 0;
            return priorityB - priorityA; // 降序排列
        });

        // 查找匹配的路由
        for (const route of sortedRoutes) {
            const methodMatches = route.method === request.method;
            const pathMatches = route.path === request.url;

            if (methodMatches && pathMatches) {
                return route;
            }
        }

        // 如果没有精确匹配，查找默认路由
        const defaultRoute = sortedRoutes.find(route => route.isDefault);
        if (defaultRoute) {
            return defaultRoute;
        }

        // 没有匹配的路由
        return null;
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

    private getAvailableRoutes(): Array<{ method: string; path: string; description?: string }> {
        if (!this.currentConfig) {
            return [];
        }

        return this.currentConfig.routes.map(route => ({
            method: route.method,
            path: route.path,
            description: route.description
        }));
    }
}
