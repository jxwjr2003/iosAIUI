/**
 * 节点渲染器
 * 负责创建和渲染UI节点元素，包括虚拟节点处理
 */
class NodeRenderer {
    constructor() {
        // 节点类型到CSS类的映射
        this.nodeTypeClasses = {
            'UIView': 'simulator-node-uiview',
            'UILabel': 'simulator-node-uilabel',
            'UIButton': 'simulator-node-uibutton',
            'UITextField': 'simulator-node-uitextfield',
            'UITextView': 'simulator-node-uitextview',
            'UIImageView': 'simulator-node-uiimageview',
            'UITableViewCell': 'simulator-node-uitableviewcell',
            'UISwitch': 'simulator-node-uiswitch',
            'UISlider': 'simulator-node-uislider',
            'UISegmentedControl': 'simulator-node-uisegmentedcontrol',
            'UIScrollView': 'simulator-node-uiscrollview',
            'UICollectionView': 'simulator-node-uicollectionview',
            'UIStackView': 'simulator-node-uistackview'
        };
    }

    /**
     * 创建节点元素
     * @param {Object} node - 节点数据
     * @param {boolean} isRoot - 是否是根节点
     * @param {Object} parentNode - 父节点数据
     * @param {HTMLElement} parentElement - 父DOM元素
     * @returns {HTMLElement} 节点元素
     */
    createNodeElement(node, isRoot = false, parentNode = null, parentElement = null) {
        // 检查是否是虚拟节点
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

        // 缓存节点信息到约束布局引擎
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
        // 获取虚拟节点的完整子树
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

        // 创建虚拟节点容器
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
     * 应用基础样式
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
        } else {
            element.classList.add('simulator-node-child');
        }

        // 应用布局方向CSS类
        if (node.layout === 'vertical') {
            element.classList.add('simulator-layout-vertical');
        } else {
            element.classList.add('simulator-layout-horizontal');
        }

        // 应用节点类型特定CSS类
        const typeClass = this.nodeTypeClasses[node.type];
        if (typeClass) {
            element.classList.add(typeClass);
        }
    }

    /**
     * 应用属性样式
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
            this.applyCornerRadius(node, element);
        }

        if (node.attributes.borderWidth) {
            element.style.setProperty('--border-width', `${node.attributes.borderWidth}px`);
        }

        if (node.attributes.borderColor) {
            element.style.setProperty('--border-color', this.parseColor(node.attributes.borderColor));
        }

        // 处理字体相关属性
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
     * 应用布局样式
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
            window.constraintLayoutEngine.nodeCache.set(node.id, {
                node,
                element,
                parentNode,
                parentElement
            });
        }
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
                        return true;
                    }
                    // 检查边缘约束中的右侧约束，这也会影响宽度
                    if (constraint.type === 'edge' &&
                        (constraint.attribute === 'right' || constraint.attribute === 'trailing')) {
                        return true;
                    }
                }
            }
        }

        return false;
    }
}

// 导出节点渲染器
if (typeof module !== 'undefined' && module.exports) {
    module.exports = NodeRenderer;
}

// 创建全局节点渲染器实例
let nodeRenderer = null;

// 初始化节点渲染器
document.addEventListener('DOMContentLoaded', () => {
    nodeRenderer = new NodeRenderer();
    window.nodeRenderer = nodeRenderer;
});

console.log('🎨 节点渲染器已加载');
