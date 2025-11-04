const { contextBridge, ipcRenderer } = require('electron');

// 通过 contextBridge 向渲染进程暴露受保护的 API
contextBridge.exposeInMainWorld('electronAPI', {
    // AI 聊天相关 API
    aiChat: (message, context) => ipcRenderer.invoke('ai-chat', message, context),
    aiConfig: (config) => ipcRenderer.invoke('ai-config', config),
    healthCheck: () => ipcRenderer.invoke('health-check'),
    aiTest: () => ipcRenderer.invoke('ai-test'),
    aiModels: () => ipcRenderer.invoke('ai-models'),

    // 文件操作 API
    openFile: () => ipcRenderer.invoke('dialog:openFile'),
    saveFile: (data) => ipcRenderer.invoke('dialog:saveFile', data),

    // 应用生命周期
    onAppClose: (callback) => ipcRenderer.on('app-close', callback),
    removeAllListeners: (channel) => ipcRenderer.removeAllListeners(channel)
});
