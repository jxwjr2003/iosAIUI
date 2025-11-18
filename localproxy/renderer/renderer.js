// 渲染进程 JavaScript
class LocalProxyUI {
    constructor() {
        this.currentMockServer = null;
        this.currentProxyServer = null;
        this.logs = [];
        this.mockConfigs = [];
        this.currentMockConfig = null;
        this.serverStatuses = []; // 存储所有服务器状态

        this.initializeEventListeners();
        this.loadLogs();
        this.loadMockConfigs();
        this.loadServerStatuses();
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

        // 启动所有模拟服务器
        document.getElementById('startAllMockServers').addEventListener('click', () => {
            this.startAllMockServers();
        });

        // 停止所有模拟服务器
        document.getElementById('stopAllMockServers').addEventListener('click', () => {
            this.stopAllMockServers();
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

        // 导入导出配置
        document.getElementById('importConfig').addEventListener('click', () => {
            this.showImportModal();
        });

        document.getElementById('exportConfig').addEventListener('click', () => {
            this.showExportModal();
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

            // 监听服务器状态变化
            window.electronAPI.onMockServersStatusChanged((statuses) => {
                this.serverStatuses = statuses;
                this.renderServerStatuses();
            });

            window.electronAPI.onMockServerStatusChanged((status) => {
                this.updateServerStatus(status);
                this.renderServerStatuses();
            });

            // 监听存储相关事件
            window.electronAPI.onStorageLocationChanged((location) => {
                this.updateCurrentStorageLocation(location);
            });

            window.electronAPI.onDynamicFileChanged((data) => {
                this.handleDynamicFileChange(data);
            });
        }

        // 初始化存储相关事件监听器
        this.initializeStorageEventListeners();
        this.setupModalHandlers();
        this.loadCurrentStorageLocation();
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

    async loadServerStatuses() {
        try {
            const result = await window.electronAPI.mockServer.getStatuses();
            if (result.success) {
                this.serverStatuses = result.statuses || [];
                this.renderServerStatuses();
            }
        } catch (error) {
            console.error('Failed to load server statuses:', error);
        }
    }

    renderMockConfigList() {
        const configList = document.getElementById('mockConfigList');
        configList.innerHTML = this.mockConfigs.map(config => {
            const port = config.port || 'N/A';
            // 兼容单路由和多路由配置
            const routes = config.routes || (config.route ? [config.route] : []);
            const firstRoute = routes.length > 0 ? routes[0] : null;
            const method = firstRoute ? firstRoute.method : 'N/A';
            const path = firstRoute ? firstRoute.path : '无路径';
            const isDefault = firstRoute?.isDefault || false;

            return `
            <div class="config-item ${this.currentMockConfig?.id === config.id ? 'active' : ''}"
                 data-id="${config.id}">
                <div class="config-item-info">
                    <div class="config-item-name">
                        ${this.escapeHtml(config.name)}
                        ${isDefault ? '<span class="default-badge">默认</span>' : ''}
                        ${routes.length > 1 ? `<span class="route-count-badge">${routes.length}路由</span>` : ''}
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

        // 加载路由 - 兼容单路由和多路由配置
        const routes = config.routes || (config.route ? [config.route] : []);
        const firstRoute = routes.length > 0 ? routes[0] : null;

        if (firstRoute) {
            document.getElementById('routeMethod').value = firstRoute.method;
            document.getElementById('routePath').value = firstRoute.path;
            document.getElementById('routeStatusCode').value = firstRoute.statusCode;
            document.getElementById('routeDescription').value = firstRoute.description || '';

            // 设置默认配置复选框
            document.getElementById('setAsDefault').checked = firstRoute.isDefault || false;

            // 加载响应头
            this.loadHeaders(firstRoute.headers || {});

            // 加载JSON body到文本区域
            const jsonBody = document.getElementById('jsonBody');
            if (firstRoute.body && typeof firstRoute.body === 'object') {
                jsonBody.value = JSON.stringify(firstRoute.body, null, 2);
            } else {
                jsonBody.value = '';
            }
        } else {
            // 如果没有路由，重置表单
            document.getElementById('routeMethod').value = 'GET';
            document.getElementById('routePath').value = '/';
            document.getElementById('routeStatusCode').value = '200';
            document.getElementById('routeDescription').value = '';
            document.getElementById('setAsDefault').checked = false;
            this.loadHeaders({});
            document.getElementById('jsonBody').value = '';
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
        document.getElementById('routePath').value = '/';
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

        console.log('Attempting to save mock config:', JSON.stringify(config, null, 2));

        try {
            const result = await window.electronAPI.config.saveMockServer(config);
            console.log('Save mock config result from main process:', result);

            if (result.success) {
                this.showMessage(result.message || '配置保存成功', 'success');
                console.log('Config saved successfully, reloading configs...');
                await this.loadMockConfigs();

                // 确保重新加载后正确设置当前配置
                const savedConfig = this.mockConfigs.find(c => c.id === config.id);
                if (savedConfig) {
                    this.currentMockConfig = savedConfig;
                } else {
                    this.currentMockConfig = config;
                }

                this.renderMockConfigList();
                console.log('Configs reloaded after save, current config:', this.currentMockConfig);
            } else {
                console.error('Config save failed:', result.error);
                this.showMessage(`配置保存失败: ${result.error}`, 'error');
            }
        } catch (error) {
            console.error('Config save error:', error);
            this.showMessage(`配置保存失败: ${error}`, 'error');
        }
    }

    async deleteMockConfig(configId) {
        const config = this.mockConfigs.find(c => c.id === configId);
        if (!config) {
            this.showMessage('配置不存在', 'error');
            return;
        }

        if (!confirm(`确定要删除配置 "${config.name}" 吗？`)) return;

        try {
            const result = await window.electronAPI.config.deleteMockConfig(configId);
            if (result.success) {
                this.showMessage(`配置 "${config.name}" 删除成功`, 'success');
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

        // 兼容单路由和多路由配置
        const routes = config.routes || (config.route ? [config.route] : []);
        const firstRoute = routes.length > 0 ? routes[0] : null;
        if (!firstRoute) return;

        const currentPort = config.port;
        const currentMethod = firstRoute.method;
        const currentPath = firstRoute.path;

        try {
            // 更新所有配置中具有相同端口、方法和路径的路由的默认标记
            const updatedConfigs = this.mockConfigs.map(c => {
                // 兼容单路由和多路由配置
                const cRoutes = c.routes || (c.route ? [c.route] : []);
                if (cRoutes.length === 0) return c;

                // 如果端口、方法和路径与当前配置相同
                if (c.port === currentPort) {
                    // 更新所有路由的默认标记
                    const updatedRoutes = cRoutes.map(route => {
                        if (route.method === currentMethod && route.path === currentPath) {
                            return {
                                ...route,
                                isDefault: c.id === configId
                            };
                        } else {
                            return {
                                ...route,
                                isDefault: false
                            };
                        }
                    });

                    // 返回更新后的配置
                    return {
                        ...c,
                        routes: updatedRoutes
                    };
                } else {
                    // 对于其他端口，保持原样
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
                route: {
                    ...config.route,
                    isDefault: false
                }
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

        // 构建单个路由
        const route = this.buildRouteConfig();
        if (!route) return null;

        // 检查默认配置冲突
        if (route.isDefault) {
            const currentMethod = route.method;
            const currentPath = route.path;

            const existingDefault = this.mockConfigs.find(config => {
                if (config.port === port && config.route) {
                    return config.route.method === currentMethod &&
                        config.route.path === currentPath &&
                        config.route.isDefault &&
                        config.id !== this.currentMockConfig?.id;
                }
                return false;
            });

            if (existingDefault) {
                this.showMessage(`同一端口下该API路径已有默认配置: ${existingDefault.name}`, 'error');
                return null;
            }
        }

        return {
            id: this.currentMockConfig?.id || `mock_${Date.now()}`,
            name,
            description,
            port,
            protocol,
            route: route,
            createdAt: this.currentMockConfig?.createdAt || new Date(),
            updatedAt: new Date()
        };
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
        // 构建当前配置
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

    async startAllMockServers() {
        try {
            const result = await window.electronAPI.mockServer.startAll();

            if (result.success) {
                this.showMessage(`成功启动 ${result.started.length} 个服务器，${result.failed.length} 个失败`, 'success');
            } else {
                this.showMessage(`批量启动失败：${result.started.length} 个成功，${result.failed.length} 个失败`, 'error');
            }

            // 显示端口冲突信息
            if (result.portConflicts.length > 0) {
                result.portConflicts.forEach(conflict => {
                    this.showMessage(`端口冲突：${conflict}`, 'error');
                });
            }

            // 显示失败详情
            result.failed.forEach(failure => {
                this.showMessage(`启动服务器 ${failure.id} 失败：${failure.error}`, 'error');
            });

        } catch (error) {
            this.showMessage(`批量启动失败: ${error}`, 'error');
        }
    }

    async stopAllMockServers() {
        try {
            const result = await window.electronAPI.mockServer.stop();
            if (result.success) {
                this.currentMockServer = null;
                this.updateMockServerUI(false);
                this.showMessage('所有模拟服务器已停止', 'info');
            } else {
                this.showMessage(`停止所有模拟服务器失败: ${result.error}`, 'error');
            }
        } catch (error) {
            this.showMessage(`停止所有模拟服务器失败: ${error}`, 'error');
        }
    }

    async stopSingleServer(configId) {
        try {
            const result = await window.electronAPI.mockServer.stopServer(configId);
            if (result.success) {
                this.showMessage(`服务器 ${configId} 已停止`, 'info');
            } else {
                this.showMessage(`停止服务器 ${configId} 失败: ${result.error}`, 'error');
            }
        } catch (error) {
            this.showMessage(`停止服务器 ${configId} 失败: ${error}`, 'error');
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

    /**
     * 渲染服务器状态列表
     */
    renderServerStatuses() {
        const statusList = document.getElementById('serverStatusList');
        if (!statusList) return;

        statusList.innerHTML = this.serverStatuses.map(status => {
            const isRunning = status.isRunning;
            const statusClass = isRunning ? 'status-running' : 'status-stopped';
            const statusText = isRunning ? '运行中' : '已停止';
            const protocolText = status.protocol === 'https' ? 'HTTPS' : 'HTTP';

            return `
                <div class="server-status-item ${statusClass}" data-id="${status.id}">
                    <div class="server-status-header">
                        <div class="server-name">${this.escapeHtml(status.name)}</div>
                        <div class="server-status ${statusClass}">${statusText}</div>
                    </div>
                    <div class="server-details">
                        <div class="server-address">${protocolText}://localhost:${status.port}${status.config.route?.path || '/'}</div>
                        <div class="server-method">${status.config.route?.method || 'GET'}</div>
                    </div>
                    <div class="server-actions">
                        ${isRunning ?
                    `<button class="btn btn-sm btn-danger stop-server" data-id="${status.id}">停止</button>` :
                    `<button class="btn btn-sm btn-primary start-server" data-id="${status.id}">启动</button>`
                }
                        ${status.error ?
                    `<div class="server-error">错误: ${this.escapeHtml(status.error)}</div>` :
                    ''
                }
                    </div>
                </div>
            `;
        }).join('');

        // 添加事件监听
        statusList.querySelectorAll('.start-server').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const configId = btn.getAttribute('data-id');
                this.startSingleServer(configId);
            });
        });

        statusList.querySelectorAll('.stop-server').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const configId = btn.getAttribute('data-id');
                this.stopSingleServer(configId);
            });
        });
    }

    /**
     * 更新单个服务器状态
     */
    updateServerStatus(updatedStatus) {
        const index = this.serverStatuses.findIndex(status => status.id === updatedStatus.id);
        if (index !== -1) {
            this.serverStatuses[index] = updatedStatus;
        } else {
            this.serverStatuses.push(updatedStatus);
        }
    }

    /**
     * 启动单个服务器
     */
    async startSingleServer(configId) {
        try {
            const result = await window.electronAPI.mockServer.start({ id: configId });
            if (result.success) {
                this.showMessage(`服务器 ${configId} 启动成功`, 'success');
            } else {
                this.showMessage(`启动服务器 ${configId} 失败: ${result.error}`, 'error');
            }
        } catch (error) {
            this.showMessage(`启动服务器 ${configId} 失败: ${error}`, 'error');
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

    // ==================== 存储管理功能 ====================

    /**
     * 初始化存储相关事件监听器
     */
    initializeStorageEventListeners() {
        // 导入配置
        const importConfigBtn = document.getElementById('importConfig');
        if (importConfigBtn) {
            importConfigBtn.addEventListener('click', () => {
                this.showImportModal();
            });
        }

        // 导出配置
        const exportConfigBtn = document.getElementById('exportConfig');
        if (exportConfigBtn) {
            exportConfigBtn.addEventListener('click', () => {
                this.showExportModal();
            });
        }

        // 导出选中配置 - 检查元素是否存在
        const exportSelectedConfigBtn = document.getElementById('exportSelectedConfig');
        if (exportSelectedConfigBtn) {
            exportSelectedConfigBtn.addEventListener('click', () => {
                this.exportSelectedConfig();
            });
        }

        // 更改存储位置 - 检查元素是否存在
        const changeStorageLocationBtn = document.getElementById('changeStorageLocation');
        if (changeStorageLocationBtn) {
            changeStorageLocationBtn.addEventListener('click', () => {
                this.showStorageLocationModal();
            });
        }

        // 动态文件加载 - 检查元素是否存在
        const selectDynamicFileBtn = document.getElementById('selectDynamicFile');
        const dynamicFileInput = document.getElementById('dynamicFileInput');
        const loadDynamicFileBtn = document.getElementById('loadDynamicFile');
        const watchDynamicFileBtn = document.getElementById('watchDynamicFile');

        if (selectDynamicFileBtn && dynamicFileInput) {
            selectDynamicFileBtn.addEventListener('click', () => {
                dynamicFileInput.click();
            });
        }

        if (dynamicFileInput) {
            dynamicFileInput.addEventListener('change', (e) => {
                this.handleDynamicFileSelect(e);
            });
        }

        if (loadDynamicFileBtn) {
            loadDynamicFileBtn.addEventListener('click', () => {
                this.loadDynamicFile();
            });
        }

        if (watchDynamicFileBtn) {
            watchDynamicFileBtn.addEventListener('click', () => {
                this.toggleFileWatching();
            });
        }

        // 导入模态框事件 - 使用事件委托或检查元素是否存在
        const importTypeRadios = document.querySelectorAll('input[name="importType"]');
        if (importTypeRadios.length > 0) {
            importTypeRadios.forEach(radio => {
                radio.addEventListener('change', (e) => {
                    this.handleImportTypeChange(e.target.value);
                });
            });
        }

        const importFileInput = document.getElementById('importFileInput');
        if (importFileInput) {
            importFileInput.addEventListener('change', (e) => {
                this.handleImportFileSelect(e);
            });
        }

        const fetchConfigBtn = document.getElementById('fetchConfig');
        if (fetchConfigBtn) {
            fetchConfigBtn.addEventListener('click', () => {
                this.fetchConfigFromUrl();
            });
        }

        const confirmImportBtn = document.getElementById('confirmImport');
        if (confirmImportBtn) {
            confirmImportBtn.addEventListener('click', () => {
                this.confirmImport();
            });
        }

        const cancelImportBtn = document.getElementById('cancelImport');
        if (cancelImportBtn) {
            cancelImportBtn.addEventListener('click', () => {
                this.hideImportModal();
            });
        }

        // 导出模态框事件
        const exportScopeRadios = document.querySelectorAll('input[name="exportScope"]');
        if (exportScopeRadios.length > 0) {
            exportScopeRadios.forEach(radio => {
                radio.addEventListener('change', (e) => {
                    this.handleExportScopeChange(e.target.value);
                });
            });
        }

        const copyExportBtn = document.getElementById('copyExport');
        if (copyExportBtn) {
            copyExportBtn.addEventListener('click', () => {
                this.copyExportToClipboard();
            });
        }

        const downloadExportBtn = document.getElementById('downloadExport');
        if (downloadExportBtn) {
            downloadExportBtn.addEventListener('click', () => {
                this.downloadExport();
            });
        }

        const saveExportBtn = document.getElementById('saveExport');
        if (saveExportBtn) {
            saveExportBtn.addEventListener('click', () => {
                this.saveExportToLocation();
            });
        }

        // 存储位置模态框事件
        const storageLocationRadios = document.querySelectorAll('input[name="storageLocation"]');
        if (storageLocationRadios.length > 0) {
            storageLocationRadios.forEach(radio => {
                radio.addEventListener('change', (e) => {
                    this.handleStorageLocationChange(e.target.value);
                });
            });
        }

        const browseStoragePathBtn = document.getElementById('browseStoragePath');
        if (browseStoragePathBtn) {
            browseStoragePathBtn.addEventListener('click', () => {
                this.browseStoragePath();
            });
        }

        const confirmStorageLocationBtn = document.getElementById('confirmStorageLocation');
        if (confirmStorageLocationBtn) {
            confirmStorageLocationBtn.addEventListener('click', () => {
                this.confirmStorageLocation();
            });
        }

        const cancelStorageLocationBtn = document.getElementById('cancelStorageLocation');
        if (cancelStorageLocationBtn) {
            cancelStorageLocationBtn.addEventListener('click', () => {
                this.hideStorageLocationModal();
            });
        }
    }

    /**
     * 设置模态框处理器
     */
    setupModalHandlers() {
        // 导入模态框
        const importModal = document.getElementById('importModal');
        const importClose = importModal.querySelector('.close');

        importClose.addEventListener('click', () => {
            this.hideImportModal();
        });

        // 导出模态框
        const exportModal = document.getElementById('exportModal');
        const exportClose = exportModal.querySelector('.close');

        exportClose.addEventListener('click', () => {
            this.hideExportModal();
        });

        // 存储位置模态框
        const storageModal = document.getElementById('storageLocationModal');
        const storageClose = storageModal.querySelector('.close');

        storageClose.addEventListener('click', () => {
            this.hideStorageLocationModal();
        });

        // 点击模态框外部关闭
        window.addEventListener('click', (event) => {
            if (event.target === importModal) {
                this.hideImportModal();
            }
            if (event.target === exportModal) {
                this.hideExportModal();
            }
            if (event.target === storageModal) {
                this.hideStorageLocationModal();
            }
        });
    }

    /**
     * 加载当前存储位置
     */
    async loadCurrentStorageLocation() {
        try {
            if (window.electronAPI && window.electronAPI.storage) {
                const result = await window.electronAPI.storage.getCurrentLocation();
                if (result.success) {
                    this.updateCurrentStorageLocation(result.location);
                }
            }
        } catch (error) {
            console.error('Failed to load current storage location:', error);
        }
    }

    /**
     * 更新当前存储位置显示
     */
    updateCurrentStorageLocation(location) {
        const storagePathElement = document.getElementById('currentStoragePath');
        if (storagePathElement && location) {
            storagePathElement.textContent = location.path || '默认位置';
            if (location.isDefault) {
                storagePathElement.textContent += ' (默认)';
            }
        }
    }

    /**
     * 处理动态文件选择
     */
    handleDynamicFileSelect(event) {
        const file = event.target.files[0];
        if (file) {
            document.getElementById('selectedFileName').textContent = file.name;
            document.getElementById('loadDynamicFile').disabled = false;
            document.getElementById('watchDynamicFile').disabled = false;
        }
    }

    /**
     * 加载动态文件
     */
    async loadDynamicFile() {
        const fileInput = document.getElementById('dynamicFileInput');
        const file = fileInput.files[0];
        if (!file) return;

        try {
            const fileStatus = document.getElementById('dynamicFileStatus');
            fileStatus.textContent = '正在加载文件...';
            fileStatus.className = 'file-status info';

            // 这里需要调用后端API来加载动态文件
            if (window.electronAPI && window.electronAPI.storage) {
                const result = await window.electronAPI.storage.loadDynamicFile(file.path);
                if (result.success) {
                    fileStatus.textContent = '文件加载成功';
                    fileStatus.className = 'file-status success';
                    this.showMessage('动态文件加载成功', 'success');
                } else {
                    fileStatus.textContent = `加载失败: ${result.error}`;
                    fileStatus.className = 'file-status error';
                }
            }
        } catch (error) {
            const fileStatus = document.getElementById('dynamicFileStatus');
            fileStatus.textContent = `加载失败: ${error.message}`;
            fileStatus.className = 'file-status error';
        }
    }

    /**
     * 切换文件监控
     */
    async toggleFileWatching() {
        const fileInput = document.getElementById('dynamicFileInput');
        const file = fileInput.files[0];
        const watchButton = document.getElementById('watchDynamicFile');

        if (!file) return;

        try {
            if (window.electronAPI && window.electronAPI.storage) {
                const isWatching = watchButton.textContent === '停止监控';

                if (isWatching) {
                    const result = await window.electronAPI.storage.unwatchFile(file.path);
                    if (result.success) {
                        watchButton.textContent = '监控文件变化';
                        watchButton.className = 'btn btn-warning';
                        this.showMessage('已停止监控文件变化', 'info');
                    }
                } else {
                    const result = await window.electronAPI.storage.watchFile(file.path);
                    if (result.success) {
                        watchButton.textContent = '停止监控';
                        watchButton.className = 'btn btn-danger';
                        this.showMessage('开始监控文件变化', 'success');
                    }
                }
            }
        } catch (error) {
            this.showMessage(`文件监控操作失败: ${error.message}`, 'error');
        }
    }

    /**
     * 处理动态文件变化
     */
    handleDynamicFileChange(data) {
        this.showMessage(`动态文件已更新: ${data.filePath}`, 'info');
        // 可以在这里重新加载配置或更新UI
    }

    /**
     * 显示导入模态框
     */
    showImportModal() {
        document.getElementById('importModal').style.display = 'block';
        this.resetImportModal();
    }

    /**
     * 隐藏导入模态框
     */
    hideImportModal() {
        document.getElementById('importModal').style.display = 'none';
    }

    /**
     * 重置导入模态框
     */
    resetImportModal() {
        document.getElementById('importFileInput').value = '';
        document.getElementById('importUrl').value = '';
        document.getElementById('importPreview').style.display = 'none';
        document.getElementById('importFileInfo').textContent = '';
    }

    /**
     * 处理导入类型变化
     */
    handleImportTypeChange(type) {
        if (type === 'file') {
            document.getElementById('fileImportSection').style.display = 'block';
            document.getElementById('urlImportSection').style.display = 'none';
        } else {
            document.getElementById('fileImportSection').style.display = 'none';
            document.getElementById('urlImportSection').style.display = 'block';
        }
    }

    /**
     * 处理导入文件选择
     */
    handleImportFileSelect(event) {
        const file = event.target.files[0];
        if (file) {
            document.getElementById('importFileInfo').textContent = `已选择文件: ${file.name} (${(file.size / 1024).toFixed(2)} KB)`;
            this.previewImportFile(file);
        }
    }

    /**
     * 预览导入文件
     */
    previewImportFile(file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const content = JSON.parse(e.target.result);
                document.getElementById('previewContent').textContent = JSON.stringify(content, null, 2);
                document.getElementById('importPreview').style.display = 'block';
            } catch (error) {
                document.getElementById('importFileInfo').textContent += ' - JSON格式无效';
            }
        };
        reader.readAsText(file);
    }

    /**
     * 从URL获取配置
     */
    async fetchConfigFromUrl() {
        const url = document.getElementById('importUrl').value;
        if (!url) {
            this.showMessage('请输入URL', 'error');
            return;
        }

        try {
            const response = await fetch(url);
            if (!response.ok) throw new Error(`HTTP ${response.status}`);

            const content = await response.json();
            document.getElementById('previewContent').textContent = JSON.stringify(content, null, 2);
            document.getElementById('importPreview').style.display = 'block';
        } catch (error) {
            this.showMessage(`获取配置失败: ${error.message}`, 'error');
        }
    }

    /**
     * 确认导入
     */
    async confirmImport() {
        const importType = document.querySelector('input[name="importType"]:checked').value;
        let importData;

        try {
            if (importType === 'file') {
                const file = document.getElementById('importFileInput').files[0];
                if (!file) {
                    this.showMessage('请选择文件', 'error');
                    return;
                }
                const text = await this.readFileAsText(file);
                importData = JSON.parse(text);
            } else {
                const previewContent = document.getElementById('previewContent').textContent;
                importData = JSON.parse(previewContent);
            }

            // 调用后端API导入配置
            if (window.electronAPI && window.electronAPI.storage) {
                const result = await window.electronAPI.storage.importConfig(importData);
                if (result.success) {
                    // 显示导入成功详情
                    const importResult = result.result;
                    let successMessage = `配置导入成功 (模拟服务器: ${importResult.importedCount.mockServers} 个, 代理服务器: ${importResult.importedCount.proxyServers} 个)`;

                    // 如果有警告，显示警告信息
                    if (importResult.warnings && importResult.warnings.length > 0) {
                        successMessage += `\\n警告: ${importResult.warnings.join('; ')}`;
                    }

                    this.showMessage(successMessage, 'success');
                    this.hideImportModal();

                    // 保存导入的配置到配置管理器
                    if (importResult.importedConfig && importResult.importedConfig.mockServers) {
                        for (const serverConfig of importResult.importedConfig.mockServers) {
                            // 迁移单路由到多路由格式
                            const migratedConfig = this.migrateServerConfig(serverConfig);
                            await window.electronAPI.config.saveMockServer(migratedConfig);
                        }
                    }

                    // 重新加载配置列表和服务器状态
                    await this.loadMockConfigs();
                    await this.loadServerStatuses();

                    // 自动启动所有导入的模拟服务器
                    if (importResult.importedCount.mockServers > 0) {
                        this.showMessage(`正在自动启动 ${importResult.importedCount.mockServers} 个模拟服务器...`, 'info');
                        await this.startAllMockServers();
                    }
                } else {
                    // 显示详细的错误信息
                    let errorMessage = '导入失败';
                    if (result.details) {
                        const details = result.details;
                        if (details.errors && details.errors.length > 0) {
                            errorMessage += `: ${details.errors.join('; ')}`;
                        }
                        if (details.warnings && details.warnings.length > 0) {
                            errorMessage += `\\n警告: ${details.warnings.join('; ')}`;
                        }
                        if (details.importedCount) {
                            errorMessage += `\\n已导入: 模拟服务器 ${details.importedCount.mockServers} 个, 代理服务器 ${details.importedCount.proxyServers} 个`;
                        }
                    } else if (result.error) {
                        errorMessage += `: ${result.error}`;
                    }
                    this.showMessage(errorMessage, 'error');
                }
            }
        } catch (error) {
            this.showMessage(`导入失败: ${error.message}`, 'error');
        }
    }

    /**
     * 读取文件为文本
     */
    readFileAsText(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => resolve(e.target.result);
            reader.onerror = (e) => reject(e);
            reader.readAsText(file);
        });
    }

    /**
     * 迁移服务器配置（从单路由到多路由）
     */
    migrateServerConfig(serverConfig) {
        // 如果已经有routes字段，说明已经是新版本配置
        if (serverConfig.routes && Array.isArray(serverConfig.routes)) {
            return serverConfig;
        }

        // 如果有route字段，说明是旧版本配置，需要迁移
        if (serverConfig.route) {
            console.log(`迁移配置: ${serverConfig.name} (从单路由到多路由)`);
            return {
                ...serverConfig,
                routes: [serverConfig.route]
            };
        }

        // 如果既没有route也没有routes，创建一个默认路由
        console.log(`为配置 ${serverConfig.name} 创建默认路由`);
        return {
            ...serverConfig,
            routes: [{
                id: `${serverConfig.id}_default_route`,
                path: '/',
                method: 'GET',
                headers: { 'Content-Type': 'application/json' },
                body: { message: 'Default response from migrated server' },
                statusCode: 200,
                description: '默认路由（由系统自动创建）',
                isDefault: true
            }]
        };
    }

    /**
     * 显示导出模态框
     */
    showExportModal() {
        document.getElementById('exportModal').style.display = 'block';
        this.updateExportPreview();
    }

    /**
     * 隐藏导出模态框
     */
    hideExportModal() {
        document.getElementById('exportModal').style.display = 'none';
    }

    /**
     * 处理导出范围变化
     */
    handleExportScopeChange(scope) {
        this.updateExportPreview();
    }

    /**
     * 更新导出预览
     */
    async updateExportPreview() {
        try {
            const scope = document.querySelector('input[name="exportScope"]:checked').value;
            const format = document.getElementById('exportFormat').value;

            let exportData;

            if (scope === 'all') {
                // 导出所有配置
                if (window.electronAPI && window.electronAPI.storage) {
                    const result = await window.electronAPI.storage.exportConfig({ scope: 'all', format });
                    if (result.success) {
                        exportData = result.data;
                    }
                }
            } else if (scope === 'selected') {
                // 导出选中配置
                if (this.currentMockConfig) {
                    if (window.electronAPI && window.electronAPI.storage) {
                        const result = await window.electronAPI.storage.exportConfig({
                            scope: 'selected',
                            configIds: [this.currentMockConfig.id],
                            format
                        });
                        if (result.success) {
                            exportData = result.data;
                        }
                    }
                }
            } else if (scope === 'current') {
                // 导出当前配置
                if (this.currentMockConfig) {
                    exportData = this.currentMockConfig;
                }
            }

            if (exportData) {
                const previewContent = format === 'json'
                    ? JSON.stringify(exportData, null, 2)
                    : this.convertToYaml(exportData);
                document.getElementById('exportPreviewContent').textContent = previewContent;
            }
        } catch (error) {
            console.error('Failed to update export preview:', error);
        }
    }

    /**
     * 转换为YAML格式
     */
    convertToYaml(obj) {
        // 简化的YAML转换，实际应用中可以使用专门的YAML库
        function convertValue(value, indent = '') {
            if (typeof value === 'object' && value !== null) {
                if (Array.isArray(value)) {
                    return value.map(item => `${indent}- ${convertValue(item, indent + '  ')}`).join('\n');
                } else {
                    return Object.entries(value).map(([key, val]) => {
                        return `${indent}${key}: ${convertValue(val, indent + '  ')}`;
                    }).join('\n');
                }
            } else {
                return String(value);
            }
        }
        return convertValue(obj);
    }

    /**
     * 复制导出内容到剪贴板
     */
    async copyExportToClipboard() {
        const content = document.getElementById('exportPreviewContent').textContent;
        try {
            await navigator.clipboard.writeText(content);
            this.showMessage('已复制到剪贴板', 'success');
        } catch (error) {
            this.showMessage('复制失败', 'error');
        }
    }

    /**
     * 下载导出文件
     */
    downloadExport() {
        const content = document.getElementById('exportPreviewContent').textContent;
        const format = document.getElementById('exportFormat').value;
        const scope = document.querySelector('input[name="exportScope"]:checked').value;

        const blob = new Blob([content], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `config-export-${scope}-${Date.now()}.${format}`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        this.showMessage('文件已下载', 'success');
    }

    /**
     * 保存导出到指定位置
     */
    async saveExportToLocation() {
        try {
            const content = document.getElementById('exportPreviewContent').textContent;
            const format = document.getElementById('exportFormat').value;
            const scope = document.querySelector('input[name="exportScope"]:checked').value;

            if (window.electronAPI && window.electronAPI.storage) {
                const result = await window.electronAPI.storage.saveExport({
                    content,
                    format,
                    scope,
                    filename: `config-export-${scope}-${Date.now()}.${format}`
                });

                if (result.success) {
                    this.showMessage('配置已保存到指定位置', 'success');
                    this.hideExportModal();
                } else {
                    this.showMessage(`保存失败: ${result.error}`, 'error');
                }
            }
        } catch (error) {
            this.showMessage(`保存失败: ${error.message}`, 'error');
        }
    }

    /**
     * 导出选中配置
     */
    exportSelectedConfig() {
        if (!this.currentMockConfig) {
            this.showMessage('请先选择一个配置', 'error');
            return;
        }
        this.showExportModal();
        // 设置为导出选中配置
        document.querySelector('input[name="exportScope"][value="selected"]').checked = true;
        this.updateExportPreview();
    }

    /**
     * 显示存储位置模态框
     */
    showStorageLocationModal() {
        document.getElementById('storageLocationModal').style.display = 'block';
    }

    /**
     * 隐藏存储位置模态框
     */
    hideStorageLocationModal() {
        document.getElementById('storageLocationModal').style.display = 'none';
    }

    /**
     * 处理存储位置变化
     */
    handleStorageLocationChange(locationType) {
        if (locationType === 'custom') {
            document.getElementById('customLocationSection').style.display = 'block';
        } else {
            document.getElementById('customLocationSection').style.display = 'none';
        }
    }

    /**
     * 浏览存储路径
     */
    async browseStoragePath() {
        try {
            if (window.electronAPI && window.electronAPI.storage) {
                const result = await window.electronAPI.storage.browsePath();
                if (result.success && result.path) {
                    document.getElementById('customStoragePath').value = result.path;
                }
            }
        } catch (error) {
            this.showMessage(`浏览路径失败: ${error.message}`, 'error');
        }
    }

    /**
     * 确认存储位置
     */
    async confirmStorageLocation() {
        const locationType = document.querySelector('input[name="storageLocation"]:checked').value;
        const migrateData = document.getElementById('migrateExistingData').checked;

        try {
            if (window.electronAPI && window.electronAPI.storage) {
                let result;

                if (locationType === 'default') {
                    result = await window.electronAPI.storage.setLocation('default');
                } else {
                    const customPath = document.getElementById('customStoragePath').value;
                    if (!customPath) {
                        this.showMessage('请输入自定义路径', 'error');
                        return;
                    }
                    result = await window.electronAPI.storage.setLocation(customPath);
                }

                if (result.success) {
                    if (migrateData) {
                        const migrateResult = await window.electronAPI.storage.migrateData(result.location);
                        if (migrateResult.success) {
                            this.showMessage('存储位置已更改且数据已迁移', 'success');
                        } else {
                            this.showMessage('存储位置已更改但数据迁移失败', 'warning');
                        }
                    } else {
                        this.showMessage('存储位置已更改', 'success');
                    }
                    this.hideStorageLocationModal();
                    await this.loadCurrentStorageLocation();
                } else {
                    this.showMessage(`更改存储位置失败: ${result.error}`, 'error');
                }
            }
        } catch (error) {
            this.showMessage(`更改存储位置失败: ${error.message}`, 'error');
        }
    }
}

// 当页面加载完成后初始化应用
document.addEventListener('DOMContentLoaded', () => {
    new LocalProxyUI();
});
