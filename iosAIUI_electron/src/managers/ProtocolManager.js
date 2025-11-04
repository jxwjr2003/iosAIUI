/**
 * 协议管理器
 * 专门负责组件协议配置的管理
 */
class ProtocolManager {
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
     * 更新协议编辑器
     * @param {Array} protocols - 协议数组
     * @param {HTMLElement} container - 容器元素
     */
    updateProtocolsEditor(protocols, container) {
        if (!container) return;

        container.innerHTML = '';

        if (protocols.length === 0) {
            const emptyMessage = document.createElement('div');
            emptyMessage.className = 'empty-state-message';
            emptyMessage.textContent = '暂无协议';
            container.appendChild(emptyMessage);
        } else {
            protocols.forEach((protocol, index) => {
                this.createProtocolItem(protocol, index, container);
            });
        }
    }

    /**
     * 创建协议项
     * @param {Object} protocol - 协议数据
     * @param {number} index - 索引
     * @param {HTMLElement} container - 容器元素
     */
    createProtocolItem(protocol, index, container) {
        const item = document.createElement('div');
        item.className = 'protocol-item';

        const protocolNameInput = document.createElement('input');
        protocolNameInput.type = 'text';
        protocolNameInput.placeholder = '协议名';
        protocolNameInput.value = protocol.protocolName || '';
        protocolNameInput.addEventListener('change', (e) => {
            this.updateProtocolProperty(index, 'protocolName', e.target.value);
        });

        const protocolMethodsTextarea = document.createElement('textarea');
        protocolMethodsTextarea.placeholder = '协议方法';
        protocolMethodsTextarea.value = protocol.protocolMethods || '';
        protocolMethodsTextarea.addEventListener('change', (e) => {
            this.updateProtocolProperty(index, 'protocolMethods', e.target.value);
        });

        const removeBtn = document.createElement('button');
        removeBtn.className = 'remove-btn';
        removeBtn.textContent = '删除';
        removeBtn.addEventListener('click', () => {
            this.removeProtocol(index);
        });

        item.appendChild(protocolNameInput);
        item.appendChild(protocolMethodsTextarea);
        item.appendChild(removeBtn);
        container.appendChild(item);
    }

    /**
     * 添加协议
     */
    addProtocol() {
        if (!this.currentNode || !this.isEditing) return;

        const newProtocol = {
            protocolName: 'newProtocol',
            protocolMethods: ''
        };

        const protocols = [...(this.currentNode.protocols || []), newProtocol];
        stateManager.updateNode(this.currentNode.id, { protocols });
    }

    /**
     * 更新协议属性
     * @param {number} index - 协议索引
     * @param {string} property - 属性名
     * @param {*} value - 属性值
     */
    updateProtocolProperty(index, property, value) {
        if (!this.currentNode || !this.isEditing) return;

        const protocols = [...(this.currentNode.protocols || [])];
        if (protocols[index]) {
            protocols[index][property] = value;
            stateManager.updateNode(this.currentNode.id, { protocols });
        }
    }

    /**
     * 删除协议
     * @param {number} index - 协议索引
     */
    removeProtocol(index) {
        if (!this.currentNode || !this.isEditing) return;

        const protocols = [...(this.currentNode.protocols || [])];
        protocols.splice(index, 1);
        stateManager.updateNode(this.currentNode.id, { protocols });
    }

    /**
     * 销毁管理器
     */
    destroy() {
        this.currentNode = null;
        this.isEditing = false;
    }
}

// 创建全局协议管理器实例
let protocolManager = new ProtocolManager();

// 导出协议管理器
window.protocolManager = protocolManager;
