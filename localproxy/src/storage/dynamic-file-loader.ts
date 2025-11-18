import * as fs from 'fs';
import * as fsPromises from 'fs/promises';
import * as path from 'path';
import { EventEmitter } from 'events';
import { FileWatchStatus, ValidationResult } from '../types/storage-types';
import { AppConfig } from '../config/config-manager';

/**
 * 动态文件加载器
 */
export class DynamicFileLoader extends EventEmitter {
    private watchedFiles: Map<string, number> = new Map();
    private fileWatchers: Map<string, fs.FSWatcher> = new Map();
    private fileStatus: Map<string, FileWatchStatus> = new Map();

    constructor() {
        super();
    }

    /**
     * 从文件加载配置
     */
    async loadFromFile(filePath: string): Promise<AppConfig> {
        try {
            const absolutePath = path.resolve(filePath);
            const configData = await fsPromises.readFile(absolutePath, 'utf-8');
            const config = JSON.parse(configData);

            const validation = this.validateConfig(config);
            if (!validation.isValid) {
                throw new Error(`配置验证失败: ${validation.errors.join(', ')}`);
            }

            this.emit('fileLoaded', { filePath: absolutePath, config });
            return config as AppConfig;
        } catch (error) {
            this.emit('fileLoadError', { filePath, error });
            throw error;
        }
    }

    /**
     * 开始监控文件变化
     */
    async watchFile(filePath: string, callback: (config: AppConfig) => void): Promise<void> {
        const absolutePath = path.resolve(filePath);

        if (this.fileWatchers.has(absolutePath)) {
            console.log(`文件已在监控中: ${absolutePath}`);
            return;
        }

        try {
            // 检查文件是否存在
            await fsPromises.access(absolutePath);

            // 设置初始状态
            const stats = await fsPromises.stat(absolutePath);
            this.fileStatus.set(absolutePath, {
                filePath: absolutePath,
                isWatching: true,
                lastModified: stats.mtime
            });

            // 使用 fs.watch 监控文件变化
            const watcher = fs.watch(absolutePath, { persistent: false });
            this.fileWatchers.set(absolutePath, watcher);

            let changeTimeout: NodeJS.Timeout;

            watcher.on('change', async (eventType: string) => {
                if (eventType === 'change') {
                    // 防抖处理，避免频繁触发
                    clearTimeout(changeTimeout);
                    changeTimeout = setTimeout(async () => {
                        try {
                            const stats = await fsPromises.stat(absolutePath);
                            const currentStatus = this.fileStatus.get(absolutePath);

                            if (currentStatus && stats.mtime > currentStatus.lastModified) {
                                console.log(`检测到文件变化: ${absolutePath}`);

                                // 更新最后修改时间
                                currentStatus.lastModified = stats.mtime;

                                // 重新加载配置
                                const config = await this.loadFromFile(absolutePath);
                                callback(config);

                                this.emit('fileChanged', { filePath: absolutePath, config });
                            }
                        } catch (error) {
                            this.emit('fileWatchError', { filePath: absolutePath, error });
                            console.error(`监控文件变化时出错: ${absolutePath}`, error);
                        }
                    }, 300); // 300ms 防抖
                }
            });

            watcher.on('error', (error: Error) => {
                this.emit('fileWatchError', { filePath: absolutePath, error });
                console.error(`文件监控错误: ${absolutePath}`, error);
            });

            this.emit('fileWatchStarted', { filePath: absolutePath });
            console.log(`开始监控文件: ${absolutePath}`);

        } catch (error) {
            this.emit('fileWatchError', { filePath: absolutePath, error });
            throw new Error(`无法监控文件: ${absolutePath} - ${error}`);
        }
    }

    /**
     * 停止监控文件
     */
    async stopWatching(filePath: string): Promise<void> {
        const absolutePath = path.resolve(filePath);
        const watcher = this.fileWatchers.get(absolutePath);

        if (watcher) {
            await watcher.close();
            this.fileWatchers.delete(absolutePath);
            this.fileStatus.delete(absolutePath);

            this.emit('fileWatchStopped', { filePath: absolutePath });
            console.log(`停止监控文件: ${absolutePath}`);
        }
    }

    /**
     * 停止监控所有文件
     */
    async stopAllWatching(): Promise<void> {
        const stopPromises: Promise<void>[] = [];

        for (const [filePath, watcher] of this.fileWatchers.entries()) {
            stopPromises.push(this.stopWatching(filePath));
        }

        await Promise.all(stopPromises);
    }

    /**
     * 获取文件监控状态
     */
    getFileWatchStatus(filePath: string): FileWatchStatus | undefined {
        const absolutePath = path.resolve(filePath);
        return this.fileStatus.get(absolutePath);
    }

    /**
     * 获取所有监控文件状态
     */
    getAllWatchStatus(): FileWatchStatus[] {
        return Array.from(this.fileStatus.values());
    }

    /**
     * 验证配置
     */
    validateConfig(config: any): ValidationResult {
        const errors: string[] = [];
        const warnings: string[] = [];

        // 基本结构验证
        if (!config || typeof config !== 'object') {
            errors.push('配置必须是有效的 JSON 对象');
            return { isValid: false, errors, warnings };
        }

        // 验证 mockServers 数组
        if (config.mockServers !== undefined && !Array.isArray(config.mockServers)) {
            errors.push('mockServers 必须是数组');
        } else if (Array.isArray(config.mockServers)) {
            config.mockServers.forEach((server: any, index: number) => {
                if (!server?.id) errors.push(`mockServers[${index}] 缺少 id 字段`);
                if (!server?.name) errors.push(`mockServers[${index}] 缺少 name 字段`);
                if (!server?.port) errors.push(`mockServers[${index}] 缺少 port 字段`);
                if (!Array.isArray(server?.routes)) {
                    errors.push(`mockServers[${index}] routes 必须是数组`);
                }
            });
        }

        // 验证 proxyServers 数组
        if (config.proxyServers !== undefined && !Array.isArray(config.proxyServers)) {
            warnings.push('proxyServers 不是数组，将忽略该字段');
        }

        // 验证 settings 对象
        if (config.settings !== undefined && typeof config.settings !== 'object') {
            warnings.push('settings 不是对象，将忽略该字段');
        }

        return {
            isValid: errors.length === 0,
            errors,
            warnings
        };
    }

    /**
     * 清理资源
     */
    async dispose(): Promise<void> {
        await this.stopAllWatching();
        this.removeAllListeners();
    }
}