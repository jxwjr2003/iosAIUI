import { createServer, Server, IncomingMessage, ServerResponse } from 'http';
import { createServer as createHttpsServer } from 'https';
import { EventEmitter } from 'events';
import { request, RequestOptions } from 'http';
import { request as httpsRequest } from 'https';

export interface ProxyServerConfig {
    id: string;
    name: string;
    port: number;
    protocol: 'http' | 'https';
    target: string;
}

export interface ProxyRequest {
    id: string;
    timestamp: Date;
    method: string;
    url: string;
    headers: Record<string, string>;
    body?: any;
}

export interface ProxyResponse {
    id: string;
    timestamp: Date;
    statusCode: number;
    headers: Record<string, string>;
    body?: any;
}

export class ProxyServerEngine extends EventEmitter {
    private server: Server | null = null;
    private isRunning: boolean = false;
    private currentConfig: ProxyServerConfig | null = null;
    private requestCounter: number = 0;

    constructor() {
        super();
    }

    public async start(config: ProxyServerConfig): Promise<void> {
        if (this.isRunning) {
            throw new Error('Proxy server is already running');
        }

        this.currentConfig = config;

        if (config.protocol === 'https') {
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
                this.emit('serverStopped');
                resolve();
            });
        });
    }

    public getStatus(): { isRunning: boolean; config: ProxyServerConfig | null } {
        return {
            isRunning: this.isRunning,
            config: this.currentConfig
        };
    }

    private async handleRequest(req: IncomingMessage, res: ServerResponse): Promise<void> {
        const requestId = `proxy_${Date.now()}_${++this.requestCounter}`;

        const proxyRequest: ProxyRequest = {
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

            this.emit('requestReceived', proxyRequest);

            // 转发请求到目标服务器
            const targetUrl = new URL(this.currentConfig!.target);
            const isTargetHttps = targetUrl.protocol === 'https:';

            const options: RequestOptions = {
                hostname: targetUrl.hostname,
                port: targetUrl.port || (isTargetHttps ? 443 : 80),
                path: req.url,
                method: req.method,
                headers: { ...req.headers }
            };

            // 删除可能引起问题的头
            if (options.headers && typeof options.headers === 'object' && !Array.isArray(options.headers)) {
                delete (options.headers as any)['host'];
                delete (options.headers as any)['content-length'];
            }

            const requestMethod = isTargetHttps ? httpsRequest : request;

            const proxyReq = requestMethod(options, (proxyRes) => {
                const responseData: Buffer[] = [];

                proxyRes.on('data', (chunk: Buffer) => {
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

                    const proxyResponse: ProxyResponse = {
                        id: requestId,
                        timestamp: new Date(),
                        statusCode: proxyRes.statusCode || 200,
                        headers: this.parseHeaders(proxyRes.headers),
                        body: responseBody
                    };

                    this.emit('responseSent', { request: proxyRequest, response: proxyResponse });
                });
            });

            proxyReq.on('error', (error) => {
                console.error('Proxy request error:', error);

                res.writeHead(502, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: 'Bad Gateway' }));

                const proxyResponse: ProxyResponse = {
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

        } catch (error) {
            console.error('Proxy server error:', error);

            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Internal server error' }));

            const proxyResponse: ProxyResponse = {
                id: requestId,
                timestamp: new Date(),
                statusCode: 500,
                headers: { 'Content-Type': 'application/json' },
                body: { error: 'Internal server error' }
            };

            this.emit('responseSent', { request: proxyRequest, response: proxyResponse });
        }
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

    private readRequestBody(req: IncomingMessage): Promise<string> {
        return new Promise((resolve, reject) => {
            let body = '';

            req.on('data', (chunk: Buffer) => {
                body += chunk.toString();
            });

            req.on('end', () => {
                resolve(body);
            });

            req.on('error', reject);
        });
    }
}
