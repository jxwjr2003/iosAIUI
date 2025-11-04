/**
 * iOS 模拟器组件
 * 负责实时渲染和预览UI效果，基于CSS实现iOS风格渲染
 */
class Simulator {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
        this.currentRootNode = null;
        this.zoomLevel = 1.0;
        this.devicePresets = {
            iphone15: { width: 393, height: 852, name: 'iPhone 15' },
            iphone15pro: { width: 393, height: 852, name: 'iPhone 15 Pro' },
            iphone14: { width: 390, height: 844, name: 'iPhone 14' },
            custom: { width: 393, height: 852, name: '自定义' }
        };
        this.currentDevice = 'iphone15';

        // 初始化组件
        this.init();
    }

    /**
     * 初始化模拟器
     */
    init() {
        // 创建模拟器结构
        this.createSimulatorStructure();

        // 绑定事件监听器
        this.bindEvents();

        // 订阅状态变化
        stateManager.subscribe((state) => {
            console.log('📱 [Simulator] 状态变化:', {
                '传入根节点ID': state.selectedRootNode?.id,
                '当前根节点ID': this.currentRootNode?.id,
                '传入选中节点ID': state.selectedNode?.id,
                '时间戳': new Date().toISOString()
            });

            try {
                // 当根节点发生变化时更新模拟器
                if (state.selectedRootNode !== this.currentRootNode) {
                    console.log('🔄 [Simulator] 根节点发生变化，调用 updateSelectedRootNode');
                    this.updateSelectedRootNode(state.selectedRootNode);
                } else {
                    console.log('⏭️ [Simulator] 根节点未变化，跳过更新');
                }

                // 当树数据发生变化时重新渲染当前根节点（确保属性更新反映到模拟器）
                if (this.currentRootNode) {
                    // 检查当前根节点是否有更新
                    const updatedRootNode = stateManager.findNode(this.currentRootNode.id);
                    if (updatedRootNode && JSON.stringify(updatedRootNode) !== JSON.stringify(this.currentRootNode)) {
                        console.log('🔄 [Simulator] 当前根节点有更新，重新渲染');
                        this.currentRootNode = updatedRootNode;
                        this.renderRootNode();
                    }
                }
            } catch (error) {
                console.error('❌ [Simulator] 状态订阅错误:', error);
                // 避免错误传播导致整个应用崩溃
            }
        });

        // 初始渲染
        this.updateDeviceView();
    }

    /**
     * 创建模拟器结构
     */
    createSimulatorStructure() {
        // 清空容器
        this.container.innerHTML = '';

        // 创建模拟器设备容器
        this.deviceContainer = document.createElement('div');
        this.deviceContainer.id = 'simulator-device';
        this.deviceContainer.className = 'simulator-device';

        // 创建模拟器屏幕
        this.screenContainer = document.createElement('div');
        this.screenContainer.id = 'simulator-screen';
        this.screenContainer.className = 'simulator-screen';

        // 创建模拟器内容区域
        this.contentContainer = document.createElement('div');
        this.contentContainer.id = 'simulator-content';
        this.contentContainer.className = 'simulator-content';

        // 创建占位符
        this.placeholder = document.createElement('div');
        this.placeholder.className = 'simulator-placeholder';
        this.placeholder.innerHTML = '<p>选择根节点开始预览</p>';

        // 组装结构
        this.contentContainer.appendChild(this.placeholder);
        this.screenContainer.appendChild(this.contentContainer);
        this.deviceContainer.appendChild(this.screenContainer);
        this.container.appendChild(this.deviceContainer);
    }

    /**
     * 绑定事件监听器
     */
    bindEvents() {
        // 绑定设备选择器
        const deviceSelector = document.getElementById('device-selector');
        if (deviceSelector) {
            deviceSelector.addEventListener('change', (e) => {
                this.currentDevice = e.target.value;
                this.updateDeviceView();
            });
        }

        // 绑定刷新按钮
        const refreshBtn = document.getElementById('refresh-simulator-btn');
        if (refreshBtn) {
            refreshBtn.addEventListener('click', () => {
                this.refreshSimulator();
            });
        }

        // 绑定缩放按钮
        const zoomInBtn = document.getElementById('zoom-in-btn');
        if (zoomInBtn) {
            zoomInBtn.addEventListener('click', () => {
                this.zoomIn();
            });
        }

        const zoomOutBtn = document.getElementById('zoom-out-btn');
        if (zoomOutBtn) {
            zoomOutBtn.addEventListener('click', () => {
                this.zoomOut();
            });
        }

        // 绑定重置视图按钮
        const resetViewBtn = document.getElementById('reset-view-btn');
        if (resetViewBtn) {
            resetViewBtn.addEventListener('click', () => {
                this.resetView();
            });
        }
    }

    /**
     * 更新选中的根节点
     * @param {Object} rootNode - 根节点数据
     */
    updateSelectedRootNode(rootNode) {
        this.currentRootNode = rootNode;
        this.renderRootNode();
    }

    /**
     * 渲染根节点 - 改进版，支持依赖关系分析
     */
    renderRootNode() {
        if (!this.currentRootNode) {
            this.showPlaceholder();
            return;
        }

        this.hidePlaceholder();
        this.clearContent();

        try {
            // 清空约束布局引擎缓存
            if (window.constraintLayoutEngine) {
                window.constraintLayoutEngine.clearCache();
            }

            // 创建根节点元素 - 根节点没有父节点，所以传递null
            const rootElement = this.createNodeElement(this.currentRootNode, true, null, this.contentContainer);
            this.contentContainer.appendChild(rootElement);

            // 应用约束布局 - 根节点的父节点是contentContainer
            // 新的约束布局引擎会在内部构建依赖图并按拓扑顺序应用约束
            this.applyConstraints(this.currentRootNode, rootElement, null, this.contentContainer);

            // 更新上下文显示
            this.updateContextDisplay();

        } catch (error) {
            console.error('渲染根节点时出错:', error);
            this.showError('渲染失败: ' + error.message);
        }
    }

    /**
     * 创建节点元素 - 改进版，延迟约束应用
     * @param {Object} node - 节点数据
     * @param {boolean} isRoot - 是否是根节点
     * @param {Object} parentNode - 父节点数据
     * @param {HTMLElement} parentElement - 父DOM元素
     * @returns {HTMLElement} 节点元素
     */
    createNodeElement(node, isRoot = false, parentNode = null, parentElement = null) {
        const element = document.createElement('div');
        element.className = `simulator-node ${node.type.toLowerCase()}`;
        element.dataset.nodeId = node.id;
        element.dataset.nodeType = node.type;

        // 应用基础样式
        this.applyBaseStyles(node, element, isRoot);

        // 应用属性样式
        this.applyAttributeStyles(node, element);

        // 应用布局样式
        this.applyLayoutStyles(node, element);

        // 缓存节点信息到约束布局引擎，但不立即应用约束
        // 约束将在所有节点创建完成后按依赖关系统一应用
        this.cacheNodeForConstraints(node, element, parentNode, parentElement);

        // 递归渲染子节点
        if (node.children && node.children.length > 0) {
            const childrenContainer = document.createElement('div');
            childrenContainer.className = 'simulator-children-container';

            node.children.forEach(child => {
                const childElement = this.createNodeElement(child, false, node, element);
                childrenContainer.appendChild(childElement);
            });

            element.appendChild(childrenContainer);
        }

        // 添加内容显示
        this.addContentDisplay(node, element);

        return element;
    }

    /**
     * 应用基础样式
     * @param {Object} node - 节点数据
     * @param {HTMLElement} element - DOM元素
     * @param {boolean} isRoot - 是否是根节点
     */
    applyBaseStyles(node, element, isRoot) {
        const styles = {
            position: 'relative',
            boxSizing: 'border-box',
            display: 'flex'
        };

        // 根节点特殊处理
        if (isRoot) {
            styles.width = '100%';
            styles.height = '100%';
            styles.minHeight = '100%';
            styles.overflow = 'hidden';
        } else {
            styles.flex = '0 0 auto';
        }

        // 应用布局方向
        if (node.layout === 'vertical') {
            styles.flexDirection = 'column';
        } else {
            styles.flexDirection = 'row';
        }

        // 应用样式到元素
        Object.assign(element.style, styles);
    }

    /**
     * 应用属性样式 - 增强版，支持5个基本属性和字体属性
     * @param {Object} node - 节点数据
     * @param {HTMLElement} element - DOM元素
     */
    applyAttributeStyles(node, element) {
        if (!node.attributes) return;

        const styles = {};

        // 1. 处理5个基本属性
        // 背景颜色
        if (node.attributes.backgroundColor) {
            styles.backgroundColor = this.parseColor(node.attributes.backgroundColor);
        }

        // 透明度
        if (node.attributes.alpha !== undefined) {
            styles.opacity = node.attributes.alpha;
        }

        // 圆角
        if (node.attributes.cornerRadius) {
            styles.borderRadius = `${node.attributes.cornerRadius}px`;
        }

        // 边框宽度
        if (node.attributes.borderWidth) {
            styles.borderWidth = `${node.attributes.borderWidth}px`;
            styles.borderStyle = 'solid';
        }

        // 边框颜色
        if (node.attributes.borderColor) {
            styles.borderColor = this.parseColor(node.attributes.borderColor);
        }

        // 2. 处理字体相关属性（针对UILabel、UIButton、UITextField）
        if (['UILabel', 'UIButton', 'UITextField', 'UITextView'].includes(node.type)) {
            // 字体大小
            if (node.attributes.fontSize) {
                styles.fontSize = `${node.attributes.fontSize}px`;
            }

            // 文本颜色
            if (node.attributes.textColor) {
                styles.color = this.parseColor(node.attributes.textColor);
            }

            // 文本对齐
            if (node.attributes.textAlignment) {
                styles.textAlign = node.attributes.textAlignment;
            }

            // 字体样式
            if (node.attributes.font) {
                this.applyFontStyle(node.attributes.font, styles);
            }

            // 按钮标题颜色
            if (node.type === 'UIButton' && node.attributes.titleColor) {
                styles.color = this.parseColor(node.attributes.titleColor);
            }
        }

        // 3. 处理通用属性
        // 文本内容
        if (node.attributes.text) {
            element.textContent = node.attributes.text;
        }

        // 占位符文本
        if (node.attributes.placeholder) {
            element.setAttribute('placeholder', node.attributes.placeholder);
        }

        // 宽度和高度
        if (node.attributes.width) {
            styles.width = `${node.attributes.width}px`;
        }

        if (node.attributes.height) {
            styles.height = `${node.attributes.height}px`;
        }

        // 应用样式到元素
        Object.assign(element.style, styles);
    }

    /**
     * 应用字体样式
     * @param {string} font - 字体类型
     * @param {Object} styles - 样式对象
     */
    applyFontStyle(font, styles) {
        const fontMap = {
            'system-17': { family: '-apple-system', size: 17, weight: 'normal' },
            'system-bold-17': { family: '-apple-system', size: 17, weight: 'bold' },
            'system-italic-17': { family: '-apple-system', size: 17, weight: 'normal', style: 'italic' },
            'system-14': { family: '-apple-system', size: 14, weight: 'normal' },
            'system-bold-14': { family: '-apple-system', size: 14, weight: 'bold' },
            'system-20': { family: '-apple-system', size: 20, weight: 'normal' },
            'system-bold-20': { family: '-apple-system', size: 20, weight: 'bold' },
            'preferred-headline': { family: '-apple-system', size: 17, weight: 'semibold' },
            'preferred-body': { family: '-apple-system', size: 17, weight: 'normal' },
            'preferred-caption1': { family: '-apple-system', size: 12, weight: 'normal' },
            'preferred-caption2': { family: '-apple-system', size: 11, weight: 'normal' },
            'preferred-footnote': { family: '-apple-system', size: 13, weight: 'normal' }
        };

        const fontConfig = fontMap[font] || fontMap['system-17'];

        styles.fontFamily = fontConfig.family;
        styles.fontSize = `${fontConfig.size}px`;
        styles.fontWeight = fontConfig.weight;

        if (fontConfig.style) {
            styles.fontStyle = fontConfig.style;
        }
    }

    /**
     * 应用布局样式
     * @param {Object} node - 节点数据
     * @param {HTMLElement} element - DOM元素
     */
    applyLayoutStyles(node, element) {
        const styles = {};

        // 处理对齐方式
        if (node.attributes?.alignment) {
            switch (node.attributes.alignment) {
                case 'center':
                    styles.justifyContent = 'center';
                    styles.alignItems = 'center';
                    break;
                case 'leading':
                    styles.justifyContent = 'flex-start';
                    break;
                case 'trailing':
                    styles.justifyContent = 'flex-end';
                    break;
                case 'top':
                    styles.alignItems = 'flex-start';
                    break;
                case 'bottom':
                    styles.alignItems = 'flex-end';
                    break;
            }
        }

        // 处理分布方式
        if (node.attributes?.distribution) {
            switch (node.attributes.distribution) {
                case 'fill':
                    styles.flex = '1';
                    break;
                case 'fillEqually':
                    styles.flex = '1';
                    break;
                case 'equalSpacing':
                    styles.justifyContent = 'space-between';
                    break;
            }
        }

        // 应用样式到元素
        Object.assign(element.style, styles);
    }

    /**
     * 添加内容显示
     * @param {Object} node - 节点数据
     * @param {HTMLElement} element - DOM元素
     */
    addContentDisplay(node, element) {
        // 根据节点类型添加特定内容
        switch (node.type) {
            case 'UILabel':
                this.addLabelContent(node, element);
                break;
            case 'UIButton':
                this.addButtonContent(node, element);
                break;
            case 'UITextField':
                this.addTextFieldContent(node, element);
                break;
            case 'UITextView':
                this.addTextViewContent(node, element);
                break;
            case 'UIImageView':
                this.addImageViewContent(node, element);
                break;
            case 'UIView':
                // UIView默认不添加额外内容
                break;
            default:
                // 为其他组件类型添加默认标识
                this.addDefaultContent(node, element);
        }
    }

    /**
     * 添加标签内容
     * @param {Object} node - 节点数据
     * @param {HTMLElement} element - DOM元素
     */
    addLabelContent(node, element) {
        const text = node.attributes?.text || node.name || 'Label';
        element.textContent = text;
        element.style.display = 'flex';
        element.style.alignItems = 'center';
        element.style.justifyContent = 'center';
        element.style.padding = '8px';
    }

    /**
     * 添加按钮内容
     * @param {Object} node - 节点数据
     * @param {HTMLElement} element - DOM元素
     */
    addButtonContent(node, element) {
        const title = node.attributes?.title || node.name || 'Button';
        element.textContent = title;
        element.style.display = 'flex';
        element.style.alignItems = 'center';
        element.style.justifyContent = 'center';
        element.style.padding = '12px 24px';
        element.style.borderRadius = '8px';
        element.style.cursor = 'pointer';
        element.style.fontWeight = '600';
    }

    /**
     * 添加文本字段内容
     * @param {Object} node - 节点数据
     * @param {HTMLElement} element - DOM元素
     */
    addTextFieldContent(node, element) {
        const placeholder = node.attributes?.placeholder || '请输入文本';
        const text = node.attributes?.text || '';
        element.innerHTML = `
            <input type="text" placeholder="${placeholder}" value="${text}" style="
                width: 100%;
                padding: 12px;
                border: 1px solid #ddd;
                border-radius: 6px;
                font-size: 16px;
                background: transparent;
            ">
        `;
    }

    /**
     * 添加文本视图内容
     * @param {Object} node - 节点数据
     * @param {HTMLElement} element - DOM元素
     */
    addTextViewContent(node, element) {
        const text = node.attributes?.text || '';
        element.innerHTML = `
            <textarea style="
                width: 100%;
                height: 100%;
                padding: 12px;
                border: 1px solid #ddd;
                border-radius: 6px;
                font-size: 16px;
                background: transparent;
                resize: none;
            ">${text}</textarea>
        `;
    }

    /**
     * 添加图片视图内容
     * @param {Object} node - 节点数据
     * @param {HTMLElement} element - DOM元素
     */
    addImageViewContent(node, element) {
        const imageName = node.attributes?.imageName || 'placeholder';
        element.innerHTML = `
            <div style="
                width: 100%;
                height: 100%;
                background: #f0f0f0;
                display: flex;
                align-items: center;
                justify-content: center;
                color: #999;
                font-size: 14px;
            ">
                ${imageName}
            </div>
        `;
    }

    /**
     * 添加默认内容
     * @param {Object} node - 节点数据
     * @param {HTMLElement} element - DOM元素
     */
    addDefaultContent(node, element) {
        element.innerHTML = `
            <div style="
                width: 100%;
                height: 100%;
                display: flex;
                align-items: center;
                justify-content: center;
                color: #666;
                font-size: 12px;
                border: 1px dashed #ddd;
                padding: 8px;
            ">
                ${node.type}
            </div>
        `;
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
            // 这里只缓存节点信息，不立即应用约束
            // 约束将在所有节点创建完成后统一应用
            window.constraintLayoutEngine.nodeCache.set(node.id, {
                node,
                element,
                parentNode,
                parentElement
            });
        }
    }

    /**
     * 应用约束 - 使用新的约束布局引擎
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
            const relationMap = {
                'equalTo': 'equal',
                'greaterThanOrEqualTo': 'greaterThanOrEqual',
                'lessThanOrEqualTo': 'lessThanOrEqual'
            };
            constraintMethod = relationMap[relation] || relation;
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
     * 解析颜色值
     * @param {string} color - 颜色值
     * @returns {string} 解析后的颜色值
     */
    parseColor(color) {
        if (!color) return '#000000';

        // 处理十六进制颜色
        if (color.startsWith('#')) {
            return color;
        }

        // 处理RGB颜色
        if (color.startsWith('rgb')) {
            return color;
        }

        // 处理颜色名称
        const colorMap = {
            'red': '#FF3B30',
            'green': '#34C759',
            'blue': '#007AFF',
            'yellow': '#FFCC00',
            'orange': '#FF9500',
            'purple': '#AF52DE',
            'pink': '#FF2D55',
            'white': '#FFFFFF',
            'black': '#000000',
            'gray': '#8E8E93',
            'lightGray': '#C7C7CC'
        };

        return colorMap[color.toLowerCase()] || '#000000';
    }

    /**
     * 更新设备视图
     */
    updateDeviceView() {
        const device = this.devicePresets[this.currentDevice];
        if (!device) return;

        // 更新设备尺寸
        this.deviceContainer.style.width = `${device.width}px`;
        this.deviceContainer.style.height = `${device.height}px`;

        // 更新屏幕尺寸
        this.screenContainer.style.width = `${device.width - 40}px`; // 减去内边距
        this.screenContainer.style.height = `${device.height - 40}px`;

        // 应用缩放
        this.applyZoom();

        // 重新渲染当前根节点
        if (this.currentRootNode) {
            this.renderRootNode();
        }
    }

    /**
     * 应用缩放
     */
    applyZoom() {
        this.container.style.transform = `scale(${this.zoomLevel})`;
        this.container.style.transformOrigin = 'center center';
    }

    /**
     * 放大
     */
    zoomIn() {
        this.zoomLevel = Math.min(this.zoomLevel + 0.1, 2.0);
        this.applyZoom();
        this.showNotification(`缩放: ${Math.round(this.zoomLevel * 100)}%`);
    }

    /**
     * 缩小
     */
    zoomOut() {
        this.zoomLevel = Math.max(this.zoomLevel - 0.1, 0.5);
        this.applyZoom();
        this.showNotification(`缩放: ${Math.round(this.zoomLevel * 100)}%`);
    }

    /**
     * 重置视图
     */
    resetView() {
        this.zoomLevel = 1.0;
        this.applyZoom();
        this.showNotification('视图已重置');
    }

    /**
     * 刷新模拟器
     */
    refreshSimulator() {
        if (this.currentRootNode) {
            this.renderRootNode();
            this.showNotification('模拟器已刷新');
        } else {
            this.showNotification('请先选择根节点');
        }
    }

    /**
     * 显示占位符
     */
    showPlaceholder() {
        this.placeholder.style.display = 'flex';
    }

    /**
     * 隐藏占位符
     */
    hidePlaceholder() {
        this.placeholder.style.display = 'none';
    }

    /**
     * 清空内容
     */
    clearContent() {
        console.log('🧹 [Simulator] clearContent 被调用:', {
            '当前子节点数量': this.contentContainer.children.length,
            '占位符存在': !!this.placeholder,
            '时间戳': new Date().toISOString()
        });

        // 使用更高效的DOM操作方法，避免循环删除导致的性能问题
        const childrenToRemove = [];
        for (let i = 0; i < this.contentContainer.children.length; i++) {
            const child = this.contentContainer.children[i];
            if (child !== this.placeholder) {
                childrenToRemove.push(child);
            }
        }

        // 批量移除子节点
        childrenToRemove.forEach(child => {
            this.contentContainer.removeChild(child);
        });

        console.log('✅ [Simulator] clearContent 完成:', {
            '移除节点数量': childrenToRemove.length,
            '剩余子节点数量': this.contentContainer.children.length,
            '时间戳': new Date().toISOString()
        });
    }

    /**
     * 显示错误
     * @param {string} message - 错误消息
     */
    showError(message) {
        this.clearContent();
        const errorElement = document.createElement('div');
        errorElement.className = 'simulator-error';
        errorElement.innerHTML = `
            <div style="
                color: #FF3B30;
                padding: 20px;
                text-align: center;
                background: #FFE5E5;
                border-radius: 8px;
                margin: 20px;
            ">
                <strong>错误:</strong> ${message}
            </div>
        `;
        this.contentContainer.appendChild(errorElement);
    }

    /**
     * 更新上下文显示
     */
    updateContextDisplay() {
        const contextElement = document.getElementById('current-context');
        if (contextElement && this.currentRootNode) {
            contextElement.innerHTML = `
                <p><strong>节点ID:</strong> ${this.currentRootNode.id}</p>
                <p><strong>节点名称:</strong> ${this.currentRootNode.name}</p>
                <p><strong>节点类型:</strong> ${this.currentRootNode.type}</p>
                <p><strong>子节点数:</strong> ${this.currentRootNode.children?.length || 0}</p>
            `;
        }
    }

    /**
     * 显示通知
     * @param {string} message - 通知消息
     */
    showNotification(message) {
        // 创建通知元素
        const notification = document.createElement('div');
        notification.className = 'simulator-notification';
        notification.textContent = message;
        notification.style.cssText = `
            position: absolute;
            top: 10px;
            left: 50%;
            transform: translateX(-50%);
            background: rgba(0, 0, 0, 0.8);
            color: white;
            padding: 8px 16px;
            border-radius: 4px;
            font-size: 12px;
            z-index: 1000;
            animation: fadeInOut 2s ease-in-out;
        `;

        this.container.appendChild(notification);

        // 2秒后自动移除
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 2000);
    }

    /**
     * 获取当前设备信息
     * @returns {Object} 设备信息
     */
    getCurrentDevice() {
        return this.devicePresets[this.currentDevice];
    }

    /**
     * 设置自定义设备尺寸
     * @param {number} width - 宽度
     * @param {number} height - 高度
     */
    setCustomDeviceSize(width, height) {
        this.devicePresets.custom.width = width;
        this.devicePresets.custom.height = height;
        this.currentDevice = 'custom';
        this.updateDeviceView();
    }

    /**
     * 销毁组件
     */
    destroy() {
        // 清理事件监听器和DOM元素
        this.container.innerHTML = '';
    }
}

// 添加CSS动画
const simulatorStyle = document.createElement('style');
simulatorStyle.textContent = `
    @keyframes fadeInOut {
        0% { opacity: 0; }
        10% { opacity: 1; }
        90% { opacity: 1; }
        100% { opacity: 0; }
    }

    .simulator-node {
        transition: all 0.2s ease;
    }

    .simulator-node:hover {
        outline: 2px solid #007AFF;
        outline-offset: -2px;
    }

    .simulator-error {
        animation: shake 0.5s ease-in-out;
    }

    @keyframes shake {
        0%, 100% { transform: translateX(0); }
        25% { transform: translateX(-5px); }
        75% { transform: translateX(5px); }
    }

    .simulator-children {
        display: flex;
        flex: 1;
    }

    /* 组件特定样式 */
    .simulator-node.uiview {
        background-color: #FFFFFF;
    }

    .simulator-node.uilabel {
        background-color: transparent;
    }

    .simulator-node.uibutton {
        background-color: #007AFF;
        color: white;
        border-radius: 8px;
        cursor: pointer;
        user-select: none;
    }

    .simulator-node.uibutton:hover {
        background-color: #0056CC;
    }

    .simulator-node.uitextfield {
        background-color: #FFFFFF;
        border: 1px solid #C7C7CC;
        border-radius: 8px;
    }

    .simulator-node.uiimageview {
        background-color: #F2F2F7;
        border-radius: 8px;
    }

    .simulator-node.uistackview {
        background-color: transparent;
    }

    .simulator-node.uiscrollview {
        background-color: #FFFFFF;
        overflow: auto;
    }
`;
document.head.appendChild(simulatorStyle);

// 创建全局模拟器实例
let simulator = null;

// 初始化模拟器
document.addEventListener('DOMContentLoaded', () => {
    simulator = new Simulator('simulator-container');
});

// 导出模拟器
window.simulator = simulator;
