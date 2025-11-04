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
const electron_1 = require("electron");
const path = __importStar(require("path"));
const mock_server_engine_1 = require("./mock-server/mock-server-engine");
const proxy_server_engine_1 = require("./proxy-server/proxy-server-engine");
const config_manager_1 = require("./config/config-manager");
const log_manager_1 = require("./logging/log-manager");
class LocalProxyApp {
    constructor() {
        this.mainWindow = null;
        this.mockServerEngine = new mock_server_engine_1.MockServerEngine();
        this.proxyServerEngine = new proxy_server_engine_1.ProxyServerEngine();
        this.configManager = new config_manager_1.ConfigManager();
        this.logManager = new log_manager_1.LogManager();
        this.setupIpcHandlers();
    }
    createMainWindow() {
        this.mainWindow = new electron_1.BrowserWindow({
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
    setupIpcHandlers() {
        // 监听模拟服务器事件
        this.mockServerEngine.on('requestHandled', (data) => {
            const { request, response } = data;
            // 记录请求详细信息
            this.logManager.addLog('mock-server', 'info', `Request: ${request.method} ${request.url}`, {
                type: 'request',
                id: request.id,
                timestamp: request.timestamp,
                method: request.method,
                url: request.url,
                headers: request.headers,
                body: request.body
            });
            // 记录响应详细信息
            this.logManager.addLog('mock-server', 'info', `Response: ${response.statusCode} for ${request.method} ${request.url}`, {
                type: 'response',
                id: response.id,
                timestamp: response.timestamp,
                statusCode: response.statusCode,
                headers: response.headers,
                body: response.body
            });
        });
        // 模拟服务器相关 IPC 处理
        electron_1.ipcMain.handle('mock-server:start', async (event, config) => {
            try {
                await this.mockServerEngine.start(config);
                this.logManager.addLog('mock-server', 'info', `Mock server started on port ${config.port}`);
                return { success: true };
            }
            catch (error) {
                const errorMessage = error instanceof Error ? error.message : String(error);
                this.logManager.addLog('mock-server', 'error', `Failed to start mock server: ${errorMessage}`);
                return { success: false, error: errorMessage };
            }
        });
        electron_1.ipcMain.handle('mock-server:stop', async () => {
            try {
                await this.mockServerEngine.stop();
                this.logManager.addLog('mock-server', 'info', 'Mock server stopped');
                return { success: true };
            }
            catch (error) {
                const errorMessage = error instanceof Error ? error.message : String(error);
                this.logManager.addLog('mock-server', 'error', `Failed to stop mock server: ${errorMessage}`);
                return { success: false, error: errorMessage };
            }
        });
        // 代理服务器相关 IPC 处理
        electron_1.ipcMain.handle('proxy-server:start', async (event, config) => {
            try {
                await this.proxyServerEngine.start(config);
                this.logManager.addLog('proxy-server', 'info', `Proxy server started on port ${config.port}`);
                return { success: true };
            }
            catch (error) {
                const errorMessage = error instanceof Error ? error.message : String(error);
                this.logManager.addLog('proxy-server', 'error', `Failed to start proxy server: ${errorMessage}`);
                return { success: false, error: errorMessage };
            }
        });
        electron_1.ipcMain.handle('proxy-server:stop', async () => {
            try {
                await this.proxyServerEngine.stop();
                this.logManager.addLog('proxy-server', 'info', 'Proxy server stopped');
                return { success: true };
            }
            catch (error) {
                const errorMessage = error instanceof Error ? error.message : String(error);
                this.logManager.addLog('proxy-server', 'error', `Failed to stop proxy server: ${errorMessage}`);
                return { success: false, error: errorMessage };
            }
        });
        // 配置管理相关 IPC 处理
        electron_1.ipcMain.handle('config:save', async (event, config) => {
            try {
                await this.configManager.saveConfig(config);
                return { success: true };
            }
            catch (error) {
                const errorMessage = error instanceof Error ? error.message : String(error);
                return { success: false, error: errorMessage };
            }
        });
        electron_1.ipcMain.handle('config:saveMockServer', async (event, config) => {
            try {
                await this.configManager.saveMockServerConfig(config);
                return { success: true };
            }
            catch (error) {
                const errorMessage = error instanceof Error ? error.message : String(error);
                return { success: false, error: errorMessage };
            }
        });
        electron_1.ipcMain.handle('config:deleteMockConfig', async (event, id) => {
            try {
                await this.configManager.deleteMockServerConfig(id);
                return { success: true };
            }
            catch (error) {
                const errorMessage = error instanceof Error ? error.message : String(error);
                return { success: false, error: errorMessage };
            }
        });
        electron_1.ipcMain.handle('config:load', async () => {
            try {
                const config = await this.configManager.loadConfig();
                return { success: true, config };
            }
            catch (error) {
                const errorMessage = error instanceof Error ? error.message : String(error);
                return { success: false, error: errorMessage };
            }
        });
        electron_1.ipcMain.handle('config:list', async () => {
            try {
                const configs = await this.configManager.listConfigs();
                return { success: true, configs };
            }
            catch (error) {
                const errorMessage = error instanceof Error ? error.message : String(error);
                return { success: false, error: errorMessage };
            }
        });
        // 日志相关 IPC 处理
        electron_1.ipcMain.handle('logs:get', async (event, filter) => {
            try {
                const logs = this.logManager.getLogs(filter);
                return { success: true, logs };
            }
            catch (error) {
                const errorMessage = error instanceof Error ? error.message : String(error);
                return { success: false, error: errorMessage };
            }
        });
        electron_1.ipcMain.handle('logs:clear', async () => {
            try {
                this.logManager.clearLogs();
                return { success: true };
            }
            catch (error) {
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
    async initialize() {
        // 在创建窗口前加载配置
        await this.configManager.loadConfig();
        await electron_1.app.whenReady();
        this.createMainWindow();
        electron_1.app.on('activate', () => {
            if (electron_1.BrowserWindow.getAllWindows().length === 0) {
                this.createMainWindow();
            }
        });
        electron_1.app.on('window-all-closed', () => {
            if (process.platform !== 'darwin') {
                electron_1.app.quit();
            }
        });
        // 应用退出前清理资源
        electron_1.app.on('before-quit', async () => {
            await this.mockServerEngine.stop();
            await this.proxyServerEngine.stop();
        });
    }
}
// 启动应用
const localProxyApp = new LocalProxyApp();
localProxyApp.initialize().catch(console.error);
//# sourceMappingURL=main.js.map