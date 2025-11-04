/**
 * iOS UI Editor 主应用文件
 * 负责整合所有组件并启动应用
 */
class IOSUIEditor {
    constructor() {
        this.components = {};
        this.isInitialized = false;

        // 初始化应用
        this.init();
    }

    /**
     * 初始化应用
     */
    async init() {
        try {
            console.log('🚀 启动 iOS UI Editor...');

            // 等待DOM加载完成
            if (document.readyState === 'loading') {
                await new Promise(resolve => document.addEventListener('DOMContentLoaded', resolve));
            }

            // 初始化核心组件
            await this.initCoreComponents();

            // 初始化UI组件
            await this.initUIComponents();

            // 绑定全局事件
            this.bindGlobalEvents();

            // 设置初始状态
            this.setupInitialState();

            this.isInitialized = true;
            console.log('✅ iOS UI Editor 启动完成');

            // 不再显示欢迎消息
            // this.showWelcomeMessage();

        } catch (error) {
            console.error('❌ 应用初始化失败:', error);
            this.showError('应用初始化失败: ' + error.message);
        }
    }

    /**
     * 初始化核心组件
     */
    async initCoreComponents() {
        console.log('📦 初始化核心组件...');

        // 等待所有核心工具加载完成
        await this.waitForCoreTools();

        // 初始化节点ID生成器
        if (window.nodeIdGenerator) {
            this.components.nodeIdGenerator = window.nodeIdGenerator;
            console.log('✅ 节点ID生成器已初始化');
        }

        // 初始化数据验证器
        if (window.dataValidator) {
            this.components.dataValidator = window.dataValidator;
            console.log('✅ 数据验证器已初始化');
        }

        // 初始化状态管理器
        if (window.stateManager) {
            this.components.stateManager = window.stateManager;
            console.log('✅ 状态管理器已初始化');
        }
    }

    /**
     * 等待核心工具加载完成
     */
    waitForCoreTools() {
        return new Promise((resolve) => {
            const checkTools = () => {
                if (window.nodeIdGenerator && window.dataValidator && window.stateManager) {
                    resolve();
                } else {
                    setTimeout(checkTools, 10);
                }
            };
            checkTools();
        });
    }

    /**
     * 初始化UI组件
     */
    async initUIComponents() {
        console.log('🎨 初始化UI组件...');

        // 初始化树形编辑器
        if (window.treeEditor) {
            this.components.treeEditor = window.treeEditor;
            console.log('✅ 树形编辑器已初始化');
        }

        // 初始化模拟器
        if (window.simulator) {
            this.components.simulator = window.simulator;
            console.log('✅ iOS模拟器已初始化');
        }

        // 初始化数据服务（如果存在）
        if (window.dataService) {
            this.components.dataService = window.dataService;
            console.log('✅ 数据服务已初始化');
        }

        // 初始化AI聊天助手（如果存在）
        if (window.aiChat) {
            this.components.aiChat = window.aiChat;
            console.log('✅ AI聊天助手已初始化');
        }
    }

    /**
     * 绑定全局事件
     */
    bindGlobalEvents() {
        console.log('🔗 绑定全局事件...');

        // 绑定工具栏按钮
        this.bindToolbarEvents();

        // 绑定键盘快捷键
        this.bindKeyboardShortcuts();

        // 绑定窗口事件
        this.bindWindowEvents();

        console.log('✅ 全局事件绑定完成');
    }

    /**
     * 绑定工具栏事件
     */
    bindToolbarEvents() {
        // 导入JSON按钮
        const importBtn = document.getElementById('import-btn');
        if (importBtn) {
            importBtn.addEventListener('click', () => {
                this.showImportDialog();
            });
        }

        // 导出JSON按钮
        const exportBtn = document.getElementById('export-btn');
        if (exportBtn) {
            exportBtn.addEventListener('click', () => {
                this.exportData();
            });
        }

        // 新建根节点按钮
        const newRootBtn = document.getElementById('new-root-btn');
        if (newRootBtn) {
            newRootBtn.addEventListener('click', () => {
                this.addRootNode();
            });
        }

        // 设置按钮
        const settingsBtn = document.getElementById('settings-btn');
        if (settingsBtn) {
            settingsBtn.addEventListener('click', () => {
                this.showSettingsDialog();
            });
        }
    }

    /**
     * 绑定键盘快捷键
     */
    bindKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            // 阻止默认行为，避免与浏览器快捷键冲突
            if (e.ctrlKey || e.metaKey) {
                switch (e.key) {
                    case 'n':
                        e.preventDefault();
                        this.addRootNode();
                        break;
                    case 'o':
                        e.preventDefault();
                        this.showImportDialog();
                        break;
                    case 's':
                        e.preventDefault();
                        this.exportData();
                        break;
                    case ',':
                        e.preventDefault();
                        this.showSettingsDialog();
                        break;
                }
            }
        });
    }

    /**
     * 绑定窗口事件
     */
    bindWindowEvents() {
        // 窗口关闭前提示保存
        window.addEventListener('beforeunload', (e) => {
            const hasUnsavedChanges = this.hasUnsavedChanges();
            if (hasUnsavedChanges) {
                e.preventDefault();
                e.returnValue = '您有未保存的更改，确定要离开吗？';
                return e.returnValue;
            }
        });

        // 窗口调整大小时更新布局
        window.addEventListener('resize', () => {
            this.handleWindowResize();
        });
    }

    /**
     * 设置初始状态
     */
    setupInitialState() {
        console.log('⚙️ 设置初始状态...');

        // 尝试从本地存储加载数据
        this.loadFromLocalStorage();

        // 设置默认的组件类型选项
        this.setupComponentTypeOptions();

        // 设置AI配置默认值
        this.setupAIConfig();

        console.log('✅ 初始状态设置完成');
    }

    /**
     * 设置组件类型选项
     */
    setupComponentTypeOptions() {
        const nodeTypeSelect = document.getElementById('node-type');
        if (nodeTypeSelect && this.components.dataValidator) {
            const componentTypes = this.components.dataValidator.getSupportedComponentTypes();

            nodeTypeSelect.innerHTML = '';
            componentTypes.forEach(type => {
                const option = document.createElement('option');
                option.value = type;
                option.textContent = type;
                nodeTypeSelect.appendChild(option);
            });
        }
    }

    /**
     * 设置AI配置
     */
    setupAIConfig() {
        // 设置默认的AI模型选项
        const aiModelSelect = document.getElementById('ai-model');
        if (aiModelSelect) {
            aiModelSelect.innerHTML = `
                <option value="gpt-4">GPT-4</option>
                <option value="gpt-3.5-turbo">GPT-3.5 Turbo</option>
            `;
        }
    }

    /**
     * 从本地存储加载数据
     */
    loadFromLocalStorage() {
        try {
            const savedData = localStorage.getItem('ios-ui-editor-data');
            if (savedData) {
                const data = JSON.parse(savedData);
                if (this.components.stateManager) {
                    this.components.stateManager.importState(data);
                    console.log('✅ 从本地存储加载数据成功');
                }
            }
        } catch (error) {
            console.warn('无法从本地存储加载数据:', error);
        }
    }

    /**
     * 保存到本地存储
     */
    saveToLocalStorage() {
        try {
            if (this.components.stateManager) {
                const data = this.components.stateManager.exportState();
                localStorage.setItem('ios-ui-editor-data', JSON.stringify(data));
                console.log('✅ 数据已保存到本地存储');
            }
        } catch (error) {
            console.error('保存到本地存储失败:', error);
        }
    }

    /**
     * 检查是否有未保存的更改
     */
    hasUnsavedChanges() {
        // 简化的实现 - 在实际应用中应该跟踪更改状态
        return false;
    }

    /**
     * 显示导入对话框
     */
    showImportDialog() {
        // 创建文件输入元素
        const fileInput = document.createElement('input');
        fileInput.type = 'file';
        fileInput.accept = '.json';

        fileInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                this.importData(file);
            }
        });

        fileInput.click();
    }

    /**
     * 导入数据
     * @param {File} file - JSON文件
     */
    async importData(file) {
        try {
            const text = await file.text();
            const data = JSON.parse(text);

            // 验证数据
            if (this.components.dataValidator) {
                const validation = this.components.dataValidator.validateImportData(data);
                if (validation.isValid && validation.data) {
                    this.components.stateManager.importState(validation.data);
                    this.showNotification('✅ 数据导入成功');
                } else {
                    this.showError('数据验证失败: ' + validation.errors.join(', '));
                }
            } else {
                this.components.stateManager.importState(data);
                this.showNotification('✅ 数据导入成功');
            }
        } catch (error) {
            this.showError('导入失败: ' + error.message);
        }
    }

    /**
     * 导出数据
     */
    async exportData() {
        try {
            // 检查数据服务是否已初始化
            if (!this.components.dataService) {
                throw new Error('数据服务未初始化，请稍后重试');
            }

            // 使用数据服务的导出功能
            const result = await this.components.dataService.exportToFile({
                includeSettings: true,
                includeModificationLog: false,
                includeChatHistory: false,
                format: 'pretty',
                timestamp: true
            });

            if (result.success) {
                const successMessage = result.filePath
                    ? `✅ 数据导出成功: ${result.filename}\n保存位置: ${result.filePath}`
                    : `✅ 数据导出成功: ${result.filename}`;
                this.showNotification(successMessage);
                console.log('📄 文件导出详情:', result);
            } else {
                throw new Error(result.message || '导出失败');
            }
        } catch (error) {
            console.error('❌ 导出失败:', error);
            this.showError('导出失败: ' + error.message);
        }
    }

    /**
     * 添加根节点
     */
    addRootNode() {
        if (this.components.treeEditor) {
            this.components.treeEditor.addRootNode();
        }
    }

    /**
     * 显示设置对话框
     */
    showSettingsDialog() {
        // 简化的设置对话框
        const settings = {
            autoSave: confirm('启用自动保存？'),
            showNodeIds: confirm('显示节点ID？'),
            theme: 'light' // 简化处理
        };

        this.showNotification('设置已更新');
    }

    /**
     * 处理窗口调整大小
     */
    handleWindowResize() {
        // 在响应式设计中，这里可以处理布局调整
        console.log('窗口大小已调整');
    }

    /**
     * 显示欢迎消息
     */
    showWelcomeMessage() {
        this.showNotification('欢迎使用 iOS UI Editor！');

        // 在聊天区域显示欢迎消息
        const chatMessages = document.getElementById('chat-messages');
        if (chatMessages) {
            const welcomeMessage = document.createElement('div');
            welcomeMessage.className = 'system-message';
            welcomeMessage.innerHTML = `
                <p><strong>欢迎使用 iOS UI Editor！</strong></p>
                <p>这是一个可视化编辑 iOS UI 层级结构的工具。</p>
                <p><strong>快速开始：</strong></p>
                <ul>
                    <li>点击"新建根节点"开始创建UI结构</li>
                    <li>在树形编辑器中管理组件层级</li>
                    <li>在属性编辑器中配置组件属性</li>
                    <li>在模拟器中实时预览效果</li>
                    <li>使用AI助手获取设计建议</li>
                </ul>
            `;
            chatMessages.appendChild(welcomeMessage);
        }
    }

    /**
     * 显示通知
     * @param {string} message - 通知消息
     */
    showNotification(message) {
        // 使用树形编辑器的通知方法（如果可用）
        if (this.components.treeEditor && this.components.treeEditor.showNotification) {
            this.components.treeEditor.showNotification(message);
        } else {
            // 简单的备用通知
            console.log('通知:', message);
            alert(message); // 简化处理
        }
    }

    /**
     * 显示错误
     * @param {string} message - 错误消息
     */
    showError(message) {
        console.error('错误:', message);
        this.showNotification('❌ ' + message);
    }

    /**
     * 获取应用状态
     */
    getAppState() {
        return {
            isInitialized: this.isInitialized,
            components: Object.keys(this.components),
            state: this.components.stateManager ? this.components.stateManager.getState() : null
        };
    }

    /**
     * 销毁应用
     */
    destroy() {
        console.log('🧹 清理应用资源...');

        // 保存数据
        this.saveToLocalStorage();

        // 清理组件
        Object.values(this.components).forEach(component => {
            if (component && typeof component.destroy === 'function') {
                component.destroy();
            }
        });

        this.components = {};
        this.isInitialized = false;

        console.log('✅ 应用已清理');
    }
}

// 创建全局应用实例
let iosUIEditor = null;

// 启动应用
document.addEventListener('DOMContentLoaded', () => {
    iosUIEditor = new IOSUIEditor();

    // 将应用实例暴露给全局作用域，便于调试
    window.iosUIEditor = iosUIEditor;
});

// 导出应用（用于模块化环境）
if (typeof module !== 'undefined' && module.exports) {
    module.exports = IOSUIEditor;
}

// 自动保存功能
setInterval(() => {
    if (iosUIEditor && iosUIEditor.isInitialized) {
        iosUIEditor.saveToLocalStorage();
    }
}, 30000); // 每30秒自动保存一次

console.log('📱 iOS UI Editor 应用脚本已加载');
