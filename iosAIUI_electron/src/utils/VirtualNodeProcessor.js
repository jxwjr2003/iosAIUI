/**
 * 虚拟节点处理器
 * 负责处理虚拟节点的创建、ID重映射和引用更新
 */
class VirtualNodeProcessor {
    constructor() {
        this.virtualNodeCache = new Map(); // 缓存虚拟节点数据：虚拟节点ID -> 原始节点数据
    }

    /**
     * 创建虚拟节点
     * @param {Object} parentNode - 父节点数据
     * @param {string} referencedTypeName - 引用的节点类型名称
     * @param {Array} treeData - 树形数据
     * @returns {Object} 虚拟节点数据
     */
    createVirtualNode(parentNode, referencedTypeName, treeData) {
        // 获取引用的根节点
        const referencedRoot = dynamicNodeTypeManager.getRootNodeById(
            dynamicNodeTypeManager.getRootIdByType(referencedTypeName)
        );

        if (!referencedRoot) {
            throw new Error(`引用的节点类型 "${referencedTypeName}" 不存在`);
        }

        // 创建虚拟节点基础结构
        const virtualNode = {
            id: nodeIdGenerator.generateChildId(parentNode.id, this.getChildCount(parentNode)),
            name: referencedRoot.name,
            type: referencedRoot.type, // 关键修改：使用被引用节点的实际类型
            referenceType: referencedTypeName, // 新增：存储引用类型名称
            attributes: {},
            constraintPackages: [],
            memberVariables: [],
            functions: [],
            protocols: [],
            layout: 'horizontal',
            description: '',
            children: [], // 初始为空数组，将在重映射后填充
            isVirtual: true,
            referencedRootId: referencedRoot.id,
            referencedRootType: referencedRoot.type,
            originalNodeData: null // 将在重映射后设置
        };

        // 复制被引用根节点的属性（除了children）
        this.copyReferencedAttributes(referencedRoot, virtualNode);

        // 重映射节点ID并创建虚拟子树
        const remappedTree = this.remapNodeIds(referencedRoot, virtualNode.id);
        virtualNode.originalNodeData = remappedTree;

        // 关键修复：将重映射后的子节点添加到虚拟节点的children数组中
        if (remappedTree.children && remappedTree.children.length > 0) {
            virtualNode.children = remappedTree.children;
        }

        // 缓存虚拟节点数据
        this.virtualNodeCache.set(virtualNode.id, virtualNode);

        console.log('🔮 [VirtualNodeProcessor] 虚拟节点已创建:', {
            '虚拟节点ID': virtualNode.id,
            '引用类型': referencedTypeName,
            '引用根节点ID': referencedRoot.id,
            '子节点数量': virtualNode.children?.length || 0,
            '时间戳': new Date().toISOString()
        });

        return virtualNode;
    }

    /**
     * 复制被引用节点的属性到虚拟节点
     * @param {Object} sourceNode - 源节点（被引用的节点）
     * @param {Object} targetNode - 目标节点（虚拟节点）
     */
    copyReferencedAttributes(sourceNode, targetNode) {
        // 复制基础属性
        if (sourceNode.attributes) {
            targetNode.attributes = { ...sourceNode.attributes };
        }
        if (sourceNode.constraintPackages) {
            targetNode.constraintPackages = JSON.parse(JSON.stringify(sourceNode.constraintPackages));
        }
        if (sourceNode.memberVariables) {
            targetNode.memberVariables = JSON.parse(JSON.stringify(sourceNode.memberVariables));
        }
        if (sourceNode.functions) {
            targetNode.functions = JSON.parse(JSON.stringify(sourceNode.functions));
        }
        if (sourceNode.protocols) {
            targetNode.protocols = JSON.parse(JSON.stringify(sourceNode.protocols));
        }
        if (sourceNode.layout) {
            targetNode.layout = sourceNode.layout;
        }
        if (sourceNode.description) {
            targetNode.description = sourceNode.description;
        }
    }

    /**
     * 重映射节点ID，为虚拟节点创建新的ID层级
     * @param {Object} node - 要重映射的节点
     * @param {string} newParentId - 新的父节点ID（虚拟节点的ID）
     * @returns {Object} 重映射后的节点
     */
    remapNodeIds(node, newParentId) {
        const remappedNode = JSON.parse(JSON.stringify(node));

        // 创建ID映射表：旧ID -> 新ID
        const idMap = new Map();

        // 使用计数器确保每个父节点的子节点有唯一的索引
        const childCounters = new Map();

        // 关键修复：对于根节点，直接使用虚拟节点ID，不创建额外的层级
        // 记录根节点的ID映射
        idMap.set(remappedNode.id, newParentId);

        // 更新根节点ID为虚拟节点ID
        remappedNode.id = newParentId;

        // 递归重映射所有子节点
        const remapRecursive = (currentNode, parentId) => {
            // 初始化或获取父节点的子节点计数器
            if (!childCounters.has(parentId)) {
                childCounters.set(parentId, 0);
            }
            const index = childCounters.get(parentId);
            childCounters.set(parentId, index + 1);

            // 生成新的节点ID，使用正确的索引
            const newId = nodeIdGenerator.generateChildId(parentId, index);

            // 记录ID映射（跳过根节点，因为根节点已经处理）
            if (currentNode.id !== remappedNode.id) {
                idMap.set(currentNode.id, newId);
            }

            // 更新当前节点ID
            currentNode.id = newId;

            // 标记为虚拟节点的子节点（用于UI控制）
            if (currentNode !== remappedNode) { // 不是根节点
                currentNode._isVirtualChild = true;
            }

            // 递归处理子节点
            if (currentNode.children && currentNode.children.length > 0) {
                currentNode.children.forEach(child => {
                    remapRecursive(child, newId);
                });
            }

            return currentNode;
        };

        // 首先构建完整的ID映射 - 从根节点的子节点开始
        if (remappedNode.children && remappedNode.children.length > 0) {
            remappedNode.children.forEach(child => {
                remapRecursive(child, newParentId);
            });
        }

        // 然后更新约束包中的参考节点ID
        const updateConstraintsRecursive = (currentNode) => {
            // 更新约束包中的参考节点ID
            if (currentNode.constraintPackages && currentNode.constraintPackages.length > 0) {
                currentNode.constraintPackages.forEach(constraintPackage => {
                    if (constraintPackage.constraints) {
                        constraintPackage.constraints.forEach(constraint => {
                            if (constraint.reference && constraint.reference.nodeId) {
                                const oldReferenceId = constraint.reference.nodeId;
                                // 如果参考节点在映射表中，更新为新ID
                                if (idMap.has(oldReferenceId)) {
                                    constraint.reference.nodeId = idMap.get(oldReferenceId);
                                } else {
                                    // 如果参考节点不在当前子树中，说明是外部参考
                                    // 对于虚拟节点，外部参考应该指向模拟器屏幕（节点ID"00"）
                                    // 或者保持原样，但这里我们统一指向模拟器屏幕
                                    constraint.reference.nodeId = "00";
                                }
                            }
                        });
                    }
                });
            }

            // 递归处理子节点
            if (currentNode.children && currentNode.children.length > 0) {
                currentNode.children.forEach(child => {
                    updateConstraintsRecursive(child);
                });
            }
        };

        updateConstraintsRecursive(remappedNode);

        return remappedNode;
    }

    /**
     * 获取虚拟节点的完整子树（用于渲染）
     * @param {Object} virtualNode - 虚拟节点
     * @returns {Object} 完整的虚拟子树
     */
    getVirtualSubtree(virtualNode) {
        if (!virtualNode.isVirtual) {
            return virtualNode;
        }

        // 从缓存中获取或重新生成虚拟子树
        let subtree = this.virtualNodeCache.get(virtualNode.id);
        if (!subtree) {
            // 如果缓存中没有，重新创建
            const referencedRoot = dynamicNodeTypeManager.getRootNodeById(virtualNode.referencedRootId);
            if (referencedRoot) {
                subtree = this.remapNodeIds(referencedRoot, virtualNode.id);
                this.virtualNodeCache.set(virtualNode.id, subtree);
            } else {
                // 如果引用的根节点不存在，返回虚拟节点本身
                return virtualNode;
            }
        }

        // 应用虚拟节点的属性覆盖
        return this.applyVirtualNodeOverrides(virtualNode, subtree);
    }

    /**
     * 应用虚拟节点的属性覆盖到子树
     * @param {Object} virtualNode - 虚拟节点（包含覆盖的属性）
     * @param {Object} subtree - 原始子树
     * @returns {Object} 应用覆盖后的子树
     */
    applyVirtualNodeOverrides(virtualNode, subtree) {
        const overriddenSubtree = JSON.parse(JSON.stringify(subtree));

        // 应用虚拟节点的属性覆盖到根节点
        if (virtualNode.attributes) {
            overriddenSubtree.attributes = { ...overriddenSubtree.attributes, ...virtualNode.attributes };
        }

        // 应用约束包覆盖
        if (virtualNode.constraintPackages && virtualNode.constraintPackages.length > 0) {
            overriddenSubtree.constraintPackages = virtualNode.constraintPackages;
        }

        return overriddenSubtree;
    }

    /**
     * 获取父节点的子节点数量
     * @param {Object} parentNode - 父节点
     * @returns {number} 子节点数量
     */
    getChildCount(parentNode) {
        return parentNode.children ? parentNode.children.length : 0;
    }

    /**
     * 检查节点是否是虚拟节点
     * @param {Object} node - 节点数据
     * @returns {boolean} 是否是虚拟节点
     */
    isVirtualNode(node) {
        return node.isVirtual === true;
    }

    /**
     * 获取虚拟节点引用的根节点ID
     * @param {Object} virtualNode - 虚拟节点
     * @returns {string|null} 引用的根节点ID
     */
    getReferencedRootId(virtualNode) {
        return virtualNode.referencedRootId || null;
    }

    /**
     * 处理被引用根节点的更新
     * @param {string} rootId - 被更新的根节点ID
     */
    handleReferencedRootUpdate(rootId) {
        console.log('🔄 [VirtualNodeProcessor] 处理被引用根节点更新:', {
            '根节点ID': rootId,
            '当前缓存大小': this.virtualNodeCache.size,
            '时间戳': new Date().toISOString()
        });

        // 获取被更新的根节点
        const updatedRoot = dynamicNodeTypeManager.getRootNodeById(rootId);
        if (!updatedRoot) {
            console.log('❌ [VirtualNodeProcessor] 被引用的根节点不存在:', rootId);
            return;
        }

        // 清除所有引用此根节点的虚拟节点缓存
        const affectedVirtualNodes = [];
        for (const [virtualNodeId, virtualNode] of this.virtualNodeCache.entries()) {
            if (virtualNode.referencedRootId === rootId) {
                this.virtualNodeCache.delete(virtualNodeId);
                affectedVirtualNodes.push(virtualNodeId);
                console.log('🗑️ [VirtualNodeProcessor] 虚拟节点缓存已清除:', {
                    '虚拟节点ID': virtualNodeId,
                    '引用的根节点ID': rootId,
                    '时间戳': new Date().toISOString()
                });
            }
        }

        // 通知状态管理器更新所有受影响的虚拟节点
        if (affectedVirtualNodes.length > 0 && window.stateManager) {
            this.refreshAffectedVirtualNodes(affectedVirtualNodes, updatedRoot);
        }

        console.log('✅ [VirtualNodeProcessor] 引用更新处理完成:', {
            '受影响的虚拟节点数量': affectedVirtualNodes.length,
            '时间戳': new Date().toISOString()
        });
    }

    /**
     * 刷新受影响的虚拟节点
     * @param {Array} virtualNodeIds - 虚拟节点ID数组
     * @param {Object} updatedRoot - 更新后的根节点
     */
    refreshAffectedVirtualNodes(virtualNodeIds, updatedRoot) {
        virtualNodeIds.forEach(virtualNodeId => {
            // 在树数据中查找虚拟节点
            const virtualNode = stateManager.findNode(virtualNodeId);
            if (virtualNode) {
                // 重新创建虚拟子树
                const remappedTree = this.remapNodeIds(updatedRoot, virtualNodeId);

                // 更新虚拟节点的子树
                virtualNode.originalNodeData = remappedTree;

                // 更新children（用于UI渲染）
                if (remappedTree.children && remappedTree.children.length > 0) {
                    virtualNode.children = remappedTree.children;
                } else {
                    virtualNode.children = [];
                }

                // 重新缓存虚拟节点
                this.virtualNodeCache.set(virtualNodeId, virtualNode);

                console.log('🔄 [VirtualNodeProcessor] 虚拟节点已刷新:', {
                    '虚拟节点ID': virtualNodeId,
                    '新的子节点数量': virtualNode.children?.length || 0,
                    '时间戳': new Date().toISOString()
                });
            }
        });

        // 通知状态变化，触发UI更新
        stateManager.notifyObservers();
    }

    /**
     * 处理虚拟节点删除
     * @param {string} virtualNodeId - 虚拟节点ID
     */
    handleVirtualNodeDelete(virtualNodeId) {
        this.virtualNodeCache.delete(virtualNodeId);
        console.log('🗑️ [VirtualNodeProcessor] 虚拟节点缓存已删除:', {
            '虚拟节点ID': virtualNodeId,
            '时间戳': new Date().toISOString()
        });
    }

    /**
     * 获取所有引用指定根节点的虚拟节点
     * @param {string} rootId - 根节点ID
     * @returns {Array} 虚拟节点数组
     */
    getVirtualNodesReferencingRoot(rootId) {
        const result = [];
        for (const virtualNode of this.virtualNodeCache.values()) {
            if (virtualNode.referencedRootId === rootId) {
                result.push(virtualNode);
            }
        }
        return result;
    }

    /**
     * 验证虚拟节点数据
     * @param {Object} virtualNode - 虚拟节点数据
     * @returns {Object} 验证结果 { isValid: boolean, errors: Array }
     */
    validateVirtualNode(virtualNode) {
        const errors = [];

        if (!virtualNode.id) {
            errors.push('虚拟节点ID不能为空');
        }

        if (!virtualNode.referencedRootId) {
            errors.push('虚拟节点必须引用一个根节点');
        }

        if (!virtualNode.type) {
            errors.push('虚拟节点类型不能为空');
        }

        // 检查引用的根节点是否存在
        const referencedRoot = dynamicNodeTypeManager.getRootNodeById(virtualNode.referencedRootId);
        if (!referencedRoot) {
            errors.push(`引用的根节点 "${virtualNode.referencedRootId}" 不存在`);
        }

        return {
            isValid: errors.length === 0,
            errors
        };
    }
}

// 创建全局虚拟节点处理器实例
const virtualNodeProcessor = new VirtualNodeProcessor();

// 导出虚拟节点处理器
window.virtualNodeProcessor = virtualNodeProcessor;
