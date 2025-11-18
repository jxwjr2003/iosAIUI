# 数据缓存功能UI设计方案

## 需求分析
当前系统需要添加以下UI功能：
1. 配置导入功能
2. 配置导出功能  
3. 指定默认配置文件地址
4. 动态文件加载管理

## UI组件设计

### 1. 存储配置管理面板
在现有配置管理区域添加新的存储配置面板：

```html
<!-- 在配置管理区域添加 -->
<div class="storage-management">
    <h3>存储配置管理</h3>
    
    <!-- 当前存储位置显示 -->
    <div class="current-storage-location">
        <label>当前配置文件位置：</label>
        <span id="currentStoragePath">默认位置</span>
        <button id="changeStorageLocation" class="btn btn-secondary">更改位置</button>
    </div>
    
    <!-- 导入导出操作 -->
    <div class="import-export-actions">
        <button id="importConfig" class="btn btn-primary">导入配置</button>
        <button id="exportConfig" class="btn btn-primary">导出配置</button>
        <button id="exportSelectedConfig" class="btn btn-secondary">导出选中配置</button>
    </div>
    
    <!-- 动态文件加载 -->
    <div class="dynamic-file-loading">
        <h4>动态文件加载</h4>
        <div class="file-loading-controls">
            <input type="file" id="dynamicFileInput" accept=".json" style="display: none;">
            <button id="selectDynamicFile" class="btn btn-secondary">选择JSON文件</button>
            <span id="selectedFileName">未选择文件</span>
            <button id="loadDynamicFile" class="btn btn-primary" disabled>加载文件</button>
            <button id="watchDynamicFile" class="btn btn-warning" disabled>监控文件变化</button>
        </div>
        <div class="file-status" id="dynamicFileStatus"></div>
    </div>
</div>
```

### 2. 导入配置模态框
```html
<!-- 在body底部添加 -->
<div id="importModal" class="modal">
    <div class="modal-content">
        <div class="modal-header">
            <h3>导入配置</h3>
            <span class="close">&times;</span>
        </div>
        <div class="modal-body">
            <div class="import-options">
                <label>
                    <input type="radio" name="importType" value="file" checked> 从文件导入
                </label>
                <label>
                    <input type="radio" name="importType" value="url"> 从URL导入
                </label>
            </div>
            
            <div id="fileImportSection">
                <input type="file" id="importFileInput" accept=".json">
                <div class="file-info" id="importFileInfo"></div>
            </div>
            
            <div id="urlImportSection" style="display: none;">
                <input type="url" id="importUrl" placeholder="输入配置JSON文件的URL">
                <button id="fetchConfig" class="btn btn-primary">获取配置</button>
            </div>
            
            <div class="import-preview" id="importPreview" style="display: none;">
                <h4>导入预览</h4>
                <pre id="previewContent"></pre>
                <div class="import-actions">
                    <button id="confirmImport" class="btn btn-success">确认导入</button>
                    <button id="cancelImport" class="btn btn-secondary">取消</button>
                </div>
            </div>
        </div>
    </div>
</div>
```

### 3. 导出配置模态框
```html
<div id="exportModal" class="modal">
    <div class="modal-content">
        <div class="modal-header">
            <h3>导出配置</h3>
            <span class="close">&times;</span>
        </div>
        <div class="modal-body">
            <div class="export-options">
                <label>
                    <input type="radio" name="exportScope" value="all" checked> 导出所有配置
                </label>
                <label>
                    <input type="radio" name="exportScope" value="selected"> 导出选中配置
                </label>
                <label>
                    <input type="radio" name="exportScope" value="current"> 导出当前配置
                </label>
            </div>
            
            <div class="export-format">
                <label>导出格式：</label>
                <select id="exportFormat">
                    <option value="json">JSON</option>
                    <option value="yaml">YAML</option>
                </select>
            </div>
            
            <div class="export-preview">
                <h4>导出预览</h4>
                <pre id="exportPreviewContent"></pre>
            </div>
            
            <div class="export-actions">
                <button id="copyExport" class="btn btn-secondary">复制到剪贴板</button>
                <button id="downloadExport" class="btn btn-primary">下载文件</button>
                <button id="saveExport" class="btn btn-success">保存到指定位置</button>
            </div>
        </div>
    </div>
</div>
```

### 4. 存储位置选择模态框
```html
<div id="storageLocationModal" class="modal">
    <div class="modal-content">
        <div class="modal-header">
            <h3>选择存储位置</h3>
            <span class="close">&times;</span>
        </div>
        <div class="modal-body">
            <div class="storage-options">
                <label>
                    <input type="radio" name="storageLocation" value="default" checked> 默认位置
                </label>
                <label>
                    <input type="radio" name="storageLocation" value="custom"> 自定义位置
                </label>
            </div>
            
            <div id="customLocationSection" style="display: none;">
                <input type="text" id="customStoragePath" placeholder="输入自定义路径">
                <button id="browseStoragePath" class="btn btn-secondary">浏览...</button>
                <div class="path-info">
                    <small>支持绝对路径或相对于应用目录的路径</small>
                </div>
            </div>
            
            <div class="migration-options">
                <label>
                    <input type="checkbox" id="migrateExistingData"> 迁移现有数据到新位置
                </label>
            </div>
            
            <div class="location-actions">
                <button id="confirmStorageLocation" class="btn btn-primary">确认</button>
                <button id="cancelStorageLocation" class="btn btn-secondary">取消</button>
            </div>
        </div>
    </div>
</div>
```

## JavaScript功能实现

### 1. 存储管理类扩展
在现有的LocalProxyUI类中添加存储管理功能：

```javascript
// 在LocalProxyUI类中添加以下方法

// 初始化存储相关事件监听器
initializeStorageEventListeners() {
    // 导入配置
    document.getElementById('importConfig').addEventListener('click', () => {
        this.showImportModal();
    });
    
    // 导出配置
    document.getElementById('exportConfig').addEventListener('click', () => {
        this.showExportModal();
    });
    
    // 导出选中配置
    document.getElementById('exportSelectedConfig').addEventListener('click', () => {
        this.exportSelectedConfig();
    });
    
    // 更改存储位置
    document.getElementById('changeStorageLocation').addEventListener('click', () => {
        this.showStorageLocationModal();
    });
    
    // 动态文件加载
    document.getElementById('selectDynamicFile').addEventListener('click', () => {
        document.getElementById('dynamicFileInput').click();
    });
    
    document.getElementById('dynamicFileInput').addEventListener('change', (e) => {
        this.handleDynamicFileSelect(e);
    });
    
    document.getElementById('loadDynamicFile').addEventListener('click', () => {
        this.loadDynamicFile();
    });
    
    document.getElementById('watchDynamicFile').addEventListener('click', () => {
        this.toggleFileWatching();
    });
}

// 显示导入模态框
showImportModal() {
    // 实现导入模态框显示逻辑
}

// 显示导出模态框  
showExportModal() {
    // 实现导出模态框显示逻辑
}

// 导出选中配置
exportSelectedConfig() {
    // 实现导出选中配置逻辑
}

// 显示存储位置模态框
showStorageLocationModal() {
    // 实现存储位置选择逻辑
}

// 处理动态文件选择
handleDynamicFileSelect(event) {
    // 实现文件选择处理逻辑
}

// 加载动态文件
loadDynamicFile() {
    // 实现动态文件加载逻辑
}

// 切换文件监控
toggleFileWatching() {
    // 实现文件监控切换逻辑
}
```

### 2. 模态框管理
添加模态框管理功能：

```javascript
// 模态框管理方法
setupModalHandlers() {
    // 导入模态框
    const importModal = document.getElementById('importModal');
    const importClose = importModal.querySelector('.close');
    
    importClose.addEventListener('click', () => {
        importModal.style.display = 'none';
    });
    
    // 导出模态框
    const exportModal = document.getElementById('exportModal');
    const exportClose = exportModal.querySelector('.close');
    
    exportClose.addEventListener('click', () => {
        exportModal.style.display = 'none';
    });
    
    // 存储位置模态框
    const storageModal = document.getElementById('storageLocationModal');
    const storageClose = storageModal.querySelector('.close');
    
    storageClose.addEventListener('click', () => {
        storageModal.style.display = 'none';
    });
    
    // 点击模态框外部关闭
    window.addEventListener('click', (event) => {
        if (event.target === importModal) {
            importModal.style.display = 'none';
        }
        if (event.target === exportModal) {
            exportModal.style.display = 'none';
        }
        if (event.target === storageModal) {
            storageModal.style.display = 'none';
        }
    });
}
```

## CSS样式设计

### 1. 存储管理面板样式
```css
/* 存储管理面板样式 */
.storage-management {
    margin-top: 20px;
    padding: 15px;
    border: 1px solid #ddd;
    border-radius: 4px;
    background-color: #f9f9f9;
}

.current-storage-location {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-bottom: 15px;
    padding: 10px;
    background-color: #fff;
    border-radius: 4px;
}

.import-export-actions {
    display: flex;
    gap: 10px;
    margin-bottom: 15px;
}

.dynamic-file-loading {
    padding: 10px;
    background-color: #fff;
    border-radius: 4px;
}

.file-loading-controls {
    display: flex;
    align-items: center;
    gap: 10px;
    flex-wrap: wrap;
}

.file-status {
    margin-top: 10px;
    padding: 5px;
    font-size: 0.9em;
}

.file-status.success {
    color: #28a745;
}

.file-status.error {
    color: #dc3545;
}

.file-status.warning {
    color: #ffc107;
}
```

### 2. 模态框样式
```css
/* 模态框样式 */
.modal {
    display: none;
    position: fixed;
    z-index: 1000;
    left: 0;
    top: 0;
    width: 100%;
    height: 100%;
    background-color: rgba(0,0,0,0.5);
}

.modal-content {
    background-color: #fefefe;
    margin: 5% auto;
    padding: 0;
    border: 1px solid #888;
    width: 80%;
    max-width: 600px;
    border-radius: 8px;
    box-shadow: 0 4px 8px rgba(0,0,0,0.2);
}

.modal-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 15px 20px;
    border-bottom: 1px solid #ddd;
    background-color: #f8f9fa;
    border-radius: 8px 8px 0 0;
}

.modal-header h3 {
    margin: 0;
    font-size: 1.2em;
}

.close {
    color: #aaa;
    float: right;
    font-size: 28px;
    font-weight: bold;
    cursor: pointer;
}

.close:hover {
    color: #000;
}

.modal-body {
    padding: 20px;
}

.import-options, .export-options, .storage-options {
    margin-bottom: 15px;
}

.import-options label, .export-options label, .storage-options label {
    display: block;
    margin-bottom: 8px;
}

.import-preview, .export-preview {
    margin-top: 15px;
    max-height: 300px;
    overflow-y: auto;
    border: 1px solid #ddd;
    padding: 10px;
    background-color: #f8f9fa;
}

.import-actions, .export-actions, .location-actions {
    display: flex;
    gap: 10px;
    margin-top: 15px;
    justify-content: flex-end;
}
```

## 实现计划

### 阶段1：基础UI组件
1. 在HTML中添加存储管理面板
2. 添加导入/导出模态框
3. 添加存储位置选择模态框
4. 添加基础CSS样式

### 阶段2：JavaScript功能
1. 实现模态框显示/隐藏逻辑
2. 实现文件选择和处理功能
3. 实现配置导入功能
4. 实现配置导出功能

### 阶段3：存储位置管理
1. 实现存储位置切换
2. 实现数据迁移功能
3. 实现动态文件加载

### 阶段4：集成测试
1. 测试所有存储功能
2. 修复发现的问题
3. 优化用户体验

## 后端API集成
需要在前端JavaScript中调用以下后端API：

```javascript
// 存储位置管理
window.electronAPI.storage.getCurrentLocation()
window.electronAPI.storage.setLocation(path)
window.electronAPI.storage.migrateData(newPath)

// 配置导入导出
window.electronAPI.storage.importConfig(filePath)
window.electronAPI.storage.exportConfig(options)
window.electronAPI.storage.exportSelected(configIds)

// 动态文件加载
window.electronAPI.storage.loadDynamicFile(filePath)
window.electronAPI.storage.watchFile(filePath)
window.electronAPI.storage.unwatchFile(filePath)
```

这个设计方案提供了完整的UI实现计划，可以在Code模式下逐步实现。