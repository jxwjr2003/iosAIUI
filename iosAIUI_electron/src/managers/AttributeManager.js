/**
 * 属性管理器
 * 专门负责组件属性的编辑和管理
 */
class AttributeManager {
    constructor() {
        this.currentNode = null;
        this.isEditing = false;
        this.colorInputMode = 'hex'; // 'hex' 或 'rgb'
    }

    /**
     * 设置当前节点
     * @param {Object} node - 节点数据
     */
    setCurrentNode(node) {
        this.currentNode = node;
        this.isEditing = !!node;
    }

    /**
     * 更新属性编辑器
     * @param {Object} attributes - 属性对象
     * @param {HTMLElement} container - 容器元素
     */
    updateAttributesEditor(attributes, container) {
        if (!container) return;

        container.innerHTML = '';

        // 获取当前节点的预定义属性
        const predefinedAttributes = getComponentAttributes(this.currentNode?.type || '');

        // 先显示预定义属性
        Object.keys(predefinedAttributes).forEach(attributeKey => {
            const attributeDef = predefinedAttributes[attributeKey];
            const currentValue = attributes[attributeKey] !== undefined ? attributes[attributeKey] : attributeDef.defaultValue;
            this.createAttributeItem(attributeKey, currentValue, container, true, attributeDef);
        });

        // 再显示自定义属性（非预定义属性）
        Object.entries(attributes).forEach(([key, value]) => {
            if (!predefinedAttributes.hasOwnProperty(key)) {
                this.createAttributeItem(key, value, container, false);
            }
        });

        // 如果没有属性，显示空状态
        if (Object.keys(attributes).length === 0 && Object.keys(predefinedAttributes).length === 0) {
            const emptyMessage = document.createElement('div');
            emptyMessage.className = 'empty-state-message';
            emptyMessage.textContent = '暂无属性';
            container.appendChild(emptyMessage);
        }
    }

    /**
     * 创建属性项
     * @param {string} key - 属性键
     * @param {*} value - 属性值
     * @param {HTMLElement} container - 容器元素
     * @param {boolean} isPredefined - 是否为预定义属性
     * @param {Object} attributeDef - 属性定义
     */
    createAttributeItem(key, value, container, isPredefined = false, attributeDef = null) {
        const item = document.createElement('div');
        item.className = `attribute-item ${isPredefined ? 'predefined-attribute' : 'custom-attribute'}`;

        // 属性键显示（预定义属性为只读标签，自定义属性为可编辑输入框）
        if (isPredefined) {
            const keyLabel = document.createElement('label');
            keyLabel.className = 'attribute-key-label';
            keyLabel.textContent = key;
            keyLabel.title = '预定义属性';
            item.appendChild(keyLabel);
        } else {
            const keyInput = document.createElement('input');
            keyInput.type = 'text';
            keyInput.placeholder = '属性名';
            keyInput.value = key;
            keyInput.addEventListener('change', (e) => {
                this.updateAttributeKey(key, e.target.value);
            });
            item.appendChild(keyInput);
        }

        // 属性值输入控件
        const valueContainer = document.createElement('div');
        valueContainer.className = 'attribute-value-container';

        if (isPredefined && attributeDef) {
            // 预定义属性使用特定输入控件
            this.createPredefinedAttributeInput(key, value, attributeDef, valueContainer);
        } else {
            // 自定义属性使用文本输入框
            const valueInput = document.createElement('input');
            valueInput.type = 'text';
            valueInput.placeholder = '属性值';
            valueInput.value = value;
            valueInput.addEventListener('change', (e) => {
                this.updateAttributeValue(key, e.target.value);
            });
            valueContainer.appendChild(valueInput);
        }

        item.appendChild(valueContainer);

        // 删除按钮（预定义属性不可删除）
        if (!isPredefined) {
            const removeBtn = document.createElement('button');
            removeBtn.className = 'remove-btn';
            removeBtn.textContent = '删除';
            removeBtn.addEventListener('click', () => {
                this.removeAttribute(key);
            });
            item.appendChild(removeBtn);
        }

        container.appendChild(item);
    }

    /**
     * 为预定义属性创建输入控件
     * @param {string} key - 属性键
     * @param {*} value - 属性值
     * @param {Object} attributeDef - 属性定义
     * @param {HTMLElement} container - 容器元素
     */
    createPredefinedAttributeInput(key, value, attributeDef, container) {
        const { type, defaultValue, options, min, max, step } = attributeDef;

        switch (type) {
            case 'color':
                this.createColorInput(key, value, container);
                break;
            case 'number':
                this.createNumberInput(key, value, container, min, max, step);
                break;
            case 'boolean':
                this.createBooleanInput(key, value, container);
                break;
            case 'select':
                this.createSelectInput(key, value, container, options);
                break;
            case 'stateGroup':
                this.createStateGroupInput(key, value, container, attributeDef);
                break;
            case 'cornerMask':
                this.createCornerMaskInput(key, value, container);
                break;
            case 'text':
            default:
                this.createTextInput(key, value, container);
                break;
        }
    }

    /**
     * 创建颜色输入控件
     * @param {string} key - 属性键
     * @param {*} value - 属性值
     * @param {HTMLElement} container - 容器元素
     */
    createColorInput(key, value, container) {
        const colorGroup = document.createElement('div');
        colorGroup.className = 'color-input-group';

        // 颜色预览方块
        const colorPreview = document.createElement('div');
        colorPreview.className = 'color-preview';
        colorPreview.style.backgroundColor = value || '#FFFFFF';
        colorPreview.addEventListener('click', () => {
            this.openColorPicker(key, value);
        });

        // 颜色输入框
        const colorInput = document.createElement('input');
        colorInput.type = 'text';
        colorInput.className = 'color-input';
        colorInput.placeholder = '#RRGGBB';
        colorInput.value = value || '';

        // 使用防抖函数处理输入事件，避免频繁触发状态更新
        let debounceTimer;
        colorInput.addEventListener('input', (e) => {
            const newValue = e.target.value;

            // 实时更新预览颜色
            colorPreview.style.backgroundColor = newValue;

            // 清除之前的定时器
            clearTimeout(debounceTimer);

            // 设置新的定时器，延迟更新属性值
            debounceTimer = setTimeout(() => {
                this.updateAttributeValue(key, newValue);
            }, 300); // 300ms 延迟
        });

        // 添加失焦事件作为备用更新机制
        colorInput.addEventListener('blur', (e) => {
            const newValue = e.target.value;
            // 清除防抖定时器
            clearTimeout(debounceTimer);
            // 立即更新属性值
            this.updateAttributeValue(key, newValue);
        });

        // RGB切换按钮
        const toggleBtn = document.createElement('button');
        toggleBtn.className = 'toggle-rgb-btn';
        toggleBtn.textContent = '切换RGB';
        toggleBtn.addEventListener('click', () => {
            this.toggleColorInputMode();
            this.refreshColorInputs(container);
        });

        colorGroup.appendChild(colorPreview);
        colorGroup.appendChild(colorInput);
        colorGroup.appendChild(toggleBtn);
        container.appendChild(colorGroup);
    }

    /**
     * 创建数字输入控件
     * @param {string} key - 属性键
     * @param {*} value - 属性值
     * @param {HTMLElement} container - 容器元素
     * @param {number} min - 最小值
     * @param {number} max - 最大值
     * @param {number} step - 步长
     */
    createNumberInput(key, value, container, min, max, step) {
        const numberInput = document.createElement('input');
        numberInput.type = 'number';
        numberInput.className = 'number-input';
        numberInput.value = value || 0;

        if (min !== undefined) numberInput.min = min;
        if (max !== undefined) numberInput.max = max;
        if (step !== undefined) numberInput.step = step;

        numberInput.addEventListener('change', (e) => {
            this.updateAttributeValue(key, parseFloat(e.target.value));
        });

        container.appendChild(numberInput);
    }

    /**
     * 创建布尔输入控件
     * @param {string} key - 属性键
     * @param {*} value - 属性值
     * @param {HTMLElement} container - 容器元素
     */
    createBooleanInput(key, value, container) {
        const switchLabel = document.createElement('label');
        switchLabel.className = 'boolean-switch';

        const switchInput = document.createElement('input');
        switchInput.type = 'checkbox';
        switchInput.checked = value === true || value === 'true';
        switchInput.addEventListener('change', (e) => {
            this.updateAttributeValue(key, e.target.checked);
        });

        const switchSlider = document.createElement('span');
        switchSlider.className = 'boolean-slider';

        switchLabel.appendChild(switchInput);
        switchLabel.appendChild(switchSlider);
        container.appendChild(switchLabel);
    }

    /**
     * 创建选择输入控件
     * @param {string} key - 属性键
     * @param {*} value - 属性值
     * @param {HTMLElement} container - 容器元素
     * @param {Array} options - 选项数组
     */
    createSelectInput(key, value, container, options) {
        const selectInput = document.createElement('select');
        selectInput.className = 'select-input';

        options.forEach(option => {
            const optionElement = document.createElement('option');
            optionElement.value = option.value;
            optionElement.textContent = option.label;
            if (option.value === value) {
                optionElement.selected = true;
            }
            selectInput.appendChild(optionElement);
        });

        selectInput.addEventListener('change', (e) => {
            this.updateAttributeValue(key, e.target.value);
        });

        container.appendChild(selectInput);
    }

    /**
     * 创建文本输入控件
     * @param {string} key - 属性键
     * @param {*} value - 属性值
     * @param {HTMLElement} container - 容器元素
     */
    createTextInput(key, value, container) {
        const textInput = document.createElement('input');
        textInput.type = 'text';
        textInput.className = 'text-input';
        textInput.value = value || '';
        textInput.addEventListener('change', (e) => {
            this.updateAttributeValue(key, e.target.value);
        });
        container.appendChild(textInput);
    }

    /**
     * 创建圆角位置输入控件
     * @param {string} key - 属性键
     * @param {*} value - 属性值
     * @param {HTMLElement} container - 容器元素
     */
    createCornerMaskInput(key, value, container) {
        const cornerMaskGroup = document.createElement('div');
        cornerMaskGroup.className = 'corner-mask-input-group';

        // 四个角的复选框组
        const cornersContainer = document.createElement('div');
        cornersContainer.className = 'corners-container';

        // 定义四个角及其标签
        const corners = [
            { key: 'top-left', label: '左上角' },
            { key: 'top-right', label: '右上角' },
            { key: 'bottom-left', label: '左下角' },
            { key: 'bottom-right', label: '右下角' }
        ];

        // 解析当前值
        const currentCorners = value ? value.split(',') : [];

        // 创建每个角的复选框
        corners.forEach(corner => {
            const cornerItem = document.createElement('div');
            cornerItem.className = 'corner-item';

            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.id = `corner-${corner.key}`;
            checkbox.value = corner.key;
            checkbox.checked = currentCorners.includes(corner.key);
            checkbox.addEventListener('change', () => {
                this.updateCornerMaskValue(key, cornersContainer);
            });

            const label = document.createElement('label');
            label.htmlFor = `corner-${corner.key}`;
            label.textContent = corner.label;
            label.className = 'corner-label';

            cornerItem.appendChild(checkbox);
            cornerItem.appendChild(label);
            cornersContainer.appendChild(cornerItem);
        });

        cornerMaskGroup.appendChild(cornersContainer);
        container.appendChild(cornerMaskGroup);
    }

    /**
     * 更新圆角位置值
     * @param {string} key - 属性键
     * @param {HTMLElement} container - 容器元素
     */
    updateCornerMaskValue(key, container) {
        const checkboxes = container.querySelectorAll('input[type="checkbox"]');
        const selectedCorners = [];

        checkboxes.forEach(checkbox => {
            if (checkbox.checked) {
                selectedCorners.push(checkbox.value);
            }
        });

        // 将选中的角以逗号分隔的字符串形式存储
        const newValue = selectedCorners.join(',');
        this.updateAttributeValue(key, newValue);
    }

    /**
     * 创建状态组输入控件（用于UIButton的状态管理）
     * @param {string} key - 属性键
     * @param {*} value - 属性值
     * @param {HTMLElement} container - 容器元素
     * @param {Object} attributeDef - 属性定义
     */
    createStateGroupInput(key, value, container, attributeDef) {
        const stateGroup = document.createElement('div');
        stateGroup.className = 'state-group-input';

        // 状态组标题
        const title = document.createElement('h4');
        title.textContent = '按钮状态管理';
        title.className = 'state-group-title';
        stateGroup.appendChild(title);

        // 状态组描述
        const description = document.createElement('p');
        description.textContent = '管理按钮在不同状态下的显示属性';
        description.className = 'state-group-description';
        stateGroup.appendChild(description);

        // 状态列表容器
        const statesContainer = document.createElement('div');
        statesContainer.className = 'states-container';

        // 获取当前状态数据
        const states = value || attributeDef.defaultValue || {};

        // 定义支持的按钮状态
        const buttonStates = [
            { key: 'normal', label: '正常状态', default: true },
            { key: 'highlighted', label: '高亮状态', default: false },
            { key: 'disabled', label: '禁用状态', default: false },
            { key: 'selected', label: '选中状态', default: false }
        ];

        // 创建每个状态的编辑器
        buttonStates.forEach(state => {
            const stateEditor = this.createStateEditor(state.key, state.label, states[state.key] || {}, state.default);
            statesContainer.appendChild(stateEditor);
        });

        stateGroup.appendChild(statesContainer);

        // 状态组操作按钮
        const actionsContainer = document.createElement('div');
        actionsContainer.className = 'state-group-actions';

        const addStateBtn = document.createElement('button');
        addStateBtn.className = 'add-state-btn';
        addStateBtn.textContent = '+ 添加自定义状态';
        addStateBtn.addEventListener('click', () => {
            this.addCustomState(statesContainer);
        });

        actionsContainer.appendChild(addStateBtn);
        stateGroup.appendChild(actionsContainer);

        container.appendChild(stateGroup);
    }

    /**
     * 创建单个状态编辑器
     * @param {string} stateKey - 状态键
     * @param {string} stateLabel - 状态标签
     * @param {Object} stateData - 状态数据
     * @param {boolean} isDefault - 是否为默认状态
     * @returns {HTMLElement} 状态编辑器元素
     */
    createStateEditor(stateKey, stateLabel, stateData, isDefault = false) {
        const stateEditor = document.createElement('div');
        stateEditor.className = `state-editor ${isDefault ? 'default-state' : ''}`;
        stateEditor.dataset.stateKey = stateKey;

        // 状态头部
        const stateHeader = document.createElement('div');
        stateHeader.className = 'state-header';

        const stateTitle = document.createElement('h5');
        stateTitle.textContent = stateLabel;
        stateHeader.appendChild(stateTitle);

        // 状态开关（非默认状态可删除）
        if (!isDefault) {
            const toggleState = document.createElement('label');
            toggleState.className = 'state-toggle';

            const toggleInput = document.createElement('input');
            toggleInput.type = 'checkbox';
            toggleInput.checked = Object.keys(stateData).length > 0;
            toggleInput.addEventListener('change', (e) => {
                if (e.target.checked) {
                    // 启用状态，设置默认值
                    this.updateStateProperty(stateKey, {
                        title: stateLabel,
                        titleColor: '#007AFF',
                        backgroundColor: '#FFFFFF'
                    });
                } else {
                    // 禁用状态，清空数据
                    this.updateStateProperty(stateKey, {});
                }
            });

            const toggleSlider = document.createElement('span');
            toggleSlider.className = 'state-toggle-slider';

            toggleState.appendChild(toggleInput);
            toggleState.appendChild(toggleSlider);
            stateHeader.appendChild(toggleState);

            // 删除状态按钮
            const deleteBtn = document.createElement('button');
            deleteBtn.className = 'remove-state-btn';
            deleteBtn.textContent = '删除';
            deleteBtn.addEventListener('click', () => {
                this.removeState(stateKey);
            });
            stateHeader.appendChild(deleteBtn);
        }

        stateEditor.appendChild(stateHeader);

        // 状态属性容器（仅在状态启用时显示）
        const stateProperties = document.createElement('div');
        stateProperties.className = 'state-properties';
        stateProperties.style.display = Object.keys(stateData).length > 0 ? 'block' : 'none';

        // 状态属性
        this.createStatePropertyInput('title', '标题', stateData.title || '', stateKey, stateProperties);
        this.createStatePropertyInput('titleColor', '标题颜色', stateData.titleColor || '#007AFF', stateKey, stateProperties, 'color');
        this.createStatePropertyInput('backgroundColor', '背景颜色', stateData.backgroundColor || '#FFFFFF', stateKey, stateProperties, 'color');

        stateEditor.appendChild(stateProperties);

        return stateEditor;
    }

    /**
     * 创建状态属性输入控件
     * @param {string} propertyKey - 属性键
     * @param {string} propertyLabel - 属性标签
     * @param {*} value - 属性值
     * @param {string} stateKey - 状态键
     * @param {HTMLElement} container - 容器元素
     * @param {string} inputType - 输入类型
     */
    createStatePropertyInput(propertyKey, propertyLabel, value, stateKey, container, inputType = 'text') {
        const propertyItem = document.createElement('div');
        propertyItem.className = 'state-property-item';

        const label = document.createElement('label');
        label.textContent = propertyLabel;
        label.className = 'state-property-label';
        propertyItem.appendChild(label);

        const valueContainer = document.createElement('div');
        valueContainer.className = 'state-property-value';

        let input;
        switch (inputType) {
            case 'color':
                input = document.createElement('input');
                input.type = 'color';
                input.value = value;

                // 使用防抖函数处理颜色输入事件
                let colorDebounceTimer;
                input.addEventListener('input', (e) => {
                    const newValue = e.target.value;

                    // 清除之前的定时器
                    clearTimeout(colorDebounceTimer);

                    // 设置新的定时器，延迟更新属性值
                    colorDebounceTimer = setTimeout(() => {
                        this.updateStateProperty(stateKey, { [propertyKey]: newValue });
                    }, 300); // 300ms 延迟
                });

                // 添加失焦事件作为备用更新机制
                input.addEventListener('blur', (e) => {
                    const newValue = e.target.value;
                    // 清除防抖定时器
                    clearTimeout(colorDebounceTimer);
                    // 立即更新属性值
                    this.updateStateProperty(stateKey, { [propertyKey]: newValue });
                });
                break;
            default:
                input = document.createElement('input');
                input.type = 'text';
                input.value = value;
                input.addEventListener('change', (e) => {
                    this.updateStateProperty(stateKey, { [propertyKey]: e.target.value });
                });
        }

        valueContainer.appendChild(input);
        propertyItem.appendChild(valueContainer);
        container.appendChild(propertyItem);
    }

    /**
     * 更新状态属性
     * @param {string} stateKey - 状态键
     * @param {Object} updates - 更新数据
     */
    updateStateProperty(stateKey, updates) {
        if (!this.currentNode || !this.isEditing) return;

        const attributes = { ...(this.currentNode.attributes || {}) };
        const currentStates = attributes.states || {};

        // 更新指定状态
        const updatedStates = {
            ...currentStates,
            [stateKey]: {
                ...currentStates[stateKey],
                ...updates
            }
        };

        // 移除空对象的状态
        Object.keys(updatedStates).forEach(key => {
            if (Object.keys(updatedStates[key]).length === 0) {
                delete updatedStates[key];
            }
        });

        attributes.states = updatedStates;
        stateManager.updateNode(this.currentNode.id, { attributes });
    }

    /**
     * 添加自定义状态
     * @param {HTMLElement} container - 状态容器
     */
    addCustomState(container) {
        const customStateKey = `custom_${Date.now()}`;
        const customStateLabel = '自定义状态';

        const stateEditor = this.createStateEditor(customStateKey, customStateLabel, {}, false);
        container.appendChild(stateEditor);
    }

    /**
     * 删除状态
     * @param {string} stateKey - 状态键
     */
    removeState(stateKey) {
        if (!this.currentNode || !this.isEditing) return;

        const attributes = { ...(this.currentNode.attributes || {}) };
        const currentStates = attributes.states || {};

        delete currentStates[stateKey];
        attributes.states = currentStates;

        stateManager.updateNode(this.currentNode.id, { attributes });
    }

    /**
     * 打开颜色选择器
     * @param {string} key - 属性键
     * @param {string} currentValue - 当前颜色值
     */
    openColorPicker(key, currentValue) {
        // 使用浏览器原生颜色选择器
        const colorInput = document.createElement('input');
        colorInput.type = 'color';
        colorInput.value = currentValue || '#FFFFFF';
        colorInput.addEventListener('input', (e) => {
            const newValue = e.target.value;
            this.updateAttributeValue(key, newValue);
            // 刷新颜色输入控件
            const container = document.getElementById('attributes-container');
            if (container) {
                this.refreshColorInputs(container);
            }
        });
        colorInput.click();
    }

    /**
     * 切换颜色输入模式
     */
    toggleColorInputMode() {
        this.colorInputMode = this.colorInputMode === 'hex' ? 'rgb' : 'hex';
    }

    /**
     * 刷新颜色输入控件
     * @param {HTMLElement} container - 容器元素
     */
    refreshColorInputs(container) {
        // 重新加载属性编辑器以更新颜色输入控件
        if (this.currentNode) {
            this.updateAttributesEditor(this.currentNode.attributes || {}, container);
        }
    }

    /**
     * 添加属性
     */
    addAttribute() {
        if (!this.currentNode || !this.isEditing) return;

        const newKey = `newAttribute_${Date.now()}`;
        const newValue = '';

        const attributes = { ...(this.currentNode.attributes || {}) };
        attributes[newKey] = newValue;

        stateManager.updateNode(this.currentNode.id, { attributes });
    }

    /**
     * 更新属性键
     * @param {string} oldKey - 旧键名
     * @param {string} newKey - 新键名
     */
    updateAttributeKey(oldKey, newKey) {
        if (!this.currentNode || !this.isEditing) return;

        const attributes = { ...(this.currentNode.attributes || {}) };
        if (attributes[oldKey] !== undefined) {
            attributes[newKey] = attributes[oldKey];
            delete attributes[oldKey];
            stateManager.updateNode(this.currentNode.id, { attributes });
        }
    }

    /**
     * 更新属性值
     * @param {string} key - 属性键
     * @param {*} value - 属性值
     */
    updateAttributeValue(key, value) {
        if (!this.currentNode || !this.isEditing) return;

        const attributes = { ...(this.currentNode.attributes || {}) };
        attributes[key] = value;
        stateManager.updateNode(this.currentNode.id, { attributes });
    }

    /**
     * 删除属性
     * @param {string} key - 属性键
     */
    removeAttribute(key) {
        if (!this.currentNode || !this.isEditing) return;

        const attributes = { ...(this.currentNode.attributes || {}) };
        delete attributes[key];
        stateManager.updateNode(this.currentNode.id, { attributes });
    }

    /**
     * 销毁管理器
     */
    destroy() {
        this.currentNode = null;
        this.isEditing = false;
    }
}

// 创建全局属性管理器实例
let attributeManager = new AttributeManager();

// 导出属性管理器
window.attributeManager = attributeManager;
