"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const electron_1 = require("electron");
// 定义 API 接口
const api = {
    // 模拟服务器相关 API
    mockServer: {
        start: (config) => electron_1.ipcRenderer.invoke('mock-server:start', config),
        stop: () => electron_1.ipcRenderer.invoke('mock-server:stop'),
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
    // 日志相关 API
    logs: {
        get: (filter) => electron_1.ipcRenderer.invoke('logs:get', filter),
        clear: () => electron_1.ipcRenderer.invoke('logs:clear'),
    },
    // 事件监听
    onLogAdded: (callback) => {
        electron_1.ipcRenderer.on('log:added', (event, log) => callback(log));
    },
    // 移除事件监听
    removeAllListeners: (channel) => {
        electron_1.ipcRenderer.removeAllListeners(channel);
    }
};
// 将 API 暴露给渲染进程
electron_1.contextBridge.exposeInMainWorld('electronAPI', api);
//# sourceMappingURL=preload.js.map