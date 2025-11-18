import { app, BrowserWindow, ipcMain, shell, dialog } from 'electron';
import * as path from 'path';
import { MockServerEngine } from './mock-server/mock-server-engine';
import { MockServerManager } from './mock-server/mock-server-manager';
import { ProxyServerEngine } from './proxy-server/proxy-server-engine';
import { ConfigManager } from './config/config-manager';
import { LogManager } from './logging/log-manager';
import { MultiPathConfigManager } from './storage/multi-path-config-manager';

class LocalProxyApp {
    private mainWindow: BrowserWindow | null = null;
    private mockServerEngine: MockServerEngine;
    private mockServerManager: MockServerManager;
    private proxyServerEngine: ProxyServerEngine;
    private configManager: ConfigManager;
    private multiPathConfigManager: MultiPathConfigManager;
    private logManager: LogManager;

    constructor() {
        this.mockServerEngine = new MockServerEngine();
        this.configManager = new ConfigManager();
        this.multiPathConfigManager = new MultiPathConfigManager(this.configManager);
        this.mockServerManager = new MockServerManager(this.configManager);
        this.proxyServerEngine = new ProxyServerEngine();
        this.logManager = new LogManager();

        this.setupIpcHandlers();
        this.setupMockServerManagerEvents();
        this.setupMultiPathConfigManagerEvents();
        this.setupProxyServerEngineEvents();
    }

    private createMainWindow(): void {
        this.mainWindow = new BrowserWindow({
            width: 1200,
            height: 800,
            webPreferences: {
                nodeIntegration: false,
                contextIsolation: true,
                preload: path.join(__dirname, 'preload.js')
            },
            icon: path.join(__dirname, '../../assets/icons/app32.png')
        });

        this.mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'));

        // 开发模式下打开开发者工具
        if (process.env.NODE_ENV === 'development') {
            this.mainWindow.webContents.openDevTools();
        }
    }

    private setupIpcHandlers(): void {
        // 监听模拟服务器事件（保留原有单个服务器的日志记录）
        this.mockServerEngine.on('requestHandled', (data: { request: any; response: any }) => {
            const { request, response } = data;

            // 在控制台打印模拟服务器请求数据
            console.log(`[${request.timestamp.toISOString()}] [MOCK REQUEST] ${request.method} ${request.url}`);
            console.log(`- 请求ID: ${request.id}`);
            console.log(`- 方法: ${request.method}`);
            console.log(`- URL: ${request.url}`);
            console.log(`- 请求头:`, JSON.stringify(request.headers, null, 2));
            if (request.body) {
                console.log(`- 请求体:`, request.body);
            }
            console.log('---');

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

            // 在控制台打印模拟服务器响应数据
            console.log(`[${response.timestamp.toISOString()}] [MOCK RESPONSE] ${response.statusCode} for ${request.method} ${request.url}`);
            console.log(`- 请求ID: ${response.id}`);
            console.log(`- 状态码: ${response.statusCode}`);
            console.log(`- 响应头:`, JSON.stringify(response.headers, null, 2));
            if (response.body) {
                console.log(`- 响应体:`, response.body);
            }
            console.log('---');

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
                // 使用新的管理器启动单个服务器
                const result = await this.mockServerManager.startServer(config.id);
                if (result.success) {
                    this.logManager.addLog('mock-server', 'info', `Mock server started on port ${config.port}`);
                } else {
                    this.logManager.addLog('mock-server', 'error', `Failed to start mock server: ${result.error}`);
                }
                return result;
            } catch (error) {
                const errorMessage = error instanceof Error ? error.message : String(error);
                this.logManager.addLog('mock-server', 'error', `Failed to start mock server: ${errorMessage}`);
                return { success: false, error: errorMessage };
            }
        });

        ipcMain.handle('mock-server:stop', async () => {
            try {
                // 停止所有模拟服务器
                await this.mockServerManager.stopAll();
                this.logManager.addLog('mock-server', 'info', 'All mock servers stopped');
                return { success: true };
            } catch (error) {
                const errorMessage = error instanceof Error ? error.message : String(error);
                this.logManager.addLog('mock-server', 'error', `Failed to stop mock servers: ${errorMessage}`);
                return { success: false, error: errorMessage };
            }
        });

        // 新增批量启动接口
        ipcMain.handle('mock-server:start-all', async () => {
            try {
                const result = await this.mockServerManager.startAll();

                // 记录批量启动结果
                if (result.success) {
                    this.logManager.addLog('mock-server', 'info',
                        `Started ${result.started.length} mock servers, ${result.failed.length} failed`);
                } else {
                    this.logManager.addLog('mock-server', 'error',
                        `Batch start failed: ${result.started.length} started, ${result.failed.length} failed`);
                }

                // 记录端口冲突
                if (result.portConflicts.length > 0) {
                    result.portConflicts.forEach(conflict => {
                        this.logManager.addLog('mock-server', 'error', `Port conflict: ${conflict}`);
                    });
                }

                // 记录失败详情
                result.failed.forEach(failure => {
                    this.logManager.addLog('mock-server', 'error',
                        `Failed to start server ${failure.id}: ${failure.error}`);
                });

                return result;
            } catch (error) {
                const errorMessage = error instanceof Error ? error.message : String(error);
                this.logManager.addLog('mock-server', 'error', `Batch start failed: ${errorMessage}`);
                return {
                    success: false,
                    started: [],
                    failed: [{ id: 'unknown', error: errorMessage }],
                    portConflicts: []
                };
            }
        });

        // 获取所有服务器状态
        ipcMain.handle('mock-server:get-statuses', async () => {
            try {
                const statuses = this.mockServerManager.getServerStatuses();
                return { success: true, statuses };
            } catch (error) {
                const errorMessage = error instanceof Error ? error.message : String(error);
                return { success: false, error: errorMessage };
            }
        });

        // 停止单个服务器
        ipcMain.handle('mock-server:stop-server', async (event, configId) => {
            try {
                await this.mockServerManager.stopServer(configId);
                this.logManager.addLog('mock-server', 'info', `Mock server ${configId} stopped`);
                return { success: true };
            } catch (error) {
                const errorMessage = error instanceof Error ? error.message : String(error);
                this.logManager.addLog('mock-server', 'error', `Failed to stop mock server ${configId}: ${errorMessage}`);
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
                console.log('Received mock server config save request:', JSON.stringify(config, null, 2));
                const result = await this.configManager.saveMockServerConfig(config);
                console.log('Mock server config save result:', result);
                return { success: true };
            } catch (error) {
                const errorMessage = error instanceof Error ? error.message : String(error);
                console.error('Mock server config save failed:', errorMessage);
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

        // 打开配置文件位置
        ipcMain.handle('config:openLocation', async () => {
            try {
                const configPath = this.configManager.getConfigPath();
                await shell.showItemInFolder(configPath);
                this.logManager.addLog('config', 'info', `Opened config location: ${configPath}`);
                return { success: true, path: configPath };
            } catch (error) {
                const errorMessage = error instanceof Error ? error.message : String(error);
                this.logManager.addLog('config', 'error', `Failed to open config location: ${errorMessage}`);
                return { success: false, error: errorMessage };
            }
        });

        // 多路径配置管理器 IPC 处理程序
        ipcMain.handle('storage:get-locations', async () => {
            try {
                const locations = this.multiPathConfigManager.getAllStorageLocations();
                return { success: true, locations };
            } catch (error) {
                const errorMessage = error instanceof Error ? error.message : String(error);
                return { success: false, error: errorMessage };
            }
        });

        ipcMain.handle('storage:switch', async (event, providerId) => {
            try {
                const success = await this.multiPathConfigManager.switchToStorage(providerId);
                this.logManager.addLog('storage', 'info', `切换到存储: ${providerId}`);
                return { success };
            } catch (error) {
                const errorMessage = error instanceof Error ? error.message : String(error);
                this.logManager.addLog('storage', 'error', `切换存储失败: ${errorMessage}`);
                return { success: false, error: errorMessage };
            }
        });

        ipcMain.handle('storage:add-custom', async (event, customPath, name) => {
            try {
                const location = await this.multiPathConfigManager.addCustomStorage(customPath, name);
                this.logManager.addLog('storage', 'info', `添加自定义存储: ${customPath}`);
                return { success: true, location };
            } catch (error) {
                const errorMessage = error instanceof Error ? error.message : String(error);
                this.logManager.addLog('storage', 'error', `添加自定义存储失败: ${errorMessage}`);
                return { success: false, error: errorMessage };
            }
        });

        ipcMain.handle('storage:load-from-file', async (event, filePath) => {
            try {
                const config = await this.multiPathConfigManager.loadFromFile(filePath);
                this.logManager.addLog('storage', 'info', `从文件加载配置: ${filePath}`);
                return { success: true, config };
            } catch (error) {
                const errorMessage = error instanceof Error ? error.message : String(error);
                this.logManager.addLog('storage', 'error', `从文件加载配置失败: ${errorMessage}`);
                return { success: false, error: errorMessage };
            }
        });

        ipcMain.handle('storage:watch-file', async (event, filePath) => {
            try {
                await this.multiPathConfigManager.watchFile(filePath, (config) => {
                    if (this.mainWindow) {
                        this.mainWindow.webContents.send('storage:file-changed', { filePath, config });
                    }
                });
                this.logManager.addLog('storage', 'info', `开始监控文件: ${filePath}`);
                return { success: true };
            } catch (error) {
                const errorMessage = error instanceof Error ? error.message : String(error);
                this.logManager.addLog('storage', 'error', `监控文件失败: ${errorMessage}`);
                return { success: false, error: errorMessage };
            }
        });

        ipcMain.handle('storage:stop-watch-file', async (event, filePath) => {
            try {
                await this.multiPathConfigManager.stopWatchingFile(filePath);
                this.logManager.addLog('storage', 'info', `停止监控文件: ${filePath}`);
                return { success: true };
            } catch (error) {
                const errorMessage = error instanceof Error ? error.message : String(error);
                this.logManager.addLog('storage', 'error', `停止监控文件失败: ${errorMessage}`);
                return { success: false, error: errorMessage };
            }
        });

        ipcMain.handle('storage:export-config', async (event, config, options) => {
            try {
                await this.multiPathConfigManager.exportConfig(config, options);
                this.logManager.addLog('storage', 'info', `导出配置到: ${options.outputPath}`);
                return { success: true };
            } catch (error) {
                const errorMessage = error instanceof Error ? error.message : String(error);
                this.logManager.addLog('storage', 'error', `导出配置失败: ${errorMessage}`);
                return { success: false, error: errorMessage };
            }
        });

        ipcMain.handle('storage:import-config', async (event, configData) => {
            try {
                // 处理从配置数据对象导入
                const tempFilePath = path.join(app.getPath('temp'), `import-${Date.now()}.json`);
                const fs = require('fs');
                fs.writeFileSync(tempFilePath, JSON.stringify(configData, null, 2));

                const result = await this.multiPathConfigManager.importConfig(tempFilePath);

                // 清理临时文件
                fs.unlinkSync(tempFilePath);

                // 根据导入结果的实际状态返回响应
                if (result.success) {
                    this.logManager.addLog('storage', 'info', '配置导入成功', {
                        importedCount: result.importedCount
                    });
                    return { success: true, result };
                } else {
                    // 导入失败，记录详细错误信息
                    this.logManager.addLog('storage', 'error', '配置导入失败', {
                        errors: result.errors,
                        warnings: result.warnings,
                        importedCount: result.importedCount
                    });
                    return {
                        success: false,
                        error: '导入失败',
                        details: {
                            errors: result.errors,
                            warnings: result.warnings,
                            importedCount: result.importedCount
                        }
                    };
                }
            } catch (error) {
                const errorMessage = error instanceof Error ? error.message : String(error);
                this.logManager.addLog('storage', 'error', `导入配置失败: ${errorMessage}`);
                return { success: false, error: errorMessage };
            }
        });

        ipcMain.handle('storage:generate-export-filename', async (event, baseName) => {
            try {
                const fileName = this.multiPathConfigManager.generateExportFileName(baseName);
                return { success: true, fileName };
            } catch (error) {
                const errorMessage = error instanceof Error ? error.message : String(error);
                return { success: false, error: errorMessage };
            }
        });

        // 添加UI所需的存储管理IPC处理程序
        // 获取当前存储位置
        ipcMain.handle('storage:get-current-location', async () => {
            try {
                const activeStorage = this.multiPathConfigManager.getActiveStorage();
                if (!activeStorage) {
                    return { success: false, error: '没有活动的存储提供者' };
                }

                const locations = this.multiPathConfigManager.getAllStorageLocations();
                const currentLocation = locations.find(loc => loc.id === activeStorage.id);
                return { success: true, location: currentLocation };
            } catch (error) {
                const errorMessage = error instanceof Error ? error.message : String(error);
                return { success: false, error: errorMessage };
            }
        });

        // 设置存储位置
        ipcMain.handle('storage:set-location', async (event, path) => {
            try {
                let result;
                if (path === 'default') {
                    result = await this.multiPathConfigManager.switchToStorage('default');
                } else {
                    // 添加自定义存储并切换到它
                    const location = await this.multiPathConfigManager.addCustomStorage(path);
                    result = await this.multiPathConfigManager.switchToStorage(location.id);
                }

                if (result) {
                    const activeStorage = this.multiPathConfigManager.getActiveStorage();
                    const locations = this.multiPathConfigManager.getAllStorageLocations();
                    const currentLocation = locations.find(loc => loc.id === activeStorage?.id);

                    // 发送存储位置变化事件
                    if (this.mainWindow && currentLocation) {
                        this.mainWindow.webContents.send('storage:location-changed', currentLocation);
                    }
                    this.logManager.addLog('storage', 'info', `存储位置已更改为: ${path}`);
                    return { success: true, location: currentLocation };
                } else {
                    return { success: false, error: '切换存储位置失败' };
                }
            } catch (error) {
                const errorMessage = error instanceof Error ? error.message : String(error);
                this.logManager.addLog('storage', 'error', `设置存储位置失败: ${errorMessage}`);
                return { success: false, error: errorMessage };
            }
        });

        // 迁移数据
        ipcMain.handle('storage:migrate-data', async (event, newPath) => {
            try {
                // 先添加新的存储位置
                const newLocation = await this.multiPathConfigManager.addCustomStorage(newPath);

                // 迁移配置到新位置
                const result = await this.multiPathConfigManager.migrateConfig(newLocation.id);

                if (result) {
                    this.logManager.addLog('storage', 'info', `数据已迁移到: ${newPath}`);
                    return { success: true };
                } else {
                    return { success: false, error: '数据迁移失败' };
                }
            } catch (error) {
                const errorMessage = error instanceof Error ? error.message : String(error);
                this.logManager.addLog('storage', 'error', `数据迁移失败: ${errorMessage}`);
                return { success: false, error: errorMessage };
            }
        });

        // 浏览路径
        ipcMain.handle('storage:browse-path', async () => {
            try {
                const result = await dialog.showOpenDialog(this.mainWindow!, {
                    properties: ['openDirectory'],
                    title: '选择存储目录'
                });

                if (!result.canceled && result.filePaths.length > 0) {
                    return { success: true, path: result.filePaths[0] };
                } else {
                    return { success: false, error: '用户取消选择' };
                }
            } catch (error) {
                const errorMessage = error instanceof Error ? error.message : String(error);
                return { success: false, error: errorMessage };
            }
        });


        // 保存导出
        ipcMain.handle('storage:save-export', async (event, options) => {
            try {
                const { content, format, scope, filename } = options;

                const result = await dialog.showSaveDialog(this.mainWindow!, {
                    defaultPath: filename,
                    filters: [
                        { name: 'JSON Files', extensions: ['json'] },
                        { name: 'All Files', extensions: ['*'] }
                    ]
                });

                if (!result.canceled && result.filePath) {
                    const fs = require('fs');
                    fs.writeFileSync(result.filePath, content);
                    this.logManager.addLog('storage', 'info', `配置已保存到: ${result.filePath}`);
                    return { success: true, path: result.filePath };
                } else {
                    return { success: false, error: '用户取消保存' };
                }
            } catch (error) {
                const errorMessage = error instanceof Error ? error.message : String(error);
                this.logManager.addLog('storage', 'error', `保存导出失败: ${errorMessage}`);
                return { success: false, error: errorMessage };
            }
        });

        // 加载动态文件
        ipcMain.handle('storage:load-dynamic-file', async (event, filePath) => {
            try {
                const config = await this.multiPathConfigManager.loadFromFile(filePath);
                this.logManager.addLog('storage', 'info', `动态文件加载成功: ${filePath}`);
                return { success: true, config };
            } catch (error) {
                const errorMessage = error instanceof Error ? error.message : String(error);
                this.logManager.addLog('storage', 'error', `动态文件加载失败: ${errorMessage}`);
                return { success: false, error: errorMessage };
            }
        });


        // 文件选择对话框
        ipcMain.handle('dialog:open-file', async (event, options) => {
            try {
                const result = await dialog.showOpenDialog(this.mainWindow!, options);
                return { success: true, result };
            } catch (error) {
                const errorMessage = error instanceof Error ? error.message : String(error);
                return { success: false, error: errorMessage };
            }
        });

        ipcMain.handle('dialog:save-file', async (event, options) => {
            try {
                const result = await dialog.showSaveDialog(this.mainWindow!, options);
                return { success: true, result };
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
            await this.mockServerManager.dispose();
            await this.proxyServerEngine.stop();
            await this.multiPathConfigManager.dispose();
        });
    }
    /**
     * 设置模拟服务器管理器事件监听
     */
    private setupMockServerManagerEvents(): void {
        // 监听服务器状态变化
        this.mockServerManager.on('serversStatusChanged', (statuses) => {
            if (this.mainWindow) {
                this.mainWindow.webContents.send('mock-servers:status-changed', statuses);
            }
        });

        // 监听单个服务器状态变化
        this.mockServerManager.on('serverStatusChanged', (status) => {
            if (this.mainWindow) {
                this.mainWindow.webContents.send('mock-server:status-changed', status);
            }
        });
    }

    /**
     * 设置多路径配置管理器事件监听
     */
    private setupMultiPathConfigManagerEvents(): void {
        // 监听存储切换事件
        this.multiPathConfigManager.on('storageSwitched', (data) => {
            if (this.mainWindow) {
                this.mainWindow.webContents.send('storage:switched', data);
            }
        });

        // 监听配置加载事件
        this.multiPathConfigManager.on('configLoaded', (data) => {
            if (this.mainWindow) {
                this.mainWindow.webContents.send('config:loaded', data);
            }
        });

        // 监听配置保存事件
        this.multiPathConfigManager.on('configSaved', (data) => {
            if (this.mainWindow) {
                this.mainWindow.webContents.send('config:saved', data);
            }
        });

        // 监听配置导入导出事件
        this.multiPathConfigManager.on('configImported', (data) => {
            if (this.mainWindow) {
                this.mainWindow.webContents.send('config:imported', data);
            }
        });

        this.multiPathConfigManager.on('configExported', (data) => {
            if (this.mainWindow) {
                this.mainWindow.webContents.send('config:exported', data);
            }
        });
    }

    /**
     * 设置代理服务器引擎事件监听
     */
    private setupProxyServerEngineEvents(): void {
        // 监听代理服务器请求接收事件
        this.proxyServerEngine.on('requestReceived', (proxyRequest: any) => {
            // 记录代理服务器请求详细信息
            this.logManager.addLog('proxy-server', 'info',
                `Proxy Request: ${proxyRequest.method} ${proxyRequest.url}`,
                {
                    type: 'proxy-request',
                    id: proxyRequest.id,
                    timestamp: proxyRequest.timestamp,
                    method: proxyRequest.method,
                    url: proxyRequest.url,
                    headers: proxyRequest.headers,
                    body: proxyRequest.body
                }
            );
        });

        // 监听代理服务器响应发送事件
        this.proxyServerEngine.on('responseSent', (data: { request: any; response: any }) => {
            const { request, response } = data;

            // 记录代理服务器响应详细信息
            this.logManager.addLog('proxy-server', 'info',
                `Proxy Response: ${response.statusCode} for ${request.method} ${request.url}`,
                {
                    type: 'proxy-response',
                    id: response.id,
                    timestamp: response.timestamp,
                    statusCode: response.statusCode,
                    headers: response.headers,
                    body: response.body
                }
            );
        });

        // 监听代理服务器启动事件
        this.proxyServerEngine.on('serverStarted', (config: any) => {
            this.logManager.addLog('proxy-server', 'info', `Proxy server started on port ${config.port}`);
        });

        // 监听代理服务器停止事件
        this.proxyServerEngine.on('serverStopped', () => {
            this.logManager.addLog('proxy-server', 'info', 'Proxy server stopped');
        });
    }
}

// 启动应用
const localProxyApp = new LocalProxyApp();
localProxyApp.initialize().catch(console.error);
