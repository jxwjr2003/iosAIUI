/**
 * 约束管理器
 * 专门负责组件约束包的管理和编辑
 */
class ConstraintManager {
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
     * 更新约束包编辑器
     * @param {Array} constraintPackages - 约束包数组
     * @param {HTMLElement} container - 容器元素
     */
    updateConstraintsEditor(constraintPackages, container) {
        if (!container) return;

        container.innerHTML = '';

        if (!constraintPackages || constraintPackages.length === 0) {
            const emptyMessage = document.createElement('div');
            emptyMessage.className = 'empty-state-message';
            emptyMessage.textContent = '暂无约束包';
            container.appendChild(emptyMessage);
        } else {
            constraintPackages.forEach((constraintPackage, packageIndex) => {
                this.createConstraintPackageItem(constraintPackage, packageIndex, container);
            });
        }
    }

    /**
     * 创建约束包项
     * @param {Object} constraintPackage - 约束包数据
     * @param {number} packageIndex - 包索引
     * @param {HTMLElement} container - 容器元素
     */
    createConstraintPackageItem(constraintPackage, packageIndex, container) {
        const packageItem = document.createElement('div');
        packageItem.className = 'constraint-package-item';

        // 约束包头部
        const packageHeader = document.createElement('div');
        packageHeader.className = 'package-header';

        // 约束包名称
        const packageNameInput = document.createElement('input');
        packageNameInput.type = 'text';
        packageNameInput.placeholder = '约束包名称';
        packageNameInput.value = constraintPackage.name || '';
        packageNameInput.addEventListener('change', (e) => {
            this.updateConstraintPackageProperty(packageIndex, 'name', e.target.value);
        });

        // 默认约束包复选框
        const defaultCheckboxLabel = document.createElement('label');
        defaultCheckboxLabel.className = 'default-checkbox-label';
        const defaultCheckbox = document.createElement('input');
        defaultCheckbox.type = 'checkbox';
        defaultCheckbox.checked = constraintPackage.isDefault || false;
        defaultCheckbox.addEventListener('change', (e) => {
            this.setDefaultConstraintPackage(packageIndex, e.target.checked);
        });
        defaultCheckboxLabel.appendChild(defaultCheckbox);
        defaultCheckboxLabel.appendChild(document.createTextNode('默认'));

        // 删除约束包按钮
        const deletePackageBtn = document.createElement('button');
        deletePackageBtn.className = 'remove-btn';
        deletePackageBtn.textContent = '删除包';
        deletePackageBtn.addEventListener('click', () => {
            this.removeConstraintPackage(packageIndex);
        });

        packageHeader.appendChild(packageNameInput);
        packageHeader.appendChild(defaultCheckboxLabel);
        packageHeader.appendChild(deletePackageBtn);

        // 约束列表容器
        const constraintsContainer = document.createElement('div');
        constraintsContainer.className = 'constraints-container';

        // 添加约束按钮
        const addConstraintBtn = document.createElement('button');
        addConstraintBtn.className = 'add-constraint-btn';
        addConstraintBtn.textContent = '+ 添加约束';
        addConstraintBtn.addEventListener('click', () => {
            this.addConstraintToPackage(packageIndex);
        });

        // 显示约束列表
        if (constraintPackage.constraints && constraintPackage.constraints.length > 0) {
            constraintPackage.constraints.forEach((constraint, constraintIndex) => {
                this.createConstraintItem(constraint, packageIndex, constraintIndex, constraintsContainer);
            });
        } else {
            const emptyMessage = document.createElement('div');
            emptyMessage.className = 'empty-state-message';
            emptyMessage.textContent = '暂无约束';
            constraintsContainer.appendChild(emptyMessage);
        }

        packageItem.appendChild(packageHeader);
        packageItem.appendChild(constraintsContainer);
        packageItem.appendChild(addConstraintBtn);
        container.appendChild(packageItem);
    }

    /**
     * 创建约束项 - 改进的两行布局
     * @param {Object} constraint - 约束数据
     * @param {number} packageIndex - 包索引
     * @param {number} constraintIndex - 约束索引
     * @param {HTMLElement} container - 容器元素
     */
    createConstraintItem(constraint, packageIndex, constraintIndex, container) {
        const item = document.createElement('div');
        item.className = 'constraint-item';

        // 第一行：当前节点配置
        const firstRow = document.createElement('div');
        firstRow.className = 'constraint-row constraint-row-first';

        // 约束类型
        const typeSelect = document.createElement('select');
        typeSelect.className = 'constraint-type-select';
        const constraintTypes = [
            { value: 'size', label: '尺寸约束' },
            { value: 'edge', label: '边缘约束' },
            { value: 'center', label: '中心约束' },
            { value: 'baseline', label: '基线约束' },
            { value: 'aspectRatio', label: '宽高比约束' }
        ];

        constraintTypes.forEach(type => {
            const option = document.createElement('option');
            option.value = type.value;
            option.textContent = type.label;
            if (type.value === constraint.type) option.selected = true;
            typeSelect.appendChild(option);
        });
        typeSelect.addEventListener('change', (e) => {
            const newType = e.target.value;

            // 根据新类型设置对应的默认属性
            const getDefaultAttribute = (type) => {
                switch (type) {
                    case 'size':
                        return 'width';
                    case 'edge':
                        return 'top';
                    case 'center':
                        return 'centerX';
                    case 'baseline':
                        return 'firstBaseline';
                    case 'aspectRatio':
                        return 'aspectRatio';
                    default:
                        return 'width';
                }
            };

            // 更新约束类型
            this.updateConstraintProperty(packageIndex, constraintIndex, 'type', newType);

            // 同时更新属性为对应类型的默认值
            this.updateConstraintProperty(packageIndex, constraintIndex, 'attribute', getDefaultAttribute(newType));

            // 类型改变时重新渲染约束项
            this.refreshConstraintItem(packageIndex, constraintIndex, container);
        });

        // 约束属性
        const attributeSelect = document.createElement('select');
        attributeSelect.className = 'constraint-attribute-select';

        // 根据约束类型动态设置属性选项
        this.populateConstraintAttributes(attributeSelect, constraint.type, constraint.attribute);

        attributeSelect.addEventListener('change', (e) => {
            this.updateConstraintProperty(packageIndex, constraintIndex, 'attribute', e.target.value);
        });

        // 约束关系
        const relationSelect = document.createElement('select');
        relationSelect.className = 'constraint-relation-select';
        const constraintRelations = [
            { value: 'equalTo', label: '等于' },
            { value: 'greaterThanOrEqualTo', label: '大于等于' },
            { value: 'lessThanOrEqualTo', label: '小于等于' }
        ];

        constraintRelations.forEach(relation => {
            const option = document.createElement('option');
            option.value = relation.value;
            option.textContent = relation.label;
            if (relation.value === constraint.relation) option.selected = true;
            relationSelect.appendChild(option);
        });
        relationSelect.addEventListener('change', (e) => {
            this.updateConstraintProperty(packageIndex, constraintIndex, 'relation', e.target.value);
        });

        // 约束值
        const valueInput = document.createElement('input');
        valueInput.type = 'number';
        valueInput.placeholder = '值';
        valueInput.value = constraint.value != null ? constraint.value : '';
        valueInput.addEventListener('change', (e) => {
            this.updateConstraintProperty(packageIndex, constraintIndex, 'value', parseFloat(e.target.value));
        });

        // 删除按钮
        const removeBtn = document.createElement('button');
        removeBtn.className = 'remove-btn';
        removeBtn.textContent = '删除';
        removeBtn.addEventListener('click', () => {
            this.removeConstraint(packageIndex, constraintIndex);
        });

        firstRow.appendChild(typeSelect);
        firstRow.appendChild(attributeSelect);
        firstRow.appendChild(relationSelect);
        firstRow.appendChild(valueInput);
        firstRow.appendChild(removeBtn);

        // 第二行：参考节点ID选择器（仅对需要参考节点的约束类型显示）
        const secondRow = document.createElement('div');
        secondRow.className = 'constraint-row constraint-row-second';

        // 根据约束类型决定是否显示第二行
        const showReferenceRow = ['edge', 'center', 'baseline'].includes(constraint.type);
        secondRow.style.display = showReferenceRow ? 'flex' : 'none';

        // 参考节点标签
        const referenceLabel = document.createElement('span');
        referenceLabel.className = 'constraint-reference-label';
        referenceLabel.textContent = '参考节点:';

        // 参考节点选择器
        const referenceNodeSelect = document.createElement('select');
        referenceNodeSelect.className = 'constraint-reference-node-select';
        this.populateReferenceNodes(referenceNodeSelect, constraint.reference?.nodeId);
        referenceNodeSelect.addEventListener('change', (e) => {
            const reference = constraint.reference || {};
            reference.nodeId = e.target.value;

            // 根据约束类型设置默认的参考属性和类型
            if (e.target.value) { // 只有当选择了参考节点时才设置默认值
                const defaultReferenceConfig = this.getDefaultReferenceConfig(constraint.type, constraint.attribute);
                reference.attribute = defaultReferenceConfig.attribute;
                reference.referenceType = defaultReferenceConfig.referenceType;
            }

            this.updateConstraintProperty(packageIndex, constraintIndex, 'reference', reference);
        });

        secondRow.appendChild(referenceLabel);
        secondRow.appendChild(referenceNodeSelect);

        // 第三行：参考节点详细配置（仅对边缘和基线约束显示）
        const thirdRow = document.createElement('div');
        thirdRow.className = 'constraint-row constraint-row-third';

        // 根据约束类型决定是否显示第三行
        const showThirdRow = ['edge', 'baseline'].includes(constraint.type);
        thirdRow.style.display = showThirdRow ? 'flex' : 'none';

        // 参考属性选择器
        const referenceAttributeSelect = document.createElement('select');
        referenceAttributeSelect.className = 'constraint-reference-attribute-select';

        // 始终填充参考属性选项，但根据约束类型决定显示哪些属性
        this.populateReferenceAttributes(referenceAttributeSelect, constraint.type, constraint.reference?.attribute);

        referenceAttributeSelect.addEventListener('change', (e) => {
            const reference = constraint.reference || {};
            reference.attribute = e.target.value;
            this.updateConstraintProperty(packageIndex, constraintIndex, 'reference', reference);
        });

        // Inset/Offset 选择器
        const referenceTypeSelect = document.createElement('select');
        referenceTypeSelect.className = 'constraint-reference-type-select';
        const referenceTypes = [
            { value: 'offset', label: '偏移量' },
            { value: 'inset', label: '内边距' }
        ];

        referenceTypes.forEach(type => {
            const option = document.createElement('option');
            option.value = type.value;
            option.textContent = type.label;
            if (type.value === (constraint.reference?.referenceType || 'offset')) option.selected = true;
            referenceTypeSelect.appendChild(option);
        });
        referenceTypeSelect.addEventListener('change', (e) => {
            const reference = constraint.reference || {};
            reference.referenceType = e.target.value;
            this.updateConstraintProperty(packageIndex, constraintIndex, 'reference', reference);
        });

        // 参考属性标签
        const referenceAttributeLabel = document.createElement('span');
        referenceAttributeLabel.className = 'constraint-reference-label';
        referenceAttributeLabel.textContent = '参考属性:';

        // 偏移类型标签
        const referenceTypeLabel = document.createElement('span');
        referenceTypeLabel.className = 'constraint-reference-label';
        referenceTypeLabel.textContent = '类型:';

        thirdRow.appendChild(referenceAttributeLabel);
        thirdRow.appendChild(referenceAttributeSelect);
        thirdRow.appendChild(referenceTypeLabel);
        thirdRow.appendChild(referenceTypeSelect);

        // 添加约束描述
        const descriptionDiv = document.createElement('div');
        descriptionDiv.className = 'constraint-description';
        descriptionDiv.textContent = this.generateConstraintDescription(constraint);

        item.appendChild(firstRow);
        item.appendChild(secondRow);
        item.appendChild(thirdRow);
        item.appendChild(descriptionDiv);
        container.appendChild(item);
    }

    /**
     * 填充约束属性选项
     * @param {HTMLSelectElement} selectElement - 选择器元素
     * @param {string} constraintType - 约束类型
     * @param {string} currentAttribute - 当前属性
     */
    populateConstraintAttributes(selectElement, constraintType, currentAttribute) {
        selectElement.innerHTML = '';

        let attributes = [];

        switch (constraintType) {
            case 'size':
                attributes = [
                    { value: 'width', label: '宽度' },
                    { value: 'height', label: '高度' }
                ];
                break;
            case 'edge':
                attributes = [
                    { value: 'top', label: '顶部' },
                    { value: 'left', label: '左侧' },
                    { value: 'right', label: '右侧' },
                    { value: 'bottom', label: '底部' },
                    { value: 'leading', label: '前导边' },
                    { value: 'trailing', label: '尾随边' }
                ];
                break;
            case 'center':
                attributes = [
                    { value: 'centerX', label: '水平中心' },
                    { value: 'centerY', label: '垂直中心' },
                    { value: 'center', label: '中心' }
                ];
                break;
            case 'baseline':
                attributes = [
                    { value: 'firstBaseline', label: '首行基线' },
                    { value: 'lastBaseline', label: '末行基线' },
                    { value: 'baseline', label: '基线' }
                ];
                break;
            case 'aspectRatio':
                attributes = [
                    { value: 'aspectRatio', label: '宽高比' }
                ];
                break;
            default:
                attributes = [];
        }

        attributes.forEach(attribute => {
            const option = document.createElement('option');
            option.value = attribute.value;
            option.textContent = attribute.label;
            if (attribute.value === currentAttribute) option.selected = true;
            selectElement.appendChild(option);
        });
    }

    /**
     * 填充参考属性选项
     * @param {HTMLSelectElement} selectElement - 选择器元素
     * @param {string} constraintType - 约束类型
     * @param {string} currentAttribute - 当前属性
     */
    populateReferenceAttributes(selectElement, constraintType, currentAttribute) {
        selectElement.innerHTML = '';

        let attributes = [];

        switch (constraintType) {
            case 'size':
                attributes = [
                    { value: 'width', label: '宽度' },
                    { value: 'height', label: '高度' }
                ];
                break;
            case 'edge':
                attributes = [
                    { value: 'top', label: '顶部' },
                    { value: 'left', label: '左侧' },
                    { value: 'right', label: '右侧' },
                    { value: 'bottom', label: '底部' },
                    { value: 'leading', label: '前导边' },
                    { value: 'trailing', label: '尾随边' }
                ];
                break;
            case 'center':
                attributes = [
                    { value: 'centerX', label: '水平中心' },
                    { value: 'centerY', label: '垂直中心' }
                ];
                break;
            case 'baseline':
                attributes = [
                    { value: 'firstBaseline', label: '首行基线' },
                    { value: 'lastBaseline', label: '末行基线' },
                    { value: 'baseline', label: '基线' }
                ];
                break;
            case 'aspectRatio':
                attributes = [
                    { value: 'aspectRatio', label: '宽高比' }
                ];
                break;
            default:
                attributes = [];
        }

        attributes.forEach(attribute => {
            const option = document.createElement('option');
            option.value = attribute.value;
            option.textContent = attribute.label;
            if (attribute.value === currentAttribute) option.selected = true;
            selectElement.appendChild(option);
        });
    }

    /**
     * 生成约束描述
     * @param {Object} constraint - 约束数据
     * @returns {string} 约束描述
     */
    generateConstraintDescription(constraint) {
        const { type, attribute, relation, value, reference } = constraint;

        let description = `当前节点的${attribute} ${this.getRelationText(relation)} `;

        if (reference && reference.nodeId) {
            const referenceNode = this.findNodeById(reference.nodeId);
            const nodeName = referenceNode ? referenceNode.name : reference.nodeId;
            description += `${nodeName}的${reference.attribute}的${reference.referenceType === 'inset' ? '内边距' : '偏移量'}${value}`;
        } else {
            description += `固定值${value}`;
        }

        return description;
    }

    /**
     * 获取关系文本
     * @param {string} relation - 关系类型
     * @returns {string} 关系文本
     */
    getRelationText(relation) {
        switch (relation) {
            case 'equalTo': return '等于';
            case 'greaterThanOrEqualTo': return '大于等于';
            case 'lessThanOrEqualTo': return '小于等于';
            default: return '等于';
        }
    }

    /**
     * 根据ID查找节点
     * @param {string} nodeId - 节点ID
     * @returns {Object|null} 节点数据
     */
    findNodeById(nodeId) {
        const treeData = stateManager.getState().treeData;
        return this.findNodeRecursive(treeData, nodeId);
    }

    /**
     * 递归查找节点
     * @param {Array} nodes - 节点数组
     * @param {string} nodeId - 节点ID
     * @returns {Object|null} 节点数据
     */
    findNodeRecursive(nodes, nodeId) {
        for (const node of nodes) {
            if (node.id === nodeId) {
                return node;
            }
            if (node.children && node.children.length > 0) {
                const found = this.findNodeRecursive(node.children, nodeId);
                if (found) return found;
            }
        }
        return null;
    }

    /**
     * 刷新约束项
     * @param {number} packageIndex - 约束包索引
     * @param {number} constraintIndex - 约束索引
     * @param {HTMLElement} container - 容器元素
     */
    refreshConstraintItem(packageIndex, constraintIndex, container) {
        // 重新创建约束项
        const constraintPackages = [...(this.currentNode.constraintPackages || [])];
        if (constraintPackages[packageIndex] && constraintPackages[packageIndex].constraints[constraintIndex]) {
            const constraint = constraintPackages[packageIndex].constraints[constraintIndex];

            // 移除旧的约束项
            const oldItem = container.children[constraintIndex];
            if (oldItem) {
                container.removeChild(oldItem);
            }

            // 创建新的约束项
            this.createConstraintItem(constraint, packageIndex, constraintIndex, container);
        }
    }

    /**
     * 填充参考节点选项（仅父节点和兄弟节点）
     * @param {HTMLSelectElement} selectElement - 选择器元素
     * @param {string} currentReference - 当前引用节点
     */
    populateReferenceNodes(selectElement, currentReference) {
        selectElement.innerHTML = '';

        // 添加空选项
        const emptyOption = document.createElement('option');
        emptyOption.value = '';
        emptyOption.textContent = '选择参考节点';
        selectElement.appendChild(emptyOption);

        if (!this.currentNode) return;

        // 获取当前节点的父节点和兄弟节点
        const availableNodes = this.getAvailableReferenceNodes();

        availableNodes.forEach(node => {
            const option = document.createElement('option');
            option.value = node.id;
            option.textContent = `${node.name} (${node.id})`;
            if (node.id === currentReference) option.selected = true;
            selectElement.appendChild(option);
        });
    }

    /**
     * 获取可用的参考节点（仅父节点和兄弟节点）
     * @returns {Array} 可用节点数组
     */
    getAvailableReferenceNodes() {
        const availableNodes = [];

        if (!this.currentNode) return availableNodes;

        // 获取当前树形结构数据
        const treeData = stateManager.getState().treeData;
        if (!treeData) return availableNodes;

        // 查找当前节点的父节点
        const parentNode = this.findParentNode(treeData, this.currentNode.id);
        if (parentNode) {
            availableNodes.push(parentNode);
        }

        // 查找当前节点的兄弟节点
        const siblingNodes = this.findSiblingNodes(treeData, this.currentNode.id);
        availableNodes.push(...siblingNodes);

        // 如果是根节点，添加虚拟节点"00"
        if (!parentNode) {
            availableNodes.push({
                id: "00",
                name: "模拟器屏幕",
                type: "simulator"
            });
        }

        return availableNodes;
    }

    /**
     * 查找父节点
     * @param {Array} nodes - 节点数组
     * @param {string} nodeId - 当前节点ID
     * @returns {Object|null} 父节点
     */
    findParentNode(nodes, nodeId) {
        for (const node of nodes) {
            if (node.id === nodeId) {
                return null; // 根节点没有父节点
            }

            if (node.children) {
                for (const child of node.children) {
                    if (child.id === nodeId) {
                        return node;
                    }

                    const foundInChildren = this.findParentNode([child], nodeId);
                    if (foundInChildren) {
                        return foundInChildren;
                    }
                }
            }
        }
        return null;
    }

    /**
     * 查找兄弟节点
     * @param {Array} nodes - 节点数组
     * @param {string} nodeId - 当前节点ID
     * @returns {Array} 兄弟节点数组
     */
    findSiblingNodes(nodes, nodeId) {
        const siblings = [];

        for (const node of nodes) {
            if (node.children) {
                const childIds = node.children.map(child => child.id);
                if (childIds.includes(nodeId)) {
                    // 找到当前节点在父节点的子节点列表中
                    siblings.push(...node.children.filter(child => child.id !== nodeId));
                    break;
                } else {
                    // 递归查找子节点
                    const foundInChildren = this.findSiblingNodes(node.children, nodeId);
                    if (foundInChildren.length > 0) {
                        siblings.push(...foundInChildren);
                        break;
                    }
                }
            }
        }

        return siblings;
    }

    /**
     * 添加约束包
     */
    addConstraintPackage() {
        if (!this.currentNode || !this.isEditing) return;

        const newPackage = {
            id: `pkg_${Date.now()}`,
            name: '新约束包',
            isDefault: false,
            constraints: []
        };

        const constraintPackages = [...(this.currentNode.constraintPackages || []), newPackage];
        stateManager.updateNode(this.currentNode.id, { constraintPackages });
    }

    /**
     * 更新约束包属性
     * @param {number} packageIndex - 约束包索引
     * @param {string} property - 属性名
     * @param {*} value - 属性值
     */
    updateConstraintPackageProperty(packageIndex, property, value) {
        if (!this.currentNode || !this.isEditing) return;

        const constraintPackages = [...(this.currentNode.constraintPackages || [])];
        if (constraintPackages[packageIndex]) {
            constraintPackages[packageIndex][property] = value;
            stateManager.updateNode(this.currentNode.id, { constraintPackages });
        }
    }

    /**
     * 设置默认约束包
     * @param {number} packageIndex - 约束包索引
     * @param {boolean} isDefault - 是否设为默认
     */
    setDefaultConstraintPackage(packageIndex, isDefault) {
        if (!this.currentNode || !this.isEditing) return;

        const constraintPackages = [...(this.currentNode.constraintPackages || [])];

        // 如果设为默认，先取消其他包的默认状态
        if (isDefault) {
            constraintPackages.forEach((pkg, index) => {
                constraintPackages[index].isDefault = (index === packageIndex);
            });
        } else {
            // 如果取消默认，确保至少有一个包是默认的
            if (constraintPackages[packageIndex]) {
                constraintPackages[packageIndex].isDefault = false;

                // 如果没有默认包，将第一个包设为默认
                if (!constraintPackages.some(pkg => pkg.isDefault) && constraintPackages.length > 0) {
                    constraintPackages[0].isDefault = true;
                }
            }
        }

        stateManager.updateNode(this.currentNode.id, { constraintPackages });
    }

    /**
     * 删除约束包
     * @param {number} packageIndex - 约束包索引
     */
    removeConstraintPackage(packageIndex) {
        if (!this.currentNode || !this.isEditing) return;

        if (!confirm('确定要删除这个约束包吗？')) {
            return;
        }

        const constraintPackages = [...(this.currentNode.constraintPackages || [])];
        const isDefault = constraintPackages[packageIndex]?.isDefault;

        constraintPackages.splice(packageIndex, 1);

        // 如果删除的是默认包，将第一个包设为默认
        if (isDefault && constraintPackages.length > 0) {
            constraintPackages[0].isDefault = true;
        }

        stateManager.updateNode(this.currentNode.id, { constraintPackages });
    }

    /**
     * 添加约束到约束包 - 使用SnapKit约束模型
     * @param {number} packageIndex - 约束包索引
     */
    addConstraintToPackage(packageIndex) {
        if (!this.currentNode || !this.isEditing) return;

        // 根据约束类型设置对应的默认属性
        const getDefaultAttribute = (type) => {
            switch (type) {
                case 'size':
                    return 'width';
                case 'edge':
                    return 'top';
                case 'center':
                    return 'centerX';
                case 'baseline':
                    return 'firstBaseline';
                case 'aspectRatio':
                    return 'aspectRatio';
                default:
                    return 'width';
            }
        };

        const newConstraint = {
            id: `constraint_${Date.now()}`,
            type: 'size',
            attribute: getDefaultAttribute('size'),
            relation: 'equalTo',
            value: 100,
            reference: {} // 空的参考对象
        };

        const constraintPackages = [...(this.currentNode.constraintPackages || [])];
        if (constraintPackages[packageIndex]) {
            constraintPackages[packageIndex].constraints = [
                ...(constraintPackages[packageIndex].constraints || []),
                newConstraint
            ];
            stateManager.updateNode(this.currentNode.id, { constraintPackages });
        }
    }

    /**
     * 更新约束属性
     * @param {number} packageIndex - 约束包索引
     * @param {number} constraintIndex - 约束索引
     * @param {string} property - 属性名
     * @param {*} value - 属性值
     */
    updateConstraintProperty(packageIndex, constraintIndex, property, value) {
        if (!this.currentNode || !this.isEditing) return;

        const constraintPackages = [...(this.currentNode.constraintPackages || [])];
        if (constraintPackages[packageIndex] &&
            constraintPackages[packageIndex].constraints &&
            constraintPackages[packageIndex].constraints[constraintIndex]) {

            constraintPackages[packageIndex].constraints[constraintIndex][property] = value;
            stateManager.updateNode(this.currentNode.id, { constraintPackages });
        }
    }

    /**
     * 删除约束
     * @param {number} packageIndex - 约束包索引
     * @param {number} constraintIndex - 约束索引
     */
    removeConstraint(packageIndex, constraintIndex) {
        if (!this.currentNode || !this.isEditing) return;

        if (!confirm('确定要删除这个约束吗？')) {
            return;
        }

        const constraintPackages = [...(this.currentNode.constraintPackages || [])];
        if (constraintPackages[packageIndex] && constraintPackages[packageIndex].constraints) {
            constraintPackages[packageIndex].constraints.splice(constraintIndex, 1);
            stateManager.updateNode(this.currentNode.id, { constraintPackages });
        }
    }

    /**
     * 获取默认参考配置
     * @param {string} constraintType - 约束类型
     * @param {string} currentAttribute - 当前属性
     * @returns {Object} 默认参考配置
     */
    getDefaultReferenceConfig(constraintType, currentAttribute) {
        let defaultAttribute = 'top';
        let defaultReferenceType = 'offset';

        switch (constraintType) {
            case 'edge':
                // 对于边缘约束，默认参考属性与当前属性相同，类型为偏移量
                defaultAttribute = currentAttribute || 'top';
                defaultReferenceType = 'offset';
                break;
            case 'center':
                // 对于中心约束，默认参考属性与当前属性相同
                defaultAttribute = currentAttribute || 'centerX';
                break;
            case 'baseline':
                // 对于基线约束，默认参考属性与当前属性相同
                defaultAttribute = currentAttribute || 'firstBaseline';
                defaultReferenceType = 'offset';
                break;
            case 'size':
                // 对于尺寸约束，默认参考属性与当前属性相同
                defaultAttribute = currentAttribute || 'width';
                break;
            default:
                // 默认情况
                defaultAttribute = currentAttribute || 'top';
                defaultReferenceType = 'offset';
        }

        return {
            attribute: defaultAttribute,
            referenceType: defaultReferenceType
        };
    }

    /**
     * 销毁管理器
     */
    destroy() {
        this.currentNode = null;
        this.isEditing = false;
    }
}

// 创建全局约束管理器实例
let constraintManager = new ConstraintManager();

// 导出约束管理器
window.constraintManager = constraintManager;
