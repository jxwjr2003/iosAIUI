"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConfigManager = void 0;
const electron_1 = require("electron");
const fs = __importStar(require("fs/promises"));
const path = __importStar(require("path"));
class ConfigManager {
    constructor() {
        this.configPath = path.join(electron_1.app.getPath('userData'), 'config.json');
        this.config = this.getDefaultConfig();
    }
    getDefaultConfig() {
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
    async loadConfig() {
        try {
            const configData = await fs.readFile(this.configPath, 'utf-8');
            const loadedConfig = JSON.parse(configData);
            // 迁移旧版配置（单路由到多路由）
            const migratedConfig = this.migrateLegacyConfig(loadedConfig);
            // 合并默认配置和加载的配置
            this.config = {
                ...this.getDefaultConfig(),
                ...migratedConfig,
                settings: {
                    ...this.getDefaultConfig().settings,
                    ...migratedConfig.settings
                }
            };
            console.log('Config loaded successfully from:', this.configPath);
            console.log('Loaded config content:', JSON.stringify(this.config, null, 2));
            return this.config;
        }
        catch (error) {
            // 如果文件不存在或读取失败，返回默认配置
            console.log('Config file not found, using default config');
            console.log('Config path that was attempted:', this.configPath);
            return this.config;
        }
    }
    async saveConfig(config) {
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
            // 添加详细日志
            console.log('Config saved successfully to:', this.configPath);
            console.log('Config content:', JSON.stringify(this.config, null, 2));
        }
        catch (error) {
            console.error('Failed to save config:', error);
            console.error('Config path:', this.configPath);
            console.error('Config content that failed to save:', JSON.stringify(this.config, null, 2));
            throw error;
        }
    }
    async saveMockServerConfig(config) {
        // 查找是否已存在相同名称的配置（使用名称作为唯一key）
        const existingIndex = this.config.mockServers.findIndex(server => server.name === config.name);
        // 检查是否有默认配置冲突（相同端口和路径只能有一个默认配置）
        // 注意：现在每个路由都有自己的isDefault属性
        const defaultRoutes = config.routes.filter(route => route.isDefault);
        if (defaultRoutes.length > 0) {
            // 对于每个默认路由，检查冲突
            for (const defaultRoute of defaultRoutes) {
                const conflictingDefault = this.config.mockServers.find(server => server.port === config.port &&
                    server.id !== config.id && // 排除自身
                    server.routes.some(route => route.path === defaultRoute.path &&
                        route.isDefault));
                if (conflictingDefault) {
                    // 自动取消其他配置中相同路径的默认状态
                    this.config.mockServers = this.config.mockServers.map(server => {
                        if (server.id === conflictingDefault.id) {
                            return {
                                ...server,
                                routes: server.routes.map(route => {
                                    if (route.path === defaultRoute.path && route.isDefault) {
                                        return {
                                            ...route,
                                            isDefault: false
                                        };
                                    }
                                    return route;
                                })
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
        }
        else {
            // 添加新配置
            this.config.mockServers.push(config);
            await this.saveConfig({ mockServers: this.config.mockServers });
            return { success: true, message: '配置已保存' };
        }
    }
    async deleteMockServerConfig(id) {
        this.config.mockServers = this.config.mockServers.filter(server => server.id !== id);
        await this.saveConfig({ mockServers: this.config.mockServers });
    }
    async saveProxyServerConfig(config) {
        // 查找是否已存在相同ID的配置
        const existingIndex = this.config.proxyServers.findIndex(server => server.id === config.id);
        if (existingIndex >= 0) {
            // 更新现有配置
            this.config.proxyServers[existingIndex] = config;
        }
        else {
            // 添加新配置
            this.config.proxyServers.push(config);
        }
        await this.saveConfig({ proxyServers: this.config.proxyServers });
    }
    async deleteProxyServerConfig(id) {
        this.config.proxyServers = this.config.proxyServers.filter(server => server.id !== id);
        await this.saveConfig({ proxyServers: this.config.proxyServers });
    }
    getMockServerConfigs() {
        return this.config.mockServers;
    }
    getProxyServerConfigs() {
        return this.config.proxyServers;
    }
    getMockServerConfig(id) {
        return this.config.mockServers.find(server => server.id === id);
    }
    getProxyServerConfig(id) {
        return this.config.proxyServers.find(server => server.id === id);
    }
    async listConfigs() {
        return {
            mockServers: this.config.mockServers,
            proxyServers: this.config.proxyServers
        };
    }
    async updateSettings(settings) {
        this.config.settings = {
            ...this.config.settings,
            ...settings
        };
        await this.saveConfig({ settings: this.config.settings });
    }
    getSettings() {
        return this.config.settings;
    }
    getConfigPath() {
        return this.configPath;
    }
    /**
     * 迁移旧版配置（从单路由到多路由）
     */
    migrateLegacyConfig(config) {
        if (!config.mockServers || !Array.isArray(config.mockServers)) {
            return config;
        }
        const migratedConfig = { ...config };
        migratedConfig.mockServers = config.mockServers.map((server) => {
            // 如果已经有routes字段，说明已经是新版本配置
            if (server.routes && Array.isArray(server.routes)) {
                return server;
            }
            // 如果有route字段，说明是旧版本配置，需要迁移
            if (server.route) {
                console.log(`迁移配置: ${server.name} (从单路由到多路由)`);
                return {
                    ...server,
                    routes: [server.route]
                };
            }
            // 如果既没有route也没有routes，创建一个默认路由
            console.log(`为配置 ${server.name} 创建默认路由`);
            return {
                ...server,
                routes: [{
                        id: `${server.id}_default_route`,
                        path: '/',
                        method: 'GET',
                        headers: { 'Content-Type': 'application/json' },
                        body: { message: 'Default response from migrated server' },
                        statusCode: 200,
                        description: '默认路由（由系统自动创建）',
                        isDefault: true
                    }]
            };
        });
        return migratedConfig;
    }
}
exports.ConfigManager = ConfigManager;
