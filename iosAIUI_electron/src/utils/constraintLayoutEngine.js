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
     * 递归遍历节点构建依赖关系 - 重构版
     * 添加树状结构天然依赖：父节点必须优先于子节点计算
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

        // 1. 添加父节点依赖（树状结构天然依赖）
        const nodeInfo = this.nodeCache.get(node.id);
        if (nodeInfo && nodeInfo.parentNode && nodeInfo.parentNode.id !== "00") {
            // 如果父节点存在且不是模拟器屏幕，添加依赖关系
            this.dependencyGraph.get(node.id).add(nodeInfo.parentNode.id);
            console.log('🌳 [ConstraintLayoutEngine] 添加父节点依赖:', {
                '节点': node.id,
                '依赖父节点': nodeInfo.parentNode.id
            });
        }

        // 2. 分析当前节点的约束，找出依赖关系
        if (node.constraintPackages) {
            const defaultPackage = node.constraintPackages.find(pkg => pkg.isDefault);
            if (defaultPackage && defaultPackage.constraints) {
                defaultPackage.constraints.forEach(constraint => {
                    if (constraint.reference && constraint.reference.nodeId) {
                        // 添加依赖关系：当前节点依赖于参考节点
                        this.dependencyGraph.get(node.id).add(constraint.reference.nodeId);
                        console.log('🔗 [ConstraintLayoutEngine] 添加约束依赖:', {
                            '节点': node.id,
                            '依赖参考节点': constraint.reference.nodeId,
                            '约束类型': constraint.type,
                            '约束属性': constraint.attribute
                        });
                    }
                });
            }
        }

        // 3. 递归处理子节点
        if (node.children) {
            node.children.forEach(child => {
                this.traverseNodeForDependencies(child);
            });
        }
    }
    /**
     * 拓扑排序 - 返回按依赖关系排序的节点ID数组
     * 重构版：从根节点"00"开始，确保自上而下的计算顺序
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

        console.log('🔍 [ConstraintLayoutEngine] 拓扑排序开始，依赖图:', {
            '依赖图节点数量': this.dependencyGraph.size,
            '依赖关系': Array.from(this.dependencyGraph.entries()).map(([nodeId, deps]) => ({
                '节点': nodeId,
                '依赖': Array.from(deps)
            }))
        });

        // 重构：优先从根节点"00"开始拓扑排序
        if (this.nodeCache.has("00")) {
            console.log('🌱 [ConstraintLayoutEngine] 从根节点"00"开始拓扑排序');
            visit("00");
        }

        // 然后处理其他节点
        for (const nodeId of this.dependencyGraph.keys()) {
            if (!visited.has(nodeId)) {
                visit(nodeId);
            }
        }

        console.log('✅ [ConstraintLayoutEngine] 拓扑排序完成:', {
            '排序结果': result,
            '处理节点数量': result.length
        });

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
        // 缓存布局数据
        this.layoutCache.set(node.id, layout);
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

        // 处理虚拟节点"00"（模拟器屏幕）
        if (node.id === "00") {
            const bounds = {
                top: 0,
                left: 0,
                width: element.offsetWidth,
                height: element.offsetHeight,
                right: element.offsetWidth,
                bottom: element.offsetHeight
            };
            console.log('📏 [ConstraintLayoutEngine] 计算节点边界 - 虚拟节点00:', {
                '节点ID': node.id,
                '节点名称': '模拟器屏幕',
                '使用缓存': false,
                '计算结果': bounds
            });
            return bounds;
        }

        // 优先使用布局缓存
        const cachedLayout = this.layoutCache.get(node.id);
        if (cachedLayout) {
            const parseDim = (val) => {
                if (typeof val === 'string') {
                    // 处理"60px"、"auto"等情况
                    const num = parseInt(val);
                    return isNaN(num) ? 0 : num;
                }
                return val || 0;
            };

            // 新增：计算父容器绝对位置
            let parentTop = 0;
            let parentLeft = 0;
            if (nodeInfo.parentNode && nodeInfo.parentNode.id !== "00") {
                const parentNodeInfo = this.nodeCache.get(nodeInfo.parentNode.id);
                if (parentNodeInfo) {
                    const parentBounds = this.calculateNodeBounds(parentNodeInfo);
                    parentTop = parentBounds.top;
                    parentLeft = parentBounds.left;
                }
            }

            const bounds = {
                top: parentTop + parseDim(cachedLayout.top),
                left: parentLeft + parseDim(cachedLayout.left),
                width: parseDim(cachedLayout.width),
                height: parseDim(cachedLayout.height),
                right: parentLeft + parseDim(cachedLayout.left) + parseDim(cachedLayout.width),
                bottom: parentTop + parseDim(cachedLayout.top) + parseDim(cachedLayout.height)
            };
            console.log('📏 [ConstraintLayoutEngine] 计算节点边界 - 使用缓存:', {
                '节点ID': node.id,
                '节点名称': node.name,
                '使用缓存': true,
                '缓存布局': cachedLayout,
                '解析后边界': bounds
            });
            return bounds;
        }

        // 优先使用视口坐标（viewport-relative）
        if (element && typeof element.getBoundingClientRect === 'function') {
            const rect = element.getBoundingClientRect();
            const bounds = {
                top: rect.top,
                left: rect.left,
                right: rect.right,
                bottom: rect.bottom,
                width: rect.width,
                height: rect.height
            };
            console.log('📏 [ConstraintLayoutEngine] 计算节点边界 - 视口坐标:', {
                '节点ID': node.id,
                '节点名称': node.name,
                '使用缓存': false,
                '视口坐标': rect,
                '计算结果': bounds
            });
            return bounds;
        }

        // 备用方案：使用父容器相对坐标
        if (element && parentElement) {
            const bounds = {
                top: element.offsetTop,
                left: element.offsetLeft,
                width: element.offsetWidth,
                height: element.offsetHeight,
                right: element.offsetLeft + element.offsetWidth,
                bottom: element.offsetTop + element.offsetHeight
            };
            console.log('📏 [ConstraintLayoutEngine] 计算节点边界 - 父容器相对坐标:', {
                '节点ID': node.id,
                '节点名称': node.name,
                '使用缓存': false,
                '父容器相对坐标': {
                    offsetTop: element.offsetTop,
                    offsetLeft: element.offsetLeft,
                    offsetWidth: element.offsetWidth,
                    offsetHeight: element.offsetHeight
                },
                '计算结果': bounds
            });
            return bounds;
        }

        // 回退到约束计算
        const width = this.calculateNodeDimension(nodeInfo, 'width');
        const height = this.calculateNodeDimension(nodeInfo, 'height');
        const bounds = {
            top: 0,
            left: 0,
            right: width,
            bottom: height,
            width: width,
            height: height
        };
        console.log('📏 [ConstraintLayoutEngine] 计算节点边界 - 回退约束计算:', {
            '节点ID': node.id,
            '节点名称': node.name,
            '使用缓存': false,
            '计算结果': bounds
        });
        return bounds;
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
        const absolutePosition = referencePosition + (value || 0);

        // 获取父容器的实际边界位置
        const nodeInfo = this.nodeCache.get(node.id);
        const parentNode = nodeInfo ? nodeInfo.parentNode : null;
        let parentBounds = { top: 0, left: 0, width: 353, height: 812 };

        if (parentNode) {
            const parentNodeInfo = this.nodeCache.get(parentNode.id);
            if (parentNodeInfo) {
                parentBounds = this.calculateNodeBounds(parentNodeInfo);
            }
        }

        let relativePosition;
        if (attribute === 'right' || attribute === 'trailing') {
            // 对于right，计算相对于父容器右边的距离
            relativePosition = parentBounds.width - (absolutePosition - parentBounds.left);
        } else if (attribute === 'bottom') {
            relativePosition = parentBounds.height - (absolutePosition - parentBounds.top);
        } else {
            // 对于left/top，计算相对于父容器左边/顶边的距离
            relativePosition = absolutePosition - parentBounds.left;
            if (attribute === 'top') {
                relativePosition = absolutePosition - parentBounds.top;
            }
        }

        // 确保位置非负
        relativePosition = Math.max(0, relativePosition);

        // 设置相对位置
        switch (attribute) {
            case 'top':
                layout.top = `${relativePosition}px`;
                break;
            case 'left':
            case 'leading':
                layout.left = `${relativePosition}px`;
                break;
            case 'right':
            case 'trailing':
                layout.right = `${relativePosition}px`;
                break;
            case 'bottom':
                layout.bottom = `${relativePosition}px`;
                break;
        }

        console.log('🔧 [ConstraintLayoutEngine] 计算参考边缘约束:', {
            '当前节点': node.id,
            '节点名称': node.name,
            '约束属性': attribute,
            '参考节点': reference.nodeId,
            '参考属性': reference.attribute,
            '参考位置': referencePosition,
            '偏移值': value,
            '绝对位置': absolutePosition,
            '父容器ID': parentNode ? parentNode.id : '无',
            '父容器边界': parentBounds,
            '计算相对位置': relativePosition,
            '最终设置位置': layout[attribute]
        });
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
     * 验证布局完整性 - 改进版，避免覆盖用户设置的高度约束
     * @param {Object} layout - 布局对象
     * @param {Object} node - 节点数据
     */
    validateLayout(layout, node) {
        // 添加调试日志
        console.log('🔍 [ConstraintLayoutEngine] 验证布局:', {
            '节点ID': node.id,
            '节点名称': node.name,
            '当前高度': layout.height,
            '当前最小高度': layout.minHeight,
            '当前最大高度': layout.maxHeight,
            '时间戳': new Date().toISOString()
        });

        // 检查节点是否有高度约束
        const hasHeightConstraint = this.hasHeightConstraint(node);

        // 确保至少设置了宽度或高度，但对于有高度约束的节点避免覆盖
        if (layout.width === 'auto' && !layout.minWidth && !layout.maxWidth) {
            // 检查是否通过 left+right 隐式定义宽度
            if (layout.left !== 'auto' && layout.right !== 'auto') {
                // 获取父节点宽度
                let parentWidth = 0;
                const nodeInfo = this.nodeCache.get(node.id);
                const parentNode = nodeInfo ? nodeInfo.parentNode : null;

                if (parentNode) {
                    const parentLayout = this.layoutCache.get(parentNode.id);
                    if (parentLayout && parentLayout.width && parentLayout.width !== 'auto') {
                        parentWidth = parseFloat(parentLayout.width);
                    } else {
                        // 如果父节点宽度未设置，尝试用默认值
                        parentWidth = 100;
                    }
                } else {
                    // 根节点，使用模拟器屏幕宽度
                    parentWidth = 353;
                }

                // 解析left和right
                const leftVal = parseFloat(layout.left);
                const rightVal = Math.abs(parseFloat(layout.right)); // right为负值，取绝对值
                const calculatedWidth = parentWidth - leftVal - rightVal;

                // 设置计算后的宽度
                layout.width = `${calculatedWidth}px`;
                console.log('✅ [ConstraintLayoutEngine] 应用 left+right 计算宽度:', {
                    '节点ID': node.id,
                    '计算宽度': calculatedWidth,
                    '父宽度': parentWidth,
                    'left': leftVal,
                    'right': rightVal
                });
            } else {
                layout.width = '100px';
            }
        }

        // 只有当没有高度约束且没有设置任何高度相关属性时才设置默认高度
        if (!hasHeightConstraint && layout.height === 'auto' && !layout.minHeight && !layout.maxHeight) {
            // 检查是否通过 top+bottom 隐式定义高度
            if (layout.top !== 'auto' && layout.bottom !== 'auto') {
                console.log('✅ [ConstraintLayoutEngine] 保留 top+bottom 定义的高度:', {
                    '节点ID': node.id,
                    'top': layout.top,
                    'bottom': layout.bottom
                });
            } else {
                layout.height = '50px';
                console.log('📏 [ConstraintLayoutEngine] 设置默认高度:', {
                    '节点ID': node.id,
                    '默认高度': layout.height,
                    '原因': '无高度约束且未设置高度'
                });
            }
        } else if (hasHeightConstraint) {
            console.log('✅ [ConstraintLayoutEngine] 保留用户设置的高度约束:', {
                '节点ID': node.id,
                '最终高度': layout.height,
                '最小高度': layout.minHeight,
                '最大高度': layout.maxHeight
            });
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
     * 检查节点是否有高度约束
     * @param {Object} node - 节点数据
     * @returns {boolean} 是否有高度约束
     */
    hasHeightConstraint(node) {
        if (!node.constraintPackages || node.constraintPackages.length === 0) {
            return false;
        }

        // 检查所有约束包中的高度约束
        for (const constraintPackage of node.constraintPackages) {
            if (constraintPackage.constraints) {
                for (const constraint of constraintPackage.constraints) {
                    if (constraint.type === 'size' && constraint.attribute === 'height') {
                        console.log('📐 [ConstraintLayoutEngine] 找到高度约束:', {
                            '节点ID': node.id,
                            '约束关系': constraint.relation,
                            '约束值': constraint.value,
                            '约束包': constraintPackage.name
                        });
                        return true;
                    }
                }
            }
        }

        return false;
    }
    /**
     * 应用布局到DOM元素
     * @param {HTMLElement} element - DOM元素
     * @param {Object} layout - 布局对象
     */
    applyLayout(element, layout) {
        Object.assign(element.style, layout);
        console.log('🎯 [ConstraintLayoutEngine] 应用布局到DOM:', {
            '节点ID': element.dataset.nodeId,
            '最终布局': layout,
            'DOM元素样式': {
                top: element.style.top,
                left: element.style.left,
                right: element.style.right,
                bottom: element.style.bottom,
                width: element.style.width,
                height: element.style.height,
                position: element.style.position
            }
        });
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
