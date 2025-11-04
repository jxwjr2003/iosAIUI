/**
 * 约束布局引擎 - 重构版
 * 支持节点依赖关系分析和拓扑排序，确保约束按正确顺序应用
 * 参考SnapKit约束模型实现
 */
class ConstraintLayoutEngine {
    constructor() {
        this.nodeCache = new Map(); // 节点缓存
        this.layoutCache = new Map(); // 布局缓存
        this.dependencyGraph = new Map(); // 依赖关系图
        this.processedNodes = new Set(); // 已处理节点
    }
    /**
     * 应用约束到节点元素 - 重构版，支持依赖分析
     * @param {Object} node - 节点数据
     * @param {HTMLElement} element - DOM元素
     * @param {Object} parentNode - 父节点数据
     * @param {HTMLElement} parentElement - 父DOM元素
     */
    applyConstraints(node, element, parentNode, parentElement) {
        if (!node.constraintPackages || node.constraintPackages.length === 0) {
            return;
        }
        // 缓存节点和元素
        this.nodeCache.set(node.id, { node, element, parentNode, parentElement });
        // 构建依赖关系图
        this.buildDependencyGraph(node);
        // 计算拓扑排序
        const sortedNodes = this.topologicalSort();
        // 按拓扑顺序应用约束
        this.applyConstraintsInOrder(sortedNodes);
    }
    /**
     * 构建依赖关系图
     * @param {Object} rootNode - 根节点数据
     */
    buildDependencyGraph(rootNode) {
        this.dependencyGraph.clear();
        this.processedNodes.clear();
        // 递归遍历所有节点，构建依赖关系
        this.traverseNodeForDependencies(rootNode);
    }
    /**
     * 递归遍历节点构建依赖关系
     * @param {Object} node - 当前节点
     */
    traverseNodeForDependencies(node) {
        if (this.processedNodes.has(node.id)) {
            return;
        }
        this.processedNodes.add(node.id);
        // 初始化当前节点的依赖集合
        if (!this.dependencyGraph.has(node.id)) {
            this.dependencyGraph.set(node.id, new Set());
        }
        // 分析当前节点的约束，找出依赖关系
        if (node.constraintPackages) {
            const defaultPackage = node.constraintPackages.find(pkg => pkg.isDefault);
            if (defaultPackage && defaultPackage.constraints) {
                defaultPackage.constraints.forEach(constraint => {
                    if (constraint.reference && constraint.reference.nodeId) {
                        // 添加依赖关系：当前节点依赖于参考节点
                        this.dependencyGraph.get(node.id).add(constraint.reference.nodeId);
                    }
                });
            }
        }
        // 递归处理子节点
        if (node.children) {
            node.children.forEach(child => {
                this.traverseNodeForDependencies(child);
            });
        }
    }
    /**
     * 拓扑排序 - 返回按依赖关系排序的节点ID数组
     * @returns {Array} 排序后的节点ID数组
     */
    topologicalSort() {
        const visited = new Set();
        const temp = new Set();
        const result = [];
        const visit = (nodeId) => {
            if (temp.has(nodeId)) {
                throw new Error(`检测到循环依赖，涉及节点: ${nodeId}`);
            }
            if (!visited.has(nodeId)) {
                temp.add(nodeId);
                const dependencies = this.dependencyGraph.get(nodeId) || new Set();
                dependencies.forEach(depId => {
                    if (this.nodeCache.has(depId)) {
                        visit(depId);
                    }
                });
                temp.delete(nodeId);
                visited.add(nodeId);
                result.push(nodeId);
            }
        };
        // 从所有节点开始遍历
        for (const nodeId of this.dependencyGraph.keys()) {
            if (!visited.has(nodeId)) {
                visit(nodeId);
            }
        }
        return result;
    }
    /**
     * 按拓扑顺序应用约束
     * @param {Array} sortedNodeIds - 排序后的节点ID数组
     */
    applyConstraintsInOrder(sortedNodeIds) {
        sortedNodeIds.forEach(nodeId => {
            const nodeInfo = this.nodeCache.get(nodeId);
            if (nodeInfo) {
                const { node, element } = nodeInfo;
                this.applyNodeConstraints(node, element);
            }
        });
    }
    /**
     * 应用单个节点的约束
     * @param {Object} node - 节点数据
     * @param {HTMLElement} element - DOM元素
     */
    applyNodeConstraints(node, element) {
        if (!node.constraintPackages || node.constraintPackages.length === 0) {
            return;
        }
        const defaultPackage = node.constraintPackages.find(pkg => pkg.isDefault);
        if (!defaultPackage || !defaultPackage.constraints) {
            return;
        }
        // 计算布局
        const layout = this.calculateLayout(node, defaultPackage.constraints);
        // 应用布局
        this.applyLayout(element, layout);
    }
    /**
     * 计算节点布局 - 改进版，支持精确位置计算
     * @param {Object} node - 节点数据
     * @param {Array} constraints - 约束数组
     * @returns {Object} 布局对象
     */
    calculateLayout(node, constraints) {
        const layout = {
            position: 'absolute',
            left: 'auto',
            top: 'auto',
            right: 'auto',
            bottom: 'auto',
            width: 'auto',
            height: 'auto',
            margin: '0'
        };
        // 按约束类型分组处理
        const sizeConstraints = constraints.filter(c => c.type === 'size');
        const edgeConstraints = constraints.filter(c => c.type === 'edge');
        const centerConstraints = constraints.filter(c => c.type === 'center');
        const baselineConstraints = constraints.filter(c => c.type === 'baseline');
        const aspectRatioConstraints = constraints.filter(c => c.type === 'aspectRatio');
        // 处理尺寸约束
        this.processSizeConstraints(sizeConstraints, layout, node);
        // 处理边缘约束 - 使用改进的位置计算
        this.processEdgeConstraints(edgeConstraints, layout, node);
        // 处理中心约束
        this.processCenterConstraints(centerConstraints, layout, node);
        // 处理基线约束
        this.processBaselineConstraints(baselineConstraints, layout, node);
        // 处理宽高比约束
        this.processAspectRatioConstraints(aspectRatioConstraints, layout, node);
        // 验证布局的完整性
        this.validateLayout(layout, node);
        return layout;
    }
    /**
     * 处理尺寸约束
     * @param {Array} constraints - 尺寸约束数组
     * @param {Object} layout - 布局对象
     * @param {Object} node - 节点数据
     */
    processSizeConstraints(constraints, layout, node) {
        constraints.forEach(constraint => {
            const { attribute, relation, value, reference } = constraint;
            if (reference && reference.nodeId) {
                // 参考其他节点的尺寸约束
                this.processReferencedSizeConstraint(constraint, layout, node);
            } else {
                // 固定尺寸约束
                this.processFixedSizeConstraint(constraint, layout);
            }
        });
    }
    /**
     * 处理固定尺寸约束
     * @param {Object} constraint - 约束数据
     * @param {Object} layout - 布局对象
     */
    processFixedSizeConstraint(constraint, layout) {
        const { attribute, relation, value } = constraint;
        switch (relation) {
            case 'equalTo':
                if (attribute === 'width') {
                    layout.width = `${value}px`;
                } else if (attribute === 'height') {
                    layout.height = `${value}px`;
                }
                break;
            case 'greaterThanOrEqualTo':
                if (attribute === 'width') {
                    layout.minWidth = `${value}px`;
                } else if (attribute === 'height') {
                    layout.minHeight = `${value}px`;
                }
                break;
            case 'lessThanOrEqualTo':
                if (attribute === 'width') {
                    layout.maxWidth = `${value}px`;
                } else if (attribute === 'height') {
                    layout.maxHeight = `${value}px`;
                }
                break;
        }
    }
    /**
     * 处理参考尺寸约束
     * @param {Object} constraint - 约束数据
     * @param {Object} layout - 布局对象
     * @param {Object} node - 节点数据
     */
    processReferencedSizeConstraint(constraint, layout, node) {
        const { attribute, relation, value, reference } = constraint;
        const referencedNode = this.nodeCache.get(reference.nodeId);
        if (!referencedNode) {
            console.warn(`无法找到参考节点: ${reference.nodeId}`);
            return;
        }
        // 计算参考尺寸
        let referenceSize = 0;
        if (reference.attribute === 'width' || reference.attribute === 'height') {
            referenceSize = this.calculateNodeDimension(referencedNode, reference.attribute);
        }
        const finalValue = referenceSize + (value || 0);
        switch (relation) {
            case 'equalTo':
                if (attribute === 'width') {
                    layout.width = `${finalValue}px`;
                } else if (attribute === 'height') {
                    layout.height = `${finalValue}px`;
                }
                break;
            case 'greaterThanOrEqualTo':
                if (attribute === 'width') {
                    layout.minWidth = `${finalValue}px`;
                } else if (attribute === 'height') {
                    layout.minHeight = `${finalValue}px`;
                }
                break;
            case 'lessThanOrEqualTo':
                if (attribute === 'width') {
                    layout.maxWidth = `${finalValue}px`;
                } else if (attribute === 'height') {
                    layout.maxHeight = `${finalValue}px`;
                }
                break;
        }
    }
    /**
     * 处理边缘约束 - 改进版，支持精确位置计算
     * @param {Array} constraints - 边缘约束数组
     * @param {Object} layout - 布局对象
     * @param {Object} node - 节点数据
     */
    processEdgeConstraints(constraints, layout, node) {
        constraints.forEach(constraint => {
            const { attribute, relation, value, reference } = constraint;
            if (reference && reference.nodeId) {
                // 参考其他节点的边缘约束
                this.processReferencedEdgeConstraint(constraint, layout, node);
            } else {
                // 相对于父容器的边缘约束
                this.processParentEdgeConstraint(constraint, layout);
            }
        });
    }
    /**
     * 处理相对于父容器的边缘约束
     * @param {Object} constraint - 约束数据
     * @param {Object} layout - 布局对象
     */
    processParentEdgeConstraint(constraint, layout) {
        const { attribute, relation, value } = constraint;
        if (relation !== 'equalTo') {
            console.warn('目前只支持equalTo关系的父容器边缘约束');
            return;
        }
        switch (attribute) {
            case 'top':
                layout.top = `${value}px`;
                break;
            case 'left':
                layout.left = `${value}px`;
                break;
            case 'right':
                layout.right = `${value}px`;
                break;
            case 'bottom':
                layout.bottom = `${value}px`;
                break;
            case 'leading':
                layout.left = `${value}px`;
                break;
            case 'trailing':
                layout.right = `${value}px`;
                break;
        }
    }
    /**
     * 计算节点边界 - 精确计算节点的位置和尺寸
     * @param {Object} nodeInfo - 节点信息
     * @returns {Object} 边界对象 {top, left, right, bottom, width, height}
     */
    calculateNodeBounds(nodeInfo) {
        const { node, element, parentElement } = nodeInfo;

        // 优先使用父容器相对坐标
        if (element && parentElement) {
            return {
                top: element.offsetTop,
                left: element.offsetLeft,
                width: element.offsetWidth,
                height: element.offsetHeight,
                right: element.offsetLeft + element.offsetWidth,
                bottom: element.offsetTop + element.offsetHeight
            };
        }

        // 备用方案：当无父元素时使用视口坐标
        if (element && typeof element.getBoundingClientRect === 'function') {
            const rect = element.getBoundingClientRect();
            return {
                top: rect.top,
                left: rect.left,
                right: rect.right,
                bottom: rect.bottom,
                width: rect.width,
                height: rect.height
            };
        }

        // 回退到约束计算
        const width = this.calculateNodeDimension(nodeInfo, 'width');
        const height = this.calculateNodeDimension(nodeInfo, 'height');
        return {
            top: 0,
            left: 0,
            right: width,
            bottom: height,
            width: width,
            height: height
        };
    }
    /**
     * 处理参考边缘约束 - 改进版，支持精确位置计算
     * @param {Object} constraint - 约束数据
     * @param {Object} layout - 布局对象
     * @param {Object} node - 节点数据
     */
    processReferencedEdgeConstraint(constraint, layout, node) {
        const { attribute, relation, value, reference } = constraint;
        const referencedNode = this.nodeCache.get(reference.nodeId);
        if (!referencedNode) {
            console.warn(`无法找到参考节点: ${reference.nodeId}`);
            return;
        }
        if (relation !== 'equalTo') {
            console.warn('目前只支持equalTo关系的参考边缘约束');
            return;
        }
        // 计算参考节点的边界位置
        const referenceBounds = this.calculateNodeBounds(referencedNode);
        let referencePosition = 0;
        // 根据参考属性确定参考位置
        switch (reference.attribute) {
            case 'top':
                referencePosition = referenceBounds.top;
                break;
            case 'left':
                referencePosition = referenceBounds.left;
                break;
            case 'right':
                referencePosition = referenceBounds.right;
                break;
            case 'bottom':
                referencePosition = referenceBounds.bottom;
                break;
            case 'leading':
                referencePosition = referenceBounds.left;
                break;
            case 'trailing':
                referencePosition = referenceBounds.right;
                break;
            default:
                referencePosition = 0;
        }
        const finalValue = referencePosition + (value || 0);
        // 根据当前属性设置布局
        switch (attribute) {
            case 'top':
                layout.top = `${finalValue}px`;
                break;
            case 'left':
                layout.left = `${finalValue}px`;
                break;
            case 'right':
                layout.right = `${finalValue}px`;
                break;
            case 'bottom':
                layout.bottom = `${finalValue}px`;
                break;
            case 'leading':
                layout.left = `${finalValue}px`;
                break;
            case 'trailing':
                layout.right = `${finalValue}px`;
                break;
        }
    }
    /**
     * 计算节点尺寸
     * @param {Object} nodeInfo - 节点信息
     * @param {string} dimension - 尺寸类型 (width/height)
     * @returns {number} 计算后的尺寸
     */
    calculateNodeDimension(nodeInfo, dimension) {
        const { node } = nodeInfo;
        // 首先检查节点属性中的尺寸
        if (node.attributes && node.attributes[dimension]) {
            return node.attributes[dimension];
        }
        // 检查约束包中的尺寸约束
        if (node.constraintPackages) {
            const defaultPackage = node.constraintPackages.find(pkg => pkg.isDefault);
            if (defaultPackage && defaultPackage.constraints) {
                const sizeConstraint = defaultPackage.constraints.find(
                    c => c.type === 'size' && c.attribute === dimension && !c.reference?.nodeId
                );
                if (sizeConstraint && sizeConstraint.value) {
                    return sizeConstraint.value;
                }
            }
        }
        // 默认尺寸
        return dimension === 'width' ? 100 : 50;
    }
    /**
     * 处理中心约束
     * @param {Array} constraints - 中心约束数组
     * @param {Object} layout - 布局对象
     * @param {Object} node - 节点数据
     */
    processCenterConstraints(constraints, layout, node) {
        if (constraints.length === 0) return;
        const hasCenterX = constraints.some(c => c.attribute === 'centerX');
        const hasCenterY = constraints.some(c => c.attribute === 'centerY');
        const hasCenter = constraints.some(c => c.attribute === 'center');
        if (hasCenter || (hasCenterX && hasCenterY)) {
            layout.left = '50%';
            layout.top = '50%';
            layout.transform = 'translate(-50%, -50%)';
        } else if (hasCenterX) {
            layout.left = '50%';
            layout.transform = 'translateX(-50%)';
        } else if (hasCenterY) {
            layout.top = '50%';
            layout.transform = 'translateY(-50%)';
        }
    }
    /**
     * 处理基线约束
     * @param {Array} constraints - 基线约束数组
     * @param {Object} layout - 布局对象
     * @param {Object} node - 节点数据
     */
    processBaselineConstraints(constraints, layout, node) {
        if (constraints.length > 0) {
            layout.verticalAlign = 'baseline';
        }
    }
    /**
     * 处理宽高比约束
     * @param {Array} constraints - 宽高比约束数组
     * @param {Object} layout - 布局对象
     * @param {Object} node - 节点数据
     */
    processAspectRatioConstraints(constraints, layout, node) {
        constraints.forEach(constraint => {
            const { relation, value } = constraint;
            if (relation === 'equalTo' && value) {
                layout.aspectRatio = value.toString();
            }
        });
    }
    /**
     * 验证布局完整性
     * @param {Object} layout - 布局对象
     * @param {Object} node - 节点数据
     */
    validateLayout(layout, node) {
        // 确保至少设置了宽度或高度
        if (layout.width === 'auto' && !layout.minWidth && !layout.maxWidth) {
            layout.width = '100px';
        }
        if (layout.height === 'auto' && !layout.minHeight && !layout.maxHeight) {
            layout.height = '50px';
        }
        // 如果使用了绝对定位，确保设置了定位属性
        if (layout.position === 'absolute') {
            const hasPositioning =
                layout.left !== 'auto' ||
                layout.top !== 'auto' ||
                layout.right !== 'auto' ||
                layout.bottom !== 'auto';
            if (!hasPositioning) {
                layout.left = '0px';
                layout.top = '0px';
            }
        }
    }
    /**
     * 应用布局到DOM元素
     * @param {HTMLElement} element - DOM元素
     * @param {Object} layout - 布局对象
     */
    applyLayout(element, layout) {
        Object.assign(element.style, layout);
    }
    /**
     * 清空缓存
     */
    clearCache() {
        this.nodeCache.clear();
        this.layoutCache.clear();
        this.dependencyGraph.clear();
        this.processedNodes.clear();
    }
    /**
     * 销毁引擎
     */
    destroy() {
        this.clearCache();
    }
}
// 创建全局约束布局引擎实例
let constraintLayoutEngine = new ConstraintLayoutEngine();
// 导出约束布局引擎
window.constraintLayoutEngine = constraintLayoutEngine;
