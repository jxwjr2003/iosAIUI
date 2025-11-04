import { EventEmitter } from 'events';
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
export declare class ProxyServerEngine extends EventEmitter {
    private server;
    private isRunning;
    private currentConfig;
    private requestCounter;
    constructor();
    start(config: ProxyServerConfig): Promise<void>;
    stop(): Promise<void>;
    getStatus(): {
        isRunning: boolean;
        config: ProxyServerConfig | null;
    };
    private handleRequest;
    private parseHeaders;
    private readRequestBody;
}
//# sourceMappingURL=proxy-server-engine.d.ts.map