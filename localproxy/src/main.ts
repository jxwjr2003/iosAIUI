import { app, BrowserWindow, ipcMain } from 'electron';
import * as path from 'path';
import { MockServerEngine } from './mock-server/mock-server-engine';
import { ProxyServerEngine } from './proxy-server/proxy-server-engine';
import { ConfigManager } from './config/config-manager';
import { LogManager } from './logging/log-manager';

class LocalProxyApp {
    private mainWindow: BrowserWindow | null = null;
    private mockServerEngine: MockServerEngine;
    private proxyServerEngine: ProxyServerEngine;
    private configManager: ConfigManager;
    private logManager: LogManager;

    constructor() {
        this.mockServerEngine = new MockServerEngine();
        this.proxyServerEngine = new ProxyServerEngine();
        this.configManager = new ConfigManager();
        this.logManager = new LogManager();

        this.setupIpcHandlers();
    }

    private createMainWindow(): void {
        this.mainWindow = new BrowserWindow({
            width: 1200,
            height: 800,
            webPreferences: {
                nodeIntegration: false,
                contextIsolation: true,
                preload: path.join(__dirname, 'preload.js')
            }
        });

        this.mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'));

        // 开发模式下打开开发者工具
        if (process.env.NODE_ENV === 'development') {
            this.mainWindow.webContents.openDevTools();
        }
    }

    private setupIpcHandlers(): void {
        // 监听模拟服务器事件
        this.mockServerEngine.on('requestHandled', (data: { request: any; response: any }) => {
            const { request, response } = data;

            // 记录请求详细信息
            this.logManager.addLog('mock-server', 'info',
                `Request: ${request.method} ${request.url}`,
                {
                    type: 'request',
                    id: request.id,
                    timestamp: request.timestamp,
                    method: request.method,
                    url: request.url,
                    headers: request.headers,
                    body: request.body
                }
            );

            // 记录响应详细信息
            this.logManager.addLog('mock-server', 'info',
                `Response: ${response.statusCode} for ${request.method} ${request.url}`,
                {
                    type: 'response',
                    id: response.id,
                    timestamp: response.timestamp,
                    statusCode: response.statusCode,
                    headers: response.headers,
                    body: response.body
                }
            );
        });

        // 模拟服务器相关 IPC 处理
        ipcMain.handle('mock-server:start', async (event, config) => {
            try {
                await this.mockServerEngine.start(config);
                this.logManager.addLog('mock-server', 'info', `Mock server started on port ${config.port}`);
                return { success: true };
            } catch (error) {
                const errorMessage = error instanceof Error ? error.message : String(error);
                this.logManager.addLog('mock-server', 'error', `Failed to start mock server: ${errorMessage}`);
                return { success: false, error: errorMessage };
            }
        });

        ipcMain.handle('mock-server:stop', async () => {
            try {
                await this.mockServerEngine.stop();
                this.logManager.addLog('mock-server', 'info', 'Mock server stopped');
                return { success: true };
            } catch (error) {
                const errorMessage = error instanceof Error ? error.message : String(error);
                this.logManager.addLog('mock-server', 'error', `Failed to stop mock server: ${errorMessage}`);
                return { success: false, error: errorMessage };
            }
        });

        // 代理服务器相关 IPC 处理
        ipcMain.handle('proxy-server:start', async (event, config) => {
            try {
                await this.proxyServerEngine.start(config);
                this.logManager.addLog('proxy-server', 'info', `Proxy server started on port ${config.port}`);
                return { success: true };
            } catch (error) {
                const errorMessage = error instanceof Error ? error.message : String(error);
                this.logManager.addLog('proxy-server', 'error', `Failed to start proxy server: ${errorMessage}`);
                return { success: false, error: errorMessage };
            }
        });

        ipcMain.handle('proxy-server:stop', async () => {
            try {
                await this.proxyServerEngine.stop();
                this.logManager.addLog('proxy-server', 'info', 'Proxy server stopped');
                return { success: true };
            } catch (error) {
                const errorMessage = error instanceof Error ? error.message : String(error);
                this.logManager.addLog('proxy-server', 'error', `Failed to stop proxy server: ${errorMessage}`);
                return { success: false, error: errorMessage };
            }
        });

        // 配置管理相关 IPC 处理
        ipcMain.handle('config:save', async (event, config) => {
            try {
                await this.configManager.saveConfig(config);
                return { success: true };
            } catch (error) {
                const errorMessage = error instanceof Error ? error.message : String(error);
                return { success: false, error: errorMessage };
            }
        });

        ipcMain.handle('config:saveMockServer', async (event, config) => {
            try {
                await this.configManager.saveMockServerConfig(config);
                return { success: true };
            } catch (error) {
                const errorMessage = error instanceof Error ? error.message : String(error);
                return { success: false, error: errorMessage };
            }
        });

        ipcMain.handle('config:deleteMockConfig', async (event, id) => {
            try {
                await this.configManager.deleteMockServerConfig(id);
                return { success: true };
            } catch (error) {
                const errorMessage = error instanceof Error ? error.message : String(error);
                return { success: false, error: errorMessage };
            }
        });

        ipcMain.handle('config:load', async () => {
            try {
                const config = await this.configManager.loadConfig();
                return { success: true, config };
            } catch (error) {
                const errorMessage = error instanceof Error ? error.message : String(error);
                return { success: false, error: errorMessage };
            }
        });

        ipcMain.handle('config:list', async () => {
            try {
                const configs = await this.configManager.listConfigs();
                return { success: true, configs };
            } catch (error) {
                const errorMessage = error instanceof Error ? error.message : String(error);
                return { success: false, error: errorMessage };
            }
        });

        // 日志相关 IPC 处理
        ipcMain.handle('logs:get', async (event, filter) => {
            try {
                const logs = this.logManager.getLogs(filter);
                return { success: true, logs };
            } catch (error) {
                const errorMessage = error instanceof Error ? error.message : String(error);
                return { success: false, error: errorMessage };
            }
        });

        ipcMain.handle('logs:clear', async () => {
            try {
                this.logManager.clearLogs();
                return { success: true };
            } catch (error) {
                const errorMessage = error instanceof Error ? error.message : String(error);
                return { success: false, error: errorMessage };
            }
        });

        // 监听日志事件并发送到渲染进程
        this.logManager.onLogAdded((log) => {
            if (this.mainWindow) {
                this.mainWindow.webContents.send('log:added', log);
            }
        });
    }

    public async initialize(): Promise<void> {
        // 在创建窗口前加载配置
        await this.configManager.loadConfig();

        await app.whenReady();
        this.createMainWindow();

        app.on('activate', () => {
            if (BrowserWindow.getAllWindows().length === 0) {
                this.createMainWindow();
            }
        });

        app.on('window-all-closed', () => {
            if (process.platform !== 'darwin') {
                app.quit();
            }
        });

        // 应用退出前清理资源
        app.on('before-quit', async () => {
            await this.mockServerEngine.stop();
            await this.proxyServerEngine.stop();
        });
    }
}

// 启动应用
const localProxyApp = new LocalProxyApp();
localProxyApp.initialize().catch(console.error);
