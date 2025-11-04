import { contextBridge, ipcRenderer } from 'electron';

// 定义 API 接口
const api = {
    // 模拟服务器相关 API
    mockServer: {
        start: (config: any) => ipcRenderer.invoke('mock-server:start', config),
        stop: () => ipcRenderer.invoke('mock-server:stop'),
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

    // 移除事件监听
    removeAllListeners: (channel: string) => {
        ipcRenderer.removeAllListeners(channel);
    }
};

// 将 API 暴露给渲染进程
contextBridge.exposeInMainWorld('electronAPI', api);

// 类型定义
export type ElectronAPI = typeof api;
