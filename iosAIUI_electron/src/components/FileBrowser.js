/**
 * 文件浏览器组件
 * 负责文件夹导航、文件选择和状态管理
 */
class FileBrowser {
    constructor() {
        this.currentFolderPath = null;
        this.currentFilePath = null;
        this.fileTree = null;
        this.pathBreadcrumb = null;
        this.fileStatus = null;
        this.isInitialized = false;

        // 初始化文件浏览器
        this.init();
    }

    /**
     * 初始化文件浏览器
     */
    async init() {
        try {
            console.log('📁 初始化文件浏览器...');

            // 等待DOM加载完成
            if (document.readyState === 'loading') {
                await new Promise(resolve => document.addEventListener('DOMContentLoaded', resolve));
            }

            // 获取DOM元素
            this.fileTree = document.getElementById('file-tree');
            this.pathBreadcrumb = document.getElementById('path-breadcrumb');
            this.fileStatus = document.getElementById('file-status');

            if (!this.fileTree || !this.pathBreadcrumb || !this.fileStatus) {
                throw new Error('文件浏览器DOM元素未找到');
            }

            // 绑定事件
            this.bindEvents();

            // 尝试加载保存的路径
            await this.loadSavedPaths();

            this.isInitialized = true;
            console.log('✅ 文件浏览器初始化完成');
        } catch (error) {
            console.error('❌ 文件浏览器初始化失败:', error);
        }
    }

    /**
     * 绑定事件处理
     */
    bindEvents() {
        // 选择文件夹按钮
        const selectFolderBtn = document.getElementById('select-folder-btn');
        if (selectFolderBtn) {
            selectFolderBtn.addEventListener('click', () => {
                this.selectFolder();
            });
        }

        // 刷新文件列表按钮
        const refreshFilesBtn = document.getElementById('refresh-files-btn');
        if (refreshFilesBtn) {
            refreshFilesBtn.addEventListener('click', () => {
                this.refreshFileList();
            });
        }
    }

    /**
     * 选择文件夹
     */
    async selectFolder() {
        try {
            // 检查是否在 Electron 环境中
            if (window.electronAPI && window.electronAPI.selectFolder) {
                const result = await window.electronAPI.selectFolder();

                if (result.success && result.folderPath) {
                    this.currentFolderPath = result.folderPath;
                    await this.saveFolderPath(this.currentFolderPath);
                    await this.loadFolderContents();
                    this.updateFileStatus('saved', '文件夹已选择');
                } else {
                    console.warn('文件夹选择取消或失败:', result.message);
                }
            } else {
                // 回退到浏览器方式（使用文件输入）
                const folderContents = await this.loadBrowserFolderContents();
                if (folderContents && folderContents.length > 0) {
                    this.currentFolderPath = 'browser-selected-folder';
                    await this.saveFolderPath(this.currentFolderPath);
                    this.renderFileTree(folderContents);
                    this.updateFileStatus('saved', '文件夹已选择');
                }
            }
        } catch (error) {
            console.error('❌ 选择文件夹失败:', error);
            this.updateFileStatus('error', '选择文件夹失败');
        }
    }

    /**
     * 加载文件夹内容
     */
    async loadFolderContents() {
        if (!this.currentFolderPath) {
            this.showEmptyState();
            return;
        }

        try {
            // 更新面包屑导航
            this.updateBreadcrumb();

            // 清空文件树
            this.fileTree.innerHTML = '';

            // 检查是否在 Electron 环境中
            if (window.electronAPI && window.electronAPI.readFolder) {
                const result = await window.electronAPI.readFolder(this.currentFolderPath);

                if (result.success && result.contents) {
                    this.renderFileTree(result.contents);
                } else {
                    throw new Error(result.message || '读取文件夹失败');
                }
            } else {
                // 浏览器环境中，检查是否有保存的文件夹内容
                const savedPaths = this.getSavedPaths();
                if (savedPaths.folderPath && savedPaths.folderPath === this.currentFolderPath) {
                    // 在浏览器环境中，我们无法重新读取文件夹内容，所以显示加载状态而不是空状态
                    this.showLoadingState();
                } else {
                    // 显示模拟数据提示
                    this.renderMockFileTree();
                }
            }

            // 高亮当前选中的文件
            this.highlightCurrentFile();
        } catch (error) {
            console.error('❌ 加载文件夹内容失败:', error);
            this.showErrorState('加载文件夹失败: ' + error.message);
        }
    }

    /**
     * 渲染文件树
     * @param {Array} contents - 文件夹内容
     */
    renderFileTree(contents) {
        if (!contents || contents.length === 0) {
            this.showEmptyState();
            return;
        }

        // 分离文件夹和文件
        const folders = contents.filter(item => item.isDirectory);
        const files = contents.filter(item => !item.isDirectory && item.name.endsWith('.json'));

        // 渲染文件夹
        folders.forEach(folder => {
            const folderElement = this.createFolderElement(folder);
            this.fileTree.appendChild(folderElement);
        });

        // 渲染JSON文件
        if (files.length > 0) {
            files.forEach(file => {
                const fileElement = this.createFileElement(file);
                this.fileTree.appendChild(fileElement);
            });
        } else {
            this.showNoJSONFilesState();
        }
    }

    /**
     * 创建文件夹元素
     * @param {Object} folder - 文件夹信息
     * @returns {HTMLElement} 文件夹元素
     */
    createFolderElement(folder) {
        const folderElement = document.createElement('div');
        folderElement.className = 'folder-node';
        folderElement.innerHTML = `
            <button class="folder-toggle collapsed"></button>
            <div class="folder-icon">📁</div>
            <span class="folder-name">${folder.name}</span>
        `;

        // 绑定文件夹点击事件
        folderElement.addEventListener('click', (e) => {
            if (e.target.classList.contains('folder-toggle')) {
                this.toggleFolder(folderElement, folder);
            } else {
                this.navigateToFolder(folder);
            }
        });

        return folderElement;
    }

    /**
     * 创建文件元素
     * @param {Object} file - 文件信息
     * @returns {HTMLElement} 文件元素
     */
    createFileElement(file) {
        const fileElement = document.createElement('div');
        fileElement.className = 'file-node';
        fileElement.setAttribute('data-file-path', file.path);

        const fileSize = this.formatFileSize(file.size);

        fileElement.innerHTML = `
            <div class="file-icon">📄</div>
            <span class="file-name">${file.name}</span>
            <span class="file-size">${fileSize}</span>
            <div class="file-actions">
                <button class="file-action-btn use-file-btn" title="使用该文件">使用该文件</button>
            </div>
        `;

        // 绑定文件点击事件 - 只负责高亮选择
        fileElement.addEventListener('click', (e) => {
            if (!e.target.classList.contains('file-action-btn')) {
                this.highlightFile(file);
            }
        });

        // 绑定文件操作按钮事件 - 负责加载文件
        const actionBtn = fileElement.querySelector('.use-file-btn');
        if (actionBtn) {
            actionBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.useFile(file);
            });
        }

        return fileElement;
    }

    /**
     * 切换文件夹展开/收缩
     * @param {HTMLElement} folderElement - 文件夹元素
     * @param {Object} folder - 文件夹信息
     */
    async toggleFolder(folderElement, folder) {
        const toggle = folderElement.querySelector('.folder-toggle');
        const isExpanded = toggle.classList.contains('expanded');

        if (isExpanded) {
            // 收缩文件夹
            toggle.classList.remove('expanded');
            toggle.classList.add('collapsed');
            folderElement.classList.remove('expanded');

            // 移除子元素
            const children = folderElement.nextElementSibling;
            if (children && children.classList.contains('folder-children')) {
                children.remove();
            }
        } else {
            // 展开文件夹
            toggle.classList.remove('collapsed');
            toggle.classList.add('expanded');
            folderElement.classList.add('expanded');

            // 加载子文件夹内容
            await this.loadFolderChildren(folderElement, folder);
        }
    }

    /**
     * 加载子文件夹内容
     * @param {HTMLElement} parentElement - 父文件夹元素
     * @param {Object} folder - 文件夹信息
     */
    async loadFolderChildren(parentElement, folder) {
        try {
            // 检查是否在 Electron 环境中
            if (window.electronAPI && window.electronAPI.readFolder) {
                const result = await window.electronAPI.readFolder(folder.path);

                if (result.success && result.contents) {
                    this.renderFolderChildren(parentElement, result.contents);
                }
            }
        } catch (error) {
            console.error('❌ 加载子文件夹失败:', error);
        }
    }

    /**
     * 渲染文件夹子内容
     * @param {HTMLElement} parentElement - 父文件夹元素
     * @param {Array} contents - 子文件夹内容
     */
    renderFolderChildren(parentElement, contents) {
        // 创建子容器
        const childrenContainer = document.createElement('div');
        childrenContainer.className = 'folder-children visible';

        // 分离文件夹和文件
        const folders = contents.filter(item => item.isDirectory);
        const files = contents.filter(item => !item.isDirectory && item.name.endsWith('.json'));

        // 渲染子文件夹
        folders.forEach(folder => {
            const folderElement = this.createFolderElement(folder);
            childrenContainer.appendChild(folderElement);
        });

        // 渲染子文件
        files.forEach(file => {
            const fileElement = this.createFileElement(file);
            childrenContainer.appendChild(fileElement);
        });

        // 插入到父元素后面
        parentElement.after(childrenContainer);
    }

    /**
     * 导航到文件夹
     * @param {Object} folder - 文件夹信息
     */
    async navigateToFolder(folder) {
        this.currentFolderPath = folder.path;
        await this.saveFolderPath(this.currentFolderPath);
        await this.loadFolderContents();
    }

    /**
     * 高亮文件（不加载内容）
     * @param {Object} file - 文件信息
     */
    highlightFile(file) {
        try {
            // 移除之前选中的文件高亮
            const previouslySelected = this.fileTree.querySelector('.file-node.selected');
            if (previouslySelected) {
                previouslySelected.classList.remove('selected');
            }

            // 高亮当前选中的文件
            const fileElement = this.fileTree.querySelector(`[data-file-path="${file.path}"]`);
            if (fileElement) {
                fileElement.classList.add('selected');
            }

            // 保存当前文件路径（仅用于高亮）
            this.currentFilePath = file.path;
            this.saveCurrentFilePath(this.currentFilePath);

            console.log('✅ 文件高亮成功:', file.name);
        } catch (error) {
            console.error('❌ 文件高亮失败:', error);
        }
    }

    /**
     * 使用文件（加载文件内容）
     * @param {Object} file - 文件信息
     */
    async useFile(file) {
        try {
            // 高亮文件
            this.highlightFile(file);

            // 保存当前文件路径
            this.currentFilePath = file.path;
            await this.saveCurrentFilePath(this.currentFilePath);

            // 更新文件状态
            this.updateFileStatus('saving', '正在加载文件...');

            // 加载文件内容到编辑器
            await this.loadFileContent(file);

            this.updateFileStatus('saved', '文件已加载');
            console.log('✅ 文件使用成功:', file.name);
        } catch (error) {
            console.error('❌ 使用文件失败:', error);
            this.updateFileStatus('error', '加载文件失败');
        }
    }

    /**
     * 选择文件（兼容旧代码，现在只高亮不加载）
     * @param {Object} file - 文件信息
     */
    async selectFile(file) {
        // 现在只高亮文件，不加载内容
        this.highlightFile(file);
    }

    /**
     * 加载文件内容
     * @param {Object} file - 文件信息
     */
    async loadFileContent(file) {
        try {
            // 检查是否在 Electron 环境中
            if (window.electronAPI && window.electronAPI.readFile) {
                const result = await window.electronAPI.readFile(file.path);

                if (result.success && result.content) {
                    const data = JSON.parse(result.content);

                    // 导入数据到状态管理器
                    if (window.stateManager) {
                        window.stateManager.importState(data);
                        this.updateFileStatus('saved', '文件已加载');
                    }
                } else {
                    throw new Error(result.message || '读取文件失败');
                }
            } else {
                // 浏览器回退方式 - 使用 FileReader 读取文件
                await this.loadFileContentInBrowser(file);
            }
        } catch (error) {
            console.error('❌ 加载文件内容失败:', error);
            this.updateFileStatus('error', '加载文件失败');
            // 重新抛出错误，让外层方法能够感知到加载失败
            throw error;
        }
    }

    /**
     * 浏览器环境下的文件读取
     * @param {Object} file - 文件信息
     */
    async loadFileContentInBrowser(file) {
        return new Promise((resolve, reject) => {
            // 创建一个文件输入元素来获取文件
            const input = document.createElement('input');
            input.type = 'file';
            input.accept = '.json';
            input.style.display = 'none';

            let fileSelected = false;
            let cleanupDone = false;

            const cleanup = () => {
                if (!cleanupDone) {
                    cleanupDone = true;
                    if (document.body.contains(input)) {
                        document.body.removeChild(input);
                    }
                }
            };

            input.addEventListener('change', (e) => {
                fileSelected = true;
                const selectedFile = e.target.files[0];
                if (!selectedFile) {
                    cleanup();
                    reject(new Error('未选择文件'));
                    return;
                }

                const reader = new FileReader();
                reader.onload = (event) => {
                    try {
                        const content = event.target.result;
                        const data = JSON.parse(content);

                        // 导入数据到状态管理器
                        if (window.stateManager) {
                            window.stateManager.importState(data);
                            this.updateFileStatus('saved', '文件已加载');
                        }

                        cleanup();
                        resolve();
                    } catch (error) {
                        cleanup();
                        reject(new Error('解析JSON失败: ' + error.message));
                    }
                };

                reader.onerror = () => {
                    cleanup();
                    reject(new Error('读取文件失败'));
                };

                reader.readAsText(selectedFile);
            });

            // 添加取消检测的焦点事件
            window.addEventListener('focus', function checkCancel() {
                setTimeout(() => {
                    if (!fileSelected && !cleanupDone) {
                        cleanup();
                        window.removeEventListener('focus', checkCancel);
                        reject(new Error('文件选择取消'));
                    }
                }, 300);
            });

            // 触发文件选择
            document.body.appendChild(input);
            input.click();

            // 备用取消检测（如果焦点事件未触发）
            setTimeout(() => {
                if (!fileSelected && !cleanupDone) {
                    cleanup();
                    reject(new Error('文件选择超时取消'));
                }
            }, 5000);
        });
    }

    /**
     * 保存当前编辑的文件
     */
    async saveCurrentFile() {
        if (!this.currentFilePath) {
            console.warn('没有选中的文件可保存');
            return false;
        }

        try {
            this.updateFileStatus('saving', '正在保存...');

            // 获取当前状态数据
            if (!window.stateManager) {
                throw new Error('状态管理器未初始化');
            }

            const data = window.stateManager.exportState();
            const jsonString = JSON.stringify(data, null, 2);

            // 检查是否在 Electron 环境中
            if (window.electronAPI && window.electronAPI.writeFile) {
                const result = await window.electronAPI.writeFile(this.currentFilePath, jsonString);

                if (result.success) {
                    this.updateFileStatus('saved', '文件已保存');
                    console.log('✅ 文件保存成功:', this.currentFilePath);
                    return true;
                } else {
                    throw new Error(result.message || '保存文件失败');
                }
            } else {
                // 浏览器回退方式
                console.warn('Electron API 不可用，无法保存文件');
                this.updateFileStatus('saved', '文件已保存（模拟）');
                return true;
            }
        } catch (error) {
            console.error('❌ 保存文件失败:', error);
            this.updateFileStatus('error', '保存文件失败');
            return false;
        }
    }

    /**
     * 另存为文件
     */
    async saveAsFile() {
        try {
            // 获取当前状态数据
            if (!window.stateManager) {
                throw new Error('状态管理器未初始化');
            }

            const data = window.stateManager.exportState();
            const jsonString = JSON.stringify(data, null, 2);

            // 检查是否在 Electron 环境中
            if (window.electronAPI && window.electronAPI.saveFile) {
                const result = await window.electronAPI.saveFile(data);

                if (result.success && result.filePath) {
                    this.currentFilePath = result.filePath;
                    await this.saveCurrentFilePath(this.currentFilePath);
                    this.updateFileStatus('saved', '文件已另存为');

                    // 刷新文件列表以显示新文件
                    await this.refreshFileList();

                    console.log('✅ 文件另存为成功:', result.filePath);
                    return true;
                } else {
                    throw new Error(result.message || '另存为失败');
                }
            } else {
                // 浏览器回退方式
                this.saveAsFileFallback(jsonString);
                return true;
            }
        } catch (error) {
            console.error('❌ 另存为失败:', error);
            this.updateFileStatus('error', '另存为失败');
            return false;
        }
    }

    /**
     * 浏览器回退方式另存为
     * @param {string} jsonString - JSON字符串
     */
    saveAsFileFallback(jsonString) {
        const blob = new Blob([jsonString], { type: 'application/json' });
        const url = URL.createObjectURL(blob);

        const timestamp = new Date().toISOString().split('T')[0];
        const filename = `ios-ui-layout-${timestamp}.json`;

        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.click();

        URL.revokeObjectURL(url);
        this.updateFileStatus('saved', '文件已下载');
    }

    /**
     * 刷新文件列表
     */
    async refreshFileList() {
        if (this.currentFolderPath) {
            await this.loadFolderContents();
        }
    }

    /**
     * 更新面包屑导航
     */
    updateBreadcrumb() {
        if (!this.currentFolderPath) {
            this.pathBreadcrumb.innerHTML = '<span class="breadcrumb-item">请选择文件夹</span>';
            return;
        }

        // 简化处理：只显示文件夹名称
        const folderName = this.currentFolderPath.split(/[\\/]/).pop() || this.currentFolderPath;

        this.pathBreadcrumb.innerHTML = `
            <span class="breadcrumb-item">${folderName}</span>
        `;
    }

    /**
     * 更新文件状态
     * @param {string} status - 状态类型 (saved|unsaved|saving|error)
     * @param {string} message - 状态消息
     */
    updateFileStatus(status, message) {
        if (!this.fileStatus) return;

        // 移除所有状态类
        this.fileStatus.classList.remove(
            'file-status-saved',
            'file-status-unsaved',
            'file-status-saving'
        );

        // 添加当前状态类
        this.fileStatus.classList.add(`file-status-${status}`);

        // 更新状态文本
        const statusText = this.fileStatus.querySelector('.status-text');
        if (statusText) {
            statusText.textContent = message;
        }

        // 显示状态
        this.fileStatus.style.display = 'flex';

        // 如果是保存成功状态，2秒后隐藏
        if (status === 'saved') {
            setTimeout(() => {
                if (this.fileStatus.classList.contains('file-status-saved')) {
                    this.fileStatus.style.display = 'none';
                }
            }, 2000);
        }
    }

    /**
     * 高亮当前选中的文件
     */
    highlightCurrentFile() {
        if (!this.currentFilePath) return;

        const fileElement = this.fileTree.querySelector(`[data-file-path="${this.currentFilePath}"]`);
        if (fileElement) {
            // 移除之前的高亮
            const previouslySelected = this.fileTree.querySelector('.file-node.selected');
            if (previouslySelected) {
                previouslySelected.classList.remove('selected');
            }

            // 添加当前高亮
            fileElement.classList.add('selected');

            // 滚动到可见区域
            fileElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    }

    /**
     * 显示空状态
     */
    showEmptyState() {
        this.fileTree.innerHTML = `
            <div class="file-tree-empty">
                <p>请选择文档文件夹开始浏览</p>
            </div>
        `;
    }

    /**
     * 显示无JSON文件状态
     */
    showNoJSONFilesState() {
        this.fileTree.innerHTML = `
            <div class="file-tree-empty">
                <p>当前文件夹中没有JSON文件</p>
                <p class="sub-text">请确保文件夹包含有效的JSON文件</p>
            </div>
        `;
    }

    /**
     * 显示加载状态
     */
    showLoadingState() {
        this.fileTree.innerHTML = `
            <div class="file-tree-empty">
                <p>正在加载文件夹内容...</p>
                <p class="sub-text">请稍候</p>
            </div>
        `;
    }

    /**
     * 显示错误状态
     * @param {string} message - 错误消息
     */
    showErrorState(message) {
        this.fileTree.innerHTML = `
            <div class="file-tree-empty error-state">
                <p>${message}</p>
            </div>
        `;
    }

    /**
     * 格式化文件大小
     * @param {number} bytes - 字节数
     * @returns {string} 格式化后的文件大小
     */
    formatFileSize(bytes) {
        if (bytes === 0) return '0 B';

        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));

        return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
    }

    /**
     * 加载保存的路径
     */
    async loadSavedPaths() {
        try {
            const savedPaths = this.getSavedPaths();

            if (savedPaths.folderPath) {
                this.currentFolderPath = savedPaths.folderPath;
                await this.loadFolderContents();
            }

            if (savedPaths.currentFilePath) {
                this.currentFilePath = savedPaths.currentFilePath;
                this.highlightCurrentFile();

                // 如果存在保存的文件路径，自动加载文件内容
                await this.loadFileFromPath(this.currentFilePath);
            }
        } catch (error) {
            console.warn('加载保存的路径失败:', error);
        }
    }

    /**
     * 从路径加载文件内容
     * @param {string} filePath - 文件路径
     */
    async loadFileFromPath(filePath) {
        try {
            if (!filePath) return;

            // 检查是否在 Electron 环境中
            if (window.electronAPI && window.electronAPI.readFile) {
                const result = await window.electronAPI.readFile(filePath);

                if (result.success && result.content) {
                    const data = JSON.parse(result.content);

                    // 导入数据到状态管理器
                    if (window.stateManager) {
                        window.stateManager.importState(data);
                        this.updateFileStatus('saved', '文件已自动加载');
                        console.log('✅ 文件自动加载成功:', filePath);
                    }
                }
            }
        } catch (error) {
            console.warn('自动加载文件失败:', error);
        }
    }

    /**
     * 保存文件夹路径
     * @param {string} folderPath - 文件夹路径
     */
    async saveFolderPath(folderPath) {
        const savedPaths = this.getSavedPaths();
        savedPaths.folderPath = folderPath;
        savedPaths.lastAccessTime = new Date().toISOString();

        localStorage.setItem('file-browser-paths', JSON.stringify(savedPaths));
    }

    /**
     * 保存当前文件路径
     * @param {string} filePath - 文件路径
     */
    async saveCurrentFilePath(filePath) {
        const savedPaths = this.getSavedPaths();
        savedPaths.currentFilePath = filePath;
        savedPaths.lastAccessTime = new Date().toISOString();

        localStorage.setItem('file-browser-paths', JSON.stringify(savedPaths));
    }

    /**
     * 获取保存的路径
     * @returns {Object} 路径对象
     */
    getSavedPaths() {
        try {
            const saved = localStorage.getItem('file-browser-paths');
            return saved ? JSON.parse(saved) : {
                folderPath: null,
                currentFilePath: null,
                lastAccessTime: null
            };
        } catch (error) {
            console.warn('读取保存的路径失败:', error);
            return {
                folderPath: null,
                currentFilePath: null,
                lastAccessTime: null
            };
        }
    }

    /**
     * 浏览器环境下的文件系统访问（使用webkitdirectory）
     */
    async loadBrowserFolderContents() {
        try {
            // 使用webkitdirectory读取文件夹内容
            return new Promise((resolve) => {
                const input = document.createElement('input');
                input.type = 'file';
                input.webkitdirectory = true;
                input.style.display = 'none';

                input.addEventListener('change', (e) => {
                    const files = Array.from(e.target.files);
                    const folderContents = [];

                    // 处理文件列表，分离文件夹和文件
                    files.forEach(file => {
                        const relativePath = file.webkitRelativePath;
                        const pathParts = relativePath.split('/');

                        if (pathParts.length > 1) {
                            // 这是一个在子文件夹中的文件
                            const folderName = pathParts[0];
                            const fileName = pathParts[pathParts.length - 1];

                            // 检查是否已经添加了这个文件夹
                            let folder = folderContents.find(item =>
                                item.isDirectory && item.name === folderName
                            );

                            if (!folder) {
                                folder = {
                                    name: folderName,
                                    isDirectory: true,
                                    path: folderName,
                                    size: 0
                                };
                                folderContents.push(folder);
                            }

                            // 添加文件
                            if (fileName.endsWith('.json')) {
                                folderContents.push({
                                    name: fileName,
                                    isDirectory: false,
                                    path: relativePath,
                                    size: file.size
                                });
                            }
                        } else {
                            // 这是根目录下的文件
                            if (file.name.endsWith('.json')) {
                                folderContents.push({
                                    name: file.name,
                                    isDirectory: false,
                                    path: file.name,
                                    size: file.size
                                });
                            }
                        }
                    });

                    // 清理临时元素
                    document.body.removeChild(input);
                    resolve(folderContents);
                });

                // 触发文件选择
                document.body.appendChild(input);
                input.click();
            });
        } catch (error) {
            console.error('❌ 浏览器文件夹内容加载失败:', error);
            return [];
        }
    }

    /**
     * 渲染模拟文件树（用于浏览器环境回退）
     */
    renderMockFileTree() {
        // 显示说明信息，而不是硬编码的文件
        this.fileTree.innerHTML = `
            <div class="file-tree-empty">
                <p>当前环境无法直接访问文件系统</p>
                <p class="sub-text">
                    请在 Electron 环境中使用完整功能，<br>
                    或使用"选择文件夹"按钮重新选择文件夹
                </p>
            </div>
        `;

        // 不再显示硬编码的测试文件
        console.warn('⚠️ 文件浏览器运行在受限环境中，无法访问实际文件系统');
    }

    /**
     * 销毁文件浏览器
     */
    destroy() {
        console.log('🧹 清理文件浏览器资源...');

        // 清理事件监听器
        const selectFolderBtn = document.getElementById('select-folder-btn');
        const refreshFilesBtn = document.getElementById('refresh-files-btn');

        if (selectFolderBtn) {
            selectFolderBtn.replaceWith(selectFolderBtn.cloneNode(true));
        }

        if (refreshFilesBtn) {
            refreshFilesBtn.replaceWith(refreshFilesBtn.cloneNode(true));
        }

        this.isInitialized = false;
        console.log('✅ 文件浏览器已清理');
    }
}

// 创建全局文件浏览器实例
const fileBrowser = new FileBrowser();

// 导出文件浏览器
window.fileBrowser = fileBrowser;

console.log('📁 文件浏览器组件已加载');
