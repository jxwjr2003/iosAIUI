"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const electron_1 = require("electron");
// 定义 API 接口
const api = {
    // 模拟服务器相关 API
    mockServer: {
        start: (config) => electron_1.ipcRenderer.invoke('mock-server:start', config),
        stop: () => electron_1.ipcRenderer.invoke('mock-server:stop'),
        startAll: () => electron_1.ipcRenderer.invoke('mock-server:start-all'),
        stopServer: (configId) => electron_1.ipcRenderer.invoke('mock-server:stop-server', configId),
        getStatuses: () => electron_1.ipcRenderer.invoke('mock-server:get-statuses'),
    },
    // 代理服务器相关 API
    proxyServer: {
        start: (config) => electron_1.ipcRenderer.invoke('proxy-server:start', config),
        stop: () => electron_1.ipcRenderer.invoke('proxy-server:stop'),
    },
    // 配置管理相关 API
    config: {
        save: (config) => electron_1.ipcRenderer.invoke('config:save', config),
        saveMockServer: (config) => electron_1.ipcRenderer.invoke('config:saveMockServer', config),
        deleteMockConfig: (id) => electron_1.ipcRenderer.invoke('config:deleteMockConfig', id),
        load: () => electron_1.ipcRenderer.invoke('config:load'),
        list: () => electron_1.ipcRenderer.invoke('config:list'),
        openLocation: () => electron_1.ipcRenderer.invoke('config:openLocation'),
    },
    // 存储管理相关 API
    storage: {
        // 存储位置管理
        getCurrentLocation: () => electron_1.ipcRenderer.invoke('storage:get-current-location'),
        setLocation: (path) => electron_1.ipcRenderer.invoke('storage:set-location', path),
        migrateData: (newPath) => electron_1.ipcRenderer.invoke('storage:migrate-data', newPath),
        browsePath: () => electron_1.ipcRenderer.invoke('storage:browse-path'),
        // 配置导入导出
        importConfig: (configData) => electron_1.ipcRenderer.invoke('storage:import-config', configData),
        exportConfig: (options) => electron_1.ipcRenderer.invoke('storage:export-config', options),
        saveExport: (options) => electron_1.ipcRenderer.invoke('storage:save-export', options),
        // 动态文件加载
        loadDynamicFile: (filePath) => electron_1.ipcRenderer.invoke('storage:load-dynamic-file', filePath),
        watchFile: (filePath) => electron_1.ipcRenderer.invoke('storage:watch-file', filePath),
        unwatchFile: (filePath) => electron_1.ipcRenderer.invoke('storage:unwatch-file', filePath),
    },
    // 对话框相关 API
    dialog: {
        openFile: (options) => electron_1.ipcRenderer.invoke('dialog:open-file', options),
        saveFile: (options) => electron_1.ipcRenderer.invoke('dialog:save-file', options),
    },
    // 日志相关 API
    logs: {
        get: (filter) => electron_1.ipcRenderer.invoke('logs:get', filter),
        clear: () => electron_1.ipcRenderer.invoke('logs:clear'),
    },
    // 事件监听
    onLogAdded: (callback) => {
        electron_1.ipcRenderer.on('log:added', (event, log) => callback(log));
    },
    // 新增事件监听
    onMockServersStatusChanged: (callback) => {
        electron_1.ipcRenderer.on('mock-servers:status-changed', (event, statuses) => callback(statuses));
    },
    onMockServerStatusChanged: (callback) => {
        electron_1.ipcRenderer.on('mock-server:status-changed', (event, status) => callback(status));
    },
    // 存储相关事件监听
    onStorageSwitched: (callback) => {
        electron_1.ipcRenderer.on('storage:switched', (event, data) => callback(data));
    },
    onConfigLoaded: (callback) => {
        electron_1.ipcRenderer.on('config:loaded', (event, data) => callback(data));
    },
    onConfigSaved: (callback) => {
        electron_1.ipcRenderer.on('config:saved', (event, data) => callback(data));
    },
    onConfigImported: (callback) => {
        electron_1.ipcRenderer.on('config:imported', (event, data) => callback(data));
    },
    onConfigExported: (callback) => {
        electron_1.ipcRenderer.on('config:exported', (event, data) => callback(data));
    },
    onFileChanged: (callback) => {
        electron_1.ipcRenderer.on('storage:file-changed', (event, data) => callback(data));
    },
    // 新增存储相关事件监听
    onStorageLocationChanged: (callback) => {
        electron_1.ipcRenderer.on('storage:location-changed', (event, location) => callback(location));
    },
    onDynamicFileChanged: (callback) => {
        electron_1.ipcRenderer.on('storage:dynamic-file-changed', (event, data) => callback(data));
    },
    // 移除事件监听
    removeAllListeners: (channel) => {
        electron_1.ipcRenderer.removeAllListeners(channel);
    }
};
// 将 API 暴露给渲染进程
electron_1.contextBridge.exposeInMainWorld('electronAPI', api);
