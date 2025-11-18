/**
 * 样式应用器
 * 负责应用CSS样式、处理颜色和字体等视觉属性
 */
class StyleApplicator {
    constructor() {
        // 颜色映射表
        this.colorMap = {
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

        // 字体映射表
        this.fontMap = {
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
    }

    /**
     * 应用基础样式到元素
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
    }

    /**
     * 应用属性样式到元素
     * @param {Object} node - 节点数据
     * @param {HTMLElement} element - DOM元素
     */
    applyAttributeStyles(node, element) {
        if (!node.attributes) return;

        // 获取实际节点类型（处理虚拟节点）
        const actualNodeType = this.getActualNodeType(node);

        // 使用CSS变量设置动态属性
        this.applyBackgroundColor(node, element);
        this.applyOpacity(node, element);
        this.applyCornerRadius(node, element);
        this.applyBorderStyles(node, element);

        // 处理字体相关属性
        if (['UILabel', 'UIButton', 'UITextField', 'UITextView'].includes(actualNodeType)) {
            this.applyTextStyles(node, element, actualNodeType);
        }

        // 处理通用属性
        this.applyGeneralAttributes(node, element);
        this.applySizeAttributes(node, element);
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
     * 应用背景颜色
     * @param {Object} node - 节点数据
     * @param {HTMLElement} element - DOM元素
     */
    applyBackgroundColor(node, element) {
        if (node.attributes.backgroundColor) {
            const color = this.parseColor(node.attributes.backgroundColor);
            element.style.setProperty('--background-color', color);
            element.style.backgroundColor = color;
        }
    }

    /**
     * 应用透明度
     * @param {Object} node - 节点数据
     * @param {HTMLElement} element - DOM元素
     */
    applyOpacity(node, element) {
        if (node.attributes.alpha !== undefined) {
            element.style.setProperty('--opacity', node.attributes.alpha);
            element.style.opacity = node.attributes.alpha;
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
     * 应用边框样式
     * @param {Object} node - 节点数据
     * @param {HTMLElement} element - DOM元素
     */
    applyBorderStyles(node, element) {
        if (node.attributes.borderWidth) {
            element.style.setProperty('--border-width', `${node.attributes.borderWidth}px`);
            element.style.borderWidth = `${node.attributes.borderWidth}px`;
            element.style.borderStyle = 'solid';
        }

        if (node.attributes.borderColor) {
            const color = this.parseColor(node.attributes.borderColor);
            element.style.setProperty('--border-color', color);
            element.style.borderColor = color;
        }
    }

    /**
     * 应用文本样式
     * @param {Object} node - 节点数据
     * @param {HTMLElement} element - DOM元素
     * @param {string} nodeType - 节点类型
     */
    applyTextStyles(node, element, nodeType) {
        if (node.attributes.fontSize) {
            element.style.setProperty('--font-size', `${node.attributes.fontSize}px`);
            element.style.fontSize = `${node.attributes.fontSize}px`;
        }

        if (node.attributes.textColor) {
            const color = this.parseColor(node.attributes.textColor);
            element.style.setProperty('--text-color', color);
            element.style.color = color;
        }

        if (node.attributes.textAlignment) {
            element.style.setProperty('--text-align', node.attributes.textAlignment);
            element.style.textAlign = node.attributes.textAlignment;
        }

        // 字体样式通过CSS类应用
        if (node.attributes.font) {
            this.applyFontStyle(node.attributes.font, element);
        }

        if (nodeType === 'UIButton' && node.attributes.titleColor) {
            const color = this.parseColor(node.attributes.titleColor);
            element.style.setProperty('--title-color', color);
            element.style.color = color;
        }
    }

    /**
     * 应用字体样式
     * @param {string} font - 字体类型
     * @param {HTMLElement} element - DOM元素
     */
    applyFontStyle(font, element) {
        const fontConfig = this.fontMap[font] || this.fontMap['system-17'];

        element.style.fontFamily = fontConfig.family;
        element.style.fontSize = `${fontConfig.size}px`;
        element.style.fontWeight = fontConfig.weight;

        if (fontConfig.style) {
            element.style.fontStyle = fontConfig.style;
        }
    }

    /**
     * 应用通用属性
     * @param {Object} node - 节点数据
     * @param {HTMLElement} element - DOM元素
     */
    applyGeneralAttributes(node, element) {
        if (node.attributes.text) {
            element.textContent = node.attributes.text;
        }

        if (node.attributes.placeholder) {
            element.setAttribute('placeholder', node.attributes.placeholder);
        }
    }

    /**
     * 应用尺寸属性
     * @param {Object} node - 节点数据
     * @param {HTMLElement} element - DOM元素
     */
    applySizeAttributes(node, element) {
        if (node.attributes.width) {
            element.style.setProperty('--width', `${node.attributes.width}px`);
            element.style.width = `${node.attributes.width}px`;
        }

        if (node.attributes.height) {
            element.style.setProperty('--height', `${node.attributes.height}px`);
            element.style.height = `${node.attributes.height}px`;
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
        return this.colorMap[color.toLowerCase()] || '#000000';
    }

    /**
     * 重置元素样式
     * @param {HTMLElement} element - DOM元素
     */
    resetStyles(element) {
        // 重置所有CSS变量和内联样式
        element.style.cssText = '';
        element.className = '';
    }

    /**
     * 应用CSS类
     * @param {HTMLElement} element - DOM元素
     * @param {Array} classes - CSS类数组
     */
    applyClasses(element, classes) {
        classes.forEach(className => {
            element.classList.add(className);
        });
    }

    /**
     * 移除CSS类
     * @param {HTMLElement} element - DOM元素
     * @param {Array} classes - CSS类数组
     */
    removeClasses(element, classes) {
        classes.forEach(className => {
            element.classList.remove(className);
        });
    }

    /**
     * 设置CSS变量
     * @param {HTMLElement} element - DOM元素
     * @param {Object} variables - CSS变量对象
     */
    setCSSVariables(element, variables) {
        Object.entries(variables).forEach(([key, value]) => {
            element.style.setProperty(`--${key}`, value);
        });
    }
}

// 导出版式应用器
if (typeof module !== 'undefined' && module.exports) {
    module.exports = StyleApplicator;
}

// 创建全局样式应用器实例
let styleApplicator = null;

// 初始化样式应用器
document.addEventListener('DOMContentLoaded', () => {
    styleApplicator = new StyleApplicator();
    window.styleApplicator = styleApplicator;
});

console.log('🎨 样式应用器已加载');
