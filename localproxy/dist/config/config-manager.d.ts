import { MockServerConfig } from '../mock-server/mock-server-engine';
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
export declare class ConfigManager {
    private configPath;
    private config;
    constructor();
    private getDefaultConfig;
    loadConfig(): Promise<AppConfig>;
    saveConfig(config: Partial<AppConfig>): Promise<void>;
    saveMockServerConfig(config: MockServerConfig): Promise<void>;
    deleteMockServerConfig(id: string): Promise<void>;
    saveProxyServerConfig(config: ProxyServerConfig): Promise<void>;
    deleteProxyServerConfig(id: string): Promise<void>;
    getMockServerConfigs(): MockServerConfig[];
    getProxyServerConfigs(): ProxyServerConfig[];
    getMockServerConfig(id: string): MockServerConfig | undefined;
    getProxyServerConfig(id: string): ProxyServerConfig | undefined;
    listConfigs(): Promise<{
        mockServers: MockServerConfig[];
        proxyServers: ProxyServerConfig[];
    }>;
    updateSettings(settings: Partial<AppConfig['settings']>): Promise<void>;
    getSettings(): AppConfig['settings'];
}
//# sourceMappingURL=config-manager.d.ts.map