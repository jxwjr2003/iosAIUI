/**
 * JSON 查看器组件
 * 负责实时显示UI层级树的JSON内容，支持格式化、复制和刷新功能
 */
class JSONViewer {
    constructor() {
        this.dialog = document.getElementById('json-viewer-dialog');
        this.jsonContent = document.getElementById('json-content');
        this.isVisible = false;

        // 初始化组件
        this.init();
    }

    /**
     * 初始化JSON查看器
     */
    init() {
        // 绑定事件监听器
        this.bindEvents();

        // 订阅状态变化，实时更新JSON内容
        stateManager.subscribe((state) => {
            if (this.isVisible) {
                this.updateJSONContent(state.treeData);
            }
        });

        console.log('📄 [JSONViewer] JSON查看器已初始化');
    }

    /**
     * 绑定事件监听器
     */
    bindEvents() {
        // 绑定查看JSON按钮
        document.getElementById('view-json-btn')?.addEventListener('click', () => {
            this.show();
        });

        // 绑定复制JSON按钮
        document.getElementById('copy-json-btn')?.addEventListener('click', () => {
            this.copyToClipboard();
        });

        // 绑定刷新JSON按钮
        document.getElementById('refresh-json-btn')?.addEventListener('click', () => {
            this.refresh();
        });

        // 绑定关闭按钮
        document.getElementById('close-json-btn')?.addEventListener('click', () => {
            this.hide();
        });

        // 绑定ESC键关闭
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.isVisible) {
                this.hide();
            }
        });

        // 绑定点击背景关闭
        this.dialog?.addEventListener('click', (e) => {
            if (e.target === this.dialog) {
                this.hide();
            }
        });
    }

    /**
     * 显示JSON查看器
     */
    show() {
        if (!this.dialog) return;

        console.log('📄 [JSONViewer] 显示JSON查看器');

        this.isVisible = true;
        this.dialog.style.display = 'flex';

        // 立即更新内容
        this.refresh();
    }

    /**
     * 隐藏JSON查看器
     */
    hide() {
        if (!this.dialog) return;

        console.log('📄 [JSONViewer] 隐藏JSON查看器');

        this.isVisible = false;
        this.dialog.style.display = 'none';
    }

    /**
     * 刷新JSON内容
     */
    refresh() {
        const currentState = stateManager.getState();
        this.updateJSONContent(currentState.treeData);

        console.log('📄 [JSONViewer] JSON内容已刷新', {
            '节点数量': currentState.treeData.length,
            '时间戳': new Date().toISOString()
        });
    }

    /**
     * 更新JSON内容显示
     * @param {Array} treeData - 树形数据
     */
    updateJSONContent(treeData) {
        if (!this.jsonContent) return;

        try {
            // 创建包含完整状态信息的JSON对象
            const jsonData = {
                treeData: treeData,
                exportTime: new Date().toISOString(),
                version: '1.0.0',
                nodeCount: this.countNodes(treeData)
            };

            // 格式化JSON字符串
            const formattedJSON = JSON.stringify(jsonData, null, 2);

            // 创建带有语法高亮的HTML
            const highlightedJSON = this.syntaxHighlight(formattedJSON);

            this.jsonContent.innerHTML = highlightedJSON;

            console.log('📄 [JSONViewer] JSON内容已更新', {
                '总节点数': jsonData.nodeCount,
                '根节点数': treeData.length
            });
        } catch (error) {
            console.error('📄 [JSONViewer] 更新JSON内容时出错:', error);
            this.jsonContent.innerHTML = '<div class="json-error">无法显示JSON内容：数据格式错误</div>';
        }
    }

    /**
     * 统计节点数量
     * @param {Array} nodes - 节点数组
     * @returns {number} 节点总数
     */
    countNodes(nodes) {
        let count = 0;

        const countRecursive = (nodeList) => {
            nodeList.forEach(node => {
                count++;
                if (node.children && node.children.length > 0) {
                    countRecursive(node.children);
                }
            });
        };

        countRecursive(nodes);
        return count;
    }

    /**
     * 语法高亮JSON
     * @param {string} json - JSON字符串
     * @returns {string} 带有高亮的HTML
     */
    syntaxHighlight(json) {
        // 转义HTML特殊字符
        json = json.replace(/&/g, '&').replace(/</g, '<').replace(/>/g, '>');

        // 添加语法高亮
        return json.replace(/("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g, (match) => {
            let cls = 'json-number';

            if (/^"/.test(match)) {
                if (/:$/.test(match)) {
                    cls = 'json-key';
                } else {
                    cls = 'json-string';
                }
            } else if (/true|false/.test(match)) {
                cls = 'json-boolean';
            } else if (/null/.test(match)) {
                cls = 'json-null';
            }

            return `<span class="${cls}">${match}</span>`;
        });
    }

    /**
     * 复制JSON到剪贴板
     */
    async copyToClipboard() {
        try {
            const currentState = stateManager.getState();
            const jsonData = {
                treeData: currentState.treeData,
                exportTime: new Date().toISOString(),
                version: '1.0.0'
            };

            const jsonString = JSON.stringify(jsonData, null, 2);

            await navigator.clipboard.writeText(jsonString);

            this.showNotification('JSON内容已复制到剪贴板');

            console.log('📄 [JSONViewer] JSON内容已复制到剪贴板', {
                '字符数': jsonString.length,
                '节点数': currentState.treeData.length
            });
        } catch (error) {
            console.error('📄 [JSONViewer] 复制到剪贴板失败:', error);
            this.showNotification('复制失败，请重试', 'error');
        }
    }

    /**
     * 显示通知
     * @param {string} message - 通知消息
     * @param {string} type - 通知类型 ('success' | 'error')
     */
    showNotification(message, type = 'success') {
        // 创建通知元素
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${type === 'error' ? '#ff3b30' : '#007AFF'};
            color: white;
            padding: 12px 20px;
            border-radius: 6px;
            z-index: 10000;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
            animation: slideIn 0.3s ease-out;
        `;

        document.body.appendChild(notification);

        // 3秒后自动移除
        setTimeout(() => {
            notification.style.animation = 'slideOut 0.3s ease-in';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, 3000);
    }

    /**
     * 销毁组件
     */
    destroy() {
        this.isVisible = false;
        // 清理事件监听器
        document.removeEventListener('keydown', this.handleKeydown);
    }
}

// 创建全局JSON查看器实例
let jsonViewer = null;

// 初始化JSON查看器
document.addEventListener('DOMContentLoaded', () => {
    jsonViewer = new JSONViewer();
});

// 导出JSON查看器
window.jsonViewer = jsonViewer;
