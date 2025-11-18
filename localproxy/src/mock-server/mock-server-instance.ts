import { MockServerEngine, MockServerConfig } from './mock-server-engine';
import { ServerInstance, ServerStatus } from '../types/server-types';

/**
 * 单个模拟服务器实例包装器
 */
export class MockServerInstance implements ServerInstance {
    private engine: MockServerEngine;
    private config: MockServerConfig;
    private _isRunning: boolean = false;
    private error?: string;

    constructor(config: MockServerConfig) {
        this.config = config;
        this.engine = new MockServerEngine();

        // 监听服务器事件
        this.setupEventListeners();
    }

    /**
     * 启动服务器实例
     */
    public async start(): Promise<void> {
        if (this._isRunning) {
            return;
        }

        try {
            await this.engine.start(this.config);
            this._isRunning = true;
            this.error = undefined;
        } catch (error) {
            this.error = error instanceof Error ? error.message : String(error);
            throw error;
        }
    }

    /**
     * 停止服务器实例
     */
    public async stop(): Promise<void> {
        if (!this._isRunning) {
            return;
        }

        try {
            await this.engine.stop();
            this._isRunning = false;
            this.error = undefined;
        } catch (error) {
            this.error = error instanceof Error ? error.message : String(error);
            throw error;
        }
    }

    /**
     * 设置运行状态（用于端口共享场景）
     */
    public setRunningStatus(running: boolean): void {
        this._isRunning = running;
    }

    /**
     * 获取服务器状态
     */
    public getStatus(): ServerStatus {
        return {
            id: this.config.id,
            name: this.config.name,
            port: this.config.port,
            protocol: this.config.protocol,
            isRunning: this._isRunning,
            config: this.config,
            error: this.error
        };
    }

    /**
     * 获取服务器配置
     */
    public getConfig(): MockServerConfig {
        return this.config;
    }

    /**
     * 更新服务器配置
     */
    public updateConfig(config: MockServerConfig): void {
        this.config = config;

        // 如果服务器正在运行，更新引擎配置
        if (this._isRunning) {
            this.engine.updateRouteConfig(config).catch(error => {
                console.error(`更新服务器配置失败:`, error);
            });
        }
    }

    /**
     * 检查服务器是否正在运行
     */
    public get isRunning(): boolean {
        return this._isRunning;
    }

    /**
     * 获取服务器端口
     */
    public get port(): number {
        return this.config.port;
    }

    /**
     * 获取服务器ID
     */
    public get id(): string {
        return this.config.id;
    }

    /**
     * 获取服务器名称
     */
    public get name(): string {
        return this.config.name;
    }

    /**
     * 设置事件监听器
     */
    private setupEventListeners(): void {
        // 监听服务器启动事件
        this.engine.on('serverStarted', (config: MockServerConfig) => {
            this._isRunning = true;
            this.error = undefined;
        });

        // 监听服务器停止事件
        this.engine.on('serverStopped', () => {
            this._isRunning = false;
            this.error = undefined;
        });

        // 监听请求处理事件
        this.engine.on('requestHandled', (data: { request: any; response: any }) => {
            // 这里可以添加实例特定的请求处理逻辑
            // 比如记录实例特定的日志等
        });

        // 监听配置更新事件
        this.engine.on('configUpdated', (config: MockServerConfig) => {
            this.config = config;
        });
    }

    /**
     * 清理资源
     */
    public async dispose(): Promise<void> {
        if (this._isRunning) {
            await this.stop();
        }

        // 移除所有事件监听器
        this.engine.removeAllListeners();
    }
}
