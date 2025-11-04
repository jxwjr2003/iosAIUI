/**
 * 状态管理器 - 使用观察者模式管理应用状态
 */
class StateManager {
    constructor() {
        this.state = {
            // UI 层级树数据
            treeData: [],
            // 当前选中的节点
            selectedNode: null,
            // 当前选中的根节点（用于模拟器预览）
            selectedRootNode: null,
            // 修改日志
            modificationLog: [],
            // AI 聊天历史
            chatHistory: [],
            // 应用设置
            settings: {
                autoSave: true,
                showNodeIds: true,
                theme: 'light'
            }
        };

        this.observers = [];
        this.modificationCount = 0;
    }

    /**
     * 添加观察者
     * @param {Function} callback - 状态变化时的回调函数
     */
    subscribe(callback) {
        this.observers.push(callback);
        return () => {
            this.observers = this.observers.filter(obs => obs !== callback);
        };
    }

    /**
     * 通知所有观察者状态已变化
     */
    notifyObservers() {
        this.observers.forEach(callback => callback(this.state));
    }

    /**
     * 更新状态
     * @param {Object} newState - 新的状态片段
     */
    setState(newState) {
        this.state = { ...this.state, ...newState };
        this.notifyObservers();
    }

    /**
     * 获取当前状态
     * @returns {Object} 当前状态
     */
    getState() {
        return { ...this.state };
    }

    /**
     * 设置树形数据
     * @param {Array} treeData - 树形数据
     */
    setTreeData(treeData) {
        this.setState({ treeData });
        // 从树数据初始化节点ID生成器，确保根节点ID正确递增
        if (window.nodeIdGenerator) {
            window.nodeIdGenerator.initializeFromTree(treeData);
        }
        this.addModificationLog('SET_TREE_DATA', '设置树形数据', { nodeCount: treeData.length });
    }

    /**
     * 添加根节点
     * @param {Object} node - 节点数据
     */
    addRootNode(node) {
        const newTreeData = [...this.state.treeData, node];
        this.setTreeData(newTreeData);
        this.addModificationLog('ADD_ROOT_NODE', `添加根节点: ${node.name}`, { nodeId: node.id });
    }

    /**
     * 删除节点
     * @param {string} nodeId - 节点ID
     */
    deleteNode(nodeId) {
        const deleteRecursive = (nodes) => {
            return nodes.filter(node => {
                if (node.id === nodeId) {
                    return false;
                }
                if (node.children && node.children.length > 0) {
                    node.children = deleteRecursive(node.children);
                }
                return true;
            });
        };

        const newTreeData = deleteRecursive(this.state.treeData);
        this.setTreeData(newTreeData);

        // 如果删除的是选中的节点，清空选中状态
        if (this.state.selectedNode && this.state.selectedNode.id === nodeId) {
            this.setState({ selectedNode: null });
        }

        this.addModificationLog('DELETE_NODE', `删除节点: ${nodeId}`, { nodeId });
    }

    /**
     * 更新节点
     * @param {string} nodeId - 节点ID
     * @param {Object} updates - 更新数据
     */
    updateNode(nodeId, updates) {
        const updateRecursive = (nodes) => {
            return nodes.map(node => {
                if (node.id === nodeId) {
                    return { ...node, ...updates };
                }
                if (node.children && node.children.length > 0) {
                    node.children = updateRecursive(node.children);
                }
                return node;
            });
        };

        const newTreeData = updateRecursive(this.state.treeData);
        this.setTreeData(newTreeData);

        // 如果更新的是选中的节点，更新选中状态
        if (this.state.selectedNode && this.state.selectedNode.id === nodeId) {
            this.setState({ selectedNode: { ...this.state.selectedNode, ...updates } });
        }

        this.addModificationLog('UPDATE_NODE', `更新节点: ${nodeId}`, { nodeId, updates });
    }

    /**
     * 添加子节点
     * @param {string} parentId - 父节点ID
     * @param {Object} childNode - 子节点数据
     */
    addChildNode(parentId, childNode) {
        const addRecursive = (nodes) => {
            return nodes.map(node => {
                if (node.id === parentId) {
                    if (!node.children) {
                        node.children = [];
                    }
                    node.children.push(childNode);
                } else if (node.children && node.children.length > 0) {
                    node.children = addRecursive(node.children);
                }
                return node;
            });
        };

        const newTreeData = addRecursive(this.state.treeData);
        this.setTreeData(newTreeData);
        this.addModificationLog('ADD_CHILD_NODE', `添加子节点到 ${parentId}: ${childNode.name}`, {
            parentId,
            childNodeId: childNode.id
        });
    }

    /**
     * 移动节点
     * @param {string} nodeId - 要移动的节点ID
     * @param {string} newParentId - 新的父节点ID
     */
    moveNode(nodeId, newParentId) {
        // 找到要移动的节点
        let nodeToMove = null;
        const findAndRemoveNode = (nodes) => {
            for (let i = 0; i < nodes.length; i++) {
                if (nodes[i].id === nodeId) {
                    nodeToMove = nodes[i];
                    nodes.splice(i, 1);
                    return true;
                }
                if (nodes[i].children && nodes[i].children.length > 0) {
                    if (findAndRemoveNode(nodes[i].children)) {
                        return true;
                    }
                }
            }
            return false;
        };

        const treeDataCopy = JSON.parse(JSON.stringify(this.state.treeData));
        if (findAndRemoveNode(treeDataCopy)) {
            // 将节点添加到新的父节点
            const addToParent = (nodes) => {
                return nodes.map(node => {
                    if (node.id === newParentId) {
                        if (!node.children) {
                            node.children = [];
                        }
                        node.children.push(nodeToMove);
                    } else if (node.children && node.children.length > 0) {
                        node.children = addToParent(node.children);
                    }
                    return node;
                });
            };

            const newTreeData = addToParent(treeDataCopy);

            // 重新编号整个树形结构，确保层级编码正确
            const renumberedTreeData = nodeIdGenerator.renumberTree(newTreeData);

            // 更新约束包中的参考节点ID
            const updatedTreeData = this.updateConstraintReferenceIds(renumberedTreeData);

            this.setTreeData(updatedTreeData);
            this.addModificationLog('MOVE_NODE', `移动节点 ${nodeId} 到 ${newParentId}`, {
                nodeId,
                newParentId
            });
        }
    }

    /**
     * 设置选中的节点
     * @param {Object} node - 节点数据
     */
    setSelectedNode(node) {
        console.log('🔍 [StateManager] setSelectedNode 被调用:', {
            '传入节点ID': node?.id,
            '传入节点名称': node?.name,
            '当前选中节点ID': this.state.selectedNode?.id,
            '当前选中根节点ID': this.state.selectedRootNode?.id,
            '时间戳': new Date().toISOString()
        });

        // 从当前树数据中查找最新的节点数据，确保数据完整
        const latestNode = this.findNode(node.id);

        // 只有当选中节点确实发生变化时才更新
        const shouldUpdateSelectedNode = !this.state.selectedNode ||
            (latestNode || node).id !== this.state.selectedNode.id;

        if (shouldUpdateSelectedNode) {
            console.log('✅ [StateManager] 更新选中节点:', {
                '从': this.state.selectedNode?.id,
                '到': (latestNode || node).id,
                '节点名称': (latestNode || node).name
            });
            this.setState({ selectedNode: latestNode || node });
        } else {
            console.log('⏭️ [StateManager] 跳过选中节点更新 - 节点未变化');
        }

        // 自动找到所选节点所属的根节点，并设置selectedRootNode
        // 只有当根节点确实发生变化时才更新，避免循环更新
        const rootNode = this.findRootNodeForNode(node.id);
        const shouldUpdateRootNode = rootNode &&
            (!this.state.selectedRootNode || rootNode.id !== this.state.selectedRootNode.id);

        if (shouldUpdateRootNode) {
            console.log('✅ [StateManager] 更新选中根节点:', {
                '从': this.state.selectedRootNode?.id,
                '到': rootNode.id,
                '根节点名称': rootNode.name
            });
            this.setState({ selectedRootNode: rootNode });
        } else {
            console.log('⏭️ [StateManager] 跳过根节点更新 - 根节点未变化');
        }
    }

    /**
     * 设置选中的根节点（用于模拟器预览）
     * @param {Object} node - 根节点数据
     */
    setSelectedRootNode(node) {
        this.setState({ selectedRootNode: node });
    }

    /**
     * 添加修改日志
     * @param {string} type - 修改类型
     * @param {string} message - 修改描述
     * @param {Object} data - 相关数据
     */
    addModificationLog(type, message, data = {}) {
        const logEntry = {
            id: ++this.modificationCount,
            type,
            message,
            data,
            timestamp: new Date().toISOString(),
            timestampDisplay: new Date().toLocaleString('zh-CN')
        };

        const newLog = [logEntry, ...this.state.modificationLog.slice(0, 99)]; // 保持最近100条记录
        this.setState({ modificationLog: newLog });
    }

    /**
     * 添加聊天消息
     * @param {string} role - 角色 ('user' | 'assistant' | 'system')
     * @param {string} content - 消息内容
     */
    addChatMessage(role, content) {
        const message = {
            id: Date.now(),
            role,
            content,
            timestamp: new Date().toISOString()
        };

        const newChatHistory = [...this.state.chatHistory, message];
        this.setState({ chatHistory: newChatHistory });
    }

    /**
     * 清空聊天历史
     */
    clearChatHistory() {
        this.setState({ chatHistory: [] });
        this.addModificationLog('CLEAR_CHAT', '清空聊天历史');
    }

    /**
     * 导出当前状态为JSON
     * @returns {Object} 状态数据
     */
    exportState() {
        return {
            treeData: this.state.treeData,
            settings: this.state.settings,
            exportTime: new Date().toISOString(),
            version: '1.0.0'
        };
    }

    /**
     * 从JSON导入状态
     * @param {Object} stateData - 状态数据
     */
    importState(stateData) {
        if (stateData.treeData) {
            this.setTreeData(stateData.treeData);
        }
        if (stateData.settings) {
            this.setState({ settings: { ...this.state.settings, ...stateData.settings } });
        }
        this.addModificationLog('IMPORT_STATE', '导入状态数据');
    }

    /**
     * 查找节点
     * @param {string} nodeId - 节点ID
     * @returns {Object|null} 节点数据
     */
    findNode(nodeId) {
        const findRecursive = (nodes) => {
            for (const node of nodes) {
                if (node.id === nodeId) {
                    return node;
                }
                if (node.children && node.children.length > 0) {
                    const found = findRecursive(node.children);
                    if (found) return found;
                }
            }
            return null;
        };

        return findRecursive(this.state.treeData);
    }

    /**
     * 查找节点所属的根节点
     * @param {string} nodeId - 节点ID
     * @returns {Object|null} 根节点数据
     */
    findRootNodeForNode(nodeId) {
        const findRootRecursive = (nodes, currentRoot) => {
            for (const node of nodes) {
                // 如果当前节点就是目标节点，则返回当前根节点
                if (node.id === nodeId) {
                    return currentRoot;
                }
                // 如果当前节点有子节点，递归查找
                if (node.children && node.children.length > 0) {
                    const found = findRootRecursive(node.children, currentRoot);
                    if (found) return found;
                }
            }
            return null;
        };

        // 遍历所有根节点
        for (const rootNode of this.state.treeData) {
            // 如果根节点本身就是目标节点，直接返回
            if (rootNode.id === nodeId) {
                return rootNode;
            }
            // 在根节点的子树中查找
            const found = findRootRecursive(rootNode.children || [], rootNode);
            if (found) return found;
        }

        return null;
    }

    /**
     * 获取所有根节点
     * @returns {Array} 根节点数组
     */
    getRootNodes() {
        return this.state.treeData;
    }

    /**
     * 验证节点数据
     * @param {Object} node - 节点数据
     * @returns {boolean} 是否有效
     */
    validateNode(node) {
        if (!node.id || typeof node.id !== 'string') {
            console.error('节点ID无效:', node.id);
            return false;
        }
        if (!node.name || typeof node.name !== 'string') {
            console.error('节点名称无效:', node.name);
            return false;
        }
        if (!node.type || typeof node.type !== 'string') {
            console.error('节点类型无效:', node.type);
            return false;
        }
        return true;
    }

    /**
     * 更新约束包中的参考节点ID
     * @param {Array} treeData - 树形数据
     * @returns {Array} 更新后的树形数据
     */
    updateConstraintReferenceIds(treeData) {
        const updatedTreeData = JSON.parse(JSON.stringify(treeData));

        // 递归遍历所有节点，更新约束包中的参考节点ID
        const updateReferences = (nodes) => {
            return nodes.map(node => {
                // 如果有约束包，更新其中的参考节点ID
                if (node.constraintPackages && node.constraintPackages.length > 0) {
                    node.constraintPackages = node.constraintPackages.map(constraintPackage => {
                        if (constraintPackage.constraints && constraintPackage.constraints.length > 0) {
                            constraintPackage.constraints = constraintPackage.constraints.map(constraint => {
                                if (constraint.reference && constraint.reference.nodeId) {
                                    // 查找参考节点是否存在，如果不存在则清除引用
                                    const referenceNode = this.findNodeInTree(constraint.reference.nodeId, updatedTreeData);
                                    if (!referenceNode) {
                                        constraint.reference.nodeId = '';
                                    }
                                }
                                return constraint;
                            });
                        }
                        return constraintPackage;
                    });
                }

                // 递归处理子节点
                if (node.children && node.children.length > 0) {
                    node.children = updateReferences(node.children);
                }

                return node;
            });
        };

        return updateReferences(updatedTreeData);
    }

    /**
     * 在树中查找节点
     * @param {string} nodeId - 节点ID
     * @param {Array} treeData - 树形数据
     * @returns {Object|null} 节点数据
     */
    findNodeInTree(nodeId, treeData) {
        const findRecursive = (nodes) => {
            for (const node of nodes) {
                if (node.id === nodeId) {
                    return node;
                }
                if (node.children && node.children.length > 0) {
                    const found = findRecursive(node.children);
                    if (found) return found;
                }
            }
            return null;
        };

        return findRecursive(treeData);
    }
}

// 创建全局状态管理器实例
const stateManager = new StateManager();

// 导出状态管理器
window.stateManager = stateManager;
