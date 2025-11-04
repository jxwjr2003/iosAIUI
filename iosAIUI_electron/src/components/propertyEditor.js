/**
 * 属性编辑器组件
 * 负责协调各个管理器类，编辑组件属性、约束包、成员变量、函数、协议配置
 */
class PropertyEditor {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
        this.currentNode = null;
        this.isEditing = false;

        // 初始化管理器
        this.managers = {
            attribute: attributeManager,
            constraint: constraintManager,
            memberVariable: memberVariableManager,
            function: functionManager,
            protocol: protocolManager
        };

        // 初始化组件
        this.init();
    }

    /**
     * 初始化属性编辑器
     */
    init() {
        // 绑定事件监听器
        this.bindEvents();

        // 订阅状态变化
        stateManager.subscribe((state) => {
            this.updateSelectedNode(state.selectedNode);
        });

        // 初始状态
        this.clearEditor();
    }

    /**
     * 绑定事件监听器
     */
    bindEvents() {
        // 绑定基础信息事件
        this.bindBaseInfoEvents();

        // 绑定动态编辑器按钮事件
        this.bindDynamicEditorEvents();

        // 绑定操作按钮事件
        this.bindActionEvents();
    }

    /**
     * 绑定基础信息事件
     */
    bindBaseInfoEvents() {
        // 节点名称输入
        const nodeNameInput = document.getElementById('node-name');
        if (nodeNameInput) {
            nodeNameInput.addEventListener('change', (e) => {
                this.updateNodeProperty('name', e.target.value);
            });
        }

        // 节点类型选择
        const nodeTypeSelect = document.getElementById('node-type');
        if (nodeTypeSelect) {
            nodeTypeSelect.addEventListener('change', (e) => {
                this.updateNodeProperty('type', e.target.value);
            });
        }

        // 布局方向选择
        const layoutDirectionSelect = document.getElementById('layout-direction');
        if (layoutDirectionSelect) {
            layoutDirectionSelect.addEventListener('change', (e) => {
                this.updateNodeProperty('layout', e.target.value);
            });
        }

        // 描述文本区域
        const nodeDescriptionTextarea = document.getElementById('node-description');
        if (nodeDescriptionTextarea) {
            nodeDescriptionTextarea.addEventListener('change', (e) => {
                this.updateNodeProperty('description', e.target.value);
            });
        }
    }

    /**
     * 绑定动态编辑器按钮事件
     */
    bindDynamicEditorEvents() {
        // 属性编辑器
        const addAttributeBtn = document.getElementById('add-attribute-btn');
        if (addAttributeBtn) {
            addAttributeBtn.addEventListener('click', () => {
                this.managers.attribute.addAttribute();
            });
        }

        // 约束包编辑器
        const addConstraintPackageBtn = document.getElementById('add-constraint-package-btn');
        if (addConstraintPackageBtn) {
            addConstraintPackageBtn.addEventListener('click', () => {
                this.managers.constraint.addConstraintPackage();
            });
        }

        // 成员变量编辑器
        const addMemberVariableBtn = document.getElementById('add-member-variable-btn');
        if (addMemberVariableBtn) {
            addMemberVariableBtn.addEventListener('click', () => {
                this.managers.memberVariable.addMemberVariable();
            });
        }

        // 函数编辑器
        const addFunctionBtn = document.getElementById('add-function-btn');
        if (addFunctionBtn) {
            addFunctionBtn.addEventListener('click', () => {
                this.managers.function.addFunction();
            });
        }

        // 协议编辑器
        const addProtocolBtn = document.getElementById('add-protocol-btn');
        if (addProtocolBtn) {
            addProtocolBtn.addEventListener('click', () => {
                this.managers.protocol.addProtocol();
            });
        }
    }

    /**
     * 绑定操作按钮事件
     */
    bindActionEvents() {
        // 绑定保存属性按钮
        const savePropertiesBtn = document.getElementById('save-properties-btn');
        if (savePropertiesBtn) {
            savePropertiesBtn.addEventListener('click', () => {
                this.saveProperties();
            });
        }

        // 绑定重置属性按钮
        const resetPropertiesBtn = document.getElementById('reset-properties-btn');
        if (resetPropertiesBtn) {
            resetPropertiesBtn.addEventListener('click', () => {
                this.resetProperties();
            });
        }
    }

    /**
     * 更新选中的节点
     * @param {Object} node - 节点数据
     */
    updateSelectedNode(node) {
        console.log('PropertyEditor: updateSelectedNode called with node:', node);
        this.currentNode = node;
        this.isEditing = false;

        // 设置所有管理器的当前节点
        Object.values(this.managers).forEach(manager => {
            manager.setCurrentNode(node);
        });

        if (node) {
            this.populateEditor(node);
        } else {
            this.clearEditor();
        }
    }

    /**
     * 填充编辑器
     * @param {Object} node - 节点数据
     */
    populateEditor(node) {
        this.isEditing = true;

        // 更新基础信息
        this.updateBaseInfo(node);

        // 使用管理器更新各个编辑器
        this.updateAttributesEditor(node.attributes || {});
        this.updateConstraintsEditor(node.constraintPackages || []);
        this.updateMemberVariablesEditor(node.memberVariables || []);
        this.updateFunctionsEditor(node.functions || []);
        this.updateProtocolsEditor(node.protocols || []);

        // 更新布局方向和描述
        this.updateLayoutDirection(node.layout || 'horizontal');
        this.updateDescription(node.description || '');
    }

    /**
     * 更新基础信息
     * @param {Object} node - 节点数据
     */
    updateBaseInfo(node) {
        // 节点ID（只读）
        const nodeIdInput = document.getElementById('node-id');
        if (nodeIdInput) {
            nodeIdInput.value = node.id;
        }

        // 节点名称
        const nodeNameInput = document.getElementById('node-name');
        if (nodeNameInput) {
            nodeNameInput.value = node.name;
        }

        // 节点类型
        const nodeTypeSelect = document.getElementById('node-type');
        if (nodeTypeSelect) {
            nodeTypeSelect.value = node.type;
        }
    }

    /**
     * 更新属性编辑器
     * @param {Object} attributes - 属性对象
     */
    updateAttributesEditor(attributes) {
        const container = document.getElementById('attributes-container');
        if (container && this.managers.attribute) {
            this.managers.attribute.updateAttributesEditor(attributes, container);
        }
    }

    /**
     * 更新约束包编辑器
     * @param {Array} constraintPackages - 约束包数组
     */
    updateConstraintsEditor(constraintPackages) {
        const container = document.getElementById('constraints-container');
        if (container && this.managers.constraint) {
            this.managers.constraint.updateConstraintsEditor(constraintPackages, container);
        }
    }

    /**
     * 更新成员变量编辑器
     * @param {Array} memberVariables - 成员变量数组
     */
    updateMemberVariablesEditor(memberVariables) {
        const container = document.getElementById('member-variables-container');
        if (container && this.managers.memberVariable) {
            this.managers.memberVariable.updateMemberVariablesEditor(memberVariables, container);
        }
    }

    /**
     * 更新函数编辑器
     * @param {Array} functions - 函数数组
     */
    updateFunctionsEditor(functions) {
        const container = document.getElementById('functions-container');
        if (container && this.managers.function) {
            this.managers.function.updateFunctionsEditor(functions, container);
        }
    }

    /**
     * 更新协议编辑器
     * @param {Array} protocols - 协议数组
     */
    updateProtocolsEditor(protocols) {
        const container = document.getElementById('protocols-container');
        if (container && this.managers.protocol) {
            this.managers.protocol.updateProtocolsEditor(protocols, container);
        }
    }

    /**
     * 更新布局方向
     * @param {string} layout - 布局方向
     */
    updateLayoutDirection(layout) {
        const layoutDirectionSelect = document.getElementById('layout-direction');
        if (layoutDirectionSelect) {
            layoutDirectionSelect.value = layout;
        }
    }

    /**
     * 更新描述
     * @param {string} description - 描述文本
     */
    updateDescription(description) {
        const nodeDescriptionTextarea = document.getElementById('node-description');
        if (nodeDescriptionTextarea) {
            nodeDescriptionTextarea.value = description;
        }
    }

    /**
     * 清空编辑器
     */
    clearEditor() {
        this.isEditing = false;

        // 清空基础信息
        const nodeIdInput = document.getElementById('node-id');
        if (nodeIdInput) nodeIdInput.value = '';

        const nodeNameInput = document.getElementById('node-name');
        if (nodeNameInput) nodeNameInput.value = '';

        const nodeTypeSelect = document.getElementById('node-type');
        if (nodeTypeSelect) nodeTypeSelect.selectedIndex = 0;

        // 清空动态编辑器
        const containers = [
            'attributes-container',
            'constraints-container',
            'member-variables-container',
            'functions-container',
            'protocols-container'
        ];

        containers.forEach(containerId => {
            const container = document.getElementById(containerId);
            if (container) container.innerHTML = '';
        });

        // 清空布局和描述
        const layoutDirectionSelect = document.getElementById('layout-direction');
        if (layoutDirectionSelect) layoutDirectionSelect.selectedIndex = 0;

        const nodeDescriptionTextarea = document.getElementById('node-description');
        if (nodeDescriptionTextarea) nodeDescriptionTextarea.value = '';
    }

    /**
     * 更新节点属性
     * @param {string} property - 属性名
     * @param {*} value - 属性值
     */
    updateNodeProperty(property, value) {
        if (!this.currentNode || !this.isEditing) return;

        const updates = { [property]: value };
        stateManager.updateNode(this.currentNode.id, updates);
    }

    /**
     * 保存属性
     */
    saveProperties() {
        if (!this.currentNode || !this.isEditing) return;

        // 触发所有输入框的change事件以确保数据同步
        this.triggerAllChangeEvents();

        this.showNotification('属性已保存');
    }

    /**
     * 重置属性
     */
    resetProperties() {
        if (!this.currentNode || !this.isEditing) return;

        if (confirm('确定要重置所有属性吗？这将丢失所有未保存的更改。')) {
            this.populateEditor(this.currentNode);
            this.showNotification('属性已重置');
        }
    }

    /**
     * 触发所有输入框的change事件
     */
    triggerAllChangeEvents() {
        const inputs = this.container.querySelectorAll('input, select, textarea');
        inputs.forEach(input => {
            const event = new Event('change', { bubbles: true });
            input.dispatchEvent(event);
        });
    }

    /**
     * 显示通知
     * @param {string} message - 通知消息
     */
    showNotification(message) {
        // 使用树形编辑器的通知方法（如果可用）
        if (window.treeEditor && window.treeEditor.showNotification) {
            window.treeEditor.showNotification(message);
        } else {
            // 简单的备用通知
            console.log('通知:', message);
            alert(message);
        }
    }

    /**
     * 填充节点类型选择器
     */
    populateNodeTypeSelect() {
        const nodeTypeSelect = document.getElementById('node-type');
        if (!nodeTypeSelect) return;

        // 清空现有选项
        nodeTypeSelect.innerHTML = '';

        // 完整的 UIKit 组件类型列表
        const componentTypes = getSupportedComponentTypes();

        // 添加选项
        componentTypes.forEach(type => {
            const option = document.createElement('option');
            option.value = type;
            option.textContent = type;
            nodeTypeSelect.appendChild(option);
        });
    }

    /**
     * 销毁组件
     */
    destroy() {
        // 清理事件监听器和DOM元素
        this.container.innerHTML = '';

        // 销毁所有管理器
        Object.values(this.managers).forEach(manager => {
            if (manager && typeof manager.destroy === 'function') {
                manager.destroy();
            }
        });
    }
}

// 创建全局属性编辑器实例
let propertyEditor = null;

// 初始化属性编辑器
document.addEventListener('DOMContentLoaded', () => {
    propertyEditor = new PropertyEditor('property-editor');
});

// 导出属性编辑器
window.propertyEditor = propertyEditor;
