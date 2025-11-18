import * as fs from 'fs/promises';
import * as path from 'path';
import { StorageProvider, ValidationResult } from '../types/storage-types';
import { AppConfig } from '../config/config-manager';

/**
 * 文件系统存储提供者
 */
export class FileSystemStorage implements StorageProvider {
    public readonly id: string;
    public readonly name: string;
    private configPath: string;

    constructor(configPath: string, name?: string) {
        this.configPath = configPath;
        this.id = `fs_${path.basename(configPath)}_${Date.now()}`;
        this.name = name || `文件存储: ${path.basename(configPath)}`;
    }

    async loadConfig(): Promise<AppConfig> {
        try {
            const configData = await fs.readFile(this.configPath, 'utf-8');
            const config = JSON.parse(configData);

            const validation = this.validateConfig(config);
            if (!validation.isValid) {
                throw new Error(`配置验证失败: ${validation.errors.join(', ')}`);
            }

            return config as AppConfig;
        } catch (error) {
            if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
                // 文件不存在，返回空配置
                return this.getEmptyConfig();
            }
            throw error;
        }
    }

    async saveConfig(config: AppConfig): Promise<void> {
        const validation = this.validateConfig(config);
        if (!validation.isValid) {
            throw new Error(`配置验证失败: ${validation.errors.join(', ')}`);
        }

        // 确保目录存在
        const configDir = path.dirname(this.configPath);
        await fs.mkdir(configDir, { recursive: true });

        // 写入配置文件
        await fs.writeFile(this.configPath, JSON.stringify(config, null, 2), 'utf-8');
    }

    validateConfig(config: any): ValidationResult {
        const errors: string[] = [];
        const warnings: string[] = [];

        // 基本结构验证
        if (!config || typeof config !== 'object') {
            errors.push('配置必须是有效的 JSON 对象');
            return { isValid: false, errors, warnings };
        }

        // 验证 mockServers 数组
        if (!Array.isArray(config.mockServers)) {
            errors.push('mockServers 必须是数组');
        } else {
            config.mockServers.forEach((server: any, index: number) => {
                if (!server.id) errors.push(`mockServers[${index}] 缺少 id 字段`);
                if (!server.name) errors.push(`mockServers[${index}] 缺少 name 字段`);
                if (!server.port) errors.push(`mockServers[${index}] 缺少 port 字段`);
                if (!Array.isArray(server.routes)) {
                    errors.push(`mockServers[${index}] routes 必须是数组`);
                }
            });
        }

        // 验证 proxyServers 数组
        if (!Array.isArray(config.proxyServers)) {
            warnings.push('proxyServers 不是数组，将使用空数组');
        }

        // 验证 settings 对象
        if (!config.settings || typeof config.settings !== 'object') {
            warnings.push('settings 不是对象，将使用默认设置');
        }

        return {
            isValid: errors.length === 0,
            errors,
            warnings
        };
    }

    getConfigPath(): string {
        return this.configPath;
    }

    async isAvailable(): Promise<boolean> {
        try {
            // 检查目录是否可写
            const configDir = path.dirname(this.configPath);
            await fs.access(configDir, fs.constants.W_OK);
            return true;
        } catch {
            return false;
        }
    }

    private getEmptyConfig(): AppConfig {
        return {
            mockServers: [],
            proxyServers: [],
            settings: {
                autoStart: false,
                logRetentionDays: 7,
                maxLogEntries: 1000
            }
        };
    }
}