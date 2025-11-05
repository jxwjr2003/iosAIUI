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
    isDefault?: boolean;
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
export declare class MockServerEngine extends EventEmitter {
    private server;
    private isRunning;
    private currentConfig;
    private requestCounter;
    private activeRequests;
    private maxConcurrentRequests;
    constructor();
    start(config: MockServerConfig): Promise<void>;
    stop(): Promise<void>;
    getStatus(): {
        isRunning: boolean;
        config: MockServerConfig | null;
    };
    updateRouteConfig(config: MockServerConfig): Promise<void>;
    updateRoute(routeId: string, updatedRoute: Partial<RouteConfig>): void;
    private handleRequest;
    private findMatchingRoute;
    private parseHeaders;
    private readRequestBody;
    private getAvailableRoutes;
}
//# sourceMappingURL=mock-server-engine.d.ts.map