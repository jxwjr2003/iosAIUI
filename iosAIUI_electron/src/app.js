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

            // 确保JSON查看器对话框在启动时隐藏
            this.ensureJSONViewerHidden();

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

        // 使用事件管理器协调组件初始化
        const eventManager = window.eventManager;

        // 初始化树形编辑器
        if (window.treeEditor) {
            this.components.treeEditor = window.treeEditor;
            console.log('✅ 树形编辑器已初始化');
        }

        // 初始化模拟器（使用事件管理器）
        if (window.simulator) {
            this.components.simulator = window.simulator;
            console.log('✅ iOS模拟器已初始化');
        } else {
            // 如果全局模拟器不存在，通过事件管理器创建
            const simulator = new Simulator('simulator-container', eventManager);
            this.components.simulator = simulator;
            console.log('✅ iOS模拟器已通过事件管理器初始化');
        }

        // 初始化数据服务（如果存在）
        if (window.dataService) {
            this.components.dataService = window.dataService;
            console.log('✅ 数据服务已初始化');
        }

        // 初始化约束布局引擎（使用事件管理器）
        if (window.constraintLayoutEngine) {
            this.components.constraintLayoutEngine = window.constraintLayoutEngine;
            console.log('✅ 约束布局引擎已初始化');
        } else {
            // 如果全局约束布局引擎不存在，通过事件管理器创建
            const constraintLayoutEngine = new ConstraintLayoutEngine(eventManager);
            this.components.constraintLayoutEngine = constraintLayoutEngine;
            window.constraintLayoutEngine = constraintLayoutEngine;
            console.log('✅ 约束布局引擎已通过事件管理器初始化');
        }

        // 初始化文件浏览器
        await this.initFileBrowser();
    }

    /**
     * 初始化文件浏览器
     */
    async initFileBrowser() {
        console.log('📁 初始化文件浏览器...');

        // 等待文件浏览器初始化
        if (window.fileBrowser) {
            this.components.fileBrowser = window.fileBrowser;
            console.log('✅ 文件浏览器已初始化');

            // 监听状态变化，实现自动保存
            if (this.components.stateManager) {
                this.setupAutoSave();
            }
        } else {
            console.warn('⚠️ 文件浏览器未找到，将使用回退方式');
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
        // 另存为按钮
        const saveAsBtn = document.getElementById('save-as-btn');
        if (saveAsBtn) {
            saveAsBtn.addEventListener('click', () => {
                this.saveAsFile();
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
     * 设置自动保存
     */
    setupAutoSave() {
        console.log('💾 设置自动保存...');

        // 监听状态变化，实现自动保存
        if (this.components.stateManager && this.components.fileBrowser) {
            // 使用防抖函数避免频繁保存
            let saveTimeout = null;

            const debouncedSave = () => {
                if (saveTimeout) {
                    clearTimeout(saveTimeout);
                }

                saveTimeout = setTimeout(async () => {
                    if (this.components.fileBrowser.currentFilePath) {
                        await this.components.fileBrowser.saveCurrentFile();
                    }
                }, 2000); // 2秒后自动保存
            };

            // 监听状态变化事件
            window.addEventListener('stateChanged', debouncedSave);
            window.addEventListener('nodeAdded', debouncedSave);
            window.addEventListener('nodeUpdated', debouncedSave);
            window.addEventListener('nodeDeleted', debouncedSave);

            console.log('✅ 自动保存已设置');
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
     * 另存为文件
     */
    async saveAsFile() {
        try {
            if (this.components.fileBrowser) {
                const success = await this.components.fileBrowser.saveAsFile();
                if (success) {
                    this.showNotification('✅ 文件已另存为');
                } else {
                    this.showError('另存为失败');
                }
            } else {
                throw new Error('文件浏览器未初始化');
            }
        } catch (error) {
            console.error('❌ 另存为失败:', error);
            this.showError('另存为失败: ' + error.message);
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
     * 确保JSON查看器对话框在启动时隐藏
     */
    ensureJSONViewerHidden() {
        try {
            // 方法1: 通过全局jsonViewer实例隐藏
            if (window.jsonViewer && typeof window.jsonViewer.hide === 'function') {
                window.jsonViewer.hide();
                console.log('✅ JSON查看器对话框已通过实例隐藏');
                return;
            }

            // 方法2: 直接操作DOM元素隐藏
            const jsonViewerDialog = document.getElementById('json-viewer-dialog');
            if (jsonViewerDialog) {
                jsonViewerDialog.style.display = 'none';
                console.log('✅ JSON查看器对话框已通过DOM操作隐藏');
                return;
            }

            console.log('⚠️ JSON查看器对话框未找到，可能尚未初始化');
        } catch (error) {
            console.warn('隐藏JSON查看器对话框时出错:', error);
        }
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
