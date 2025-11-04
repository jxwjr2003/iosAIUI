/**
 * 成员变量管理器
 * 专门负责组件成员变量的管理
 */
class MemberVariableManager {
    constructor() {
        this.currentNode = null;
        this.isEditing = false;
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
     * 更新成员变量编辑器
     * @param {Array} memberVariables - 成员变量数组
     * @param {HTMLElement} container - 容器元素
     */
    updateMemberVariablesEditor(memberVariables, container) {
        if (!container) return;

        container.innerHTML = '';

        if (memberVariables.length === 0) {
            const emptyMessage = document.createElement('div');
            emptyMessage.className = 'empty-state-message';
            emptyMessage.textContent = '暂无成员变量';
            container.appendChild(emptyMessage);
        } else {
            memberVariables.forEach((variable, index) => {
                this.createMemberVariableItem(variable, index, container);
            });
        }
    }

    /**
     * 创建成员变量项
     * @param {Object} variable - 成员变量数据
     * @param {number} index - 索引
     * @param {HTMLElement} container - 容器元素
     */
    createMemberVariableItem(variable, index, container) {
        const item = document.createElement('div');
        item.className = 'member-variable-item';

        const nameInput = document.createElement('input');
        nameInput.type = 'text';
        nameInput.placeholder = '变量名';
        nameInput.value = variable.name || '';
        nameInput.addEventListener('change', (e) => {
            this.updateMemberVariableProperty(index, 'name', e.target.value);
        });

        const typeSelect = document.createElement('select');
        const variableTypes = ['String', 'Int', 'Bool', 'Double', 'Float', 'UIColor', 'UIFont'];
        variableTypes.forEach(type => {
            const option = document.createElement('option');
            option.value = type;
            option.textContent = type;
            if (type === variable.type) option.selected = true;
            typeSelect.appendChild(option);
        });
        typeSelect.addEventListener('change', (e) => {
            this.updateMemberVariableProperty(index, 'type', e.target.value);
        });

        const defaultValueInput = document.createElement('input');
        defaultValueInput.type = 'text';
        defaultValueInput.placeholder = '默认值';
        defaultValueInput.value = variable.defaultValue || '';
        defaultValueInput.addEventListener('change', (e) => {
            this.updateMemberVariableProperty(index, 'defaultValue', e.target.value);
        });

        const removeBtn = document.createElement('button');
        removeBtn.className = 'remove-btn';
        removeBtn.textContent = '删除';
        removeBtn.addEventListener('click', () => {
            this.removeMemberVariable(index);
        });

        item.appendChild(nameInput);
        item.appendChild(typeSelect);
        item.appendChild(defaultValueInput);
        item.appendChild(removeBtn);
        container.appendChild(item);
    }

    /**
     * 添加成员变量
     */
    addMemberVariable() {
        if (!this.currentNode || !this.isEditing) return;

        const newVariable = {
            name: 'newVariable',
            type: 'String',
            defaultValue: ''
        };

        const memberVariables = [...(this.currentNode.memberVariables || []), newVariable];
        stateManager.updateNode(this.currentNode.id, { memberVariables });
    }

    /**
     * 更新成员变量属性
     * @param {number} index - 变量索引
     * @param {string} property - 属性名
     * @param {*} value - 属性值
     */
    updateMemberVariableProperty(index, property, value) {
        if (!this.currentNode || !this.isEditing) return;

        const memberVariables = [...(this.currentNode.memberVariables || [])];
        if (memberVariables[index]) {
            memberVariables[index][property] = value;
            stateManager.updateNode(this.currentNode.id, { memberVariables });
        }
    }

    /**
     * 删除成员变量
     * @param {number} index - 变量索引
     */
    removeMemberVariable(index) {
        if (!this.currentNode || !this.isEditing) return;

        const memberVariables = [...(this.currentNode.memberVariables || [])];
        memberVariables.splice(index, 1);
        stateManager.updateNode(this.currentNode.id, { memberVariables });
    }

    /**
     * 销毁管理器
     */
    destroy() {
        this.currentNode = null;
        this.isEditing = false;
    }
}

// 创建全局成员变量管理器实例
let memberVariableManager = new MemberVariableManager();

// 导出成员变量管理器
window.memberVariableManager = memberVariableManager;
