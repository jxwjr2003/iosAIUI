"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LogManager = void 0;
const events_1 = require("events");
class LogManager extends events_1.EventEmitter {
    constructor() {
        super();
        this.logs = [];
        this.maxLogEntries = 1000;
    }
    addLog(source, type, message, data) {
        const log = {
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
    getLogs(filter) {
        let filteredLogs = this.logs;
        if (filter) {
            if (filter.type) {
                filteredLogs = filteredLogs.filter(log => log.type === filter.type);
            }
            if (filter.source) {
                filteredLogs = filteredLogs.filter(log => log.source.includes(filter.source));
            }
            if (filter.message) {
                filteredLogs = filteredLogs.filter(log => log.message.includes(filter.message));
            }
            if (filter.startTime) {
                filteredLogs = filteredLogs.filter(log => log.timestamp >= filter.startTime);
            }
            if (filter.endTime) {
                filteredLogs = filteredLogs.filter(log => log.timestamp <= filter.endTime);
            }
        }
        return filteredLogs;
    }
    clearLogs() {
        this.logs = [];
        this.emit('logsCleared');
    }
    setMaxLogEntries(max) {
        this.maxLogEntries = max;
        // 如果当前日志数量超过最大值，则截断
        if (this.logs.length > this.maxLogEntries) {
            this.logs = this.logs.slice(-this.maxLogEntries);
        }
    }
    onLogAdded(callback) {
        this.on('logAdded', callback);
    }
    onLogsCleared(callback) {
        this.on('logsCleared', callback);
    }
}
exports.LogManager = LogManager;
//# sourceMappingURL=log-manager.js.map