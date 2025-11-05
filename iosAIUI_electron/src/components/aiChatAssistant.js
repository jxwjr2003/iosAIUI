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

        // DeepSeek配置
        this.deepSeekConfig = {
            url: 'https://api.deepseek.com/v1',
            apiKey: '',
            model: '',
            models: []
        };
        this.isConnected = false;

        // 初始化组件
        this.init();
    }

    /**
     * 初始化AI聊天助手
     */
    init() {
        // 创建聊天界面结构
        this.createChatInterface();

        // 确保在DOM完全加载后绑定事件
        if (document.readyState === 'complete' || document.readyState === 'interactive') {
            this.bindDialogEvents();
        } else {
            document.addEventListener('DOMContentLoaded', () => {
                this.bindDialogEvents();
            });
        }

        // 加载配置
        this.loadDeepSeekConfig();

        // 订阅状态变化
        stateManager.subscribe((state) => {
            this.updateContext(state);
        });

        // 显示欢迎消息
        this.addSystemMessage('欢迎使用AI聊天助手！我可以帮助您优化UI层级结构、提供设计建议和执行修改命令。');

        console.log('🤖 AI聊天助手初始化完成');
    }

    /**
     * 绑定对话框事件
     */
    bindDialogEvents() {
        // AI命令确认对话框已删除，不再需要绑定相关事件
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
        configButton.addEventListener('click', () => this.showDeepSeekConfigDialog());

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
     * 加载DeepSeek配置
     */
    loadDeepSeekConfig() {
        try {
            const savedConfig = localStorage.getItem('deepseek-config');
            if (savedConfig) {
                const config = JSON.parse(savedConfig);
                this.deepSeekConfig = {
                    ...this.deepSeekConfig,
                    url: config.url || this.deepSeekConfig.url,
                    apiKey: config.apiKey || '',
                    model: config.model || '',
                    models: config.models || []
                };
                this.isConnected = !!this.deepSeekConfig.apiKey && !!this.deepSeekConfig.model;
            }
        } catch (error) {
            console.warn('配置加载失败，清除错误配置', error);
            localStorage.removeItem('deepseek-config');
        }
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
     * 发送到AI服务
     * @param {string} message - 用户消息
     * @param {Object} context - 上下文数据
     * @returns {Promise<Object>} AI响应
     */
    async sendToAIService(message, context) {
        // 检查连接状态
        if (!this.isConnected) {
            throw new Error('请先配置AI API Key以使用聊天功能。');
        }

        try {
            // 通过Electron主进程调用DeepSeek API
            // 清理API密钥，确保只包含ASCII字符
            const cleanApiKey = this.deepSeekConfig.apiKey.replace(/[^\x00-\x7F]/g, '');

            // 验证清理后的API密钥
            if (!cleanApiKey) {
                throw new Error('API密钥无效：必须包含ASCII字符');
            }

            const response = await window.electronAPI.deepseekChat({
                url: this.deepSeekConfig.url,
                apiKey: cleanApiKey,
                model: this.deepSeekConfig.model,
                message: message,
                context: context
            });

            if (!response.success) {
                throw new Error(response.error || 'AI服务返回错误');
            }

            // 解析AI响应
            return {
                content: response.response,
                type: 'suggestion',
                actions: ['apply_commands']
            };
        } catch (error) {
            console.error('AI服务调用失败:', error);
            throw error;
        }
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
        // 尝试解析为命令
        let commands = null;
        try {
            // 尝试解析整个响应内容
            commands = JSON.parse(response.content);
            // 如果解析成功，可能是单个命令或命令数组
            if (!Array.isArray(commands)) {
                commands = [commands];
            }
        } catch (e) {
            // 解析失败，作为普通消息
            this.addAIMessage(response.content);
        }

        if (commands) {
            // 显示命令确认界面
            this.showCommandConfirmation(commands);
        } else {
            // 处理响应中的操作
            if (response.actions && response.actions.length > 0) {
                this.showActionButtons(response.actions);
            }
        }
    }

    /**
     * 显示命令确认界面
     * @param {Array} commands - 命令列表
     */
    showCommandConfirmation(commands) {
        // AI命令确认对话框已删除，直接执行命令
        console.log('🤖 AI返回的命令:', commands);
        this.executeCommands(commands);
    }

    /**
     * 格式化命令描述
     * @param {Object} command - 命令对象
     * @returns {string} 格式化后的描述
     */
    formatCommandDescription(command) {
        switch (command.action) {
            case 'add':
                return `添加节点: ${command.node.type} (${command.node.id})`;
            case 'delete':
                return `删除节点: ${command.nodeId}`;
            case 'update':
                return `更新节点: ${command.nodeId} (${Object.keys(command.updates).join(', ')})`;
            case 'move':
                return `移动节点: ${command.nodeId} 到 ${command.newParentId}`;
            default:
                return JSON.stringify(command);
        }
    }

    /**
     * 执行多个命令
     * @param {Array} commands - 命令列表
     */
    async executeCommands(commands) {
        for (const command of commands) {
            try {
                await this.executeCommand(command);
                // 记录成功执行
                this.addSystemMessage(`✅ 执行成功: ${this.formatCommandDescription(command)}`);
            } catch (error) {
                this.addSystemMessage(`❌ 执行失败: ${error.message}`);
                // 如果一个命令失败，停止后续命令
                break;
            }
        }
    }

    /**
     * 执行单个命令
     * @param {Object} command - 命令对象
     */
    async executeCommand(command) {
        switch (command.action) {
            case 'add':
                await this.executeAddCommand(command);
                break;
            case 'delete':
                await this.executeDeleteCommand(command);
                break;
            case 'update':
                await this.executeUpdateCommand(command);
                break;
            case 'move':
                await this.executeMoveCommand(command);
                break;
            default:
                throw new Error(`未知命令类型: ${command.action}`);
        }
    }

    /**
     * 执行添加节点命令
     * @param {Object} command - 命令对象
     */
    async executeAddCommand(command) {
        const { node, parentId } = command;
        if (!node) {
            throw new Error('缺少节点数据');
        }

        // 如果没有指定父节点，使用当前选中节点
        const parent = parentId || stateManager.getState().selectedNode?.id || stateManager.getRootNodeId();
        if (!parent) {
            throw new Error('找不到父节点');
        }

        // 添加节点
        stateManager.addNode(node, parent);
    }

    /**
     * 执行删除节点命令
     * @param {Object} command - 命令对象
     */
    async executeDeleteCommand(command) {
        const { nodeId } = command;
        if (!nodeId) {
            throw new Error('缺少节点ID');
        }

        // 删除节点
        stateManager.deleteNode(nodeId);
    }

    /**
     * 执行更新节点命令
     * @param {Object} command - 命令对象
     */
    async executeUpdateCommand(command) {
        const { nodeId, updates } = command;
        if (!nodeId || !updates) {
            throw new Error('缺少节点ID或更新数据');
        }

        // 更新节点
        stateManager.updateNode(nodeId, updates);
    }

    /**
     * 执行移动节点命令
     * @param {Object} command - 命令对象
     */
    async executeMoveCommand(command) {
        const { nodeId, newParentId } = command;
        if (!nodeId || !newParentId) {
            throw new Error('缺少节点ID或新父节点ID');
        }

        // 移动节点
        stateManager.moveNode(nodeId, newParentId);
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
        // 创建更完整的配置对话框
        const configDialog = document.createElement('div');
        configDialog.className = 'ai-config-dialog';
        configDialog.innerHTML = `
            <div class="config-header">
                <h3>AI配置</h3>
                <button class="close-btn">&times;</button>
            </div>
            <div class="config-body">
                <div class="config-section">
                    <h4>通用配置</h4>
                    <div class="config-field">
                        <label for="ai-api-key">API Key:</label>
                        <input type="password" id="ai-api-key" placeholder="输入AI API Key" value="${this.aiConfig.apiKey}">
                    </div>
                    <div class="config-field">
                        <label for="ai-model">模型:</label>
                        <input type="text" id="ai-model" placeholder="模型名称" value="${this.aiConfig.model}">
                    </div>
                </div>
                <div class="config-actions">
                    <button id="save-ai-config" class="btn-primary">保存配置</button>
                    <button id="deepseek-config" class="btn-secondary">DeepSeek配置</button>
                </div>
            </div>
        `;

        // 添加到DOM并绑定事件
        document.body.appendChild(configDialog);

        // 绑定事件
        document.querySelector('.close-btn').addEventListener('click', () => configDialog.remove());
        document.getElementById('save-ai-config').addEventListener('click', () => {
            this.aiConfig.apiKey = document.getElementById('ai-api-key').value;
            this.aiConfig.model = document.getElementById('ai-model').value;
            this.saveConfig();
            this.addSystemMessage('AI配置已更新');
            configDialog.remove();
        });
        document.getElementById('deepseek-config').addEventListener('click', () => {
            configDialog.remove();
            this.showDeepSeekConfigDialog();
        });
    }

    /**
     * 显示DeepSeek配置对话框
     */
    showDeepSeekConfigDialog() {
        const configDialog = document.createElement('div');
        configDialog.className = 'ai-config-dialog deepseek-config';
        configDialog.innerHTML = `
            <div class="config-header">
                <h3>DeepSeek配置</h3>
                <button class="close-btn">&times;</button>
            </div>
            <div class="config-body">
                <div class="config-field">
                    <label for="deepseek-url">服务地址:</label>
                    <input type="url" id="deepseek-url" placeholder="https://api.deepseek.com/v1" 
                           value="${this.deepSeekConfig.url || ''}">
                </div>
                <div class="config-field">
                    <label for="deepseek-api-key">API Key:</label>
                    <input type="password" id="deepseek-api-key" placeholder="输入DeepSeek API Key"
                           value="${this.deepSeekConfig.apiKey || ''}">
                </div>
                <div class="config-field">
                    <label for="deepseek-model">模型:</label>
                    <select id="deepseek-model">
                        <option value="">请选择模型</option>
                        ${this.deepSeekConfig.models?.map(model =>
            `<option value="${model.id}" ${model.id === this.deepSeekConfig.model ? 'selected' : ''}>
                                ${model.id}
                            </option>`
        ).join('') || ''}
                    </select>
                    <button id="refresh-models" class="btn-secondary">刷新模型列表</button>
                    <div id="model-status" class="status-message"></div>
                </div>
                <div class="config-actions">
                    <button id="test-connection" class="btn-secondary">测试连接</button>
                    <button id="save-deepseek-config" class="btn-primary">保存配置</button>
                </div>
            </div>
        `;

        // 添加到DOM并绑定事件
        document.body.appendChild(configDialog);

        // 绑定事件
        document.querySelector('.close-btn').addEventListener('click', () => configDialog.remove());
        document.getElementById('refresh-models').addEventListener('click', () => this.refreshDeepSeekModels());
        document.getElementById('test-connection').addEventListener('click', () => this.testDeepSeekConnection());
        document.getElementById('save-deepseek-config').addEventListener('click', () => this.saveDeepSeekConfig());

        // 自动尝试获取模型列表（如果已有配置）
        this.autoRefreshModels();
    }

    /**
     * 自动刷新模型列表
     */
    async autoRefreshModels() {
        const url = document.getElementById('deepseek-url').value;
        const apiKey = document.getElementById('deepseek-api-key').value;

        if (url && apiKey && (!this.deepSeekConfig.models || this.deepSeekConfig.models.length === 0)) {
            try {
                this.setModelStatus('正在自动获取模型列表...', 'loading');
                const models = await this.fetchDeepSeekModels(url, apiKey);
                this.updateModelSelect(models);
                this.setModelStatus(`已加载 ${models.length} 个模型`, 'success');
            } catch (error) {
                this.setModelStatus(`自动获取失败: ${error.message}`, 'error');
            }
        }
    }

    /**
     * 设置模型状态消息
     * @param {string} message - 状态消息
     * @param {string} type - 消息类型 (loading|success|error)
     */
    setModelStatus(message, type = 'info') {
        const statusElement = document.getElementById('model-status');
        if (statusElement) {
            statusElement.textContent = message;
            statusElement.className = `status-message status-${type}`;
        }
    }

    /**
     * 刷新DeepSeek模型列表
     */
    async refreshDeepSeekModels() {
        const url = document.getElementById('deepseek-url').value;
        const apiKey = document.getElementById('deepseek-api-key').value;

        if (!url || !apiKey) {
            alert('请先填写服务地址和API Key');
            return;
        }

        try {
            this.setLoadingState(true);
            const models = await this.fetchDeepSeekModels(url, apiKey);
            this.updateModelSelect(models);
            this.setLoadingState(false);
        } catch (error) {
            this.setLoadingState(false);
            alert(`获取模型列表失败: ${error.message}`);
        }
    }

    /**
     * 获取DeepSeek模型列表
     */
    async fetchDeepSeekModels(url, apiKey) {
        try {
            // 1. 首先尝试通过Electron主进程调用DeepSeek API
            if (window.electronAPI && window.electronAPI.invoke) {
                const response = await window.electronAPI.invoke('deepseek-models', { url, apiKey });

                if (response && response.success) {
                    return response.models;
                } else {
                    throw new Error(response?.error || '获取模型列表失败');
                }
            } else {
                // 2. 如果Electron API不可用，尝试使用浏览器fetch
                return await this.fetchDeepSeekModelsViaBrowser(url, apiKey);
            }
        } catch (error) {
            console.error('获取DeepSeek模型失败:', error);
            throw error;
        }
    }

    /**
     * 通过浏览器fetch获取DeepSeek模型列表
     */
    async fetchDeepSeekModelsViaBrowser(url, apiKey) {
        try {
            // 清理API密钥，确保只包含ASCII字符
            const cleanApiKey = apiKey.replace(/[^\x00-\x7F]/g, '');

            // 验证清理后的API密钥
            if (!cleanApiKey) {
                throw new Error('API密钥无效：必须包含ASCII字符');
            }

            // 开发模式下使用模拟数据
            if (this.isDevelopmentMode()) {
                this.setModelStatus('开发模式：使用模拟数据', 'info');
                return [
                    { id: 'deepseek-chat', name: 'deepseek-chat' },
                    { id: 'deepseek-coder', name: 'deepseek-coder' }
                ];
            }

            this.setModelStatus('正在通过浏览器获取模型列表...', 'loading');
            this.setModelStatus('注意：浏览器模式可能受CORS限制', 'info');

            const response = await fetch(`${url}/models`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${cleanApiKey}`,
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                }
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.error?.message || `HTTP错误! 状态: ${response.status}`);
            }

            const data = await response.json();
            return data.data || [];
        } catch (error) {
            console.error('通过浏览器获取模型列表失败:', error);

            // 如果是CORS错误，提供更友好的提示
            if (error.message.includes('CORS')) {
                throw new Error('无法获取模型列表：浏览器CORS限制。请使用Electron应用或配置代理服务器');
            }

            throw new Error(`无法获取模型列表: ${error.message}`);
        }
    }

    /**
     * 检查是否为开发模式
     */
    isDevelopmentMode() {
        const hostname = window.location.hostname;
        return hostname === 'localhost' ||
            hostname === '127.0.0.1' ||
            hostname === '[::1]' ||  // IPv6 localhost
            hostname.endsWith('.local');  // 常见的开发环境域名
    }

    /**
     * 更新模型选择器
     */
    updateModelSelect(models) {
        const modelSelect = document.getElementById('deepseek-model');
        if (!modelSelect) return;

        // 保存模型列表
        this.deepSeekConfig.models = models;

        // 更新选择器选项
        modelSelect.innerHTML = '<option value="">请选择模型</option>' +
            models.map(model =>
                `<option value="${model.id}">${model.id}</option>`
            ).join('');
    }

    /**
     * 测试DeepSeek连接
     */
    async testDeepSeekConnection() {
        const url = document.getElementById('deepseek-url').value;
        const apiKey = document.getElementById('deepseek-api-key').value;

        if (!url || !apiKey) {
            alert('请先填写服务地址和API Key');
            return;
        }

        try {
            this.setLoadingState(true);
            const result = await this.testDeepSeekAPI(url, apiKey);
            this.setLoadingState(false);
            alert(`连接测试成功！\n服务状态: ${result.status}\n模型数量: ${result.modelCount}`);
        } catch (error) {
            this.setLoadingState(false);
            alert(`连接测试失败: ${error.message}`);
        }
    }

    /**
     * 测试DeepSeek API连接
     */
    async testDeepSeekAPI(url, apiKey) {
        try {
            // 1. 首先尝试通过Electron主进程测试连接
            if (window.electronAPI && window.electronAPI.invoke) {
                const response = await window.electronAPI.invoke('deepseek-test', { url, apiKey });

                if (response && response.success) {
                    return response.data;
                } else {
                    throw new Error(response?.error || '连接测试失败');
                }
            } else {
                // 2. 如果Electron API不可用，尝试使用浏览器fetch
                return await this.testDeepSeekConnectionViaBrowser(url, apiKey);
            }
        } catch (error) {
            console.error('测试DeepSeek连接失败:', error);
            throw error;
        }
    }

    /**
     * 通过浏览器fetch测试DeepSeek连接
     */
    async testDeepSeekConnectionViaBrowser(url, apiKey) {
        try {
            // 开发模式下使用模拟数据
            if (this.isDevelopmentMode()) {
                this.setModelStatus('开发模式：使用模拟数据', 'info');
                return {
                    status: 'connected',
                    modelCount: 2
                };
            }

            this.setModelStatus('正在测试连接...', 'loading');
            this.setModelStatus('注意：浏览器模式可能受CORS限制', 'info');

            const response = await fetch(`${url}/models`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${apiKey}`,
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                }
            });

            if (response.ok) {
                const data = await response.json();
                return {
                    status: 'connected',
                    modelCount: data.data?.length || 0
                };
            } else {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.error?.message || `HTTP错误! 状态: ${response.status}`);
            }
        } catch (error) {
            console.error('通过浏览器测试连接失败:', error);

            // 如果是CORS错误，提供更友好的提示
            if (error.message.includes('CORS')) {
                throw new Error('连接测试失败：浏览器CORS限制。请使用Electron应用或配置代理服务器');
            }

            throw new Error(`连接测试失败: ${error.message}`);
        }
    }

    /**
     * 保存DeepSeek配置
     */
    saveDeepSeekConfig() {
        const config = {
            url: document.getElementById('deepseek-url').value,
            apiKey: document.getElementById('deepseek-api-key').value,
            model: document.getElementById('deepseek-model').value,
            // 仅保存必要字段
            models: (this.deepSeekConfig.models || []).map(m => ({ id: m.id, name: m.name }))
        };

        try {
            localStorage.setItem('deepseek-config', JSON.stringify(config));
            this.deepSeekConfig = config;
            this.isConnected = !!config.apiKey && !!config.model;
            alert('DeepSeek配置已保存');
        } catch (e) {
            console.error('配置保存失败', e);
            alert('配置保存失败: ' + e.message);
        }
        document.querySelector('.deepseek-config').remove();
    }

    /**
     * 设置加载状态
     */
    setLoadingState(loading) {
        const buttons = document.querySelectorAll('.deepseek-config button');
        buttons.forEach(button => {
            button.disabled = loading;
        });
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
     * 更新上下文状态
     * @param {Object} state - 最新状态
     */
    updateContext(state) {
        this.currentState = state;
        console.log('🔄 AI聊天助手上下文已更新', state);
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
