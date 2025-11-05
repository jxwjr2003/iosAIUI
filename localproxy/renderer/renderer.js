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

        // 打开文件保存位置
        document.getElementById('openConfigLocation').addEventListener('click', () => {
            this.openConfigLocation();
        });

        // 添加响应头
        document.getElementById('addHeader').addEventListener('click', () => {
            this.addHeaderField();
        });

        // JSON实时编辑 - 移除确认/编辑按钮的监听器
        // 现在JSON文本区域始终可编辑

        // Tab切换
        document.querySelectorAll('.tab-button').forEach(button => {
            button.addEventListener('click', (e) => {
                const tab = e.target.getAttribute('data-tab');
                this.switchTab(tab);
            });
        });

        // 实时表单验证
        this.setupFormValidation();

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
            const isDefault = route?.isDefault || false;

            return `
            <div class="config-item ${this.currentMockConfig?.id === config.id ? 'active' : ''}" 
                 data-id="${config.id}">
                <div class="config-item-info">
                    <div class="config-item-name">
                        ${this.escapeHtml(config.name)}
                        ${isDefault ? '<span class="default-badge">默认</span>' : ''}
                    </div>
                    <div class="config-item-description">${this.escapeHtml(config.description || '无描述')}</div>
                    <div class="config-item-details">
                        <span class="config-method ${method.toLowerCase()}">${method}</span>
                        <span class="config-path">${this.escapeHtml(path)}</span>
                        <span class="config-port">:${port}</span>
                    </div>
                </div>
                <div class="config-item-actions">
                    <button class="btn btn-sm btn-primary load-config" data-id="${config.id}">加载</button>
                    ${isDefault ? `<button class="btn btn-sm btn-secondary unset-default" data-id="${config.id}">取消默认</button>` : `<button class="btn btn-sm btn-warning set-default" data-id="${config.id}">设为默认</button>`}
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

        configList.querySelectorAll('.set-default').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const configId = btn.getAttribute('data-id');
                this.setAsDefaultConfig(configId);
            });
        });

        configList.querySelectorAll('.unset-default').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const configId = btn.getAttribute('data-id');
                this.unsetDefaultConfig(configId);
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

            // 设置默认配置复选框
            document.getElementById('setAsDefault').checked = route.isDefault || false;

            // 加载响应头
            this.loadHeaders(route.headers);

            // 加载JSON body到文本区域
            const jsonBody = document.getElementById('jsonBody');
            if (route.body && typeof route.body === 'object') {
                jsonBody.value = JSON.stringify(route.body, null, 2);
            } else {
                jsonBody.value = '';
            }
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

        // 重置响应头
        this.loadHeaders({});

        // 重置JSON文本区域
        const jsonBody = document.getElementById('jsonBody');
        jsonBody.value = '';
        jsonBody.disabled = false;

        // 重置按钮状态
        document.getElementById('confirmJson').disabled = false;
        document.getElementById('editJson').disabled = true;

        document.getElementById('saveMockConfig').disabled = false;
    }

    async saveMockConfig() {
        const config = this.buildMockConfig();
        if (!config) return;

        try {
            const result = await window.electronAPI.config.saveMockServer(config);
            if (result.success) {
                this.showMessage(result.message || '配置保存成功', 'success');
                await this.loadMockConfigs();
                this.currentMockConfig = config;
                this.renderMockConfigList();
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

    async setAsDefaultConfig(configId) {
        const config = this.mockConfigs.find(c => c.id === configId);
        if (!config) return;

        // 获取当前配置的路由（假设第一个路由）
        const currentRoute = config.routes[0];
        if (!currentRoute) return;

        const currentPort = config.port;
        const currentMethod = currentRoute.method;
        const currentPath = currentRoute.path;

        try {
            // 更新所有配置中具有相同端口、方法和路径的路由的默认标记
            const updatedConfigs = this.mockConfigs.map(c => {
                // 对于每个配置，我们只关心第一个路由
                const route = c.routes[0];
                if (!route) return c;

                // 如果端口、方法和路径与当前配置相同
                if (c.port === currentPort && route.method === currentMethod && route.path === currentPath) {
                    // 如果是当前配置，设置为默认，否则取消默认
                    return {
                        ...c,
                        routes: [{
                            ...route,
                            isDefault: c.id === configId
                        }]
                    };
                } else {
                    // 对于其他端口或路径，保持原样
                    return c;
                }
            });

            // 批量保存所有配置
            for (const config of updatedConfigs) {
                await window.electronAPI.config.saveMockServer(config);
            }

            this.showMessage('已设为默认配置', 'success');
            await this.loadMockConfigs();
        } catch (error) {
            this.showMessage(`设置默认配置失败: ${error}`, 'error');
        }
    }

    async unsetDefaultConfig(configId) {
        const config = this.mockConfigs.find(c => c.id === configId);
        if (!config) return;

        try {
            // 只取消当前配置的默认标记
            const updatedConfig = {
                ...config,
                routes: config.routes.map(route => ({
                    ...route,
                    isDefault: false
                }))
            };

            await window.electronAPI.config.saveMockServer(updatedConfig);
            this.showMessage('已取消默认配置', 'success');
            await this.loadMockConfigs();
        } catch (error) {
            this.showMessage(`取消默认配置失败: ${error}`, 'error');
        }
    }

    async openConfigLocation() {
        try {
            const result = await window.electronAPI.config.openLocation();
            if (result.success) {
                this.showMessage(`配置文件位置已打开: ${result.path}`, 'success');
            } else {
                this.showMessage(`打开文件位置失败: ${result.error}`, 'error');
            }
        } catch (error) {
            this.showMessage(`打开文件位置失败: ${error}`, 'error');
        }
    }

    // JSON文本区域自适应高度
    setupJsonAutoResize() {
        const jsonBody = document.getElementById('jsonBody');
        if (!jsonBody) return;

        // 初始调整高度
        this.adjustTextareaHeight(jsonBody);

        // 监听输入变化
        jsonBody.addEventListener('input', () => {
            this.adjustTextareaHeight(jsonBody);
            // 实时验证JSON格式
            this.validateJsonFormat(jsonBody);
        });

        // 监听窗口大小变化
        window.addEventListener('resize', () => {
            this.adjustTextareaHeight(jsonBody);
        });
    }

    adjustTextareaHeight(textarea) {
        // 重置高度以获取正确的scrollHeight
        textarea.style.height = 'auto';

        // 计算新高度，基于可用空间和内容
        const availableHeight = window.innerHeight * 0.7; // 最大高度为视口的70%
        const newHeight = Math.min(Math.max(textarea.scrollHeight, 200), availableHeight);
        textarea.style.height = newHeight + 'px';
    }

    validateJsonFormat(textarea) {
        // 清除之前的高亮
        textarea.classList.remove('field-error');

        // 如果JSON不为空，验证格式
        if (textarea.value.trim()) {
            try {
                JSON.parse(textarea.value);
                // JSON格式正确，移除错误高亮
                textarea.classList.remove('field-error');
            } catch (error) {
                // JSON格式错误，添加错误高亮
                textarea.classList.add('field-error');
            }
        } else {
            // JSON为空，移除错误高亮
            textarea.classList.remove('field-error');
        }
    }

    switchTab(tab) {
        // 更新tab按钮状态
        document.querySelectorAll('.tab-button').forEach(button => {
            button.classList.remove('active');
        });
        document.querySelector(`.tab-button[data-tab="${tab}"]`).classList.add('active');

        // 更新tab内容
        document.querySelectorAll('.tab-pane').forEach(pane => {
            pane.classList.remove('active');
        });
        document.getElementById(`${tab}-tab`).classList.add('active');
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


    buildMockConfig() {
        const name = document.getElementById('mockConfigName').value.trim();
        const description = document.getElementById('mockConfigDescription').value.trim();
        const portInput = document.getElementById('mockPort').value;
        const protocol = document.getElementById('mockProtocol').value;

        // 验证必填字段
        if (!name) {
            this.showMessage('请填写配置名称', 'error');
            this.highlightField('mockConfigName');
            return null;
        }

        if (!portInput) {
            this.showMessage('请填写端口号', 'error');
            this.highlightField('mockPort');
            return null;
        }

        const port = parseInt(portInput);
        if (isNaN(port) || port < 1 || port > 65535) {
            this.showMessage('端口号必须在1-65535之间', 'error');
            this.highlightField('mockPort');
            return null;
        }

        // 构建多个路由
        const routes = this.buildRoutesConfig();
        if (!routes || routes.length === 0) return null;

        return {
            id: this.currentMockConfig?.id || `mock_${Date.now()}`,
            name,
            description,
            port,
            protocol,
            routes: routes,
            createdAt: this.currentMockConfig?.createdAt || new Date(),
            updatedAt: new Date()
        };
    }

    buildRoutesConfig() {
        // 构建当前表单中的路由
        const route = this.buildRouteConfig();
        if (!route) return null;

        const currentPort = parseInt(document.getElementById('mockPort').value);
        const currentMethod = route.method;
        const currentPath = route.path;
        const isDefault = route.isDefault;

        // 如果有现有配置，合并路由
        if (this.currentMockConfig && this.currentMockConfig.routes) {
            // 保留除当前编辑路由外的其他路由
            const otherRoutes = this.currentMockConfig.routes.filter(r =>
                r.id !== route.id && r.path !== route.path
            );

            // 检查默认配置冲突
            if (isDefault) {
                // 检查同一端口下同一路径是否已有默认配置
                const existingDefault = this.mockConfigs.find(config => {
                    if (config.port === currentPort && config.routes && config.routes.length > 0) {
                        const configRoute = config.routes[0];
                        return configRoute.method === currentMethod &&
                            configRoute.path === currentPath &&
                            configRoute.isDefault;
                    }
                    return false;
                });

                if (existingDefault && existingDefault.id !== this.currentMockConfig?.id) {
                    this.showMessage(`同一端口下该API路径已有默认配置: ${existingDefault.name}`, 'error');
                    return null;
                }
            }

            return [...otherRoutes, route];
        }

        // 对于新配置，检查默认配置冲突
        if (isDefault) {
            const existingDefault = this.mockConfigs.find(config => {
                if (config.port === currentPort && config.routes && config.routes.length > 0) {
                    const configRoute = config.routes[0];
                    return configRoute.method === currentMethod &&
                        configRoute.path === currentPath &&
                        configRoute.isDefault;
                }
                return false;
            });

            if (existingDefault) {
                this.showMessage(`同一端口下该API路径已有默认配置: ${existingDefault.name}`, 'error');
                return null;
            }
        }

        return [route];
    }

    buildRouteConfig() {
        const method = document.getElementById('routeMethod').value;
        const path = document.getElementById('routePath').value.trim();
        const statusCode = parseInt(document.getElementById('routeStatusCode').value);
        const description = document.getElementById('routeDescription').value.trim();
        const isDefault = document.getElementById('setAsDefault').checked;

        // 验证API路径
        if (!path) {
            this.showMessage('请填写API路径', 'error');
            this.highlightField('routePath');
            return null;
        }

        // 验证路径格式（必须以/开头）
        if (!path.startsWith('/')) {
            this.showMessage('API路径必须以斜杠(/)开头', 'error');
            this.highlightField('routePath');
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

        // 构建JSON body - 使用文本区域内容
        const jsonBody = document.getElementById('jsonBody');
        let body = {};

        try {
            if (jsonBody.value.trim()) {
                body = JSON.parse(jsonBody.value);
            }
        } catch (error) {
            this.showMessage('JSON格式无效，请检查JSON响应内容', 'error');
            this.highlightField('jsonBody');
            return null;
        }

        return {
            id: `route_${Date.now()}`,
            method,
            path,
            statusCode,
            headers,
            body,
            description,
            isDefault
        };
    }

    async startMockServer() {
        // 构建当前配置的路由
        const currentRoute = this.buildRouteConfig();
        if (!currentRoute) return;

        // 合并所有配置的路由
        const allRoutes = [];
        this.mockConfigs.forEach(config => {
            if (config.routes && config.routes.length > 0) {
                allRoutes.push(config.routes[0]);
            }
        });

        // 确保当前路由在合并后的路由数组中（如果当前配置是新的，可能还没有保存，所以需要添加）
        // 但是，当前路由可能已经存在于allRoutes中（如果当前配置是已保存的），所以我们先检查是否已经存在
        const existingIndex = allRoutes.findIndex(route => route.path === currentRoute.path && route.method === currentRoute.method);
        if (existingIndex >= 0) {
            // 替换已存在的路由
            allRoutes[existingIndex] = currentRoute;
        } else {
            // 添加新路由
            allRoutes.push(currentRoute);
        }

        // 构建配置
        const name = document.getElementById('mockConfigName').value.trim();
        const description = document.getElementById('mockConfigDescription').value.trim();
        const portInput = document.getElementById('mockPort').value;
        const protocol = document.getElementById('mockProtocol').value;

        const port = parseInt(portInput);
        if (isNaN(port) || port < 1 || port > 65535) {
            this.showMessage('端口号必须在1-65535之间', 'error');
            return;
        }

        const config = {
            id: `mock_${Date.now()}`,
            name,
            description,
            port,
            protocol,
            routes: allRoutes,
            createdAt: new Date(),
            updatedAt: new Date()
        };

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

    setupFormValidation() {
        // 监听表单字段变化，实时验证并更新按钮状态
        const form = document.getElementById('mockServerForm');
        const fields = [
            'mockConfigName',
            'mockPort',
            'routePath',
            'jsonBody'
        ];

        fields.forEach(fieldId => {
            const field = document.getElementById(fieldId);
            if (field) {
                field.addEventListener('input', () => {
                    this.validateForm();
                });
                field.addEventListener('change', () => {
                    this.validateForm();
                });
            }
        });

        // 监听响应头变化
        const headersList = document.getElementById('headersList');
        if (headersList) {
            // 使用事件委托监听响应头的变化
            headersList.addEventListener('input', () => {
                this.validateForm();
            });
        }

        // 初始验证
        this.validateForm();

        // 设置JSON文本区域自适应高度
        this.setupJsonAutoResize();
    }

    validateForm() {
        const saveButton = document.getElementById('saveMockConfig');
        if (!saveButton) return;

        // 清除之前的高亮
        document.querySelectorAll('.field-error').forEach(el => {
            el.classList.remove('field-error');
        });

        // 验证必填字段
        const name = document.getElementById('mockConfigName').value.trim();
        const portInput = document.getElementById('mockPort').value;
        const path = document.getElementById('routePath').value.trim();
        const jsonBody = document.getElementById('jsonBody');

        let isValid = true;

        // 验证配置名称
        if (!name) {
            this.highlightField('mockConfigName');
            isValid = false;
        }

        // 验证端口号
        if (!portInput) {
            this.highlightField('mockPort');
            isValid = false;
        } else {
            const port = parseInt(portInput);
            if (isNaN(port) || port < 1 || port > 65535) {
                this.highlightField('mockPort');
                isValid = false;
            }
        }

        // 验证API路径
        if (!path) {
            this.highlightField('routePath');
            isValid = false;
        } else if (!path.startsWith('/')) {
            this.highlightField('routePath');
            isValid = false;
        }

        // 验证JSON格式（如果填写了JSON）
        if (jsonBody && jsonBody.value.trim()) {
            try {
                JSON.parse(jsonBody.value);
            } catch (error) {
                this.highlightField('jsonBody');
                isValid = false;
            }
        }

        // 更新保存按钮状态
        saveButton.disabled = !isValid;

        // 如果验证通过，清除错误高亮
        if (isValid) {
            document.querySelectorAll('.field-error').forEach(el => {
                el.classList.remove('field-error');
            });
        }
    }

    highlightField(fieldId) {
        // 清除之前的高亮
        document.querySelectorAll('.field-error').forEach(el => {
            el.classList.remove('field-error');
        });

        // 高亮指定的字段
        const field = document.getElementById(fieldId);
        if (field) {
            field.classList.add('field-error');
            field.focus();
        }
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
