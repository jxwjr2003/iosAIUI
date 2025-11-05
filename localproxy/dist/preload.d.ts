declare const api: {
    mockServer: {
        start: (config: any) => Promise<any>;
        stop: () => Promise<any>;
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
    logs: {
        get: (filter?: any) => Promise<any>;
        clear: () => Promise<any>;
    };
    onLogAdded: (callback: (log: any) => void) => void;
    removeAllListeners: (channel: string) => void;
};
export type ElectronAPI = typeof api;
export {};
//# sourceMappingURL=preload.d.ts.map