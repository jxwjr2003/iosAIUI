import { EventEmitter } from 'events';
export interface LogEntry {
    id: string;
    timestamp: Date;
    type: 'info' | 'error' | 'warn' | 'debug';
    source: string;
    message: string;
    data?: any;
}
export interface LogFilter {
    type?: LogEntry['type'];
    source?: string;
    message?: string;
    startTime?: Date;
    endTime?: Date;
}
export declare class LogManager extends EventEmitter {
    private logs;
    private maxLogEntries;
    constructor();
    addLog(source: string, type: LogEntry['type'], message: string, data?: any): void;
    getLogs(filter?: LogFilter): LogEntry[];
    clearLogs(): void;
    setMaxLogEntries(max: number): void;
    onLogAdded(callback: (log: LogEntry) => void): void;
    onLogsCleared(callback: () => void): void;
}
//# sourceMappingURL=log-manager.d.ts.map