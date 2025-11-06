/**
 * 动态节点类型管理器
 * 负责管理动态节点类型、循环引用检测和节点类型刷新
 */
class DynamicNodeTypeManager {
    constructor() {
        this.availableTypes = new Map(); // 存储可用的节点类型：类型名称 -> 根节点ID
        this.typeToRootMap = new Map(); // 节点类型到根节点的映射
        this.rootToTypeMap = new Map(); // 根节点ID到节点类型的映射
    }

    /**
     * 初始化动态节点类型管理器
     * @param {Array} treeData - 树形数据
     */
    initialize(treeData) {
        this.refreshAvailableTypes(treeData);
    }

    /**
     * 刷新可用的节点类型
     * @param {Array} treeData - 树形数据
     */
    refreshAvailableTypes(treeData) {
        this.availableTypes.clear();
        this.typeToRootMap.clear();
        this.rootToTypeMap.clear();

        // 遍历所有根节点，将根节点名称作为节点类型
        treeData.forEach(rootNode => {
            const typeName = rootNode.name;
            if (typeName && typeName.trim() !== '') {
                this.availableTypes.set(typeName, rootNode.id);
                this.typeToRootMap.set(typeName, rootNode);
                this.rootToTypeMap.set(rootNode.id, typeName);
            }
        });

        console.log('🔄 [DynamicNodeTypeManager] 节点类型已刷新:', {
            '可用类型数量': this.availableTypes.size,
            '可用类型': Array.from(this.availableTypes.keys()),
            '时间戳': new Date().toISOString()
        });
    }

    /**
     * 获取所有可用的动态节点类型
     * @returns {Array} 节点类型数组，每个元素为 { name: 类型名称, rootId: 根节点ID }
     */
    getAvailableTypes() {
        return Array.from(this.availableTypes.entries()).map(([name, rootId]) => ({
            name,
            rootId,
            isDynamic: true
        }));
    }

    /**
     * 根据类型名称获取根节点ID
     * @param {string} typeName - 节点类型名称
     * @returns {string|null} 根节点ID
     */
    getRootIdByType(typeName) {
        return this.availableTypes.get(typeName) || null;
    }

    /**
     * 根据根节点ID获取类型名称
     * @param {string} rootId - 根节点ID
     * @returns {string|null} 节点类型名称
     */
    getTypeByRootId(rootId) {
        return this.rootToTypeMap.get(rootId) || null;
    }

    /**
     * 根据根节点ID获取根节点数据
     * @param {string} rootId - 根节点ID
     * @returns {Object|null} 根节点数据
     */
    getRootNodeById(rootId) {
        const typeName = this.getTypeByRootId(rootId);
        return typeName ? this.typeToRootMap.get(typeName) : null;
    }

    /**
     * 检查节点类型是否存在
     * @param {string} typeName - 节点类型名称
     * @returns {boolean} 是否存在
     */
    hasType(typeName) {
        return this.availableTypes.has(typeName);
    }

    /**
     * 检查是否允许选择节点类型（防止循环引用）
     * @param {string} currentNodeId - 当前节点ID
     * @param {string} targetTypeName - 目标节点类型名称
     * @param {Array} treeData - 树形数据
     * @returns {Object} 检查结果 { allowed: boolean, reason: string }
     */
    canSelectType(currentNodeId, targetTypeName, treeData) {
        // 获取目标根节点ID
        const targetRootId = this.getRootIdByType(targetTypeName);
        if (!targetRootId) {
            return { allowed: false, reason: `节点类型 "${targetTypeName}" 不存在` };
        }

        // 检查是否尝试选择自己
        if (currentNodeId === targetRootId) {
            return { allowed: false, reason: '不能选择自己作为节点类型' };
        }

        // 检查是否形成循环引用
        const wouldCreateCycle = this.wouldCreateCycle(currentNodeId, targetRootId, treeData);
        if (wouldCreateCycle) {
            return { allowed: false, reason: '选择此节点类型会导致循环引用' };
        }

        return { allowed: true, reason: '' };
    }

    /**
     * 检查选择节点类型是否会形成循环引用
     * @param {string} currentNodeId - 当前节点ID
     * @param {string} targetRootId - 目标根节点ID
     * @param {Array} treeData - 树形数据
     * @returns {boolean} 是否会形成循环引用
     */
    wouldCreateCycle(currentNodeId, targetRootId, treeData) {
        // 如果当前节点是目标根节点的子节点，则形成循环引用
        const isDescendant = this.isDescendant(targetRootId, currentNodeId, treeData);
        if (isDescendant) {
            return true;
        }

        // 如果目标根节点是当前节点的子节点，也形成循环引用
        const isTargetDescendant = this.isDescendant(currentNodeId, targetRootId, treeData);
        if (isTargetDescendant) {
            return true;
        }

        return false;
    }

    /**
     * 检查节点是否是另一个节点的后代
     * @param {string} parentId - 父节点ID
     * @param {string} childId - 子节点ID
     * @param {Array} treeData - 树形数据
     * @returns {boolean} 是否是后代
     */
    isDescendant(parentId, childId, treeData) {
        const findNode = (nodes, targetId) => {
            for (const node of nodes) {
                if (node.id === targetId) {
                    return true;
                }
                if (node.children && node.children.length > 0) {
                    if (findNode(node.children, targetId)) {
                        return true;
                    }
                }
            }
            return false;
        };

        // 找到父节点，然后在父节点的子树中查找子节点
        const findParentAndCheck = (nodes) => {
            for (const node of nodes) {
                if (node.id === parentId) {
                    // 在父节点的子树中查找子节点
                    return findNode(node.children || [], childId);
                }
                if (node.children && node.children.length > 0) {
                    if (findParentAndCheck(node.children)) {
                        return true;
                    }
                }
            }
            return false;
        };

        return findParentAndCheck(treeData);
    }

    /**
     * 处理根节点名称修改
     * @param {string} rootId - 根节点ID
     * @param {string} oldName - 旧名称
     * @param {string} newName - 新名称
     * @param {Array} treeData - 树形数据
     */
    handleRootNameChange(rootId, oldName, newName, treeData) {
        // 移除旧的类型映射
        if (this.availableTypes.has(oldName)) {
            this.availableTypes.delete(oldName);
            this.typeToRootMap.delete(oldName);
        }
        this.rootToTypeMap.delete(rootId);

        // 添加新的类型映射
        if (newName && newName.trim() !== '') {
            this.availableTypes.set(newName, rootId);
            this.typeToRootMap.set(newName, this.getRootNodeById(rootId) || { id: rootId, name: newName });
            this.rootToTypeMap.set(rootId, newName);
        }

        console.log('📝 [DynamicNodeTypeManager] 根节点名称已更新:', {
            '根节点ID': rootId,
            '旧名称': oldName,
            '新名称': newName,
            '时间戳': new Date().toISOString()
        });
    }

    /**
     * 处理根节点删除
     * @param {string} rootId - 根节点ID
     */
    handleRootDelete(rootId) {
        const typeName = this.getTypeByRootId(rootId);
        if (typeName) {
            this.availableTypes.delete(typeName);
            this.typeToRootMap.delete(typeName);
            this.rootToTypeMap.delete(rootId);

            console.log('🗑️ [DynamicNodeTypeManager] 根节点类型已移除:', {
                '根节点ID': rootId,
                '类型名称': typeName,
                '时间戳': new Date().toISOString()
            });
        }
    }

    /**
     * 获取节点类型的显示名称
     * @param {string} typeName - 节点类型名称
     * @returns {string} 显示名称
     */
    getTypeDisplayName(typeName) {
        return `[引用] ${typeName}`;
    }

    /**
     * 判断节点类型是否是动态类型
     * @param {string} typeName - 节点类型名称
     * @returns {boolean} 是否是动态类型
     */
    isDynamicType(typeName) {
        return this.availableTypes.has(typeName);
    }
}

// 创建全局动态节点类型管理器实例
const dynamicNodeTypeManager = new DynamicNodeTypeManager();

// 导出动态节点类型管理器
window.dynamicNodeTypeManager = dynamicNodeTypeManager;
