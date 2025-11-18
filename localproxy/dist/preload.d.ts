declare const api: {
    mockServer: {
        start: (config: any) => Promise<any>;
        stop: () => Promise<any>;
        startAll: () => Promise<any>;
        stopServer: (configId: string) => Promise<any>;
        getStatuses: () => Promise<any>;
    };
    proxyServer: {
        start: (config: any) => Promise<any>;
        stop: () => Promise<any>;
    };
    config: {
        save: (config: any) => Promise<any>;
        saveMockServer: (config: any) => Promise<any>;
        deleteMockConfig: (id: string) => Promise<any>;
        load: () => Promise<any>;
        list: () => Promise<any>;
        openLocation: () => Promise<any>;
    };
    storage: {
        getCurrentLocation: () => Promise<any>;
        setLocation: (path: string) => Promise<any>;
        migrateData: (newPath: string) => Promise<any>;
        browsePath: () => Promise<any>;
        importConfig: (configData: any) => Promise<any>;
        exportConfig: (options: any) => Promise<any>;
        saveExport: (options: any) => Promise<any>;
        loadDynamicFile: (filePath: string) => Promise<any>;
        watchFile: (filePath: string) => Promise<any>;
        unwatchFile: (filePath: string) => Promise<any>;
    };
    dialog: {
        openFile: (options: any) => Promise<any>;
        saveFile: (options: any) => Promise<any>;
    };
    logs: {
        get: (filter?: any) => Promise<any>;
        clear: () => Promise<any>;
    };
    onLogAdded: (callback: (log: any) => void) => void;
    onMockServersStatusChanged: (callback: (statuses: any) => void) => void;
    onMockServerStatusChanged: (callback: (status: any) => void) => void;
    onStorageSwitched: (callback: (data: any) => void) => void;
    onConfigLoaded: (callback: (data: any) => void) => void;
    onConfigSaved: (callback: (data: any) => void) => void;
    onConfigImported: (callback: (data: any) => void) => void;
    onConfigExported: (callback: (data: any) => void) => void;
    onFileChanged: (callback: (data: any) => void) => void;
    onStorageLocationChanged: (callback: (location: any) => void) => void;
    onDynamicFileChanged: (callback: (data: any) => void) => void;
    removeAllListeners: (channel: string) => void;
};
export type ElectronAPI = typeof api;
export {};
//# sourceMappingURL=preload.d.ts.map