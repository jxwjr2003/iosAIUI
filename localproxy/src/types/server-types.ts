/**
 * 服务器类型定义
 */

import { MockServerConfig } from '../mock-server/mock-server-engine';

/**
 * 服务器状态接口
 */
export interface ServerStatus {
    id: string;
    name: string;
    port: number;
    protocol: string;
    isRunning: boolean;
    config: MockServerConfig;
    error?: string;
}

/**
 * 批量启动结果接口
 */
export interface BatchStartResult {
    success: boolean;
    started: string[];
    failed: Array<{ id: string, error: string }>;
    portConflicts: string[];
}

/**
 * 单个启动结果接口
 */
export interface StartResult {
    success: boolean;
    error?: string;
}

/**
 * 端口共享组接口
 */
export interface PortSharingGroup {
    port: number;
    protocol: 'http' | 'https';
    serverIds: string[];
    configs: MockServerConfig[];
}

/**
 * 服务器实例接口
 */
export interface ServerInstance {
    readonly id: string;
    readonly port: number;
    readonly isRunning: boolean;
    start(): Promise<void>;
    stop(): Promise<void>;
    getStatus(): ServerStatus;
    getConfig(): MockServerConfig;
    updateConfig(config: MockServerConfig): void;
}