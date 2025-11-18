import { app } from 'electron';
import * as path from 'path';
import { EventEmitter } from 'events';
import { ConfigManager, AppConfig } from '../config/config-manager';
import { StorageProvider, StorageLocation, ExportOptions, ImportResult } from '../types/storage-types';
import { FileSystemStorage } from './file-system-storage';
import { DynamicFileLoader } from './dynamic-file-loader';
import { ExportManager } from './export-manager';

/**
 * 多路径配置管理器
 */
export class MultiPathConfigManager extends EventEmitter {
    private configManager: ConfigManager;
    private dynamicFileLoader: DynamicFileLoader;
    private exportManager: ExportManager;
    private storageProviders: Map<string, StorageProvider> = new Map();
    private activeStorage: StorageProvider | null = null;
    private storageLocations: StorageLocation[] = [];

    constructor(configManager: ConfigManager) {
        super();
        this.configManager = configManager;
        this.dynamicFileLoader = new DynamicFileLoader();
        this.exportManager = new ExportManager();

        // 初始化默认存储位置
        this.initializeDefaultLocations();
    }

    /**
     * 初始化默认存储位置
     */
    private initializeDefaultLocations(): void {
        // 默认位置：Electron 用户数据目录
        const defaultPath = this.configManager.getConfigPath();
        const defaultStorage = new FileSystemStorage(defaultPath, '默认配置');
        this.addStorageProvider(defaultStorage, {
            id: 'default',
            name: '默认配置',
            path: defaultPath,
            type: 'default',
            isActive: true,
            createdAt: new Date()
        });

        // 设置默认存储为活动存储
        this.activeStorage = defaultStorage;
    }

    /**
     * 添加存储提供者
     */
    addStorageProvider(provider: StorageProvider, location: StorageLocation): void {
        this.storageProviders.set(provider.id, provider);
        this.storageLocations.push(location);
        this.emit('storageProviderAdded', { provider, location });
    }

    /**
     * 移除存储提供者
     */
    removeStorageProvider(providerId: string): void {
        const provider = this.storageProviders.get(providerId);
        if (provider) {
            this.storageProviders.delete(providerId);
            this.storageLocations = this.storageLocations.filter(loc => loc.id !== providerId);

            // 如果移除的是活动存储，切换到默认存储
            if (this.activeStorage?.id === providerId) {
                this.switchToStorage('default');
            }

            this.emit('storageProviderRemoved', { providerId });
        }
    }

    /**
     * 切换到指定存储
     */
    async switchToStorage(providerId: string): Promise<boolean> {
        const provider = this.storageProviders.get(providerId);
        if (!provider) {
            throw new Error(`存储提供者不存在: ${providerId}`);
        }

        // 检查存储是否可用
        const isAvailable = await provider.isAvailable();
        if (!isAvailable) {
            throw new Error(`存储不可用: ${providerId}`);
        }

        // 更新活动存储
        this.activeStorage = provider;

        // 更新存储位置状态
        this.storageLocations.forEach(location => {
            location.isActive = location.id === providerId;
        });

        this.emit('storageSwitched', { provider, location: this.getStorageLocation(providerId) });
        return true;
    }

    /**
     * 获取存储位置信息
     */
    getStorageLocation(providerId: string): StorageLocation | undefined {
        return this.storageLocations.find(loc => loc.id === providerId);
    }

    /**
     * 获取所有存储位置
     */
    getAllStorageLocations(): StorageLocation[] {
        return [...this.storageLocations];
    }

    /**
     * 获取当前活动存储
     */
    getActiveStorage(): StorageProvider | null {
        return this.activeStorage;
    }

    /**
     * 从活动存储加载配置
     */
    async loadConfig(): Promise<AppConfig> {
        if (!this.activeStorage) {
            throw new Error('没有活动的存储提供者');
        }

        try {
            const config = await this.activeStorage.loadConfig();
            this.emit('configLoaded', { config, storage: this.activeStorage });
            return config;
        } catch (error) {
            this.emit('configLoadError', { error, storage: this.activeStorage });
            throw error;
        }
    }

    /**
     * 保存配置到活动存储
     */
    async saveConfig(config: AppConfig): Promise<void> {
        if (!this.activeStorage) {
            throw new Error('没有活动的存储提供者');
        }

        try {
            await this.activeStorage.saveConfig(config);
            this.emit('configSaved', { config, storage: this.activeStorage });
        } catch (error) {
            this.emit('configSaveError', { error, storage: this.activeStorage });
            throw error;
        }
    }

    /**
     * 从文件动态加载配置
     */
    async loadFromFile(filePath: string): Promise<AppConfig> {
        return await this.dynamicFileLoader.loadFromFile(filePath);
    }

    /**
     * 开始监控文件变化
     */
    async watchFile(filePath: string, callback: (config: AppConfig) => void): Promise<void> {
        await this.dynamicFileLoader.watchFile(filePath, callback);
    }

    /**
     * 停止监控文件
     */
    async stopWatchingFile(filePath: string): Promise<void> {
        await this.dynamicFileLoader.stopWatching(filePath);
    }

    /**
     * 获取文件监控状态
     */
    getFileWatchStatus(filePath: string) {
        return this.dynamicFileLoader.getFileWatchStatus(filePath);
    }

    /**
     * 导出配置
     */
    async exportConfig(config: AppConfig, options: ExportOptions): Promise<void> {
        await this.exportManager.exportConfig(config, options);
        this.emit('configExported', { config, options });
    }

    /**
     * 导入配置
     */
    async importConfig(filePath: string): Promise<ImportResult> {
        const result = await this.exportManager.importConfig(filePath);
        this.emit('configImported', { result, filePath });
        return result;
    }

    /**
     * 添加自定义存储位置
     */
    async addCustomStorage(customPath: string, name?: string): Promise<StorageLocation> {
        const absolutePath = path.resolve(customPath);
        const storageName = name || `自定义: ${path.basename(absolutePath)}`;

        const provider = new FileSystemStorage(absolutePath, storageName);
        const location: StorageLocation = {
            id: provider.id,
            name: storageName,
            path: absolutePath,
            type: 'custom',
            isActive: false,
            createdAt: new Date()
        };

        this.addStorageProvider(provider, location);
        return location;
    }

    /**
     * 添加项目存储位置
     */
    async addProjectStorage(projectPath: string): Promise<StorageLocation> {
        const configPath = path.join(projectPath, 'localproxy-config.json');
        const provider = new FileSystemStorage(configPath, '项目配置');
        const location: StorageLocation = {
            id: provider.id,
            name: '项目配置',
            path: configPath,
            type: 'project',
            isActive: false,
            createdAt: new Date()
        };

        this.addStorageProvider(provider, location);
        return location;
    }

    /**
     * 迁移配置到另一个存储
     */
    async migrateConfig(toProviderId: string): Promise<boolean> {
        const fromProvider = this.activeStorage;
        const toProvider = this.storageProviders.get(toProviderId);

        if (!fromProvider || !toProvider) {
            throw new Error('源或目标存储提供者不存在');
        }

        try {
            // 从当前存储加载配置
            const config = await fromProvider.loadConfig();

            // 保存到目标存储
            await toProvider.saveConfig(config);

            // 切换到目标存储
            await this.switchToStorage(toProviderId);

            this.emit('configMigrated', { from: fromProvider, to: toProvider, config });
            return true;
        } catch (error) {
            this.emit('configMigrationError', { error, from: fromProvider, to: toProvider });
            throw error;
        }
    }

    /**
     * 生成导出文件名
     */
    generateExportFileName(baseName?: string): string {
        return this.exportManager.generateExportFileName(baseName);
    }

    /**
     * 清理资源
     */
    async dispose(): Promise<void> {
        await this.dynamicFileLoader.dispose();
        this.removeAllListeners();
    }
}