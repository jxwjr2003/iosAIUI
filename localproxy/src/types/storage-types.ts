/**
 * 存储相关类型定义
 */

import { AppConfig } from '../config/config-manager';

/**
 * 存储位置类型
 */
export interface StorageLocation {
    id: string;
    name: string;
    path: string;
    type: 'default' | 'custom' | 'project' | 'temporary';
    isActive: boolean;
    createdAt: Date;
    lastUsed?: Date;
}

/**
 * 导出选项
 */
export interface ExportOptions {
    type: 'full' | 'selected' | 'template';
    includeMockServers: boolean;
    includeProxyServers: boolean;
    includeSettings: boolean;
    selectedIds?: string[];
    templateName?: string;
    outputPath: string;
}

/**
 * 导入结果
 */
export interface ImportResult {
    success: boolean;
    importedConfig: AppConfig;
    warnings: string[];
    errors: string[];
    importedCount: {
        mockServers: number;
        proxyServers: number;
    };
}

/**
 * 文件监控状态
 */
export interface FileWatchStatus {
    filePath: string;
    isWatching: boolean;
    lastModified: Date;
    error?: string;
}

/**
 * 配置验证结果
 */
export interface ValidationResult {
    isValid: boolean;
    errors: string[];
    warnings: string[];
}

/**
 * 存储提供者接口
 */
export interface StorageProvider {
    readonly id: string;
    readonly name: string;

    loadConfig(): Promise<AppConfig>;
    saveConfig(config: AppConfig): Promise<void>;
    validateConfig(config: any): ValidationResult;
    getConfigPath(): string;
    isAvailable(): Promise<boolean>;
}