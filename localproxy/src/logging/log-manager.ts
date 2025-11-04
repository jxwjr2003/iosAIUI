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

export class LogManager extends EventEmitter {
    private logs: LogEntry[] = [];
    private maxLogEntries: number = 1000;

    constructor() {
        super();
    }

    public addLog(source: string, type: LogEntry['type'], message: string, data?: any): void {
        const log: LogEntry = {
            id: `log_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            timestamp: new Date(),
            type,
            source,
            message,
            data
        };

        this.logs.push(log);

        // 限制日志数量
        if (this.logs.length > this.maxLogEntries) {
            this.logs = this.logs.slice(-this.maxLogEntries);
        }

        this.emit('logAdded', log);
    }

    public getLogs(filter?: LogFilter): LogEntry[] {
        let filteredLogs = this.logs;

        if (filter) {
            if (filter.type) {
                filteredLogs = filteredLogs.filter(log => log.type === filter.type);
            }
            if (filter.source) {
                filteredLogs = filteredLogs.filter(log => log.source.includes(filter.source!));
            }
            if (filter.message) {
                filteredLogs = filteredLogs.filter(log => log.message.includes(filter.message!));
            }
            if (filter.startTime) {
                filteredLogs = filteredLogs.filter(log => log.timestamp >= filter.startTime!);
            }
            if (filter.endTime) {
                filteredLogs = filteredLogs.filter(log => log.timestamp <= filter.endTime!);
            }
        }

        return filteredLogs;
    }

    public clearLogs(): void {
        this.logs = [];
        this.emit('logsCleared');
    }

    public setMaxLogEntries(max: number): void {
        this.maxLogEntries = max;
        // 如果当前日志数量超过最大值，则截断
        if (this.logs.length > this.maxLogEntries) {
            this.logs = this.logs.slice(-this.maxLogEntries);
        }
    }

    public onLogAdded(callback: (log: LogEntry) => void): void {
        this.on('logAdded', callback);
    }

    public onLogsCleared(callback: () => void): void {
        this.on('logsCleared', callback);
    }
}
