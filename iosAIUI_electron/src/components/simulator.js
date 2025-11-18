/**
 * iOS 模拟器组件 - 重构版
 * 负责协调各个模块化组件，实现UI预览功能
 */
class Simulator {
    constructor(containerId, eventManager = null) {
        this.container = document.getElementById(containerId);
        this.eventManager = eventManager;
        this.currentRootNode = null;
        this.zoomLevel = 1.0;

        // 使用模块化组件
        this.deviceManager = window.deviceManager || new DeviceManager();
        this.nodeRenderer = window.nodeRenderer || new NodeRenderer();
        this.styleApplicator = window.styleApplicator || new StyleApplicator();
        this.constraintApplier = window.constraintApplier || new ConstraintApplier();

        // 初始化当前设备设置
        this.currentDevice = this.deviceManager.currentDevice;

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
     * 渲染根节点 - 使用模块化组件重构版
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
            this.constraintApplier.clearCache();

            // 强制DOM重排，确保尺寸更新生效
            this.forceReflow();

            // 获取实时容器尺寸
            const containerWidth = this.contentContainer.clientWidth;
            const containerHeight = this.contentContainer.clientHeight;

            console.log('📱 [Simulator] 渲染根节点:', {
                '容器宽度': containerWidth,
                '容器高度': containerHeight,
                '设备': this.deviceManager.currentDevice,
                '时间戳': new Date().toISOString()
            });

            // 创建虚拟节点"00"代表模拟器屏幕 - 使用设备管理器获取设备信息
            const device = this.deviceManager.getCurrentDevice();
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

            // 使用节点渲染器创建根节点元素
            const rootElement = this.nodeRenderer.createNodeElement(this.currentRootNode, true, null, this.contentContainer);

            // 使用约束应用器检查宽度约束
            const hasWidthConstraint = this.constraintApplier.hasWidthConstraint(this.currentRootNode);
            if (!hasWidthConstraint) {
                rootElement.style.width = '100%';
                rootElement.style.minWidth = '100%';
                rootElement.style.maxWidth = '100%';
                console.log('📏 [Simulator] 根节点无宽度约束，设置宽度为100%');
            } else {
                console.log('✅ [Simulator] 根节点有宽度约束，保留约束设置');
            }

            this.contentContainer.appendChild(rootElement);

            // 使用约束应用器应用约束布局
            this.constraintApplier.applyConstraints(this.currentRootNode, rootElement, null, this.contentContainer);

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

    // 节点创建和渲染功能已完全迁移到NodeRenderer组件
    // 样式应用功能已完全迁移到StyleApplicator组件
    // 内容显示功能已完全迁移到NodeRenderer组件

    // 约束处理功能已完全迁移到ConstraintApplier组件
    // 样式辅助功能已完全迁移到StyleApplicator组件

    /**
     * 更新分辨率显示
     */
    updateResolutionDisplay() {
        const device = this.deviceManager.getCurrentDevice();
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
        const device = this.deviceManager.getCurrentDevice();
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
        const device = this.deviceManager.getCurrentDevice();
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
        return this.deviceManager.getCurrentDevice();
    }

    /**
     * 设置自定义设备尺寸
     * @param {number} width - 宽度
     * @param {number} height - 高度
     */
    setCustomDeviceSize(width, height) {
        this.deviceManager.setCustomDeviceSize(width, height);
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
                        console.log('� [Simulator] 找到右侧边缘约束:', {
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
