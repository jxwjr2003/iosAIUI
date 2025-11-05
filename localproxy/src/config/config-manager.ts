import { app } from 'electron';
import * as fs from 'fs/promises';
import * as path from 'path';
import { MockServerConfig, RouteConfig } from '../mock-server/mock-server-engine';
import { ProxyServerConfig } from '../proxy-server/proxy-server-engine';

export interface AppConfig {
    mockServers: MockServerConfig[];
    proxyServers: ProxyServerConfig[];
    settings: {
        autoStart: boolean;
        logRetentionDays: number;
        maxLogEntries: number;
    };
}

export class ConfigManager {
    private configPath: string;
    private config: AppConfig;

    constructor() {
        this.configPath = path.join(app.getPath('userData'), 'config.json');
        this.config = this.getDefaultConfig();
    }

    private getDefaultConfig(): AppConfig {
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

    public async loadConfig(): Promise<AppConfig> {
        try {
            const configData = await fs.readFile(this.configPath, 'utf-8');
            const loadedConfig = JSON.parse(configData);

            // 合并默认配置和加载的配置
            this.config = {
                ...this.getDefaultConfig(),
                ...loadedConfig,
                settings: {
                    ...this.getDefaultConfig().settings,
                    ...loadedConfig.settings
                }
            };

            return this.config;
        } catch (error) {
            // 如果文件不存在或读取失败，返回默认配置
            console.log('Config file not found, using default config');
            return this.config;
        }
    }

    public async saveConfig(config: Partial<AppConfig>): Promise<void> {
        // 合并现有配置和新配置
        this.config = {
            ...this.config,
            ...config,
            settings: {
                ...this.config.settings,
                ...config.settings
            }
        };

        try {
            // 确保目录存在
            const configDir = path.dirname(this.configPath);
            await fs.mkdir(configDir, { recursive: true });

            // 写入配置文件
            await fs.writeFile(this.configPath, JSON.stringify(this.config, null, 2), 'utf-8');
        } catch (error) {
            console.error('Failed to save config:', error);
            throw error;
        }
    }

    public async saveMockServerConfig(config: MockServerConfig): Promise<{ success: boolean; message?: string }> {
        // 查找是否已存在相同名称的配置（使用名称作为唯一key）
        const existingIndex = this.config.mockServers.findIndex(server => server.name === config.name);

        // 检查是否有默认配置冲突（相同端口和路径只能有一个默认配置）
        if (config.routes.some(route => route.isDefault)) {
            const defaultRoute = config.routes.find(route => route.isDefault);
            if (defaultRoute) {
                // 查找相同端口和路径的其他默认配置
                const conflictingDefault = this.config.mockServers.find(server =>
                    server.port === config.port &&
                    server.id !== config.id && // 排除自身
                    server.routes.some(route =>
                        route.path === defaultRoute.path &&
                        route.isDefault
                    )
                );

                if (conflictingDefault) {
                    // 自动取消其他配置的默认状态
                    this.config.mockServers = this.config.mockServers.map(server => {
                        if (server.id === conflictingDefault.id) {
                            return {
                                ...server,
                                routes: server.routes.map(route => ({
                                    ...route,
                                    isDefault: false
                                }))
                            };
                        }
                        return server;
                    });
                }
            }
        }

        if (existingIndex >= 0) {
            // 更新现有配置
            this.config.mockServers[existingIndex] = config;
            await this.saveConfig({ mockServers: this.config.mockServers });
            return { success: true, message: '配置已更新' };
        } else {
            // 添加新配置
            this.config.mockServers.push(config);
            await this.saveConfig({ mockServers: this.config.mockServers });
            return { success: true, message: '配置已保存' };
        }
    }

    public async deleteMockServerConfig(id: string): Promise<void> {
        this.config.mockServers = this.config.mockServers.filter(server => server.id !== id);
        await this.saveConfig({ mockServers: this.config.mockServers });
    }

    public async saveProxyServerConfig(config: ProxyServerConfig): Promise<void> {
        // 查找是否已存在相同ID的配置
        const existingIndex = this.config.proxyServers.findIndex(server => server.id === config.id);

        if (existingIndex >= 0) {
            // 更新现有配置
            this.config.proxyServers[existingIndex] = config;
        } else {
            // 添加新配置
            this.config.proxyServers.push(config);
        }

        await this.saveConfig({ proxyServers: this.config.proxyServers });
    }

    public async deleteProxyServerConfig(id: string): Promise<void> {
        this.config.proxyServers = this.config.proxyServers.filter(server => server.id !== id);
        await this.saveConfig({ proxyServers: this.config.proxyServers });
    }

    public getMockServerConfigs(): MockServerConfig[] {
        return this.config.mockServers;
    }

    public getProxyServerConfigs(): ProxyServerConfig[] {
        return this.config.proxyServers;
    }

    public getMockServerConfig(id: string): MockServerConfig | undefined {
        return this.config.mockServers.find(server => server.id === id);
    }

    public getProxyServerConfig(id: string): ProxyServerConfig | undefined {
        return this.config.proxyServers.find(server => server.id === id);
    }

    public async listConfigs(): Promise<{
        mockServers: MockServerConfig[];
        proxyServers: ProxyServerConfig[];
    }> {
        return {
            mockServers: this.config.mockServers,
            proxyServers: this.config.proxyServers
        };
    }

    public async updateSettings(settings: Partial<AppConfig['settings']>): Promise<void> {
        this.config.settings = {
            ...this.config.settings,
            ...settings
        };
        await this.saveConfig({ settings: this.config.settings });
    }

    public getSettings(): AppConfig['settings'] {
        return this.config.settings;
    }

    public getConfigPath(): string {
        return this.configPath;
    }
}
