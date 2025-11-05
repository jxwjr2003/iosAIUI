/**
 * UI 树形编辑器组件
 * 负责可视化编辑UI组件层级关系，支持增删改查、拖拽排序等功能
 */
class TreeEditor {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
        this.selectedNode = null;
        this.copiedNode = null;
        this.isDragging = false;
        this.dragSource = null;
        this.dragTarget = null;

        // 初始化组件
        this.init();
    }

    /**
     * 初始化树形编辑器
     */
    init() {
        // 创建树形容器
        this.treeContainer = document.createElement('div');
        this.treeContainer.className = 'tree-container';
        this.container.appendChild(this.treeContainer);

        // 在树容器上添加捕获阶段的事件监听器
        this.treeContainer.addEventListener('click', (e) => {
            // 尝试找到最近的树节点元素
            const treeNode = e.target.closest('.tree-node');
            console.log('🎯 [TreeEditor] 捕获阶段点击事件:', {
                '目标元素': e.target.tagName,
                '目标类名': e.target.className,
                '目标ID': e.target.id,
                '最近树节点': treeNode ? treeNode.dataset.nodeId : '无',
                '事件阶段': '捕获阶段',
                '时间戳': new Date().toISOString()
            });
        }, true); // true 表示捕获阶段

        // 绑定事件监听器
        this.bindEvents();

        // 订阅状态变化
        stateManager.subscribe((state) => {
            console.log('🔄 [TreeEditor] 状态变化:', {
                'treeData变化': JSON.stringify(state.treeData) !== JSON.stringify(this.lastTreeData),
                'selectedNode变化': state.selectedNode?.id !== this.selectedNode?.id,
                '时间戳': new Date().toISOString()
            });

            // 只有当树数据确实发生变化时才重新渲染
            const shouldRender = JSON.stringify(state.treeData) !== JSON.stringify(this.lastTreeData);
            if (shouldRender) {
                this.render(state.treeData);
                this.lastTreeData = JSON.parse(JSON.stringify(state.treeData)); // 深拷贝
            }

            // 总是更新选中节点
            this.updateSelectedNode(state.selectedNode);
        });

        // 初始渲染
        this.render(stateManager.getState().treeData);
    }

    /**
     * 绑定事件监听器
     */
    bindEvents() {
        // 绑定工具栏按钮事件
        document.getElementById('expand-all-btn')?.addEventListener('click', () => this.expandAll());
        document.getElementById('collapse-all-btn')?.addEventListener('click', () => this.collapseAll());
        document.getElementById('search-tree-btn')?.addEventListener('click', () => this.showSearch());
        document.getElementById('new-root-btn')?.addEventListener('click', () => this.addRootNode());

        // 绑定键盘事件
        document.addEventListener('keydown', (e) => this.handleKeydown(e));
    }

    /**
     * 渲染树形结构
     * @param {Array} treeData - 树形数据
     */
    render(treeData) {
        if (!treeData || treeData.length === 0) {
            this.treeContainer.innerHTML = `
                <div class="tree-empty-state">
                    <p>暂无UI层级数据</p>
                    <button id="create-first-node" class="btn-primary">创建第一个节点</button>
                </div>
            `;
            document.getElementById('create-first-node')?.addEventListener('click', () => this.addRootNode());
            return;
        }

        this.treeContainer.innerHTML = '';
        this.renderNodes(treeData, 0);
    }

    /**
     * 递归渲染节点
     * @param {Array} nodes - 节点数组
     * @param {number} level - 当前层级
     */
    renderNodes(nodes, level) {
        nodes.forEach((node, index) => {
            const nodeElement = this.createNodeElement(node, level, index);
            this.treeContainer.appendChild(nodeElement);

            // 递归渲染子节点
            if (node.children && node.children.length > 0) {
                this.renderNodes(node.children, level + 1);
            }
        });
    }

    /**
     * 创建节点元素
     * @param {Object} node - 节点数据
     * @param {number} level - 节点层级（从0开始）
     * @param {number} index - 节点索引
     * @returns {HTMLElement} 节点元素
     */
    createNodeElement(node, level = 0, index = 0) {
        console.log('🌳 [TreeEditor] 创建节点元素:', {
            '节点ID': node.id,
            '节点名称': node.name,
            '节点类型': node.type,
            '层级': level,
            '索引': index
        });

        const nodeElement = document.createElement('div');
        nodeElement.className = 'tree-node';
        nodeElement.dataset.nodeId = node.id;
        nodeElement.dataset.nodeIndex = index;
        nodeElement.dataset.nodeLevel = level;

        // 创建节点内容
        const nodeContent = document.createElement('div');
        nodeContent.className = 'tree-node-content';

        // 缩进指示器
        const indentSpacer = document.createElement('div');
        indentSpacer.className = `node-indent indent-level-${level}`;
        nodeContent.appendChild(indentSpacer);

        // 节点ID
        const nodeId = document.createElement('span');
        nodeId.className = 'node-id';
        nodeId.textContent = node.id;
        nodeContent.appendChild(nodeId);

        // 节点名称
        const nodeName = document.createElement('span');
        nodeName.className = 'node-name';
        nodeName.textContent = node.name;
        nodeContent.appendChild(nodeName);

        // 节点类型
        const nodeType = document.createElement('span');
        nodeType.className = 'node-type';
        nodeType.textContent = node.type;
        nodeContent.appendChild(nodeType);

        // 节点操作按钮
        const nodeActions = document.createElement('div');
        nodeActions.className = 'node-actions';

        // 添加子节点按钮
        const addChildBtn = document.createElement('button');
        addChildBtn.className = 'node-action-btn';
        addChildBtn.innerHTML = '+';
        addChildBtn.title = '添加子节点';
        addChildBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            this.showComponentTypeDialog(node.id);
        });

        // 删除节点按钮
        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'node-action-btn';
        deleteBtn.innerHTML = '×';
        deleteBtn.title = '删除节点';
        deleteBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            this.deleteNode(node.id);
        });

        // 复制节点按钮
        const copyBtn = document.createElement('button');
        copyBtn.className = 'node-action-btn';
        copyBtn.innerHTML = '📋';
        copyBtn.title = '复制节点';
        copyBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            this.copyNode(node);
        });

        // 粘贴子节点按钮
        const pasteBtn = document.createElement('button');
        pasteBtn.className = 'node-action-btn';
        pasteBtn.innerHTML = '📝';
        pasteBtn.title = '粘贴子节点';
        pasteBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            this.pasteChildNode(node.id);
        });

        nodeActions.appendChild(addChildBtn);
        nodeActions.appendChild(copyBtn);
        nodeActions.appendChild(pasteBtn);
        nodeActions.appendChild(deleteBtn);
        nodeContent.appendChild(nodeActions);

        nodeElement.appendChild(nodeContent);

        // 添加点击事件
        nodeElement.addEventListener('click', (e) => {
            console.log('🖱️ [TreeEditor] 节点点击事件触发:', {
                '节点ID': node.id,
                '节点名称': node.name,
                '事件目标': e.target.className,
                '时间戳': new Date().toISOString()
            });
            e.stopPropagation();
            this.selectNode(node);
        });

        // 添加拖拽事件
        this.makeNodeDraggable(nodeElement);

        return nodeElement;
    }

    /**
     * 使节点可拖拽
     * @param {HTMLElement} nodeElement - 节点元素
     */
    makeNodeDraggable(nodeElement) {
        nodeElement.draggable = true;

        nodeElement.addEventListener('dragstart', (e) => {
            this.isDragging = true;
            this.dragSource = nodeElement;
            e.dataTransfer.setData('text/plain', nodeElement.dataset.nodeId);
            nodeElement.classList.add('dragging');
        });

        nodeElement.addEventListener('dragend', (e) => {
            this.isDragging = false;
            this.dragSource = null;
            this.dragTarget = null;
            nodeElement.classList.remove('dragging');
            document.querySelectorAll('.tree-node').forEach(node => {
                node.classList.remove('drag-over');
            });
        });

        nodeElement.addEventListener('dragover', (e) => {
            e.preventDefault();
            if (this.isDragging && this.dragSource !== nodeElement) {
                this.dragTarget = nodeElement;
                nodeElement.classList.add('drag-over');
            }
        });

        nodeElement.addEventListener('dragleave', (e) => {
            if (this.isDragging && this.dragSource !== nodeElement) {
                nodeElement.classList.remove('drag-over');
            }
        });

        nodeElement.addEventListener('drop', (e) => {
            e.preventDefault();
            if (this.isDragging && this.dragSource && this.dragTarget) {
                const sourceNodeId = this.dragSource.dataset.nodeId;
                const targetNodeId = this.dragTarget.dataset.nodeId;

                if (sourceNodeId !== targetNodeId) {
                    this.moveNode(sourceNodeId, targetNodeId);
                }

                nodeElement.classList.remove('drag-over');
            }
        });
    }

    /**
     * 选择节点
     * @param {Object} node - 节点数据
     */
    selectNode(node) {
        console.log('🌳 [TreeEditor] selectNode 被调用:', {
            '节点ID': node?.id,
            '节点名称': node?.name,
            '节点类型': node?.type,
            '当前选中节点ID': this.selectedNode?.id,
            '时间戳': new Date().toISOString()
        });

        this.selectedNode = node;
        stateManager.setSelectedNode(node);

        // 更新UI选中状态
        document.querySelectorAll('.tree-node').forEach(nodeElement => {
            nodeElement.classList.remove('selected');
        });

        // 使用更精确的选择器确保正确匹配节点
        const selectedElement = document.querySelector(`.tree-node[data-node-id="${node.id}"]`);
        if (selectedElement) {
            selectedElement.classList.add('selected');
            console.log('✅ [TreeEditor] UI选中状态已更新:', node.id);
        } else {
            console.log('❌ [TreeEditor] 未找到对应的DOM元素:', node.id);
        }
    }

    /**
     * 更新选中的节点
     * @param {Object} node - 节点数据
     */
    updateSelectedNode(node) {
        if (node && node.id !== this.selectedNode?.id) {
            this.selectedNode = node;

            // 更新UI选中状态
            document.querySelectorAll('.tree-node').forEach(nodeElement => {
                nodeElement.classList.remove('selected');
            });

            // 使用更精确的选择器确保正确匹配节点
            const selectedElement = document.querySelector(`.tree-node[data-node-id="${node.id}"]`);
            if (selectedElement) {
                selectedElement.classList.add('selected');
            }
        }
    }

    /**
     * 添加根节点
     */
    addRootNode() {
        this.showComponentTypeDialog(null);
    }

    /**
     * 显示组件类型选择对话框
     * @param {string|null} parentId - 父节点ID，null表示根节点
     */
    showComponentTypeDialog(parentId) {
        // 直接创建默认的UIView节点，不再显示对话框
        this.createNewNode(parentId, 'UIView');
    }

    /**
     * 清理对话框事件监听器
     */
    cleanupDialogEvents(confirmBtn, cancelBtn, confirmHandler, cancelHandler) {
        confirmBtn.removeEventListener('click', confirmHandler);
        cancelBtn.removeEventListener('click', cancelHandler);
    }

    /**
     * 创建新节点
     * @param {string|null} parentId - 父节点ID
     * @param {string} componentType - 组件类型
     */
    createNewNode(parentId, componentType) {
        const newNode = {
            id: parentId ?
                nodeIdGenerator.generateChildId(parentId, this.getChildCount(parentId)) :
                nodeIdGenerator.generateRootId(),
            name: this.generateDefaultName(componentType),
            type: componentType,
            attributes: {},
            constraintPackages: [],
            memberVariables: [],
            functions: [],
            protocols: [],
            layout: 'horizontal',
            description: '',
            children: []
        };

        // 验证节点数据
        const validation = dataValidator.validateNode(newNode);
        if (!validation.isValid) {
            console.error('节点验证失败:', validation.errors);
            return;
        }

        if (parentId) {
            // 添加为子节点
            stateManager.addChildNode(parentId, newNode);
        } else {
            // 添加为根节点
            stateManager.addRootNode(newNode);
        }

        // 选中新创建的节点
        this.selectNode(newNode);
    }

    /**
     * 生成默认节点名称
     * @param {string} componentType - 组件类型
     * @returns {string} 默认名称
     */
    generateDefaultName(componentType) {
        const baseName = componentType.replace('UI', '');
        const count = this.getNodeCountByType(componentType) + 1;
        return `${baseName}${count}`;
    }

    /**
     * 获取指定类型的节点数量
     * @param {string} componentType - 组件类型
     * @returns {number} 节点数量
     */
    getNodeCountByType(componentType) {
        const treeData = stateManager.getState().treeData;
        let count = 0;

        const countRecursive = (nodes) => {
            nodes.forEach(node => {
                if (node.type === componentType) {
                    count++;
                }
                if (node.children) {
                    countRecursive(node.children);
                }
            });
        };

        countRecursive(treeData);
        return count;
    }

    /**
     * 获取子节点数量
     * @param {string} parentId - 父节点ID
     * @returns {number} 子节点数量
     */
    getChildCount(parentId) {
        const parentNode = stateManager.findNode(parentId);
        return parentNode?.children?.length || 0;
    }

    /**
     * 删除节点
     * @param {string} nodeId - 节点ID
     */
    deleteNode(nodeId) {
        if (confirm('确定要删除这个节点吗？此操作不可撤销。')) {
            stateManager.deleteNode(nodeId);
        }
    }

    /**
     * 复制节点
     * @param {Object} node - 节点数据
     */
    copyNode(node) {
        // 深度复制节点及其所有子节点
        this.copiedNode = JSON.parse(JSON.stringify(node));

        // 显示复制成功提示
        this.showNotification(`已复制节点: ${node.name}`);
    }

    /**
     * 粘贴子节点
     * @param {string} parentId - 父节点ID
     */
    pasteChildNode(parentId) {
        if (!this.copiedNode) {
            this.showNotification('请先复制一个节点');
            return;
        }

        // 重新生成节点ID，确保层级编码连续性
        const pastedNode = this.renumberCopiedNode(this.copiedNode, parentId);

        // 添加为子节点
        stateManager.addChildNode(parentId, pastedNode);

        // 选中粘贴的节点
        this.selectNode(pastedNode);

        this.showNotification(`已粘贴节点到 ${parentId}`);
    }

    /**
     * 重新编号复制的节点
     * @param {Object} node - 节点数据
     * @param {string} parentId - 父节点ID
     * @returns {Object} 重新编号后的节点
     */
    renumberCopiedNode(node, parentId) {
        const newId = nodeIdGenerator.generateChildId(parentId, this.getChildCount(parentId));

        const renumberRecursive = (currentNode, newParentId) => {
            const currentId = currentNode.id;
            const newChildId = nodeIdGenerator.generateChildId(newParentId, 0);

            currentNode.id = newChildId;

            if (currentNode.children && currentNode.children.length > 0) {
                currentNode.children.forEach(child => {
                    renumberRecursive(child, newChildId);
                });
            }

            return currentNode;
        };

        return renumberRecursive(JSON.parse(JSON.stringify(node)), parentId);
    }

    /**
     * 移动节点
     * @param {string} nodeId - 要移动的节点ID
     * @param {string} newParentId - 新的父节点ID
     */
    moveNode(nodeId, newParentId) {
        // 检查是否尝试将节点移动到自己的子节点中
        const childIds = nodeIdGenerator.getAllChildIds(nodeId, stateManager.getState().treeData);
        if (childIds.includes(newParentId)) {
            this.showNotification('不能将节点移动到自己的子节点中');
            return;
        }

        stateManager.moveNode(nodeId, newParentId);
        this.showNotification(`已移动节点 ${nodeId} 到 ${newParentId}`);
    }

    /**
     * 展开所有节点
     */
    expandAll() {
        // 实现展开所有节点的逻辑
        document.querySelectorAll('.tree-children').forEach(children => {
            children.classList.remove('hidden');
        });
        this.showNotification('已展开所有节点');
    }

    /**
     * 收起所有节点
     */
    collapseAll() {
        // 实现收起所有节点的逻辑
        document.querySelectorAll('.tree-children').forEach(children => {
            children.classList.add('hidden');
        });
        this.showNotification('已收起所有节点');
    }

    /**
     * 显示搜索功能
     */
    showSearch() {
        const searchTerm = prompt('请输入搜索关键词:');
        if (searchTerm) {
            this.searchNodes(searchTerm);
        }
    }

    /**
     * 搜索节点
     * @param {string} searchTerm - 搜索关键词
     */
    searchNodes(searchTerm) {
        const treeData = stateManager.getState().treeData;
        const results = [];

        const searchRecursive = (nodes) => {
            nodes.forEach(node => {
                if (node.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    node.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    (node.description && node.description.toLowerCase().includes(searchTerm.toLowerCase()))) {
                    results.push(node);
                }
                if (node.children) {
                    searchRecursive(node.children);
                }
            });
        };

        searchRecursive(treeData);

        if (results.length > 0) {
            // 高亮显示搜索结果
            this.highlightSearchResults(results);
            this.showNotification(`找到 ${results.length} 个匹配的节点`);
        } else {
            this.showNotification('没有找到匹配的节点');
        }
    }

    /**
     * 高亮显示搜索结果
     * @param {Array} results - 搜索结果
     */
    highlightSearchResults(results) {
        // 移除之前的高亮
        document.querySelectorAll('.search-highlight').forEach(element => {
            element.classList.remove('search-highlight');
        });

        // 添加新的高亮
        results.forEach(node => {
            const nodeElement = document.querySelector(`[data-node-id="${node.id}"]`);
            if (nodeElement) {
                nodeElement.classList.add('search-highlight');
                nodeElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
        });
    }

    /**
     * 处理键盘事件
     * @param {KeyboardEvent} e - 键盘事件
     */
    handleKeydown(e) {
        // 检查是否在输入框中，如果是则不处理复制粘贴快捷键
        const activeElement = document.activeElement;
        const isInputFocused = activeElement?.tagName === 'INPUT' ||
            activeElement?.tagName === 'TEXTAREA' ||
            activeElement?.contentEditable === 'true';

        if (isInputFocused) {
            return; // 让系统默认的复制粘贴功能正常工作
        }

        if (e.ctrlKey || e.metaKey) {
            switch (e.key) {
                case 'c':
                    if (this.selectedNode) {
                        e.preventDefault();
                        // 使用自定义格式存储UI节点数据
                        const uiNodeData = {
                            type: 'ios-ui-node',
                            node: this.selectedNode,
                            timestamp: Date.now()
                        };
                        // 同时设置自定义数据和纯文本数据
                        navigator.clipboard.writeText(JSON.stringify(uiNodeData));
                        this.copyNode(this.selectedNode);
                    }
                    break;
                case 'v':
                    if (this.selectedNode) {
                        e.preventDefault();
                        // 从剪贴板读取数据
                        navigator.clipboard.readText().then(text => {
                            try {
                                const data = JSON.parse(text);
                                if (data.type === 'ios-ui-node') {
                                    // 处理UI节点粘贴
                                    this.pasteChildNode(this.selectedNode.id);
                                } else {
                                    // 普通文本，不处理
                                    console.log('粘贴普通文本，忽略:', text);
                                }
                            } catch (error) {
                                // 不是JSON格式，可能是普通文本
                                console.log('粘贴非UI节点数据，忽略:', text);
                            }
                        }).catch(err => {
                            console.log('读取剪贴板失败:', err);
                        });
                    }
                    break;
                case 'd':
                    if (this.selectedNode) {
                        e.preventDefault();
                        this.deleteNode(this.selectedNode.id);
                    }
                    break;
                case 'n':
                    e.preventDefault();
                    if (this.selectedNode) {
                        this.showComponentTypeDialog(this.selectedNode.id);
                    } else {
                        this.addRootNode();
                    }
                    break;
            }
        }
    }

    /**
     * 显示通知
     * @param {string} message - 通知消息
     */
    showNotification(message) {
        // 创建通知元素
        const notification = document.createElement('div');
        notification.className = 'notification';
        notification.textContent = message;
        document.body.appendChild(notification);

        // 3秒后自动移除
        setTimeout(() => {
            notification.classList.add('notification-exit');
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, 3000);
    }

    /**
     * 获取选中的节点
     * @returns {Object|null} 选中的节点
     */
    getSelectedNode() {
        return this.selectedNode;
    }

    /**
     * 清除选中状态
     */
    clearSelection() {
        this.selectedNode = null;
        document.querySelectorAll('.tree-node').forEach(nodeElement => {
            nodeElement.classList.remove('selected');
        });
    }

    /**
     * 销毁组件
     */
    destroy() {
        // 清理事件监听器和DOM元素
        this.container.innerHTML = '';
    }
}

// 创建全局树形编辑器实例
let treeEditor = null;

// 初始化树形编辑器
document.addEventListener('DOMContentLoaded', () => {
    treeEditor = new TreeEditor('tree-container');
});

// 导出树形编辑器
window.treeEditor = treeEditor;
