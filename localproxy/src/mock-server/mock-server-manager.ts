import { EventEmitter } from 'events';
import { MockServerInstance } from './mock-server-instance';
import { ConfigManager } from '../config/config-manager';
import { MockServerConfig, RouteConfig } from './mock-server-engine';
import { ServerStatus, BatchStartResult, StartResult, PortSharingGroup } from '../types/server-types';

/**
 * 模拟服务器管理器，管理多个服务器实例，支持端口共享
 */
export class MockServerManager extends EventEmitter {
    private instances: Map<string, MockServerInstance> = new Map();
    private configManager: ConfigManager;
    private usedPorts: Set<number> = new Set();
    private portSharingGroups: Map<number, PortSharingGroup> = new Map();

    constructor(configManager: ConfigManager) {
        super();
        this.configManager = configManager;
    }

    /**
     * 批量启动所有配置的服务器
     */
    public async startAll(): Promise<BatchStartResult> {
        const result: BatchStartResult = {
            success: true,
            started: [],
            failed: [],
            portConflicts: []
        };

        console.log(`开始批量启动服务器，配置数量: ${this.configManager.getMockServerConfigs().length}`);

        // 清除端口使用记录
        this.usedPorts.clear();
        this.portSharingGroups.clear();

        // 获取所有配置
        const configs = this.configManager.getMockServerConfigs();

        if (configs.length === 0) {
            console.log('没有找到需要启动的服务器配置');
            return result;
        }

        console.log(`找到 ${configs.length} 个服务器配置:`, configs.map(c => `${c.name}:${c.port}`));

        // 按端口分组配置
        const portGroups = this.groupConfigsByPort(configs);

        console.log(`按端口分组: ${portGroups.size} 个端口组`);

        // 为每个端口组创建共享服务器
        for (const [port, groupConfigs] of portGroups.entries()) {
            try {
                console.log(`启动端口 ${port} 的共享服务器，包含 ${groupConfigs.length} 个配置`);

                // 创建合并配置
                const mergedConfig = this.createMergedConfig(port, groupConfigs);

                // 启动共享服务器
                await this.startSharedServer(mergedConfig, groupConfigs);

                // 记录启动的配置ID
                result.started.push(...groupConfigs.map(config => config.id));
                console.log(`端口 ${port} 的共享服务器启动成功，启动配置: ${groupConfigs.map(c => c.id).join(', ')}`);

                // 记录端口共享组
                this.portSharingGroups.set(port, {
                    port,
                    protocol: mergedConfig.protocol,
                    serverIds: groupConfigs.map(config => config.id),
                    configs: groupConfigs
                });

            } catch (error) {
                const errorMessage = error instanceof Error ? error.message : String(error);
                console.error(`端口 ${port} 的共享服务器启动失败:`, errorMessage);
                for (const config of groupConfigs) {
                    result.failed.push({ id: config.id, error: errorMessage });
                }
                result.success = false;
            }
        }

        console.log(`批量启动完成: 成功 ${result.started.length} 个, 失败 ${result.failed.length} 个`);

        // 发出状态更新事件
        this.emit('serversStatusChanged', this.getServerStatuses());

        return result;
    }

    /**
     * 批量停止所有服务器
     */
    public async stopAll(): Promise<void> {
        const stopPromises: Promise<void>[] = [];

        for (const instance of this.instances.values()) {
            if (instance.isRunning) {
                stopPromises.push(instance.stop());
            }
        }

        await Promise.all(stopPromises);
        this.usedPorts.clear();
        this.portSharingGroups.clear();

        // 发出状态更新事件
        this.emit('serversStatusChanged', this.getServerStatuses());
    }

    /**
     * 启动单个服务器（支持端口共享）
     */
    public async startServer(configId: string): Promise<StartResult> {
        // 获取配置
        const config = this.configManager.getMockServerConfig(configId);
        if (!config) {
            return { success: false, error: `配置 ${configId} 不存在` };
        }

        try {
            // 检查是否已有相同端口的服务器在运行
            const existingGroup = this.portSharingGroups.get(config.port);

            if (existingGroup) {
                // 添加到现有端口共享组
                if (!existingGroup.serverIds.includes(configId)) {
                    existingGroup.serverIds.push(configId);
                    existingGroup.configs.push(config);

                    // 重新创建合并配置并更新服务器
                    const mergedConfig = this.createMergedConfig(config.port, existingGroup.configs);
                    await this.updateSharedServer(config.port, mergedConfig);
                }
            } else {
                // 创建新的端口共享组
                const mergedConfig = this.createMergedConfig(config.port, [config]);
                await this.startSharedServer(mergedConfig, [config]);

                this.portSharingGroups.set(config.port, {
                    port: config.port,
                    protocol: config.protocol,
                    serverIds: [configId],
                    configs: [config]
                });
            }

            // 发出状态更新事件
            this.emit('serversStatusChanged', this.getServerStatuses());

            return { success: true };
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            return { success: false, error: errorMessage };
        }
    }

    /**
     * 停止单个服务器
     */
    public async stopServer(configId: string): Promise<void> {
        const instance = this.instances.get(configId);
        if (instance) {
            try {
                await instance.stop();
                this.usedPorts.delete(instance.port);

                // 发出状态更新事件
                this.emit('serverStatusChanged', instance.getStatus());
                this.emit('serversStatusChanged', this.getServerStatuses());
            } catch (error) {
                console.error(`停止服务器 ${configId} 失败:`, error);
            }
        }

        // 从端口共享组中移除
        for (const [port, group] of this.portSharingGroups.entries()) {
            const configIndex = group.serverIds.indexOf(configId);
            if (configIndex >= 0) {
                group.serverIds.splice(configIndex, 1);
                group.configs.splice(configIndex, 1);

                if (group.serverIds.length === 0) {
                    // 如果没有其他配置使用这个端口，停止服务器
                    this.portSharingGroups.delete(port);
                    const serverInstance = Array.from(this.instances.values()).find(inst => inst.port === port);
                    if (serverInstance) {
                        await serverInstance.stop();
                        this.instances.delete(serverInstance.id);
                    }
                } else {
                    // 更新现有服务器配置
                    const mergedConfig = this.createMergedConfig(port, group.configs);
                    await this.updateSharedServer(port, mergedConfig);
                }
                break;
            }
        }
    }

    /**
     * 获取所有服务器状态
     */
    public getServerStatuses(): ServerStatus[] {
        const statuses: ServerStatus[] = [];

        // 获取正在运行的实例状态
        for (const instance of this.instances.values()) {
            statuses.push(instance.getStatus());
        }

        // 添加未运行的配置状态
        const allConfigs = this.configManager.getMockServerConfigs();
        for (const config of allConfigs) {
            const existingStatus = statuses.find(status => status.id === config.id);
            if (!existingStatus) {
                statuses.push({
                    id: config.id,
                    name: config.name,
                    port: config.port,
                    protocol: config.protocol,
                    isRunning: false,
                    config: config
                });
            }
        }

        return statuses;
    }

    /**
     * 获取单个服务器状态
     */
    public getServerStatus(configId: string): ServerStatus | undefined {
        const instance = this.instances.get(configId);
        if (instance) {
            return instance.getStatus();
        }

        // 如果实例不存在，返回配置信息
        const config = this.configManager.getMockServerConfig(configId);
        if (config) {
            return {
                id: config.id,
                name: config.name,
                port: config.port,
                protocol: config.protocol,
                isRunning: false,
                config: config
            };
        }

        return undefined;
    }

    /**
     * 按端口分组配置
     */
    private groupConfigsByPort(configs: MockServerConfig[]): Map<number, MockServerConfig[]> {
        const portGroups = new Map<number, MockServerConfig[]>();

        for (const config of configs) {
            if (!portGroups.has(config.port)) {
                portGroups.set(config.port, []);
            }
            portGroups.get(config.port)!.push(config);
        }

        return portGroups;
    }

    /**
     * 创建合并配置（将多个配置的路由合并到一个配置中）
     */
    private createMergedConfig(port: number, configs: MockServerConfig[]): MockServerConfig {
        if (configs.length === 0) {
            throw new Error('无法为空配置创建合并配置');
        }

        // 收集所有路由
        const allRoutes: RouteConfig[] = [];
        for (const config of configs) {
            allRoutes.push(...config.routes);
        }

        // 使用第一个配置作为基础，合并所有路由
        const baseConfig = configs[0];
        return {
            ...baseConfig,
            id: `shared_${port}`, // 使用共享ID
            name: `共享服务器 (端口 ${port})`,
            port: port,
            routes: allRoutes
        };
    }

    /**
     * 启动共享服务器
     */
    private async startSharedServer(mergedConfig: MockServerConfig, originalConfigs: MockServerConfig[]): Promise<void> {
        const serverId = mergedConfig.id;

        // 检查端口是否已被占用
        if (this.usedPorts.has(mergedConfig.port)) {
            throw new Error(`端口 ${mergedConfig.port} 已被占用，无法启动服务器`);
        }

        // 创建或获取实例
        let instance = this.instances.get(serverId);
        if (!instance) {
            instance = new MockServerInstance(mergedConfig);
            this.instances.set(serverId, instance);
        } else {
            instance.updateConfig(mergedConfig);
        }

        try {
            // 启动服务器
            await instance.start();
            this.usedPorts.add(mergedConfig.port);

            // 为每个原始配置创建虚拟实例用于状态管理
            for (const config of originalConfigs) {
                if (!this.instances.has(config.id)) {
                    const virtualInstance = new MockServerInstance(config);
                    // 设置虚拟实例为运行状态
                    virtualInstance.setRunningStatus(true);
                    this.instances.set(config.id, virtualInstance);
                } else {
                    // 更新现有实例的运行状态
                    const existingInstance = this.instances.get(config.id);
                    if (existingInstance) {
                        existingInstance.setRunningStatus(true);
                    }
                }
            }

            // 发出状态更新事件
            this.emit('serverStatusChanged', instance.getStatus());
            this.emit('serversStatusChanged', this.getServerStatuses());

        } catch (error) {
            // 如果启动失败，清理端口使用记录
            this.usedPorts.delete(mergedConfig.port);
            throw error;
        }
    }

    /**
     * 更新共享服务器配置
     */
    private async updateSharedServer(port: number, mergedConfig: MockServerConfig): Promise<void> {
        const serverId = mergedConfig.id;
        const instance = this.instances.get(serverId);

        if (instance && instance.isRunning) {
            instance.updateConfig(mergedConfig);
            this.emit('serverStatusChanged', instance.getStatus());
            this.emit('serversStatusChanged', this.getServerStatuses());
        }
    }

    /**
     * 检查端口是否可用（现在支持端口共享，所以总是返回true）
     */
    public isPortAvailable(port: number): boolean {
        // 由于支持端口共享，端口总是可用的
        return true;
    }

    /**
     * 获取正在使用的端口列表
     */
    public getUsedPorts(): number[] {
        return Array.from(this.usedPorts);
    }

    /**
     * 获取端口共享组信息
     */
    public getPortSharingGroups(): PortSharingGroup[] {
        return Array.from(this.portSharingGroups.values());
    }

    /**
     * 清理所有实例
     */
    public async dispose(): Promise<void> {
        await this.stopAll();

        // 清理所有实例
        for (const instance of this.instances.values()) {
            await instance.dispose();
        }

        this.instances.clear();
        this.usedPorts.clear();
        this.portSharingGroups.clear();
    }

    /**
     * 重新加载配置
     */
    public reloadConfigs(): void {
        // 停止所有服务器
        this.stopAll();

        // 清除实例映射
        this.instances.clear();
        this.usedPorts.clear();
        this.portSharingGroups.clear();

        // 发出状态更新事件
        this.emit('serversStatusChanged', this.getServerStatuses());
    }
}
