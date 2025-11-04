/**
 * AI聊天助手组件
 * 通过Electron主进程连接第三方AI服务，提供智能建议和命令执行
 */
class AIChatAssistant {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
        this.messages = [];
        this.isConnected = false;
        this.aiConfig = {
            apiKey: '',
            model: 'gpt-3.5-turbo',
            temperature: 0.7,
            maxTokens: 1000
        };

        // 初始化组件
        this.init();
    }

    /**
     * 初始化AI聊天助手
     */
    init() {
        // 创建聊天界面结构
        this.createChatInterface();

        // 绑定事件监听器
        this.bindEvents();

        // 加载配置
        this.loadConfig();

        // 订阅状态变化
        stateManager.subscribe((state) => {
            this.updateContext(state);
        });

        // 显示欢迎消息
        this.addSystemMessage('欢迎使用AI聊天助手！我可以帮助您优化UI层级结构、提供设计建议和执行修改命令。');

        console.log('🤖 AI聊天助手初始化完成');
    }

    /**
     * 创建聊天界面结构
     */
    createChatInterface() {
        // 清空容器
        this.container.innerHTML = '';

        // 创建聊天容器
        const chatContainer = document.createElement('div');
        chatContainer.className = 'ai-chat-container';

        // 创建消息区域
        this.messagesContainer = document.createElement('div');
        this.messagesContainer.className = 'chat-messages';
        this.messagesContainer.id = 'chat-messages';

        // 创建输入区域
        const inputContainer = document.createElement('div');
        inputContainer.className = 'chat-input-container';

        // 创建消息输入框
        this.messageInput = document.createElement('textarea');
        this.messageInput.className = 'chat-input';
        this.messageInput.placeholder = '输入您的问题或指令...';
        this.messageInput.rows = 3;

        // 创建按钮容器
        const buttonContainer = document.createElement('div');
        buttonContainer.className = 'chat-buttons';

        // 发送按钮
        this.sendButton = document.createElement('button');
        this.sendButton.className = 'btn-primary';
        this.sendButton.textContent = '发送';
        this.sendButton.addEventListener('click', () => this.sendMessage());

        // 清除聊天按钮
        const clearButton = document.createElement('button');
        clearButton.className = 'btn-secondary';
        clearButton.textContent = '清除聊天';
        clearButton.addEventListener('click', () => this.clearChat());

        // 配置按钮
        const configButton = document.createElement('button');
        configButton.className = 'btn-secondary';
        configButton.textContent = '配置';
        configButton.addEventListener('click', () => this.showConfigDialog());

        // 组装界面
        buttonContainer.appendChild(this.sendButton);
        buttonContainer.appendChild(clearButton);
        buttonContainer.appendChild(configButton);

        inputContainer.appendChild(this.messageInput);
        inputContainer.appendChild(buttonContainer);

        chatContainer.appendChild(this.messagesContainer);
        chatContainer.appendChild(inputContainer);

        this.container.appendChild(chatContainer);

        // 绑定键盘事件
        this.messageInput.addEventListener('keydown', (e) => {
            if (e.ctrlKey && e.key === 'Enter') {
                this.sendMessage();
            }
        });
    }

    /**
     * 绑定事件监听器
     */
    bindEvents() {
        // 绑定AI模型选择器
        const aiModelSelect = document.getElementById('ai-model');
        if (aiModelSelect) {
            aiModelSelect.addEventListener('change', (e) => {
                this.aiConfig.model = e.target.value;
                this.saveConfig();
            });
        }

        // 绑定API Key输入
        const apiKeyInput = document.getElementById('ai-api-key');
        if (apiKeyInput) {
            apiKeyInput.addEventListener('change', (e) => {
                this.aiConfig.apiKey = e.target.value;
                this.saveConfig();
            });
        }

        // 绑定预设命令按钮
        this.bindPresetCommands();
    }

    /**
     * 绑定预设命令按钮
     */
    bindPresetCommands() {
        const presetCommands = [
            {
                id: 'optimize-layout',
                text: '优化布局结构',
                command: '请分析当前的UI层级结构并提供优化建议'
            },
            {
                id: 'suggest-components',
                text: '推荐组件',
                command: '根据当前设计，推荐适合的UI组件'
            },
            {
                id: 'check-constraints',
                text: '检查约束',
                command: '检查当前的约束配置是否合理'
            },
            {
                id: 'generate-template',
                text: '生成模板',
                command: '为常见的UI场景生成布局模板'
            }
        ];

        presetCommands.forEach(preset => {
            const button = document.getElementById(`ai-${preset.id}`);
            if (button) {
                button.addEventListener('click', () => {
                    this.messageInput.value = preset.command;
                    this.sendMessage();
                });
            }
        });
    }

    /**
     * 加载配置
     */
    loadConfig() {
        try {
            const savedConfig = localStorage.getItem('ai-chat-config');
            if (savedConfig) {
                this.aiConfig = { ...this.aiConfig, ...JSON.parse(savedConfig) };
            }

            // 更新UI中的配置值
            const aiModelSelect = document.getElementById('ai-model');
            if (aiModelSelect) {
                aiModelSelect.value = this.aiConfig.model;
            }

            const apiKeyInput = document.getElementById('ai-api-key');
            if (apiKeyInput) {
                apiKeyInput.value = this.aiConfig.apiKey;
            }

            this.isConnected = !!this.aiConfig.apiKey;
        } catch (error) {
            console.warn('加载AI配置失败:', error);
        }
    }

    /**
     * 保存配置
     */
    saveConfig() {
        try {
            localStorage.setItem('ai-chat-config', JSON.stringify(this.aiConfig));
            this.isConnected = !!this.aiConfig.apiKey;
        } catch (error) {
            console.error('保存AI配置失败:', error);
        }
    }

    /**
     * 更新上下文
     * @param {Object} state - 应用状态
     */
    updateContext(state) {
        this.currentState = state;
    }

    /**
     * 发送消息
     */
    async sendMessage() {
        const message = this.messageInput.value.trim();
        if (!message) return;

        // 添加用户消息
        this.addUserMessage(message);

        // 清空输入框
        this.messageInput.value = '';

        // 禁用发送按钮
        this.setSendButtonState(false);

        try {
            // 检查连接状态
            if (!this.isConnected) {
                this.addSystemMessage('请先配置AI API Key以使用聊天功能。');
                this.setSendButtonState(true);
                return;
            }

            // 准备上下文数据
            const context = this.prepareContext();

            // 发送消息到AI服务
            const response = await this.sendToAIService(message, context);

            // 处理AI响应
            await this.handleAIResponse(response);

        } catch (error) {
            console.error('发送消息失败:', error);
            this.addSystemMessage(`发送消息失败: ${error.message}`);
        } finally {
            // 重新启用发送按钮
            this.setSendButtonState(true);
        }
    }

    /**
     * 准备上下文数据
     * @returns {Object} 上下文数据
     */
    prepareContext() {
        const state = this.currentState || stateManager.getState();

        return {
            currentTree: state.treeData,
            selectedNode: state.selectedNode,
            nodeCount: this.countNodes(state.treeData),
            supportedComponents: dataValidator.getSupportedComponentTypes(),
            constraintsTypes: ['size', 'edge', 'center', 'baseline', 'aspectRatio']
        };
    }

    /**
     * 发送到AI服务（模拟实现）
     * @param {string} message - 用户消息
     * @param {Object} context - 上下文数据
     * @returns {Promise<Object>} AI响应
     */
    async sendToAIService(message, context) {
        // 在实际应用中，这里应该通过Electron主进程调用真实的AI服务
        // 这里使用模拟响应来演示功能

        return new Promise((resolve) => {
            setTimeout(() => {
                const response = this.generateMockResponse(message, context);
                resolve(response);
            }, 1000 + Math.random() * 2000); // 模拟网络延迟
        });
    }

    /**
     * 生成模拟响应
     * @param {string} message - 用户消息
     * @param {Object} context - 上下文数据
     * @returns {Object} 模拟响应
     */
    generateMockResponse(message, context) {
        const lowerMessage = message.toLowerCase();

        // 根据消息内容生成不同的响应
        if (lowerMessage.includes('优化') || lowerMessage.includes('optimize')) {
            return {
                content: `基于您当前的UI层级结构（共${context.nodeCount}个节点），我建议：

1. **布局优化**: 考虑使用UIStackView来管理相关的组件，减少手动约束配置
2. **性能建议**: 对于复杂的层级，建议将静态内容与动态内容分离
3. **可访问性**: 为重要组件添加accessibilityIdentifier属性

需要我执行这些优化吗？`,
                type: 'suggestion',
                actions: ['apply_optimization', 'show_details']
            };
        } else if (lowerMessage.includes('组件') || lowerMessage.includes('component')) {
            return {
                content: `根据iOS设计规范，我推荐以下组件：

🔹 **UIScrollView**: 用于可滚动内容
🔹 **UIStackView**: 自动布局管理
🔹 **UICollectionView**: 复杂网格布局
🔹 **UITabBarController**: 多页面导航

当前支持的所有组件类型：${context.supportedComponents.join(', ')}`,
                type: 'information',
                actions: []
            };
        } else if (lowerMessage.includes('约束') || lowerMessage.includes('constraint')) {
            return {
                content: `约束配置建议：

📐 **尺寸约束**: 使用equal、greaterThanOrEqual、lessThanOrEqual
📍 **边界约束**: 定义组件与父视图或兄弟视图的关系
🎯 **中心约束**: 居中对齐
⚖️ **宽高比约束**: 保持特定比例

当前支持的约束类型：${context.constraintsTypes.join(', ')}`,
                type: 'information',
                actions: ['add_constraint_examples']
            };
        } else {
            return {
                content: `我已经收到您的消息："${message}"

作为iOS UI Editor的AI助手，我可以帮助您：
• 分析和优化UI层级结构
• 推荐合适的UI组件和布局方式
• 检查约束配置的合理性
• 生成常见UI场景的模板
• 执行结构修改命令

请告诉我您需要什么帮助！`,
                type: 'general',
                actions: []
            };
        }
    }

    /**
     * 处理AI响应
     * @param {Object} response - AI响应
     */
    async handleAIResponse(response) {
        // 添加AI消息
        this.addAIMessage(response.content);

        // 处理响应中的操作
        if (response.actions && response.actions.length > 0) {
            this.showActionButtons(response.actions);
        }

        // 检查是否需要执行命令
        await this.executeAICommands(response);
    }

    /**
     * 显示操作按钮
     * @param {Array} actions - 操作列表
     */
    showActionButtons(actions) {
        const actionContainer = document.createElement('div');
        actionContainer.className = 'ai-actions';

        actions.forEach(action => {
            const button = document.createElement('button');
            button.className = 'btn-action';
            button.textContent = this.getActionLabel(action);
            button.addEventListener('click', () => this.handleAction(action));
            actionContainer.appendChild(button);
        });

        this.messagesContainer.appendChild(actionContainer);
        this.scrollToBottom();
    }

    /**
     * 获取操作标签
     * @param {string} action - 操作类型
     * @returns {string} 操作标签
     */
    getActionLabel(action) {
        const labels = {
            'apply_optimization': '应用优化',
            'show_details': '查看详情',
            'add_constraint_examples': '添加约束示例',
            'generate_template': '生成模板'
        };
        return labels[action] || action;
    }

    /**
     * 处理操作
     * @param {string} action - 操作类型
     */
    handleAction(action) {
        switch (action) {
            case 'apply_optimization':
                this.applyOptimization();
                break;
            case 'add_constraint_examples':
                this.addConstraintExamples();
                break;
            case 'generate_template':
                this.generateTemplate();
                break;
            default:
                this.addSystemMessage(`执行操作: ${action}`);
        }
    }

    /**
     * 执行AI命令
     * @param {Object} response - AI响应
     */
    async executeAICommands(response) {
        // 在实际应用中，这里会解析AI返回的结构化命令
        // 并执行相应的修改操作

        if (response.type === 'suggestion') {
            // 可以自动执行一些优化建议
            // 例如：this.applyAISuggestions(response.content);
        }
    }

    /**
     * 应用优化建议
     */
    applyOptimization() {
        this.addSystemMessage('正在应用优化建议...');

        // 模拟优化操作
        setTimeout(() => {
            this.addSystemMessage('优化已应用！建议使用UIStackView简化布局。');
        }, 1000);
    }

    /**
     * 添加约束示例
     */
    addConstraintExamples() {
        const examples = [
            {
                package: 'sizeExample',
                type: 'size',
                method: 'equal',
                value: 100,
                reference: ''
            },
            {
                package: 'edgeExample',
                type: 'edge',
                method: 'equal',
                value: 20,
                reference: 'superview'
            }
        ];

        examples.forEach(example => {
            // 添加到当前选中的节点或根节点
            const currentNode = stateManager.getState().selectedNode;
            if (currentNode) {
                // 使用constraintPackages字段，如果不存在则创建
                const constraintPackages = [...(currentNode.constraintPackages || [])];
                if (constraintPackages.length === 0) {
                    // 如果没有约束包，创建一个默认包
                    constraintPackages.push({
                        id: `pkg_${Date.now()}`,
                        name: '默认约束包',
                        isDefault: true,
                        constraints: [example]
                    });
                } else {
                    // 将示例约束添加到第一个包中
                    const defaultPackage = constraintPackages.find(pkg => pkg.isDefault) || constraintPackages[0];
                    defaultPackage.constraints = [...(defaultPackage.constraints || []), example];
                }
                stateManager.updateNode(currentNode.id, { constraintPackages });
            }
        });

        this.addSystemMessage('已添加约束示例到当前节点');
    }

    /**
     * 生成模板
     */
    generateTemplate() {
        const template = dataService.generateTemplate('basic');
        dataService.importData(template);
        this.addSystemMessage('已生成基础UI模板');
    }

    /**
     * 添加用户消息
     * @param {string} message - 消息内容
     */
    addUserMessage(message) {
        this.addMessage(message, 'user');
    }

    /**
     * 添加AI消息
     * @param {string} message - 消息内容
     */
    addAIMessage(message) {
        this.addMessage(message, 'ai');
    }

    /**
     * 添加系统消息
     * @param {string} message - 消息内容
     */
    addSystemMessage(message) {
        this.addMessage(message, 'system');
    }

    /**
     * 添加消息
     * @param {string} content - 消息内容
     * @param {string} type - 消息类型 (user|ai|system)
     */
    addMessage(content, type) {
        const message = {
            id: Date.now(),
            content: content,
            type: type,
            timestamp: new Date().toISOString()
        };

        this.messages.push(message);

        // 创建消息元素
        const messageElement = document.createElement('div');
        messageElement.className = `chat-message ${type}-message`;
        messageElement.innerHTML = `
            <div class="message-content">${this.formatMessage(content)}</div>
            <div class="message-time">${this.formatTime(message.timestamp)}</div>
        `;

        this.messagesContainer.appendChild(messageElement);
        this.scrollToBottom();

        // 保存到状态管理器
        stateManager.addChatMessage(message);
    }

    /**
     * 格式化消息内容
     * @param {string} content - 消息内容
     * @returns {string} 格式化后的HTML
     */
    formatMessage(content) {
        // 简单的Markdown样式格式化
        return content
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\*(.*?)\*/g, '<em>$1</em>')
            .replace(/`(.*?)`/g, '<code>$1</code>')
            .replace(/\n/g, '<br>')
            .replace(/🔹/g, '•')
            .replace(/📐/g, '📏')
            .replace(/📍/g, '📌')
            .replace(/🎯/g, '🎯')
            .replace(/⚖️/g, '⚖️');
    }

    /**
     * 格式化时间
     * @param {string} timestamp - ISO时间字符串
     * @returns {string} 格式化后的时间
     */
    formatTime(timestamp) {
        const date = new Date(timestamp);
        return date.toLocaleTimeString('zh-CN', {
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    /**
     * 滚动到底部
     */
    scrollToBottom() {
        this.messagesContainer.scrollTop = this.messagesContainer.scrollHeight;
    }

    /**
     * 清除聊天
     */
    clearChat() {
        if (confirm('确定要清除所有聊天记录吗？')) {
            this.messages = [];
            this.messagesContainer.innerHTML = '';
            stateManager.clearChatHistory();
            this.addSystemMessage('聊天记录已清除');
        }
    }

    /**
     * 显示配置对话框
     */
    showConfigDialog() {
        // 简化的配置对话框
        const apiKey = prompt('请输入AI API Key:', this.aiConfig.apiKey);
        if (apiKey !== null) {
            this.aiConfig.apiKey = apiKey;
            this.saveConfig();
            this.addSystemMessage('AI配置已更新');
        }
    }

    /**
     * 设置发送按钮状态
     * @param {boolean} enabled - 是否启用
     */
    setSendButtonState(enabled) {
        this.sendButton.disabled = !enabled;
        this.sendButton.textContent = enabled ? '发送' : '发送中...';
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
     * 获取聊天历史
     * @returns {Array} 聊天历史
     */
    getChatHistory() {
        return this.messages;
    }

    /**
     * 导出聊天记录
     */
    exportChat() {
        try {
            const chatData = {
                exportTime: new Date().toISOString(),
                messages: this.messages
            };

            const blob = new Blob([JSON.stringify(chatData, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);

            const a = document.createElement('a');
            a.href = url;
            a.download = `ai-chat-${new Date().toISOString().split('T')[0]}.json`;
            a.click();

            URL.revokeObjectURL(url);

            this.addSystemMessage('聊天记录已导出');
        } catch (error) {
            this.addSystemMessage(`导出聊天记录失败: ${error.message}`);
        }
    }

    /**
     * 销毁组件
     */
    destroy() {
        // 清理事件监听器和DOM元素
        this.container.innerHTML = '';
    }
}

// 创建全局AI聊天助手实例
let aiChatAssistant = null;

// 初始化AI聊天助手
document.addEventListener('DOMContentLoaded', () => {
    aiChatAssistant = new AIChatAssistant('ai-chat-container');
});

// 导出AI聊天助手
window.aiChatAssistant = aiChatAssistant;

console.log('🤖 AI聊天助手已加载');
