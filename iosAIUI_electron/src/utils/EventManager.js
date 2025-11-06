/**
 * 事件管理器 - 用于组件间通信和依赖管理
 * 解决组件初始化时序问题和硬编码依赖问题
 */
class EventManager {
    constructor() {
        this.listeners = new Map();
        this.eventHistory = [];
        this.maxHistorySize = 100;
    }

    /**
     * 订阅事件
     * @param {string} event - 事件名称
     * @param {Function} callback - 回调函数
     * @param {Object} options - 选项
     */
    on(event, callback, options = {}) {
        if (!this.listeners.has(event)) {
            this.listeners.set(event, []);
        }

        const listener = {
            callback,
            once: options.once || false,
            id: this.generateListenerId()
        };

        this.listeners.get(event).push(listener);
        return listener.id;
    }

    /**
     * 一次性订阅事件
     * @param {string} event - 事件名称
     * @param {Function} callback - 回调函数
     */
    once(event, callback) {
        return this.on(event, callback, { once: true });
    }

    /**
     * 发布事件
     * @param {string} event - 事件名称
     * @param {*} data - 事件数据
     */
    emit(event, data) {
        // 记录事件历史
        this.recordEvent(event, data);

        // 通知监听器
        if (this.listeners.has(event)) {
            const listeners = this.listeners.get(event);
            const remainingListeners = [];

            listeners.forEach(listener => {
                try {
                    listener.callback(data);
                    // 如果不是一次性监听器，保留
                    if (!listener.once) {
                        remainingListeners.push(listener);
                    }
                } catch (error) {
                    console.error(`事件处理错误 [${event}]:`, error);
                    // 即使出错也保留监听器，除非是一次性的
                    if (!listener.once) {
                        remainingListeners.push(listener);
                    }
                }
            });

            this.listeners.set(event, remainingListeners);
        }

        console.log(`📢 [EventManager] 事件发布: ${event}`, {
            '数据': data,
            '监听器数量': this.listeners.get(event)?.length || 0,
            '时间戳': new Date().toISOString()
        });
    }

    /**
     * 取消订阅事件
     * @param {string} event - 事件名称
     * @param {string} listenerId - 监听器ID
     */
    off(event, listenerId) {
        if (this.listeners.has(event)) {
            const listeners = this.listeners.get(event);
            const filteredListeners = listeners.filter(listener => listener.id !== listenerId);
            this.listeners.set(event, filteredListeners);
        }
    }

    /**
     * 记录事件历史
     * @param {string} event - 事件名称
     * @param {*} data - 事件数据
     */
    recordEvent(event, data) {
        this.eventHistory.push({
            event,
            data,
            timestamp: new Date().toISOString()
        });

        // 限制历史记录大小
        if (this.eventHistory.length > this.maxHistorySize) {
            this.eventHistory.shift();
        }
    }

    /**
     * 生成监听器ID
     * @returns {string} 唯一的监听器ID
     */
    generateListenerId() {
        return `listener_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    /**
     * 获取事件历史
     * @returns {Array} 事件历史记录
     */
    getEventHistory() {
        return [...this.eventHistory];
    }

    /**
     * 清空事件历史
     */
    clearEventHistory() {
        this.eventHistory = [];
    }

    /**
     * 获取监听器统计信息
     * @returns {Object} 监听器统计信息
     */
    getListenerStats() {
        const stats = {};
        for (const [event, listeners] of this.listeners.entries()) {
            stats[event] = listeners.length;
        }
        return stats;
    }

    /**
     * 销毁事件管理器
     */
    destroy() {
        this.listeners.clear();
        this.eventHistory = [];
        console.log('🧹 [EventManager] 事件管理器已销毁');
    }
}

// 创建全局事件管理器实例
let eventManager = new EventManager();

// 导出事件管理器
window.eventManager = eventManager;

// 导出类（用于模块化环境）
if (typeof module !== 'undefined' && module.exports) {
    module.exports = EventManager;
}
