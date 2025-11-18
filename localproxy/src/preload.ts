import { contextBridge, ipcRenderer } from 'electron';

// 定义 API 接口
const api = {
    // 模拟服务器相关 API
    mockServer: {
        start: (config: any) => ipcRenderer.invoke('mock-server:start', config),
        stop: () => ipcRenderer.invoke('mock-server:stop'),
        startAll: () => ipcRenderer.invoke('mock-server:start-all'),
        stopServer: (configId: string) => ipcRenderer.invoke('mock-server:stop-server', configId),
        getStatuses: () => ipcRenderer.invoke('mock-server:get-statuses'),
    },

    // 代理服务器相关 API
    proxyServer: {
        start: (config: any) => ipcRenderer.invoke('proxy-server:start', config),
        stop: () => ipcRenderer.invoke('proxy-server:stop'),
    },

    // 配置管理相关 API
    config: {
        save: (config: any) => ipcRenderer.invoke('config:save', config),
        saveMockServer: (config: any) => ipcRenderer.invoke('config:saveMockServer', config),
        deleteMockConfig: (id: string) => ipcRenderer.invoke('config:deleteMockConfig', id),
        load: () => ipcRenderer.invoke('config:load'),
        list: () => ipcRenderer.invoke('config:list'),
        openLocation: () => ipcRenderer.invoke('config:openLocation'),
    },

    // 存储管理相关 API
    storage: {
        // 存储位置管理
        getCurrentLocation: () => ipcRenderer.invoke('storage:get-current-location'),
        setLocation: (path: string) => ipcRenderer.invoke('storage:set-location', path),
        migrateData: (newPath: string) => ipcRenderer.invoke('storage:migrate-data', newPath),
        browsePath: () => ipcRenderer.invoke('storage:browse-path'),

        // 配置导入导出
        importConfig: (configData: any) => ipcRenderer.invoke('storage:import-config', configData),
        exportConfig: (options: any) => ipcRenderer.invoke('storage:export-config', options),
        saveExport: (options: any) => ipcRenderer.invoke('storage:save-export', options),

        // 动态文件加载
        loadDynamicFile: (filePath: string) => ipcRenderer.invoke('storage:load-dynamic-file', filePath),
        watchFile: (filePath: string) => ipcRenderer.invoke('storage:watch-file', filePath),
        unwatchFile: (filePath: string) => ipcRenderer.invoke('storage:unwatch-file', filePath),
    },

    // 对话框相关 API
    dialog: {
        openFile: (options: any) => ipcRenderer.invoke('dialog:open-file', options),
        saveFile: (options: any) => ipcRenderer.invoke('dialog:save-file', options),
    },

    // 日志相关 API
    logs: {
        get: (filter?: any) => ipcRenderer.invoke('logs:get', filter),
        clear: () => ipcRenderer.invoke('logs:clear'),
    },

    // 事件监听
    onLogAdded: (callback: (log: any) => void) => {
        ipcRenderer.on('log:added', (event, log) => callback(log));
    },

    // 新增事件监听
    onMockServersStatusChanged: (callback: (statuses: any) => void) => {
        ipcRenderer.on('mock-servers:status-changed', (event, statuses) => callback(statuses));
    },

    onMockServerStatusChanged: (callback: (status: any) => void) => {
        ipcRenderer.on('mock-server:status-changed', (event, status) => callback(status));
    },

    // 存储相关事件监听
    onStorageSwitched: (callback: (data: any) => void) => {
        ipcRenderer.on('storage:switched', (event, data) => callback(data));
    },

    onConfigLoaded: (callback: (data: any) => void) => {
        ipcRenderer.on('config:loaded', (event, data) => callback(data));
    },

    onConfigSaved: (callback: (data: any) => void) => {
        ipcRenderer.on('config:saved', (event, data) => callback(data));
    },

    onConfigImported: (callback: (data: any) => void) => {
        ipcRenderer.on('config:imported', (event, data) => callback(data));
    },

    onConfigExported: (callback: (data: any) => void) => {
        ipcRenderer.on('config:exported', (event, data) => callback(data));
    },

    onFileChanged: (callback: (data: any) => void) => {
        ipcRenderer.on('storage:file-changed', (event, data) => callback(data));
    },

    // 新增存储相关事件监听
    onStorageLocationChanged: (callback: (location: any) => void) => {
        ipcRenderer.on('storage:location-changed', (event, location) => callback(location));
    },

    onDynamicFileChanged: (callback: (data: any) => void) => {
        ipcRenderer.on('storage:dynamic-file-changed', (event, data) => callback(data));
    },

    // 移除事件监听
    removeAllListeners: (channel: string) => {
        ipcRenderer.removeAllListeners(channel);
    }
};

// 将 API 暴露给渲染进程
contextBridge.exposeInMainWorld('electronAPI', api);

// 类型定义
export type ElectronAPI = typeof api;
