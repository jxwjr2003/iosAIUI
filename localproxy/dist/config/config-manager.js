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
        }
        catch (error) {
            // 如果文件不存在或读取失败，返回默认配置
            console.log('Config file not found, using default config');
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
        }
        catch (error) {
            console.error('Failed to save config:', error);
            throw error;
        }
    }
    async saveMockServerConfig(config) {
        // 查找是否已存在相同ID的配置
        const existingIndex = this.config.mockServers.findIndex(server => server.id === config.id);
        if (existingIndex >= 0) {
            // 更新现有配置
            this.config.mockServers[existingIndex] = config;
        }
        else {
            // 添加新配置
            this.config.mockServers.push(config);
        }
        await this.saveConfig({ mockServers: this.config.mockServers });
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
}
exports.ConfigManager = ConfigManager;
//# sourceMappingURL=config-manager.js.map