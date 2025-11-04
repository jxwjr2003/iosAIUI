/**
 * 节点ID生成器 - 生成和维护层级节点ID（030201格式）
 */
class NodeIdGenerator {
    constructor() {
        this.rootCounter = 1;
    }

    /**
     * 生成根节点ID
     * @returns {string} 根节点ID
     */
    generateRootId() {
        const id = this.rootCounter.toString().padStart(2, '0');
        this.rootCounter++;
        return id;
    }

    /**
     * 生成子节点ID
     * @param {string} parentId - 父节点ID
     * @param {number} index - 在父节点中的索引位置
     * @returns {string} 子节点ID
     */
    generateChildId(parentId, index) {
        if (!parentId) {
            return this.generateRootId();
        }

        // 父节点ID已经是两位数字格式，直接追加两位数字
        const childNumber = (index + 1).toString().padStart(2, '0');
        return parentId + childNumber;
    }

    /**
     * 解析节点ID，获取层级信息
     * @param {string} nodeId - 节点ID
     * @returns {Object} 层级信息
     */
    parseNodeId(nodeId) {
        if (!nodeId || typeof nodeId !== 'string') {
            return { levels: [], depth: 0, isValid: false };
        }

        // 将节点ID按每两位分割
        const levels = [];
        for (let i = 0; i < nodeId.length; i += 2) {
            const level = nodeId.substring(i, i + 2);
            levels.push(parseInt(level, 10));
        }

        return {
            levels,
            depth: levels.length,
            isValid: levels.every(level => level > 0 && level <= 99)
        };
    }

    /**
     * 获取父节点ID
     * @param {string} nodeId - 节点ID
     * @returns {string|null} 父节点ID，如果没有父节点则返回null
     */
    getParentId(nodeId) {
        const { levels, depth } = this.parseNodeId(nodeId);
        if (depth <= 1) {
            return null; // 根节点没有父节点
        }

        // 移除最后一级，重新构建父节点ID
        const parentLevels = levels.slice(0, -1);
        return parentLevels.map(level => level.toString().padStart(2, '0')).join('');
    }

    /**
     * 获取同级的下一个节点ID
     * @param {string} nodeId - 当前节点ID
     * @returns {string} 下一个节点ID
     */
    getNextSiblingId(nodeId) {
        const parentId = this.getParentId(nodeId);
        if (!parentId) {
            // 根节点的下一个兄弟节点
            const { levels } = this.parseNodeId(nodeId);
            const nextRootNumber = levels[0] + 1;
            return nextRootNumber.toString().padStart(2, '0');
        }

        const { levels } = this.parseNodeId(nodeId);
        const lastLevel = levels[levels.length - 1];
        const nextLevel = lastLevel + 1;

        return parentId + nextLevel.toString().padStart(2, '0');
    }

    /**
     * 验证节点ID格式
     * @param {string} nodeId - 节点ID
     * @returns {boolean} 是否有效
     */
    isValidNodeId(nodeId) {
        if (typeof nodeId !== 'string') return false;
        if (nodeId.length % 2 !== 0) return false; // 必须是偶数长度

        // 检查每两位是否为有效数字
        for (let i = 0; i < nodeId.length; i += 2) {
            const part = nodeId.substring(i, i + 2);
            const num = parseInt(part, 10);
            if (isNaN(num) || num < 1 || num > 99) {
                return false;
            }
        }

        return true;
    }

    /**
     * 重新编号整个树形结构
     * @param {Array} treeData - 树形数据
     * @returns {Array} 重新编号后的树形数据
     */
    renumberTree(treeData) {
        this.rootCounter = 1;
        return this._renumberNodes(treeData);
    }

    /**
     * 递归重新编号节点
     * @param {Array} nodes - 节点数组
     * @param {string} parentId - 父节点ID
     * @returns {Array} 重新编号后的节点数组
     */
    _renumberNodes(nodes, parentId = null) {
        return nodes.map((node, index) => {
            const newId = parentId
                ? this.generateChildId(parentId, index)
                : this.generateRootId();

            const newNode = {
                ...node,
                id: newId
            };

            if (node.children && node.children.length > 0) {
                newNode.children = this._renumberNodes(node.children, newId);
            }

            return newNode;
        });
    }

    /**
     * 获取节点在父节点中的位置
     * @param {string} nodeId - 节点ID
     * @returns {number} 位置索引（从0开始）
     */
    getNodePosition(nodeId) {
        const { levels } = this.parseNodeId(nodeId);
        if (levels.length === 0) return 0;

        return levels[levels.length - 1] - 1;
    }

    /**
     * 计算节点的最大深度
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

        calculateDepth(treeData, 1);
        return maxDepth;
    }

    /**
     * 获取节点的完整路径
     * @param {string} nodeId - 节点ID
     * @param {Array} treeData - 树形数据
     * @returns {Array} 节点路径数组，从根节点到当前节点
     */
    getNodePath(nodeId, treeData) {
        const path = [];

        const findPath = (nodes, targetId, currentPath) => {
            for (const node of nodes) {
                const newPath = [...currentPath, node];

                if (node.id === targetId) {
                    path.push(...newPath);
                    return true;
                }

                if (node.children && node.children.length > 0) {
                    if (findPath(node.children, targetId, newPath)) {
                        return true;
                    }
                }
            }
            return false;
        };

        findPath(treeData, nodeId, []);
        return path;
    }

    /**
     * 检查节点ID是否在树中存在
     * @param {string} nodeId - 节点ID
     * @param {Array} treeData - 树形数据
     * @returns {boolean} 是否存在
     */
    nodeExists(nodeId, treeData) {
        const checkExists = (nodes) => {
            for (const node of nodes) {
                if (node.id === nodeId) {
                    return true;
                }
                if (node.children && node.children.length > 0) {
                    if (checkExists(node.children)) {
                        return true;
                    }
                }
            }
            return false;
        };

        return checkExists(treeData);
    }

    /**
     * 获取节点的所有子节点ID
     * @param {string} nodeId - 节点ID
     * @param {Array} treeData - 树形数据
     * @returns {Array} 所有子节点ID
     */
    getAllChildIds(nodeId, treeData) {
        const childIds = [];

        const collectChildIds = (nodes) => {
            for (const node of nodes) {
                childIds.push(node.id);
                if (node.children && node.children.length > 0) {
                    collectChildIds(node.children);
                }
            }
        };

        const findAndCollect = (nodes, targetId) => {
            for (const node of nodes) {
                if (node.id === targetId) {
                    if (node.children && node.children.length > 0) {
                        collectChildIds(node.children);
                    }
                    return;
                }
                if (node.children && node.children.length > 0) {
                    findAndCollect(node.children, targetId);
                }
            }
        };

        findAndCollect(treeData, nodeId);
        return childIds;
    }

    /**
     * 重置根节点计数器
     */
    reset() {
        this.rootCounter = 1;
    }

    /**
     * 从现有树形数据中初始化根节点计数器
     * @param {Array} treeData - 树形数据
     */
    initializeFromTree(treeData) {
        if (!treeData || treeData.length === 0) {
            this.rootCounter = 1;
            return;
        }

        // 找到最大的根节点编号
        let maxRoot = 0;
        treeData.forEach(node => {
            const { levels } = this.parseNodeId(node.id);
            if (levels.length > 0) {
                maxRoot = Math.max(maxRoot, levels[0]);
            }
        });

        this.rootCounter = maxRoot + 1;
    }
}

// 创建全局节点ID生成器实例
const nodeIdGenerator = new NodeIdGenerator();

// 导出节点ID生成器
window.nodeIdGenerator = nodeIdGenerator;
