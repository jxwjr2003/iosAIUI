/**
 * iOS 模拟器组件
 * 负责实时渲染和预览UI效果，基于CSS实现iOS风格渲染
 */
class Simulator {
    constructor(containerId, eventManager = null) {
        this.container = document.getElementById(containerId);
        this.eventManager = eventManager;
        this.currentRootNode = null;
        this.zoomLevel = 1.0;
        this.devicePresets = {
            iphone16: {
                width: 393 + 40,
                height: 852 + 40,
                name: 'iPhone 16',
                logicalResolution: '393×852 pt',
                physicalResolution: '1179×2556 px'
            },
            iphone16plus: {
                width: 428 + 40,
                height: 926 + 40,
                name: 'iPhone 16 Plus',
                logicalResolution: '428×926 pt',
                physicalResolution: '1284×2778 px'
            },
            iphone16pro: {
                width: 393 + 40,
                height: 852 + 40,
                name: 'iPhone 16 Pro',
                logicalResolution: '393×852 pt',
                physicalResolution: '1179×2556 px'
            },
            iphone16promax: {
                width: 430 + 40,
                height: 932 + 40,
                name: 'iPhone 16 Pro Max',
                logicalResolution: '430×932 pt',
                physicalResolution: '1290×2796 px'
            },
            iphone15: {
                width: 393 + 40,
                height: 852 + 40,
                name: 'iPhone 15',
                logicalResolution: '393×852 pt',
                physicalResolution: '1179×2556 px'
            },
            iphone15pro: {
                width: 393 + 40,
                height: 852 + 40,
                name: 'iPhone 15 Pro',
                logicalResolution: '393×852 pt',
                physicalResolution: '1179×2556 px'
            },
            iphone14: {
                width: 390 + 40,
                height: 844 + 40,
                name: 'iPhone 14',
                logicalResolution: '390×844 pt',
                physicalResolution: '1170×2532 px'
            },
            custom: {
                width: 393 + 40,
                height: 852 + 40,
                name: '自定义',
                logicalResolution: '393×852 pt',
                physicalResolution: '1179×2556 px'
            }
        };
        this.currentDevice = 'iphone16promax';

        // 初始化组件
        this.init();

        // 发布模拟器就绪事件
        if (this.eventManager) {
            this.eventManager.emit('simulator:ready', this);
        }
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

            // 强制DOM重排，确保尺寸更新生效
            this.forceReflow();

            // 获取实时容器尺寸
            const containerWidth = this.contentContainer.clientWidth;
            const containerHeight = this.contentContainer.clientHeight;

            console.log('📱 [Simulator] 渲染根节点:', {
                '容器宽度': containerWidth,
                '容器高度': containerHeight,
                '设备': this.currentDevice,
                '时间戳': new Date().toISOString()
            });

            // 创建虚拟节点"00"代表模拟器屏幕 - 确保使用最新设备尺寸
            const device = this.devicePresets[this.currentDevice];
            const simulatorNode = {
                id: "00",
                type: "simulator",
                attributes: {
                    width: containerWidth,
                    height: containerHeight,
                    deviceWidth: device.width - 40, // 屏幕实际宽度（减去内边距）
                    deviceHeight: device.height - 40 // 屏幕实际高度（减去内边距）
                }
            };

            console.log('📏 [Simulator] 虚拟节点"00"尺寸:', {
                '容器宽度': containerWidth,
                '容器高度': containerHeight,
                '设备宽度': device.width,
                '设备高度': device.height,
                '屏幕宽度': device.width - 40,
                '屏幕高度': device.height - 40,
                '时间戳': new Date().toISOString()
            });

            // 缓存虚拟节点到约束布局引擎
            if (window.constraintLayoutEngine) {
                window.constraintLayoutEngine.nodeCache.set(simulatorNode.id, {
                    node: simulatorNode,
                    element: this.contentContainer,
                    parentNode: null,
                    parentElement: null
                });
            }

            // 创建根节点元素 - 根节点没有父节点，所以传递null
            const rootElement = this.createNodeElement(this.currentRootNode, true, null, this.contentContainer);

            // 检查根节点是否有宽度约束，如果没有才强制设置为100%
            const hasWidthConstraint = this.hasWidthConstraint(this.currentRootNode);
            if (!hasWidthConstraint) {
                rootElement.style.width = '100%';
                rootElement.style.minWidth = '100%';
                rootElement.style.maxWidth = '100%';
                console.log('📏 [Simulator] 根节点无宽度约束，设置宽度为100%');
            } else {
                console.log('✅ [Simulator] 根节点有宽度约束，保留约束设置');
            }

            this.contentContainer.appendChild(rootElement);

            // 应用约束布局 - 根节点的父节点是contentContainer
            // 新的约束布局引擎会在内部构建依赖图并按拓扑顺序应用约束
            this.applyConstraints(this.currentRootNode, rootElement, null, this.contentContainer);

            // 在下一帧检查是否需要覆盖约束布局引擎的设置
            requestAnimationFrame(() => {
                // 只有没有宽度约束时才强制设置100%宽度
                if (!hasWidthConstraint) {
                    console.log('🔄 [Simulator] 强制设置根节点宽度为100%', {
                        '当前宽度': rootElement.offsetWidth,
                        '目标宽度': this.contentContainer.clientWidth,
                        '时间戳': new Date().toISOString()
                    });
                    rootElement.style.width = '100%';
                    rootElement.style.minWidth = '100%';
                    rootElement.style.maxWidth = '100%';
                } else {
                    console.log('✅ [Simulator] 保留根节点的宽度约束设置', {
                        '当前宽度': rootElement.offsetWidth,
                        '约束宽度': rootElement.style.width,
                        '时间戳': new Date().toISOString()
                    });
                }
            });

            // 更新上下文显示
            this.updateContextDisplay();

            console.log('✅ [Simulator] 根节点渲染完成:', {
                '根节点宽度': rootElement.offsetWidth,
                '根节点高度': rootElement.offsetHeight,
                '时间戳': new Date().toISOString()
            });

        } catch (error) {
            console.error('渲染根节点时出错:', error);
            this.showError('渲染失败: ' + error.message);
        }
    }

    /**
     * 创建节点元素 - 改进版，延迟约束应用，支持虚拟节点
     * @param {Object} node - 节点数据
     * @param {boolean} isRoot - 是否是根节点
     * @param {Object} parentNode - 父节点数据
     * @param {HTMLElement} parentElement - 父DOM元素
     * @returns {HTMLElement} 节点元素
     */
    createNodeElement(node, isRoot = false, parentNode = null, parentElement = null) {
        // 检查是否是虚拟节点 - 添加安全检查
        const isVirtualNode = window.virtualNodeProcessor &&
            window.virtualNodeProcessor.isVirtualNode &&
            window.virtualNodeProcessor.isVirtualNode(node);

        if (isVirtualNode) {
            return this.createVirtualNodeElement(node, isRoot, parentNode, parentElement);
        }

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
     * 创建虚拟节点元素
     * @param {Object} virtualNode - 虚拟节点数据
     * @param {boolean} isRoot - 是否是根节点
     * @param {Object} parentNode - 父节点数据
     * @param {HTMLElement} parentElement - 父DOM元素
     * @returns {HTMLElement} 虚拟节点元素
     */
    createVirtualNodeElement(virtualNode, isRoot = false, parentNode = null, parentElement = null) {
        // 获取虚拟节点的完整子树 - 添加安全检查
        const virtualSubtree = window.virtualNodeProcessor &&
            window.virtualNodeProcessor.getVirtualSubtree ?
            window.virtualNodeProcessor.getVirtualSubtree(virtualNode) : null;

        if (!virtualSubtree || !virtualSubtree.children) {
            // 如果无法获取虚拟子树，创建占位元素
            const placeholderElement = document.createElement('div');
            placeholderElement.className = 'simulator-node simulator-virtual-node';
            placeholderElement.dataset.nodeId = virtualNode.id;
            placeholderElement.dataset.nodeType = virtualNode.type;
            placeholderElement.innerHTML = `
                <div style="padding: 8px; background: #f0f0f0; border: 1px dashed #ccc; border-radius: 4px;">
                    <div style="font-weight: 500;">[引用] ${virtualNode.type}</div>
                    <div style="font-size: 12px; color: #666;">无法加载引用的内容</div>
                </div>
            `;
            return placeholderElement;
        }

        // 创建虚拟节点容器 - 使用标准的节点元素结构
        const virtualContainer = document.createElement('div');
        virtualContainer.className = `simulator-node ${virtualNode.type.toLowerCase()} simulator-virtual-container`;
        virtualContainer.dataset.nodeId = virtualNode.id;
        virtualContainer.dataset.nodeType = virtualNode.type;
        virtualContainer.dataset.isVirtual = 'true';
        virtualContainer.dataset.referencedRootId = virtualNode.referencedRootId;

        // 应用虚拟节点的样式到容器本身
        this.applyBaseStyles(virtualNode, virtualContainer, false);
        this.applyAttributeStyles(virtualNode, virtualContainer);
        this.applyLayoutStyles(virtualNode, virtualContainer);

        // 创建虚拟内容容器
        const virtualContent = document.createElement('div');
        virtualContent.className = 'simulator-virtual-content';
        virtualContent.style.cssText = `
            width: 100%;
            height: 100%;
            position: relative;
        `;

        // 渲染虚拟子树
        virtualSubtree.children.forEach(child => {
            const childElement = this.createNodeElement(child, false, virtualNode, virtualContent);
            virtualContent.appendChild(childElement);
        });

        virtualContainer.appendChild(virtualContent);

        // 缓存节点信息到约束布局引擎
        this.cacheNodeForConstraints(virtualNode, virtualContainer, parentNode, parentElement);

        return virtualContainer;
    }

    /**
     * 应用虚拟节点样式
     * @param {Object} virtualNode - 虚拟节点数据
     * @param {HTMLElement} element - DOM元素
     */
    applyVirtualNodeStyles(virtualNode, element) {
        // 应用基础样式
        this.applyBaseStyles(virtualNode, element, false);

        // 应用属性样式
        this.applyAttributeStyles(virtualNode, element);

        // 应用布局样式
        this.applyLayoutStyles(virtualNode, element);

        // 缓存节点信息到约束布局引擎
        this.cacheNodeForConstraints(virtualNode, element, null, null);
    }

    /**
     * 应用基础样式 - 使用CSS类替代内联样式
     * @param {Object} node - 节点数据
     * @param {HTMLElement} element - DOM元素
     * @param {boolean} isRoot - 是否是根节点
     */
    applyBaseStyles(node, element, isRoot) {
        // 应用基础CSS类
        element.classList.add('simulator-node-base');

        // 根据节点类型和布局应用特定CSS类
        if (isRoot) {
            element.classList.add('simulator-node-root');
            console.log('🌱 [Simulator] 应用根节点基础样式:', {
                '节点ID': node.id,
                '节点名称': node.name,
                '时间戳': new Date().toISOString()
            });
        } else {
            element.classList.add('simulator-node-child');
        }

        // 应用布局方向CSS类
        if (node.layout === 'vertical') {
            element.classList.add('simulator-layout-vertical');
        } else {
            element.classList.add('simulator-layout-horizontal');
        }
    }

    /**
     * 应用属性样式 - 使用CSS变量和类替代内联样式
     * @param {Object} node - 节点数据
     * @param {HTMLElement} element - DOM元素
     */
    applyAttributeStyles(node, element) {
        if (!node.attributes) return;

        // 获取实际节点类型（处理虚拟节点）
        const actualNodeType = this.getActualNodeType(node);

        // 使用CSS变量设置动态属性
        if (node.attributes.backgroundColor) {
            element.style.setProperty('--background-color', this.parseColor(node.attributes.backgroundColor));
        }

        if (node.attributes.alpha !== undefined) {
            element.style.setProperty('--opacity', node.attributes.alpha);
        }

        if (node.attributes.cornerRadius) {
            // 处理圆角位置设置
            this.applyCornerRadius(node, element);
        }

        if (node.attributes.borderWidth) {
            element.style.setProperty('--border-width', `${node.attributes.borderWidth}px`);
        }

        if (node.attributes.borderColor) {
            element.style.setProperty('--border-color', this.parseColor(node.attributes.borderColor));
        }

        // 处理字体相关属性 - 使用实际节点类型
        if (['UILabel', 'UIButton', 'UITextField', 'UITextView'].includes(actualNodeType)) {
            if (node.attributes.fontSize) {
                element.style.setProperty('--font-size', `${node.attributes.fontSize}px`);
            }

            if (node.attributes.textColor) {
                element.style.setProperty('--text-color', this.parseColor(node.attributes.textColor));
            }

            if (node.attributes.textAlignment) {
                element.style.setProperty('--text-align', node.attributes.textAlignment);
            }

            // 字体样式通过CSS类应用
            if (node.attributes.font) {
                this.applyFontStyle(node.attributes.font, element);
            }

            if (actualNodeType === 'UIButton' && node.attributes.titleColor) {
                element.style.setProperty('--title-color', this.parseColor(node.attributes.titleColor));
            }
        }

        // 处理通用属性
        if (node.attributes.text) {
            element.textContent = node.attributes.text;
        }

        if (node.attributes.placeholder) {
            element.setAttribute('placeholder', node.attributes.placeholder);
        }

        // 宽度和高度通过CSS变量设置
        if (node.attributes.width) {
            element.style.setProperty('--width', `${node.attributes.width}px`);
        }

        if (node.attributes.height) {
            element.style.setProperty('--height', `${node.attributes.height}px`);
        }
    }

    /**
     * 获取实际节点类型（处理虚拟节点）
     * @param {Object} node - 节点数据
     * @returns {string} 实际节点类型
     */
    getActualNodeType(node) {
        // 如果是虚拟节点，返回被引用根节点的实际类型
        if (node.isVirtual && node.referencedRootType) {
            return node.referencedRootType;
        }
        return node.type;
    }

    /**
     * 应用字体样式
     * @param {string} font - 字体类型
     * @param {HTMLElement} element - DOM元素
     */
    applyFontStyle(font, element) {
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

        element.style.fontFamily = fontConfig.family;
        element.style.fontSize = `${fontConfig.size}px`;
        element.style.fontWeight = fontConfig.weight;

        if (fontConfig.style) {
            element.style.fontStyle = fontConfig.style;
        }
    }

    /**
     * 应用布局样式 - 使用CSS类替代内联样式
     * @param {Object} node - 节点数据
     * @param {HTMLElement} element - DOM元素
     */
    applyLayoutStyles(node, element) {
        // 处理对齐方式
        if (node.attributes?.alignment) {
            switch (node.attributes.alignment) {
                case 'center':
                    element.classList.add('simulator-align-center');
                    break;
                case 'leading':
                    element.classList.add('simulator-align-leading');
                    break;
                case 'trailing':
                    element.classList.add('simulator-align-trailing');
                    break;
                case 'top':
                    element.classList.add('simulator-align-top');
                    break;
                case 'bottom':
                    element.classList.add('simulator-align-bottom');
                    break;
            }
        }

        // 处理分布方式
        if (node.attributes?.distribution) {
            switch (node.attributes.distribution) {
                case 'fill':
                    element.classList.add('simulator-distribution-fill');
                    break;
                case 'fillEqually':
                    element.classList.add('simulator-distribution-fillEqually');
                    break;
                case 'equalSpacing':
                    element.classList.add('simulator-distribution-equalSpacing');
                    break;
            }
        }
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
            case 'UITableViewCell':
                this.addTableViewCellContent(node, element);
                break;
            case 'UISwitch':
            case 'UISlider':
            case 'UISegmentedControl':
            case 'UIScrollView':
            case 'UICollectionView':
            case 'UIStackView':
            case 'UIAlertView':
            case 'UISearchBar':
            case 'UIActivityIndicatorView':
            case 'UIProgressView':
            case 'UIPickerView':
            case 'UIDatePicker':
            case 'UIWebView':
            case 'WKWebView':
            case 'UIToolbar':
            case 'UINavigationBar':
            case 'UITabBar':
            case 'UIStatusBar':
            case 'UIPopoverController':
            case 'UIActionSheet':
                // 这些组件类型不需要额外内容，保持背景颜色可见
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
        const text = node.attributes?.text ?? 'Label';
        element.textContent = text;
        element.className += ' simulator-label-content';

        const textAlignment = node.attributes?.textAlignment;
        switch (textAlignment) {
            case 'left':
                element.classList.add('simulator-label-left');
                break;
            case 'right':
                element.classList.add('simulator-label-right');
                break;
            case 'center':
                element.classList.add('simulator-label-center');
                break;
            default:
                element.classList.add('simulator-label-left');
        }
    }

    /**
     * 添加按钮内容
     * @param {Object} node - 节点数据
     * @param {HTMLElement} element - DOM元素
     */
    addButtonContent(node, element) {
        const title = node.attributes?.title ?? '';
        element.textContent = title;
        element.className += ' simulator-button-content';
    }

    /**
     * 添加文本字段内容
     * @param {Object} node - 节点数据
     * @param {HTMLElement} element - DOM元素
     */
    addTextFieldContent(node, element) {
        const placeholder = node.attributes?.placeholder || '请输入文本';
        const text = node.attributes?.text || '';

        const input = document.createElement('input');
        input.type = 'text';
        input.placeholder = placeholder;
        input.value = text;
        input.className = 'simulator-textfield-input';

        element.appendChild(input);
    }

    /**
     * 添加文本视图内容
     * @param {Object} node - 节点数据
     * @param {HTMLElement} element - DOM元素
     */
    addTextViewContent(node, element) {
        const text = node.attributes?.text || '';

        const textarea = document.createElement('textarea');
        textarea.className = 'simulator-textview-textarea';
        textarea.value = text;

        element.appendChild(textarea);
    }

    /**
     * 添加图片视图内容
     * @param {Object} node - 节点数据
     * @param {HTMLElement} element - DOM元素
     */
    addImageViewContent(node, element) {
        const testUrl = node.attributes?.testUrl;
        const imageName = node.attributes?.imageName || 'placeholder';
        const backgroundColor = this.parseColor(node.attributes?.backgroundColor || '#FFFFFF');

        if (testUrl) {
            // 使用远程图片
            const img = document.createElement('img');
            img.src = testUrl;
            img.className = 'simulator-imageview-img';

            // 使用CSS变量设置动态属性
            img.style.setProperty('--object-fit', node.attributes?.contentMode || 'scaleToFill');
            img.style.setProperty('--background-color', backgroundColor);

            element.appendChild(img);
        } else {
            // 没有远程图片时，显示背景色和占位文本
            const placeholderDiv = document.createElement('div');
            placeholderDiv.className = 'simulator-imageview-placeholder';
            placeholderDiv.style.setProperty('--background-color', backgroundColor);
            placeholderDiv.textContent = imageName;
            element.appendChild(placeholderDiv);
        }
    }

    /**
     * 添加表格单元格内容
     * @param {Object} node - 节点数据
     * @param {HTMLElement} element - DOM元素
     */
    addTableViewCellContent(node, element) {
        const textLabel = node.attributes?.textLabel ?? '单元格';
        const detailTextLabel = node.attributes?.detailTextLabel ?? '';

        // 创建表格单元格内容容器
        const cellContent = document.createElement('div');
        cellContent.className = 'simulator-tableviewcell-content';
        cellContent.style.cssText = `
            width: 100%;
            height: 100%;
            display: flex;
            align-items: center;
            padding: 12px 16px;
            box-sizing: border-box;
        `;

        // 创建文本标签
        const textLabelElement = document.createElement('div');
        textLabelElement.className = 'simulator-tableviewcell-textlabel';
        textLabelElement.textContent = textLabel;
        textLabelElement.style.cssText = `
            flex: 1;
            font-size: 16px;
            color: #000000;
        `;

        cellContent.appendChild(textLabelElement);

        // 如果有详细文本标签，添加它
        if (detailTextLabel) {
            const detailTextLabelElement = document.createElement('div');
            detailTextLabelElement.className = 'simulator-tableviewcell-detailtextlabel';
            detailTextLabelElement.textContent = detailTextLabel;
            detailTextLabelElement.style.cssText = `
                font-size: 14px;
                color: #666666;
                margin-left: 8px;
            `;
            cellContent.appendChild(detailTextLabelElement);
        }

        element.appendChild(cellContent);
    }

    /**
     * 添加默认内容
     * @param {Object} node - 节点数据
     * @param {HTMLElement} element - DOM元素
     */
    addDefaultContent(node, element) {
        const defaultDiv = document.createElement('div');
        defaultDiv.className = 'simulator-default-content';
        defaultDiv.textContent = node.type;
        element.appendChild(defaultDiv);
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
     * 应用圆角样式
     * @param {Object} node - 节点数据
     * @param {HTMLElement} element - DOM元素
     */
    applyCornerRadius(node, element) {
        const cornerRadius = node.attributes.cornerRadius;
        const cornerMask = node.attributes.cornerMask || '';

        if (!cornerRadius) return;

        // 如果没有设置圆角位置，默认四个角都是圆角
        if (!cornerMask) {
            element.style.borderRadius = `${cornerRadius}px`;
            return;
        }

        // 解析选中的角
        const selectedCorners = cornerMask.split(',');

        // 设置各个角的圆角
        if (selectedCorners.includes('top-left')) {
            element.style.borderTopLeftRadius = `${cornerRadius}px`;
        } else {
            element.style.borderTopLeftRadius = '0';
        }

        if (selectedCorners.includes('top-right')) {
            element.style.borderTopRightRadius = `${cornerRadius}px`;
        } else {
            element.style.borderTopRightRadius = '0';
        }

        if (selectedCorners.includes('bottom-left')) {
            element.style.borderBottomLeftRadius = `${cornerRadius}px`;
        } else {
            element.style.borderBottomLeftRadius = '0';
        }

        if (selectedCorners.includes('bottom-right')) {
            element.style.borderBottomRightRadius = `${cornerRadius}px`;
        } else {
            element.style.borderBottomRightRadius = '0';
        }
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
     * 更新分辨率显示
     */
    updateResolutionDisplay() {
        const device = this.devicePresets[this.currentDevice];
        if (!device) return;

        const resolutionDisplay = document.getElementById('resolution-display');
        if (resolutionDisplay) {
            const resolutionText = resolutionDisplay.querySelector('.resolution-text');
            if (resolutionText) {
                resolutionText.textContent = `${device.logicalResolution} (${device.physicalResolution})`;
            }
        }
    }

    /**
     * 强制DOM重排
     */
    forceReflow() {
        // 通过读取offsetWidth等属性强制触发重排
        if (this.contentContainer) {
            this.contentContainer.offsetWidth;
        }
        if (this.screenContainer) {
            this.screenContainer.offsetWidth;
        }
        if (this.deviceContainer) {
            this.deviceContainer.offsetWidth;
        }
    }

    /**
     * 更新设备视图
     */
    updateDeviceView() {
        const device = this.devicePresets[this.currentDevice];
        if (!device) return;

        console.log('🔄 [Simulator] 更新设备视图:', {
            '设备': this.currentDevice,
            '宽度': device.width,
            '高度': device.height,
            '时间戳': new Date().toISOString()
        });

        // 更新设备尺寸
        this.deviceContainer.style.width = `${device.width}px`;
        this.deviceContainer.style.height = `${device.height}px`;

        // 更新屏幕尺寸 - 补偿边框宽度
        this.screenContainer.style.width = `${device.width - 40 + 2}px`; // 减去内边距，补偿边框
        this.screenContainer.style.height = `${device.height - 40 + 2}px`;

        // 强制DOM重排，确保尺寸更新生效
        this.forceReflow();

        // 更新分辨率显示
        this.updateResolutionDisplay();

        // 应用缩放
        this.applyZoom();

        // 使用requestAnimationFrame确保DOM完全更新后再渲染根节点
        requestAnimationFrame(() => {
            // 再次强制重排，确保所有尺寸更新完成
            this.forceReflow();

            // 获取实时容器尺寸进行验证
            const containerWidth = this.contentContainer.clientWidth;
            const containerHeight = this.contentContainer.clientHeight;

            console.log('📏 [Simulator] 设备切换后容器尺寸验证:', {
                '设备': this.currentDevice,
                '容器宽度': containerWidth,
                '容器高度': containerHeight,
                '目标宽度': device.width - 40,
                '时间戳': new Date().toISOString()
            });

            // 清空约束布局引擎缓存，确保设备切换后约束重新计算
            if (window.constraintLayoutEngine) {
                window.constraintLayoutEngine.clearCache();
                console.log('🧹 [Simulator] 设备切换后清理约束缓存，确保重新计算');
            }

            // 重新渲染当前根节点
            if (this.currentRootNode) {
                this.renderRootNode();
            }
        });
    }

    /**
     * 应用缩放
     */
    applyZoom() {
        const device = this.devicePresets[this.currentDevice];
        const scale = this.zoomLevel;
        this.container.style.transform = `scale(${scale})`;
        this.container.style.transformOrigin = 'top center';  // 改为从顶部开始缩放
        // 调整容器高度以匹配缩放后的视觉大小
        this.container.style.height = `${device.height / scale}px`;
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
        this.placeholder.classList.add('simulator-placeholder-visible');
        this.placeholder.classList.remove('simulator-placeholder-hidden');
    }

    /**
     * 隐藏占位符
     */
    hidePlaceholder() {
        this.placeholder.classList.add('simulator-placeholder-hidden');
        this.placeholder.classList.remove('simulator-placeholder-visible');
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

        const errorContent = document.createElement('div');
        errorContent.className = 'simulator-error-content';

        // 使用DOM操作替代innerHTML
        const strongElement = document.createElement('strong');
        strongElement.textContent = '错误:';

        const messageText = document.createTextNode(` ${message}`);

        errorContent.appendChild(strongElement);
        errorContent.appendChild(messageText);

        errorElement.appendChild(errorContent);
        this.contentContainer.appendChild(errorElement);
    }

    /**
     * 更新上下文显示
     */
    updateContextDisplay() {
        const contextElement = document.getElementById('current-context');
        if (contextElement && this.currentRootNode) {
            // 清空现有内容
            contextElement.innerHTML = '';

            // 使用DOM操作创建上下文信息
            const createInfoLine = (label, value) => {
                const p = document.createElement('p');
                const strong = document.createElement('strong');
                strong.textContent = `${label}:`;
                p.appendChild(strong);
                p.appendChild(document.createTextNode(` ${value}`));
                return p;
            };

            contextElement.appendChild(createInfoLine('节点ID', this.currentRootNode.id));
            contextElement.appendChild(createInfoLine('节点名称', this.currentRootNode.name));
            contextElement.appendChild(createInfoLine('节点类型', this.currentRootNode.type));
            contextElement.appendChild(createInfoLine('子节点数', this.currentRootNode.children?.length || 0));
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
                        console.log('📐 [Simulator] 找到宽度约束:', {
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
                        console.log('📐 [Simulator] 找到右侧边缘约束:', {
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
     * 销毁组件
     */
    destroy() {
        // 清理事件监听器和DOM元素
        this.container.innerHTML = '';
    }
}


// 创建全局模拟器实例
let simulator = null;

// 初始化模拟器
document.addEventListener('DOMContentLoaded', () => {
    simulator = new Simulator('simulator-container');
    // 导出模拟器到全局变量
    window.simulator = simulator;
    console.log('✅ [Simulator] 全局模拟器实例已创建:', {
        '实例存在': !!window.simulator,
        '时间戳': new Date().toISOString()
    });
});
