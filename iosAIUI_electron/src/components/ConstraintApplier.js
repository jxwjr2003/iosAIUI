/**
 * 约束应用器
 * 负责应用Auto Layout约束到DOM元素，包括回退约束处理
 */
class ConstraintApplier {
    constructor() {
        // 约束类型映射
        this.constraintTypes = {
            'size': '尺寸约束',
            'edge': '边界约束',
            'center': '中心约束',
            'baseline': '基线约束',
            'aspectRatio': '宽高比约束'
        };

        // 约束关系映射
        this.relationMap = {
            'equalTo': 'equal',
            'greaterThanOrEqualTo': 'greaterThanOrEqual',
            'lessThanOrEqualTo': 'lessThanOrEqual'
        };
    }

    /**
     * 应用约束到节点元素
     * @param {Object} node - 节点数据
     * @param {HTMLElement} element - DOM元素
     * @param {Object} parentNode - 父节点数据
     * @param {HTMLElement} parentElement - 父DOM元素
     */
    applyConstraints(node, element, parentNode, parentElement) {
        // 使用约束布局引擎应用约束
        if (window.constraintLayoutEngine) {
            // 新的约束布局引擎会构建依赖图并按拓扑顺序应用所有约束
            window.constraintLayoutEngine.applyConstraints(node, element, parentNode, parentElement);
        } else {
            console.warn('约束布局引擎未加载，使用回退约束处理');
            this.applyConstraintsFallback(node, element);
        }
    }

    /**
     * 回退约束处理（当约束布局引擎不可用时）
     * @param {Object} node - 节点数据
     * @param {HTMLElement} element - DOM元素
     */
    applyConstraintsFallback(node, element) {
        // 从 constraintPackages 中获取约束
        let constraints = [];

        if (node.constraintPackages && node.constraintPackages.length > 0) {
            // 获取默认约束包中的约束
            const defaultPackage = node.constraintPackages.find(pkg => pkg.isDefault);
            if (defaultPackage && defaultPackage.constraints) {
                constraints = defaultPackage.constraints;
            }
        }

        if (constraints.length === 0) return;

        const styles = {};

        constraints.forEach(constraint => {
            this.applySingleConstraintFallback(constraint, styles);
        });

        // 应用约束样式
        Object.assign(element.style, styles);
    }

    /**
     * 回退单个约束处理
     * @param {Object} constraint - 约束数据
     * @param {Object} styles - 样式对象
     */
    applySingleConstraintFallback(constraint, styles) {
        const { type, relation, value, reference, attribute } = constraint;

        // 处理约束关系映射：JSON使用relation字段，代码期望method字段
        let constraintMethod = relation;
        if (relation) {
            // 将relation映射到method
            constraintMethod = this.relationMap[relation] || relation;
        }

        switch (type) {
            case 'size':
                this.applySizeConstraintFallback(constraintMethod, attribute, value, styles);
                break;
            case 'edge':
                this.applyEdgeConstraintFallback(constraintMethod, value, reference, styles);
                break;
            case 'center':
                this.applyCenterConstraintFallback(constraintMethod, value, reference, styles);
                break;
            case 'baseline':
                this.applyBaselineConstraintFallback(constraintMethod, value, reference, styles);
                break;
            case 'aspectRatio':
                this.applyAspectRatioConstraintFallback(constraintMethod, value, styles);
                break;
        }
    }

    /**
     * 回退尺寸约束
     * @param {string} method - 约束方法
     * @param {string} attribute - 约束属性 (width/height)
     * @param {number} value - 约束值
     * @param {Object} styles - 样式对象
     */
    applySizeConstraintFallback(method, attribute, value, styles) {
        switch (method) {
            case 'equal':
                if (attribute === 'width') {
                    styles.width = `${value}px`;
                } else if (attribute === 'height') {
                    styles.height = `${value}px`;
                }
                break;
            case 'greaterThanOrEqual':
                if (attribute === 'width') {
                    styles.minWidth = `${value}px`;
                } else if (attribute === 'height') {
                    styles.minHeight = `${value}px`;
                }
                break;
            case 'lessThanOrEqual':
                if (attribute === 'width') {
                    styles.maxWidth = `${value}px`;
                } else if (attribute === 'height') {
                    styles.maxHeight = `${value}px`;
                }
                break;
        }
    }

    /**
     * 回退边界约束
     * @param {string} method - 约束方法
     * @param {number} value - 约束值
     * @param {Object} reference - 参考对象
     * @param {Object} styles - 样式对象
     */
    applyEdgeConstraintFallback(method, value, reference, styles) {
        // 简化的边界约束实现
        switch (method) {
            case 'equal':
                styles.margin = `${value}px`;
                break;
            case 'greaterThanOrEqual':
                styles.margin = `min(${value}px, auto)`;
                break;
            case 'lessThanOrEqual':
                styles.margin = `max(${value}px, auto)`;
                break;
        }
    }

    /**
     * 回退中心约束
     * @param {string} method - 约束方法
     * @param {number} value - 约束值
     * @param {Object} reference - 参考对象
     * @param {Object} styles - 样式对象
     */
    applyCenterConstraintFallback(method, value, reference, styles) {
        styles.justifyContent = 'center';
        styles.alignItems = 'center';
    }

    /**
     * 回退基线约束
     * @param {string} method - 约束方法
     * @param {number} value - 约束值
     * @param {Object} reference - 参考对象
     * @param {Object} styles - 样式对象
     */
    applyBaselineConstraintFallback(method, value, reference, styles) {
        styles.alignItems = 'baseline';
    }

    /**
     * 回退宽高比约束
     * @param {string} method - 约束方法
     * @param {number} value - 约束值
     * @param {Object} styles - 样式对象
     */
    applyAspectRatioConstraintFallback(method, value, styles) {
        styles.aspectRatio = value.toString();
    }

    /**
     * 获取节点的所有约束
     * @param {Object} node - 节点数据
     * @returns {Array} 约束数组
     */
    getNodeConstraints(node) {
        if (!node.constraintPackages || node.constraintPackages.length === 0) {
            return [];
        }

        // 获取默认约束包中的约束
        const defaultPackage = node.constraintPackages.find(pkg => pkg.isDefault);
        if (defaultPackage && defaultPackage.constraints) {
            return defaultPackage.constraints;
        }

        // 如果没有默认包，返回第一个包的约束
        return node.constraintPackages[0]?.constraints || [];
    }

    /**
     * 检查节点是否有宽度约束
     * @param {Object} node - 节点数据
     * @returns {boolean} 是否有宽度约束
     */
    hasWidthConstraint(node) {
        if (!node.constraintPackages || node.constraintPackages.length === 0) {
            return false;
        }

        // 检查所有约束包中的宽度约束
        for (const constraintPackage of node.constraintPackages) {
            if (constraintPackage.constraints) {
                for (const constraint of constraintPackage.constraints) {
                    if (constraint.type === 'size' && constraint.attribute === 'width') {
                        console.log('📐 [ConstraintApplier] 找到宽度约束:', {
                            '节点ID': node.id,
                            '约束关系': constraint.relation,
                            '约束值': constraint.value,
                            '约束包': constraintPackage.name
                        });
                        return true;
                    }
                    // 检查边缘约束中的右侧约束，这也会影响宽度
                    if (constraint.type === 'edge' &&
                        (constraint.attribute === 'right' || constraint.attribute === 'trailing')) {
                        console.log('📐 [ConstraintApplier] 找到右侧边缘约束:', {
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
                        return true;
                    }
                    // 检查边缘约束中的底部约束，这也会影响高度
                    if (constraint.type === 'edge' &&
                        (constraint.attribute === 'bottom')) {
                        return true;
                    }
                }
            }
        }

        return false;
    }

    /**
     * 获取约束类型描述
     * @param {string} constraintType - 约束类型
     * @returns {string} 约束类型描述
     */
    getConstraintTypeDescription(constraintType) {
        return this.constraintTypes[constraintType] || constraintType;
    }

    /**
     * 验证约束数据
     * @param {Object} constraint - 约束数据
     * @returns {Object} 验证结果 {isValid: boolean, errors: Array}
     */
    validateConstraint(constraint) {
        const errors = [];

        // 检查必需字段
        if (!constraint.type) {
            errors.push('约束类型不能为空');
        }

        if (!constraint.relation) {
            errors.push('约束关系不能为空');
        }

        if (constraint.value === undefined || constraint.value === null) {
            errors.push('约束值不能为空');
        }

        // 检查约束类型是否有效
        if (!this.constraintTypes[constraint.type]) {
            errors.push(`无效的约束类型: ${constraint.type}`);
        }

        // 检查尺寸约束的属性
        if (constraint.type === 'size' && !constraint.attribute) {
            errors.push('尺寸约束必须指定属性 (width/height)');
        }

        return {
            isValid: errors.length === 0,
            errors: errors
        };
    }

    /**
     * 清理约束缓存
     */
    clearCache() {
        // 清理约束布局引擎缓存
        if (window.constraintLayoutEngine) {
            window.constraintLayoutEngine.clearCache();
        }
    }

    /**
     * 缓存节点信息用于约束计算
     * @param {Object} node - 节点数据
     * @param {HTMLElement} element - DOM元素
     * @param {Object} parentNode - 父节点数据
     * @param {HTMLElement} parentElement - 父DOM元素
     */
    cacheNodeForConstraints(node, element, parentNode, parentElement) {
        // 缓存节点信息到约束布局引擎
        if (window.constraintLayoutEngine) {
            window.constraintLayoutEngine.nodeCache.set(node.id, {
                node,
                element,
                parentNode,
                parentElement
            });
        }
    }
}

// 导出约束应用器
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ConstraintApplier;
}

// 创建全局约束应用器实例
let constraintApplier = null;

// 初始化约束应用器
document.addEventListener('DOMContentLoaded', () => {
    constraintApplier = new ConstraintApplier();
    window.constraintApplier = constraintApplier;
});

console.log('📐 约束应用器已加载');
