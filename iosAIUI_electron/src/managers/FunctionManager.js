/**
 * 函数管理器
 * 专门负责组件函数的管理
 */
class FunctionManager {
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
     * 更新函数编辑器
     * @param {Array} functions - 函数数组
     * @param {HTMLElement} container - 容器元素
     */
    updateFunctionsEditor(functions, container) {
        if (!container) return;

        container.innerHTML = '';

        if (functions.length === 0) {
            const emptyMessage = document.createElement('div');
            emptyMessage.className = 'empty-state-message';
            emptyMessage.textContent = '暂无函数';
            container.appendChild(emptyMessage);
        } else {
            functions.forEach((func, index) => {
                this.createFunctionItem(func, index, container);
            });
        }
    }

    /**
     * 创建函数项
     * @param {Object} func - 函数数据
     * @param {number} index - 索引
     * @param {HTMLElement} container - 容器元素
     */
    createFunctionItem(func, index, container) {
        const item = document.createElement('div');
        item.className = 'function-item';

        const funcNameInput = document.createElement('input');
        funcNameInput.type = 'text';
        funcNameInput.placeholder = '函数名';
        funcNameInput.value = func.funcName || '';
        funcNameInput.addEventListener('change', (e) => {
            this.updateFunctionProperty(index, 'funcName', e.target.value);
        });

        const funcLogicTextarea = document.createElement('textarea');
        funcLogicTextarea.placeholder = '函数逻辑';
        funcLogicTextarea.value = func.funcLogic || '';
        funcLogicTextarea.addEventListener('change', (e) => {
            this.updateFunctionProperty(index, 'funcLogic', e.target.value);
        });

        const removeBtn = document.createElement('button');
        removeBtn.className = 'remove-btn';
        removeBtn.textContent = '删除';
        removeBtn.addEventListener('click', () => {
            this.removeFunction(index);
        });

        item.appendChild(funcNameInput);
        item.appendChild(funcLogicTextarea);
        item.appendChild(removeBtn);
        container.appendChild(item);
    }

    /**
     * 添加函数
     */
    addFunction() {
        if (!this.currentNode || !this.isEditing) return;

        const newFunction = {
            funcName: 'newFunction',
            funcLogic: ''
        };

        const functions = [...(this.currentNode.functions || []), newFunction];
        stateManager.updateNode(this.currentNode.id, { functions });
    }

    /**
     * 更新函数属性
     * @param {number} index - 函数索引
     * @param {string} property - 属性名
     * @param {*} value - 属性值
     */
    updateFunctionProperty(index, property, value) {
        if (!this.currentNode || !this.isEditing) return;

        const functions = [...(this.currentNode.functions || [])];
        if (functions[index]) {
            functions[index][property] = value;
            stateManager.updateNode(this.currentNode.id, { functions });
        }
    }

    /**
     * 删除函数
     * @param {number} index - 函数索引
     */
    removeFunction(index) {
        if (!this.currentNode || !this.isEditing) return;

        const functions = [...(this.currentNode.functions || [])];
        functions.splice(index, 1);
        stateManager.updateNode(this.currentNode.id, { functions });
    }

    /**
     * 销毁管理器
     */
    destroy() {
        this.currentNode = null;
        this.isEditing = false;
    }
}

// 创建全局函数管理器实例
let functionManager = new FunctionManager();

// 导出函数管理器
window.functionManager = functionManager;
