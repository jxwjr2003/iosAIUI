/**
 * 数据验证器 - 使用 AJV 进行 JSON Schema 验证
 */
class DataValidator {
    constructor() {
        // 定义节点数据的基本模式
        this.nodeSchema = {
            type: 'object',
            properties: {
                id: { type: 'string', pattern: '^\\d{2}(\\d{2})*$' },
                name: { type: 'string', minLength: 1, maxLength: 100 },
                type: { type: 'string', minLength: 1, maxLength: 50 },
                attributes: {
                    type: 'object',
                    additionalProperties: {
                        oneOf: [
                            { type: 'string' },
                            { type: 'number' },
                            { type: 'boolean' },
                            { type: 'array' },
                            { type: 'object' }
                        ]
                    }
                },
                memberVariables: {
                    type: 'array',
                    items: {
                        type: 'object',
                        properties: {
                            name: { type: 'string' },
                            type: {
                                type: 'string',
                                enum: ['String', 'Int', 'Bool', 'Double', 'Float', 'UIColor', 'UIFont']
                            },
                            defaultValue: { type: 'string' }
                        },
                        required: ['name', 'type']
                    }
                },
                functions: {
                    type: 'array',
                    items: {
                        type: 'object',
                        properties: {
                            funcName: { type: 'string' },
                            funcLogic: { type: 'string' }
                        },
                        required: ['funcName']
                    }
                },
                protocols: {
                    type: 'array',
                    items: {
                        type: 'object',
                        properties: {
                            protocolName: { type: 'string' },
                            protocolLogic: { type: 'string' }
                        },
                        required: ['protocolName']
                    }
                },
                layout: {
                    type: 'string',
                    enum: ['horizontal', 'vertical']
                },
                description: { type: 'string', maxLength: 1000 },
                children: {
                    type: 'array',
                    items: { $ref: '#' } // 递归引用自身
                }
            },
            required: ['id', 'name', 'type']
        };

        // 定义树形数据的完整模式
        this.treeSchema = {
            type: 'array',
            items: this.nodeSchema
        };

        // 支持的 iOS 组件类型
        this.supportedComponentTypes = [
            'UIView', 'UIViewController', 'UILabel', 'UIButton', 'UITextField', 'UITextView',
            'UIImageView', 'UITableView', 'UICollectionView', 'UIScrollView', 'UIStackView',
            'UISwitch', 'UISlider', 'UIStepper', 'UISegmentedControl', 'UIActivityIndicatorView',
            'UIProgressView', 'UIPageControl', 'UIDatePicker', 'UIPickerView', 'UIVisualEffectView',
            'UINavigationBar', 'UIToolbar', 'UITabBar', 'UISearchBar', 'UIWebView', 'WKWebView',
            'MKMapView', 'GLKView', 'SCNView', 'ARSessionView', 'AVPlayerView', 'PDFView'
        ];

        // 支持的约束类型和方法 - 扩展支持SnapKit完整属性
        this.supportedConstraintTypes = {
            size: ['width', 'height'],
            edge: ['top', 'left', 'right', 'bottom', 'leading', 'trailing'],
            center: ['centerX', 'centerY'],
            baseline: ['firstBaseline', 'lastBaseline', 'baseline'],
            aspectRatio: ['aspectRatio']
        };

        // 支持的约束关系
        this.supportedConstraintRelations = [
            'equalTo', 'greaterThanOrEqualTo', 'lessThanOrEqualTo'
        ];

        // 支持的参考类型
        this.supportedReferenceTypes = [
            'offset', 'inset'
        ];

        // 颜色格式验证正则表达式
        this.colorRegex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$|^rgb\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*\)$/i;
    }

    /**
     * 验证节点数据
     * @param {Object} node - 节点数据
     * @returns {Object} 验证结果 { isValid: boolean, errors: Array }
     */
    validateNode(node) {
        const errors = [];

        // 基础字段验证
        if (!node.id || typeof node.id !== 'string') {
            errors.push('节点ID不能为空且必须是字符串');
        } else if (!this.isValidNodeId(node.id)) {
            errors.push(`节点ID格式无效: ${node.id}`);
        }

        if (!node.name || typeof node.name !== 'string') {
            errors.push('节点名称不能为空且必须是字符串');
        } else if (node.name.length > 100) {
            errors.push('节点名称长度不能超过100个字符');
        }

        if (!node.type || typeof node.type !== 'string') {
            errors.push('节点类型不能为空且必须是字符串');
        } else if (!this.supportedComponentTypes.includes(node.type)) {
            errors.push(`不支持的组件类型: ${node.type}`);
        }

        // 属性验证
        if (node.attributes && typeof node.attributes === 'object') {
            const attributeErrors = this.validateAttributes(node.attributes);
            errors.push(...attributeErrors);
        }


        // 成员变量验证
        if (node.memberVariables && Array.isArray(node.memberVariables)) {
            const memberVariableErrors = this.validateMemberVariables(node.memberVariables);
            errors.push(...memberVariableErrors);
        }

        // 函数验证
        if (node.functions && Array.isArray(node.functions)) {
            const functionErrors = this.validateFunctions(node.functions);
            errors.push(...functionErrors);
        }

        // 协议验证
        if (node.protocols && Array.isArray(node.protocols)) {
            const protocolErrors = this.validateProtocols(node.protocols);
            errors.push(...protocolErrors);
        }

        // 布局验证
        if (node.layout && !['horizontal', 'vertical'].includes(node.layout)) {
            errors.push('布局方向必须是 horizontal 或 vertical');
        }

        // 描述验证
        if (node.description && node.description.length > 1000) {
            errors.push('描述长度不能超过1000个字符');
        }

        // 递归验证子节点
        if (node.children && Array.isArray(node.children)) {
            for (const child of node.children) {
                const childResult = this.validateNode(child);
                if (!childResult.isValid) {
                    errors.push(`子节点 ${child.id} 验证失败: ${childResult.errors.join(', ')}`);
                }
            }
        }

        return {
            isValid: errors.length === 0,
            errors
        };
    }

    /**
     * 验证树形数据
     * @param {Array} treeData - 树形数据
     * @returns {Object} 验证结果 { isValid: boolean, errors: Array }
     */
    validateTree(treeData) {
        const errors = [];

        if (!Array.isArray(treeData)) {
            errors.push('树形数据必须是数组');
            return { isValid: false, errors };
        }

        // 检查根节点ID唯一性
        const rootIds = new Set();
        for (const rootNode of treeData) {
            if (rootIds.has(rootNode.id)) {
                errors.push(`根节点ID重复: ${rootNode.id}`);
            }
            rootIds.add(rootNode.id);

            const nodeResult = this.validateNode(rootNode);
            if (!nodeResult.isValid) {
                errors.push(`根节点 ${rootNode.id} 验证失败: ${nodeResult.errors.join(', ')}`);
            }
        }

        return {
            isValid: errors.length === 0,
            errors
        };
    }

    /**
     * 验证属性数据
     * @param {Object} attributes - 属性对象
     * @returns {Array} 错误信息数组
     */
    validateAttributes(attributes) {
        const errors = [];

        for (const [key, value] of Object.entries(attributes)) {
            if (typeof key !== 'string' || key.length === 0) {
                errors.push('属性键不能为空且必须是字符串');
                continue;
            }

            if (key.length > 50) {
                errors.push(`属性键长度不能超过50个字符: ${key}`);
            }

            // 检查颜色格式
            if (key.toLowerCase().includes('color') && typeof value === 'string') {
                if (!this.colorRegex.test(value)) {
                    errors.push(`颜色格式无效: ${value}，支持格式: #RGB, #RRGGBB, rgb(r, g, b)`);
                }
            }

            // 检查数值范围
            if (typeof value === 'number') {
                if (!isFinite(value)) {
                    errors.push(`属性值必须是有效数字: ${key} = ${value}`);
                }
            }
        }

        return errors;
    }


    /**
     * 验证成员变量数据
     * @param {Array} memberVariables - 成员变量数组
     * @returns {Array} 错误信息数组
     */
    validateMemberVariables(memberVariables) {
        const errors = [];
        const variableNames = new Set();

        for (const variable of memberVariables) {
            if (!variable.name || typeof variable.name !== 'string') {
                errors.push('成员变量名称不能为空且必须是字符串');
                continue;
            }

            if (variableNames.has(variable.name)) {
                errors.push(`成员变量名称重复: ${variable.name}`);
            }
            variableNames.add(variable.name);

            if (!variable.type || !['String', 'Int', 'Bool', 'Double', 'Float', 'UIColor', 'UIFont'].includes(variable.type)) {
                errors.push(`不支持的成员变量类型: ${variable.type}`);
            }

            if (variable.defaultValue && typeof variable.defaultValue !== 'string') {
                errors.push('成员变量默认值必须是字符串');
            }
        }

        return errors;
    }

    /**
     * 验证函数数据
     * @param {Array} functions - 函数数组
     * @returns {Array} 错误信息数组
     */
    validateFunctions(functions) {
        const errors = [];
        const functionNames = new Set();

        for (const func of functions) {
            if (!func.funcName || typeof func.funcName !== 'string') {
                errors.push('函数名称不能为空且必须是字符串');
                continue;
            }

            if (functionNames.has(func.funcName)) {
                errors.push(`函数名称重复: ${func.funcName}`);
            }
            functionNames.add(func.funcName);

            if (func.funcLogic && typeof func.funcLogic !== 'string') {
                errors.push('函数逻辑必须是字符串');
            }
        }

        return errors;
    }

    /**
     * 验证协议数据
     * @param {Array} protocols - 协议数组
     * @returns {Array} 错误信息数组
     */
    validateProtocols(protocols) {
        const errors = [];
        const protocolNames = new Set();

        for (const protocol of protocols) {
            if (!protocol.protocolName || typeof protocol.protocolName !== 'string') {
                errors.push('协议名称不能为空且必须是字符串');
                continue;
            }

            if (protocolNames.has(protocol.protocolName)) {
                errors.push(`协议名称重复: ${protocol.protocolName}`);
            }
            protocolNames.add(protocol.protocolName);

            if (protocol.protocolLogic && typeof protocol.protocolLogic !== 'string') {
                errors.push('协议逻辑必须是字符串');
            }
        }

        return errors;
    }

    /**
     * 验证节点ID格式
     * @param {string} nodeId - 节点ID
     * @returns {boolean} 是否有效
     */
    isValidNodeId(nodeId) {
        if (typeof nodeId !== 'string') return false;
        if (nodeId.length % 2 !== 0) return false;

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
     * 清理和标准化节点数据
     * @param {Object} node - 节点数据
     * @returns {Object} 清理后的节点数据
     */
    sanitizeNode(node) {
        const sanitized = { ...node };

        // 确保必需字段存在
        if (!sanitized.id || typeof sanitized.id !== 'string') {
            sanitized.id = '01';
        }

        if (!sanitized.name || typeof sanitized.name !== 'string') {
            sanitized.name = '未命名节点';
        }

        if (!sanitized.type || typeof sanitized.type !== 'string') {
            sanitized.type = 'UIView';
        }

        // 清理属性
        if (sanitized.attributes && typeof sanitized.attributes === 'object') {
            const cleanedAttributes = {};
            for (const [key, value] of Object.entries(sanitized.attributes)) {
                if (typeof key === 'string' && key.length > 0 && key.length <= 50) {
                    cleanedAttributes[key] = value;
                }
            }
            sanitized.attributes = cleanedAttributes;
        } else {
            sanitized.attributes = {};
        }

        // 清理数组字段，确保是数组
        ['memberVariables', 'functions', 'protocols', 'children'].forEach(field => {
            if (!Array.isArray(sanitized[field])) {
                sanitized[field] = [];
            }
        });

        // 确保constraintPackages字段存在且是数组
        if (!Array.isArray(sanitized.constraintPackages)) {
            sanitized.constraintPackages = [];
        }

        // 移除冗余的constraints字段
        if ('constraints' in sanitized) {
            delete sanitized.constraints;
        }

        // 确保布局方向有效
        if (!['horizontal', 'vertical'].includes(sanitized.layout)) {
            sanitized.layout = 'horizontal';
        }

        // 清理描述
        if (sanitized.description && typeof sanitized.description === 'string') {
            if (sanitized.description.length > 1000) {
                sanitized.description = sanitized.description.substring(0, 1000);
            }
        } else {
            sanitized.description = '';
        }

        // 递归清理子节点
        if (sanitized.children && Array.isArray(sanitized.children)) {
            sanitized.children = sanitized.children.map(child => this.sanitizeNode(child));
        }

        return sanitized;
    }

    /**
     * 验证导入的JSON数据
     * @param {Object} jsonData - JSON数据
     * @returns {Object} 验证结果 { isValid: boolean, errors: Array, data: Object }
     */
    validateImportData(jsonData) {
        const errors = [];

        if (!jsonData || typeof jsonData !== 'object') {
            errors.push('导入的数据必须是有效的JSON对象');
            return { isValid: false, errors, data: null };
        }

        // 检查版本兼容性
        if (jsonData.version && jsonData.version !== '1.0.0') {
            errors.push(`不支持的版本: ${jsonData.version}，当前支持版本: 1.0.0`);
        }

        // 验证树形数据
        if (jsonData.treeData && Array.isArray(jsonData.treeData)) {
            const treeResult = this.validateTree(jsonData.treeData);
            if (!treeResult.isValid) {
                errors.push(...treeResult.errors);
            }
        } else {
            errors.push('缺少树形数据 (treeData)');
        }

        // 清理和标准化数据
        let sanitizedData = null;
        if (jsonData.treeData) {
            sanitizedData = {
                treeData: jsonData.treeData.map(node => this.sanitizeNode(node)),
                settings: jsonData.settings || {},
                version: '1.0.0',
                importTime: new Date().toISOString()
            };
        }

        return {
            isValid: errors.length === 0,
            errors,
            data: sanitizedData
        };
    }

    /**
     * 获取支持的组件类型列表
     * @returns {Array} 支持的组件类型数组
     */
    getSupportedComponentTypes() {
        return [...this.supportedComponentTypes];
    }

    /**
     * 获取支持的约束类型和方法
     * @returns {Object} 支持的约束类型和方法
     */
    getSupportedConstraintTypes() {
        return { ...this.supportedConstraintTypes };
    }

    /**
     * 检查约束冲突
     * @param {Array} constraints - 约束数组
     * @returns {Array} 冲突信息数组
     */
    checkConstraintConflicts(constraints) {
        const conflicts = [];
        const constraintMap = new Map();

        for (const constraint of constraints) {
            const key = `${constraint.package}-${constraint.type}`;
            if (constraintMap.has(key)) {
                conflicts.push(`约束包 ${constraint.package} 中存在重复的约束类型: ${constraint.type}`);
            }
            constraintMap.set(key, constraint);
        }

        return conflicts;
    }

    /**
     * 验证颜色值
     * @param {string} color - 颜色值
     * @returns {boolean} 是否有效
     */
    isValidColor(color) {
        return this.colorRegex.test(color);
    }

    /**
     * 格式化颜色值
     * @param {string} color - 颜色值
     * @returns {string} 格式化后的颜色值
     */
    formatColor(color) {
        if (!color) return '#000000';

        if (this.colorRegex.test(color)) {
            return color;
        }

        // 尝试修复常见的颜色格式问题
        if (color.startsWith('rgb(') && !color.endsWith(')')) {
            return color + ')';
        }

        return '#000000';
    }
}

// 创建全局数据验证器实例
const dataValidator = new DataValidator();

// 导出数据验证器
window.dataValidator = dataValidator;
