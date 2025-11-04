// 渲染进程 JavaScript
class LocalProxyUI {
    constructor() {
        this.currentMockServer = null;
        this.currentProxyServer = null;
        this.logs = [];
        this.mockConfigs = [];
        this.currentMockConfig = null;

        this.initializeEventListeners();
        this.loadLogs();
        this.loadMockConfigs();
    }

    initializeEventListeners() {
        // 模拟服务器表单提交
        document.getElementById('mockServerForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.startMockServer();
        });

        // 停止模拟服务器
        document.getElementById('stopMockServer').addEventListener('click', () => {
            this.stopMockServer();
        });

        // 代理服务器表单提交
        document.getElementById('proxyServerForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.startProxyServer();
        });

        // 停止代理服务器
        document.getElementById('stopProxyServer').addEventListener('click', () => {
            this.stopProxyServer();
        });

        // 清空日志
        document.getElementById('clearLogs').addEventListener('click', () => {
            this.clearLogs();
        });

        // 日志过滤
        document.getElementById('logLevelFilter').addEventListener('change', () => {
            this.filterLogs();
        });

        document.getElementById('logSourceFilter').addEventListener('input', () => {
            this.filterLogs();
        });

        // 配置管理
        document.getElementById('newMockConfig').addEventListener('click', () => {
            this.createNewMockConfig();
        });

        document.getElementById('saveMockConfig').addEventListener('click', () => {
            this.saveMockConfig();
        });

        // 添加响应头
        document.getElementById('addHeader').addEventListener('click', () => {
            this.addHeaderField();
        });

        // 添加JSON字段
        document.getElementById('addJsonField').addEventListener('click', () => {
            this.addJsonField();
        });

        // 监听实时日志
        if (window.electronAPI) {
            window.electronAPI.onLogAdded((log) => {
                this.addLogToUI(log);
            });
        }
    }

    async loadMockConfigs() {
        try {
            const result = await window.electronAPI.config.list();
            if (result.success) {
                this.mockConfigs = result.configs.mockServers || [];
                this.renderMockConfigList();
            }
        } catch (error) {
            console.error('Failed to load mock configs:', error);
        }
    }

    renderMockConfigList() {
        const configList = document.getElementById('mockConfigList');
        configList.innerHTML = this.mockConfigs.map(config => {
            // 获取第一个路由的HTTP方法和路径
            const route = config.routes && config.routes.length > 0 ? config.routes[0] : null;
            const method = route ? route.method : 'N/A';
            const path = route ? route.path : '无路径';
            const port = config.port || 'N/A';

            return `
            <div class="config-item ${this.currentMockConfig?.id === config.id ? 'active' : ''}" 
                 data-id="${config.id}">
                <div class="config-item-info">
                    <div class="config-item-name">${this.escapeHtml(config.name)}</div>
                    <div class="config-item-description">${this.escapeHtml(config.description || '无描述')}</div>
                    <div class="config-item-details">
                        <span class="config-method ${method.toLowerCase()}">${method}</span>
                        <span class="config-path">${this.escapeHtml(path)}</span>
                        <span class="config-port">:${port}</span>
                    </div>
                </div>
                <div class="config-item-actions">
                    <button class="btn btn-sm btn-primary load-config" data-id="${config.id}">加载</button>
                    <button class="btn btn-sm btn-danger delete-config" data-id="${config.id}">删除</button>
                </div>
            </div>
        `}).join('');

        // 添加加载和删除事件监听
        configList.querySelectorAll('.load-config').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const configId = btn.getAttribute('data-id');
                this.loadMockConfig(configId);
            });
        });

        configList.querySelectorAll('.delete-config').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const configId = btn.getAttribute('data-id');
                this.deleteMockConfig(configId);
            });
        });

        configList.querySelectorAll('.config-item').forEach(item => {
            item.addEventListener('click', () => {
                const configId = item.getAttribute('data-id');
                this.loadMockConfig(configId);
            });
        });
    }

    async loadMockConfig(configId) {
        const config = this.mockConfigs.find(c => c.id === configId);
        if (!config) return;

        this.currentMockConfig = config;
        this.renderMockConfigList();

        // 填充表单
        document.getElementById('mockConfigName').value = config.name;
        document.getElementById('mockConfigDescription').value = config.description || '';
        document.getElementById('mockPort').value = config.port;
        document.getElementById('mockProtocol').value = config.protocol;

        // 加载第一个路由（简化处理）
        if (config.routes && config.routes.length > 0) {
            const route = config.routes[0];
            document.getElementById('routeMethod').value = route.method;
            document.getElementById('routePath').value = route.path;
            document.getElementById('routeStatusCode').value = route.statusCode;
            document.getElementById('routeDescription').value = route.description || '';

            // 加载响应头
            this.loadHeaders(route.headers);

            // 加载JSON body
            this.loadJsonFields(route.body);
        }

        document.getElementById('saveMockConfig').disabled = false;
    }

    loadHeaders(headers) {
        const headersList = document.getElementById('headersList');
        headersList.innerHTML = '';

        Object.entries(headers).forEach(([key, value]) => {
            this.addHeaderField(key, value);
        });

        // 确保至少有一个默认头
        if (Object.keys(headers).length === 0) {
            this.addHeaderField('Content-Type', 'application/json');
        }
    }

    loadJsonFields(body) {
        const jsonFields = document.getElementById('jsonFields');
        jsonFields.innerHTML = '';

        if (body && typeof body === 'object') {
            Object.entries(body).forEach(([key, value]) => {
                const type = this.determineValueType(value);
                this.addJsonField(key, type, value);
            });
        }

        // 确保至少有一个默认字段
        if (!body || Object.keys(body).length === 0) {
            this.addJsonField('message', 'string', 'Hello World');
        }
    }

    determineValueType(value) {
        if (typeof value === 'string') return 'string';
        if (typeof value === 'number') return 'number';
        if (typeof value === 'boolean') return 'boolean';
        if (Array.isArray(value)) return 'array';
        if (typeof value === 'object') return 'object';
        return 'string';
    }

    createNewMockConfig() {
        this.currentMockConfig = null;
        this.renderMockConfigList();

        // 重置表单
        document.getElementById('mockServerForm').reset();
        document.getElementById('mockConfigName').value = '';
        document.getElementById('mockConfigDescription').value = '';
        document.getElementById('mockPort').value = '3000';
        document.getElementById('mockProtocol').value = 'http';
        document.getElementById('routeMethod').value = 'GET';
        document.getElementById('routePath').value = '/api/test';
        document.getElementById('routeStatusCode').value = '200';
        document.getElementById('routeDescription').value = '';

        // 重置响应头和JSON字段
        this.loadHeaders({});
        this.loadJsonFields({});

        document.getElementById('saveMockConfig').disabled = false;
    }

    async saveMockConfig() {
        const config = this.buildMockConfig();
        if (!config) return;

        try {
            const result = await window.electronAPI.config.saveMockServer(config);
            if (result.success) {
                this.showMessage('配置保存成功', 'success');
                await this.loadMockConfigs();
            } else {
                this.showMessage(`配置保存失败: ${result.error}`, 'error');
            }
        } catch (error) {
            this.showMessage(`配置保存失败: ${error}`, 'error');
        }
    }

    async deleteMockConfig(configId) {
        if (!confirm('确定要删除这个配置吗？')) return;

        try {
            const result = await window.electronAPI.config.deleteMockConfig(configId);
            if (result.success) {
                this.showMessage('配置删除成功', 'success');
                if (this.currentMockConfig?.id === configId) {
                    this.createNewMockConfig();
                }
                await this.loadMockConfigs();
            } else {
                this.showMessage(`配置删除失败: ${result.error}`, 'error');
            }
        } catch (error) {
            this.showMessage(`配置删除失败: ${error}`, 'error');
        }
    }

    addHeaderField(key = '', value = '') {
        const headersList = document.getElementById('headersList');
        const headerItem = document.createElement('div');
        headerItem.className = 'key-value-item';
        headerItem.innerHTML = `
            <input type="text" class="header-key" placeholder="Header Key" value="${this.escapeHtml(key)}">
            <input type="text" class="header-value" placeholder="Header Value" value="${this.escapeHtml(value)}">
            <button type="button" class="btn btn-danger remove-header">删除</button>
        `;
        headersList.appendChild(headerItem);

        headerItem.querySelector('.remove-header').addEventListener('click', () => {
            headerItem.remove();
        });
    }

    addJsonField(key = '', type = 'string', value = '') {
        const jsonFields = document.getElementById('jsonFields');
        const jsonItem = document.createElement('div');
        jsonItem.className = 'key-value-item';
        jsonItem.innerHTML = `
            <input type="text" class="json-key" placeholder="Key" value="${this.escapeHtml(key)}">
            <select class="json-type">
                <option value="string" ${type === 'string' ? 'selected' : ''}>字符串</option>
                <option value="number" ${type === 'number' ? 'selected' : ''}>数字</option>
                <option value="boolean" ${type === 'boolean' ? 'selected' : ''}>布尔值</option>
                <option value="object" ${type === 'object' ? 'selected' : ''}>对象</option>
                <option value="array" ${type === 'array' ? 'selected' : ''}>数组</option>
            </select>
            <input type="text" class="json-value" placeholder="Value" value="${this.escapeHtml(this.formatJsonValue(value, type))}">
            <button type="button" class="btn btn-danger remove-json-field">删除</button>
        `;
        jsonFields.appendChild(jsonItem);

        jsonItem.querySelector('.remove-json-field').addEventListener('click', () => {
            jsonItem.remove();
        });
    }

    formatJsonValue(value, type) {
        if (type === 'boolean') {
            return value.toString();
        }
        if (type === 'object' || type === 'array') {
            return JSON.stringify(value, null, 2);
        }
        return value;
    }

    buildMockConfig() {
        const name = document.getElementById('mockConfigName').value.trim();
        const description = document.getElementById('mockConfigDescription').value.trim();
        const port = parseInt(document.getElementById('mockPort').value);
        const protocol = document.getElementById('mockProtocol').value;

        if (!name || !port) {
            this.showMessage('请填写配置名称和端口号', 'error');
            return null;
        }

        const route = this.buildRouteConfig();
        if (!route) return null;

        return {
            id: this.currentMockConfig?.id || `mock_${Date.now()}`,
            name,
            description,
            port,
            protocol,
            routes: [route],
            createdAt: this.currentMockConfig?.createdAt || new Date(),
            updatedAt: new Date()
        };
    }

    buildRouteConfig() {
        const method = document.getElementById('routeMethod').value;
        const path = document.getElementById('routePath').value.trim();
        const statusCode = parseInt(document.getElementById('routeStatusCode').value);
        const description = document.getElementById('routeDescription').value.trim();

        if (!path) {
            this.showMessage('请填写API路径', 'error');
            return null;
        }

        // 构建响应头
        const headers = {};
        document.querySelectorAll('#headersList .key-value-item').forEach(item => {
            const key = item.querySelector('.header-key').value.trim();
            const value = item.querySelector('.header-value').value.trim();
            if (key && value) {
                headers[key] = value;
            }
        });

        // 构建JSON body
        const body = {};
        document.querySelectorAll('#jsonFields .key-value-item').forEach(item => {
            const key = item.querySelector('.json-key').value.trim();
            const type = item.querySelector('.json-type').value;
            const value = item.querySelector('.json-value').value.trim();

            if (key && value) {
                body[key] = this.parseJsonValue(value, type);
            }
        });

        return {
            id: `route_${Date.now()}`,
            method,
            path,
            statusCode,
            headers,
            body,
            description
        };
    }

    parseJsonValue(value, type) {
        try {
            switch (type) {
                case 'number':
                    return Number(value);
                case 'boolean':
                    return value.toLowerCase() === 'true';
                case 'object':
                case 'array':
                    return JSON.parse(value);
                default:
                    return value;
            }
        } catch (error) {
            return value; // 解析失败时返回原始字符串
        }
    }

    async startMockServer() {
        const config = this.buildMockConfig();
        if (!config) return;

        try {
            const result = await window.electronAPI.mockServer.start(config);
            if (result.success) {
                this.currentMockServer = config;
                this.updateMockServerUI(true);
                this.showMessage('模拟服务器启动成功', 'success');
            } else {
                this.showMessage(`模拟服务器启动失败: ${result.error}`, 'error');
            }
        } catch (error) {
            this.showMessage(`模拟服务器启动失败: ${error}`, 'error');
        }
    }

    async stopMockServer() {
        try {
            const result = await window.electronAPI.mockServer.stop();
            if (result.success) {
                this.currentMockServer = null;
                this.updateMockServerUI(false);
                this.showMessage('模拟服务器已停止', 'info');
            } else {
                this.showMessage(`停止模拟服务器失败: ${result.error}`, 'error');
            }
        } catch (error) {
            this.showMessage(`停止模拟服务器失败: ${error}`, 'error');
        }
    }

    async startProxyServer() {
        const form = document.getElementById('proxyServerForm');
        const formData = new FormData(form);

        const config = {
            id: `proxy_${Date.now()}`,
            name: formData.get('name'),
            port: parseInt(formData.get('port')),
            protocol: formData.get('protocol'),
            target: formData.get('target')
        };

        try {
            const result = await window.electronAPI.proxyServer.start(config);
            if (result.success) {
                this.currentProxyServer = config;
                this.updateProxyServerUI(true);
                this.showMessage('代理服务器启动成功', 'success');
            } else {
                this.showMessage(`代理服务器启动失败: ${result.error}`, 'error');
            }
        } catch (error) {
            this.showMessage(`代理服务器启动失败: ${error}`, 'error');
        }
    }

    async stopProxyServer() {
        try {
            const result = await window.electronAPI.proxyServer.stop();
            if (result.success) {
                this.currentProxyServer = null;
                this.updateProxyServerUI(false);
                this.showMessage('代理服务器已停止', 'info');
            } else {
                this.showMessage(`停止代理服务器失败: ${result.error}`, 'error');
            }
        } catch (error) {
            this.showMessage(`停止代理服务器失败: ${error}`, 'error');
        }
    }

    updateMockServerUI(isRunning) {
        const startBtn = document.querySelector('#mockServerForm button[type="submit"]');
        const stopBtn = document.getElementById('stopMockServer');

        if (isRunning) {
            startBtn.disabled = true;
            stopBtn.disabled = false;
            startBtn.textContent = '运行中...';
        } else {
            startBtn.disabled = false;
            stopBtn.disabled = true;
            startBtn.textContent = '启动模拟服务器';
        }
    }

    updateProxyServerUI(isRunning) {
        const startBtn = document.querySelector('#proxyServerForm button[type="submit"]');
        const stopBtn = document.getElementById('stopProxyServer');

        if (isRunning) {
            startBtn.disabled = true;
            stopBtn.disabled = false;
            startBtn.textContent = '运行中...';
        } else {
            startBtn.disabled = false;
            stopBtn.disabled = true;
            startBtn.textContent = '启动代理服务器';
        }
    }

    async loadLogs() {
        try {
            const result = await window.electronAPI.logs.get();
            if (result.success) {
                this.logs = result.logs;
                this.renderLogs();
            }
        } catch (error) {
            console.error('Failed to load logs:', error);
        }
    }

    async clearLogs() {
        try {
            const result = await window.electronAPI.logs.clear();
            if (result.success) {
                this.logs = [];
                this.renderLogs();
                this.showMessage('日志已清空', 'info');
            }
        } catch (error) {
            this.showMessage(`清空日志失败: ${error}`, 'error');
        }
    }

    addLogToUI(log) {
        this.logs.push(log);
        if (this.logs.length > 1000) {
            this.logs = this.logs.slice(-1000);
        }
        this.renderLogs();
    }

    renderLogs() {
        const logsList = document.getElementById('logsList');
        const levelFilter = document.getElementById('logLevelFilter').value;
        const sourceFilter = document.getElementById('logSourceFilter').value.toLowerCase();

        let filteredLogs = this.logs;

        if (levelFilter !== 'all') {
            filteredLogs = filteredLogs.filter(log => log.type === levelFilter);
        }

        if (sourceFilter) {
            filteredLogs = filteredLogs.filter(log =>
                log.source.toLowerCase().includes(sourceFilter)
            );
        }

        logsList.innerHTML = filteredLogs.map(log => {
            let detailsHtml = '';

            // 如果有详细数据，显示可展开的详细信息
            if (log.data) {
                const dataType = log.data.type || 'info';
                detailsHtml = `
                    <div class="log-details" style="display: none;">
                        <div class="log-details-content">
                            <pre>${this.escapeHtml(JSON.stringify(log.data, null, 2))}</pre>
                        </div>
                    </div>
                `;
            }

            return `
                <div class="log-entry log-type-${log.type} ${log.data ? 'has-details' : ''}">
                    <div class="log-header" ${log.data ? 'style="cursor: pointer;"' : ''}>
                        <div class="log-timestamp">${this.formatTimestamp(log.timestamp)}</div>
                        <div class="log-source">${log.source}</div>
                        <div class="log-message">${this.escapeHtml(log.message)}</div>
                        ${log.data ? '<div class="log-toggle">▼</div>' : ''}
                    </div>
                    ${detailsHtml}
                </div>
            `;
        }).join('');

        // 添加点击事件来展开/收起详细信息
        logsList.querySelectorAll('.log-header').forEach(header => {
            header.addEventListener('click', () => {
                const logEntry = header.parentElement;
                const details = logEntry.querySelector('.log-details');
                const toggle = logEntry.querySelector('.log-toggle');

                if (details && toggle) {
                    if (details.style.display === 'none') {
                        details.style.display = 'block';
                        toggle.textContent = '▲';
                    } else {
                        details.style.display = 'none';
                        toggle.textContent = '▼';
                    }
                }
            });
        });

        // 自动滚动到底部
        logsList.scrollTop = logsList.scrollHeight;
    }

    filterLogs() {
        this.renderLogs();
    }

    formatTimestamp(timestamp) {
        const date = new Date(timestamp);
        return date.toLocaleTimeString('zh-CN', {
            hour12: false,
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        });
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    showMessage(message, type = 'info') {
        // 简单的消息提示实现
        console.log(`[${type.toUpperCase()}] ${message}`);

        // 在实际应用中，这里可以添加更美观的 toast 通知
        const existingMessage = document.querySelector('.message-toast');
        if (existingMessage) {
            existingMessage.remove();
        }

        const toast = document.createElement('div');
        toast.className = `message-toast message-${type}`;
        toast.textContent = message;
        toast.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 12px 20px;
            border-radius: 4px;
            color: white;
            font-weight: 500;
            z-index: 1000;
            opacity: 0;
            transition: opacity 0.3s ease;
            ${type === 'error' ? 'background: #dc3545;' : ''}
            ${type === 'success' ? 'background: #28a745;' : ''}
            ${type === 'info' ? 'background: #17a2b8;' : ''}
        `;

        document.body.appendChild(toast);

        // 显示动画
        setTimeout(() => {
            toast.style.opacity = '1';
        }, 10);

        // 3秒后自动消失
        setTimeout(() => {
            toast.style.opacity = '0';
            setTimeout(() => {
                if (toast.parentNode) {
                    toast.parentNode.removeChild(toast);
                }
            }, 300);
        }, 3000);
    }
}

// 当页面加载完成后初始化应用
document.addEventListener('DOMContentLoaded', () => {
    new LocalProxyUI();
});
