/**
 * 数据服务组件
 * 负责数据的导入导出、持久化和版本兼容性管理
 */
class DataService {
    constructor() {
        this.storageKey = 'ios-ui-editor-data';
        this.currentVersion = '1.0.0';
        this.supportedVersions = ['1.0.0'];

        // 初始化数据服务
        this.init();
    }

    /**
     * 初始化数据服务
     */
    init() {
        console.log('📊 初始化数据服务...');

        // 设置默认的导出选项
        this.exportOptions = {
            includeSettings: true,
            includeModificationLog: false,
            includeChatHistory: false,
            format: 'pretty', // 'pretty' | 'minified'
            timestamp: true
        };

        console.log('✅ 数据服务初始化完成');
    }

    /**
     * 导出当前状态为JSON
     * @param {Object} options - 导出选项
     * @returns {Object} 导出的数据
     */
    exportData(options = {}) {
        try {
            const exportOptions = { ...this.exportOptions, ...options };

            // 检查状态管理器是否可用
            if (!window.stateManager) {
                throw new Error('状态管理器未初始化');
            }

            const state = window.stateManager.getState();

            const exportData = {
                version: this.currentVersion,
                exportTime: new Date().toISOString(),
                treeData: state.treeData
            };

            // 根据选项包含其他数据
            if (exportOptions.includeSettings) {
                exportData.settings = state.settings;
            }

            if (exportOptions.includeModificationLog) {
                exportData.modificationLog = state.modificationLog;
            }

            if (exportOptions.includeChatHistory) {
                exportData.chatHistory = state.chatHistory;
            }

            // 验证导出的数据（如果数据验证器可用）
            if (window.dataValidator) {
                const validation = window.dataValidator.validateTree(exportData.treeData);
                if (!validation.isValid) {
                    throw new Error(`数据验证失败: ${validation.errors.join(', ')}`);
                }
            }

            console.log('✅ 数据导出成功', {
                nodeCount: this.countNodes(exportData.treeData),
                rootNodes: exportData.treeData.length
            });

            return exportData;
        } catch (error) {
            console.error('❌ 数据导出失败:', error);
            throw error;
        }
    }

    /**
     * 导入数据
     * @param {Object} data - 导入的数据
     * @param {Object} options - 导入选项
     * @returns {Object} 导入结果
     */
    importData(data, options = {}) {
        try {
            console.log('📥 开始导入数据...', data);

            // 验证数据格式
            if (!data || typeof data !== 'object') {
                throw new Error('无效的数据格式');
            }

            // 检查版本兼容性
            this.checkVersionCompatibility(data.version);

            // 验证树形数据
            if (!data.treeData || !Array.isArray(data.treeData)) {
                throw new Error('缺少有效的树形数据');
            }

            // 检查数据验证器是否可用
            if (!window.dataValidator) {
                throw new Error('数据验证器未初始化');
            }

            const validation = window.dataValidator.validateImportData(data);
            if (!validation.isValid) {
                throw new Error(`数据验证失败: ${validation.errors.join(', ')}`);
            }

            // 清理和标准化数据
            const sanitizedData = validation.data || data;

            // 检查状态管理器是否可用
            if (!window.stateManager) {
                throw new Error('状态管理器未初始化');
            }

            // 导入数据到状态管理器
            window.stateManager.importState(sanitizedData);

            console.log('✅ 数据导入成功', {
                nodeCount: this.countNodes(sanitizedData.treeData),
                rootNodes: sanitizedData.treeData.length
            });

            return {
                success: true,
                message: '数据导入成功',
                stats: {
                    nodeCount: this.countNodes(sanitizedData.treeData),
                    rootNodes: sanitizedData.treeData.length
                }
            };
        } catch (error) {
            console.error('❌ 数据导入失败:', error);
            return {
                success: false,
                message: error.message,
                error: error
            };
        }
    }

    /**
     * 检查版本兼容性
     * @param {string} version - 数据版本
     */
    checkVersionCompatibility(version) {
        if (!version) {
            console.warn('⚠️ 数据版本未指定，假设为兼容版本');
            return;
        }

        if (!this.supportedVersions.includes(version)) {
            throw new Error(`不支持的版本: ${version}，当前支持版本: ${this.supportedVersions.join(', ')}`);
        }
    }

    /**
     * 保存到本地存储
     */
    saveToLocalStorage() {
        try {
            const data = this.exportData({
                includeSettings: true,
                includeModificationLog: true,
                includeChatHistory: true
            });

            localStorage.setItem(this.storageKey, JSON.stringify(data));
            console.log('💾 数据已保存到本地存储');

            return {
                success: true,
                message: '数据已保存到本地存储',
                timestamp: new Date().toISOString()
            };
        } catch (error) {
            console.error('❌ 保存到本地存储失败:', error);
            return {
                success: false,
                message: error.message,
                error: error
            };
        }
    }

    /**
     * 从本地存储加载数据
     */
    loadFromLocalStorage() {
        try {
            const savedData = localStorage.getItem(this.storageKey);
            if (!savedData) {
                return {
                    success: false,
                    message: '没有找到保存的数据'
                };
            }

            const data = JSON.parse(savedData);
            const result = this.importData(data);

            if (result.success) {
                console.log('📂 从本地存储加载数据成功');
                return {
                    success: true,
                    message: '数据加载成功',
                    data: data
                };
            } else {
                throw new Error(result.message);
            }
        } catch (error) {
            console.error('❌ 从本地存储加载数据失败:', error);
            return {
                success: false,
                message: error.message,
                error: error
            };
        }
    }

    /**
     * 导出为JSON文件
     * @param {Object} options - 导出选项
     */
    async exportToFile(options = {}) {
        try {
            const data = this.exportData(options);
            const format = options.format || this.exportOptions.format;
            const jsonString = format === 'minified'
                ? JSON.stringify(data)
                : JSON.stringify(data, null, 2);

            // 检查是否在 Electron 环境中，使用原生保存对话框
            if (window.electronAPI && window.electronAPI.saveFile) {
                const result = await window.electronAPI.saveFile(data);

                if (result.success) {
                    console.log('📄 数据已导出为文件:', result.filePath);
                    return {
                        success: true,
                        message: '数据导出成功',
                        filename: result.filename,
                        filePath: result.filePath
                    };
                } else {
                    throw new Error(result.message || '保存对话框失败');
                }
            } else {
                // 回退到浏览器下载方式
                const blob = new Blob([jsonString], { type: 'application/json' });
                const url = URL.createObjectURL(blob);

                const timestamp = options.timestamp !== false ? `-${new Date().toISOString().split('T')[0]}` : '';
                const filename = `ios-ui-layout${timestamp}.json`;

                const a = document.createElement('a');
                a.href = url;
                a.download = filename;
                a.click();

                URL.revokeObjectURL(url);

                console.log('📄 数据已导出为文件:', filename);

                return {
                    success: true,
                    message: '数据导出成功',
                    filename: filename,
                    filePath: '浏览器默认下载目录'
                };
            }
        } catch (error) {
            console.error('❌ 导出为文件失败:', error);
            return {
                success: false,
                message: error.message,
                error: error
            };
        }
    }

    /**
     * 从文件导入数据
     * @param {File} file - 文件对象
     */
    async importFromFile(file) {
        try {
            if (!file) {
                throw new Error('没有选择文件');
            }

            if (!file.name.endsWith('.json')) {
                throw new Error('只支持JSON文件');
            }

            const text = await this.readFileAsText(file);
            const data = JSON.parse(text);

            const result = this.importData(data);

            if (result.success) {
                console.log('📂 从文件导入数据成功:', file.name);
                return {
                    success: true,
                    message: '文件导入成功',
                    filename: file.name,
                    stats: result.stats
                };
            } else {
                throw new Error(result.message);
            }
        } catch (error) {
            console.error('❌ 从文件导入数据失败:', error);
            return {
                success: false,
                message: error.message,
                error: error
            };
        }
    }

    /**
     * 读取文件为文本
     * @param {File} file - 文件对象
     * @returns {Promise<string>} 文件内容
     */
    readFileAsText(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => resolve(e.target.result);
            reader.onerror = (e) => reject(new Error('文件读取失败'));
            reader.readAsText(file);
        });
    }

    /**
     * 统计节点数量
     * @param {Array} treeData - 树形数据
     * @returns {number} 节点总数
     */
    countNodes(treeData) {
        let count = 0;

        const countRecursive = (nodes) => {
            nodes.forEach(node => {
                count++;
                if (node.children && node.children.length > 0) {
                    countRecursive(node.children);
                }
            });
        };

        if (treeData && Array.isArray(treeData)) {
            countRecursive(treeData);
        }

        return count;
    }

    /**
     * 获取数据统计信息
     * @returns {Object} 统计信息
     */
    getStats() {
        // 检查状态管理器是否可用
        if (!window.stateManager) {
            throw new Error('状态管理器未初始化');
        }

        const state = window.stateManager.getState();
        const treeData = state.treeData || [];

        return {
            totalNodes: this.countNodes(treeData),
            rootNodes: treeData.length,
            maxDepth: this.getMaxDepth(treeData),
            nodeTypes: this.getNodeTypes(treeData),
            lastModified: state.modificationLog[0]?.timestamp || null
        };
    }

    /**
     * 获取树的最大深度
     * @param {Array} treeData - 树形数据
     * @returns {number} 最大深度
     */
    getMaxDepth(treeData) {
        let maxDepth = 0;

        const calculateDepth = (nodes, currentDepth) => {
            maxDepth = Math.max(maxDepth, currentDepth);
            nodes.forEach(node => {
                if (node.children && node.children.length > 0) {
                    calculateDepth(node.children, currentDepth + 1);
                }
            });
        };

        if (treeData && Array.isArray(treeData)) {
            calculateDepth(treeData, 1);
        }

        return maxDepth;
    }

    /**
     * 获取节点类型统计
     * @param {Array} treeData - 树形数据
     * @returns {Object} 节点类型统计
     */
    getNodeTypes(treeData) {
        const types = {};

        const countTypes = (nodes) => {
            nodes.forEach(node => {
                types[node.type] = (types[node.type] || 0) + 1;
                if (node.children && node.children.length > 0) {
                    countTypes(node.children);
                }
            });
        };

        if (treeData && Array.isArray(treeData)) {
            countTypes(treeData);
        }

        return types;
    }

    /**
     * 生成数据模板
     * @param {string} templateType - 模板类型
     * @returns {Object} 模板数据
     */
    generateTemplate(templateType = 'basic') {
        const templates = {
            basic: {
                version: this.currentVersion,
                treeData: [
                    {
                        id: '01',
                        name: 'RootView',
                        type: 'UIView',
                        attributes: {
                            backgroundColor: '#FFFFFF'
                        },
                        constraintPackages: [],
                        memberVariables: [],
                        functions: [],
                        protocols: [],
                        layout: 'vertical',
                        description: '根视图',
                        children: [
                            {
                                id: '0101',
                                name: 'HeaderLabel',
                                type: 'UILabel',
                                attributes: {
                                    text: '欢迎使用 iOS UI Editor',
                                    textColor: '#000000',
                                    fontSize: 18,
                                    fontWeight: 'bold',
                                    textAlignment: 'center'
                                },
                                constraintPackages: [],
                                memberVariables: [],
                                functions: [],
                                protocols: [],
                                layout: 'horizontal',
                                description: '标题标签'
                            }
                        ]
                    }
                ],
                settings: {
                    autoSave: true,
                    showNodeIds: true,
                    theme: 'light'
                }
            },
            form: {
                version: this.currentVersion,
                treeData: [
                    {
                        id: '01',
                        name: 'FormView',
                        type: 'UIView',
                        attributes: {
                            backgroundColor: '#F2F2F7'
                        },
                        constraintPackages: [],
                        memberVariables: [],
                        functions: [],
                        protocols: [],
                        layout: 'vertical',
                        description: '表单视图',
                        children: [
                            {
                                id: '0101',
                                name: 'UsernameField',
                                type: 'UITextField',
                                attributes: {
                                    placeholder: '用户名',
                                    backgroundColor: '#FFFFFF'
                                },
                                constraintPackages: [],
                                memberVariables: [],
                                functions: [],
                                protocols: [],
                                layout: 'horizontal',
                                description: '用户名输入框'
                            },
                            {
                                id: '0102',
                                name: 'PasswordField',
                                type: 'UITextField',
                                attributes: {
                                    placeholder: '密码',
                                    backgroundColor: '#FFFFFF',
                                    isSecureTextEntry: true
                                },
                                constraintPackages: [],
                                memberVariables: [],
                                functions: [],
                                protocols: [],
                                layout: 'horizontal',
                                description: '密码输入框'
                            },
                            {
                                id: '0103',
                                name: 'LoginButton',
                                type: 'UIButton',
                                attributes: {
                                    title: '登录',
                                    backgroundColor: '#007AFF',
                                    textColor: '#FFFFFF'
                                },
                                constraintPackages: [],
                                memberVariables: [],
                                functions: [],
                                protocols: [],
                                layout: 'horizontal',
                                description: '登录按钮'
                            }
                        ]
                    }
                ]
            }
        };

        return templates[templateType] || templates.basic;
    }

    /**
     * 应用数据模板
     * @param {string} templateType - 模板类型
     */
    applyTemplate(templateType) {
        try {
            const template = this.generateTemplate(templateType);
            const result = this.importData(template);

            if (result.success) {
                console.log(`✅ 应用模板成功: ${templateType}`);
                return {
                    success: true,
                    message: `模板 "${templateType}" 应用成功`,
                    template: templateType
                };
            } else {
                throw new Error(result.message);
            }
        } catch (error) {
            console.error('❌ 应用模板失败:', error);
            return {
                success: false,
                message: error.message,
                error: error
            };
        }
    }

    /**
     * 数据迁移（版本升级）
     * @param {Object} data - 旧版本数据
     * @returns {Object} 迁移后的数据
     */
    migrateData(data) {
        // 简单的数据迁移逻辑
        // 在实际应用中，这里应该处理不同版本之间的数据格式变化

        const migratedData = { ...data };

        // 确保必需字段存在
        if (!migratedData.version) {
            migratedData.version = this.currentVersion;
        }

        // 清理和标准化树形数据
        if (migratedData.treeData && Array.isArray(migratedData.treeData)) {
            migratedData.treeData = migratedData.treeData.map(node =>
                dataValidator.sanitizeNode(node)
            );
        }

        return migratedData;
    }

    /**
     * 备份当前数据
     */
    backupData() {
        try {
            const data = this.exportData({
                includeSettings: true,
                includeModificationLog: true,
                includeChatHistory: true
            });

            const backupKey = `${this.storageKey}-backup-${Date.now()}`;
            localStorage.setItem(backupKey, JSON.stringify(data));

            console.log('💾 数据备份创建成功:', backupKey);

            return {
                success: true,
                message: '数据备份创建成功',
                backupKey: backupKey,
                timestamp: new Date().toISOString()
            };
        } catch (error) {
            console.error('❌ 数据备份失败:', error);
            return {
                success: false,
                message: error.message,
                error: error
            };
        }
    }

    /**
     * 清理旧数据
     */
    cleanupOldData() {
        try {
            const keysToKeep = [this.storageKey];
            const backupKeys = [];

            // 找出所有备份键
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (key.startsWith(`${this.storageKey}-backup-`)) {
                    backupKeys.push(key);
                }
            }

            // 按时间排序，保留最新的5个备份
            backupKeys.sort().reverse();
            const keysToRemove = backupKeys.slice(5);

            // 删除旧备份
            keysToRemove.forEach(key => {
                localStorage.removeItem(key);
                console.log('🗑️ 删除旧备份:', key);
            });

            return {
                success: true,
                message: `数据清理完成，删除了 ${keysToRemove.length} 个旧备份`,
                removed: keysToRemove.length,
                kept: backupKeys.length - keysToRemove.length
            };
        } catch (error) {
            console.error('❌ 数据清理失败:', error);
            return {
                success: false,
                message: error.message,
                error: error
            };
        }
    }

    /**
     * 显示通知
     * @param {string} message - 通知消息
     */
    showNotification(message) {
        // 使用树形编辑器的通知方法（如果可用）
        if (window.treeEditor && window.treeEditor.showNotification) {
            window.treeEditor.showNotification(message);
        } else {
            // 简单的备用通知
            console.log('通知:', message);
        }
    }
}

// 创建全局数据服务实例
const dataService = new DataService();

// 导出数据服务
window.dataService = dataService;

// 自动保存功能
setInterval(() => {
    // 检查状态管理器是否可用
    if (window.stateManager && window.dataService) {
        const state = window.stateManager.getState();
        if (state.settings?.autoSave) {
            window.dataService.saveToLocalStorage();
        }
    }
}, 30000); // 每30秒自动保存一次

console.log('📊 数据服务已加载');
