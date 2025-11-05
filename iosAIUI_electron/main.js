const { app, BrowserWindow, ipcMain, safeStorage, dialog } = require('electron');
const path = require('path');
const fs = require('fs');
const { OpenAI } = require('openai');

// 保持对窗口对象的全局引用，避免被垃圾回收
let mainWindow;

function createWindow() {
    // 创建浏览器窗口
    mainWindow = new BrowserWindow({
        width: 1600,
        height: 1000,
        minWidth: 1200,
        minHeight: 800,
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            enableRemoteModule: false,
            preload: path.join(__dirname, 'preload.js')
        },
        title: 'iOS UI Editor',
        icon: process.platform === 'darwin'
            ? path.join(__dirname, 'assets', 'icon32.png')
            : path.join(__dirname, 'assets', 'icon16.png')
    });

    // 加载应用的 index.html
    mainWindow.loadFile('index.html');

    // 开发模式下打开开发者工具
    if (process.argv.includes('--dev')) {
        mainWindow.webContents.openDevTools();
    }

    // 当窗口被关闭时触发
    mainWindow.on('closed', () => {
        mainWindow = null;
    });
}

// Electron 完成初始化并准备创建浏览器窗口时调用此方法
app.whenReady().then(createWindow);

// 当所有窗口都关闭时退出应用
app.on('window-all-closed', () => {
    // 在 macOS 上，除非用户按 Cmd + Q 显式退出，否则应用和菜单栏会保持活动状态
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('activate', () => {
    // 在 macOS 上，当单击停靠图标且没有其他窗口打开时，通常会在应用中重新创建一个窗口
    if (BrowserWindow.getAllWindows().length === 0) {
        createWindow();
    }
});

// AI 配置管理
let aiConfig = {
    apiKey: '',
    model: 'gpt-4',
    baseURL: 'https://api.openai.com/v1'
};

// IPC 处理器
ipcMain.handle('ai-chat', async (event, message, context) => {
    try {
        if (!aiConfig.apiKey) {
            throw new Error('请先配置 AI API Key');
        }

        const openai = new OpenAI({
            apiKey: aiConfig.apiKey,
            baseURL: aiConfig.baseURL
        });

        const completion = await openai.chat.completions.create({
            model: aiConfig.model,
            messages: [
                {
                    role: 'system',
                    content: `你是一个 iOS UI 编辑器助手。请根据提供的 UI 层级结构 JSON 数据，帮助用户优化和修改 UI 设计。
          
当前选中的节点信息：
${JSON.stringify(context.currentNode, null, 2)}

可用的修改命令格式：
- 添加节点: { "action": "add", "node": {...} }
- 删除节点: { "action": "delete", "nodeId": "..." }
- 修改节点: { "action": "update", "nodeId": "...", "updates": {...} }
- 移动节点: { "action": "move", "nodeId": "...", "newParentId": "..." }

请以 JSON 格式返回修改命令，确保命令格式正确且可执行。`
                },
                {
                    role: 'user',
                    content: message
                }
            ],
            temperature: 0.7,
            max_tokens: 1000
        });

        return {
            success: true,
            response: completion.choices[0].message.content,
            usage: completion.usage
        };
    } catch (error) {
        console.error('AI 聊天错误:', error);
        return {
            success: false,
            error: error.message
        };
    }
});

ipcMain.handle('ai-config', async (event, config) => {
    try {
        if (config.apiKey) {
            // 使用安全存储保存 API Key
            const encrypted = safeStorage.encryptString(config.apiKey);
            aiConfig.apiKey = config.apiKey;
        }
        if (config.model) aiConfig.model = config.model;
        if (config.baseURL) aiConfig.baseURL = config.baseURL;

        return { success: true, config: aiConfig };
    } catch (error) {
        return { success: false, error: error.message };
    }
});

ipcMain.handle('health-check', async () => {
    return { status: 'healthy', timestamp: new Date().toISOString() };
});

const axios = require('axios');

ipcMain.handle('ai-test', async (event) => {
    try {
        if (!aiConfig.apiKey) {
            throw new Error('请先配置 AI API Key');
        }

        const openai = new OpenAI({
            apiKey: aiConfig.apiKey,
            baseURL: aiConfig.baseURL
        });

        // 简单的测试请求
        await openai.models.list();
        return { success: true, message: 'AI 服务连接正常' };
    } catch (error) {
        return { success: false, error: error.message };
    }
});

ipcMain.handle('ai-models', async (event) => {
    try {
        if (!aiConfig.apiKey) {
            throw new Error('请先配置 AI API Key');
        }

        const openai = new OpenAI({
            apiKey: aiConfig.apiKey,
            baseURL: aiConfig.baseURL
        });

        const models = await openai.models.list();
        return {
            success: true,
            models: models.data.map(model => model.id).filter(id => id.includes('gpt'))
        };
    } catch (error) {
        return { success: false, error: error.message };
    }
});

ipcMain.handle('deepseek-chat', async (event, { url, apiKey, model, message, context }) => {
    try {
        const response = await axios.post(
            `${url}/chat/completions`,
            {
                model: model,
                messages: [
                    {
                        role: 'system',
                        content: `你是一个 iOS UI 编辑器助手。请根据提供的 UI 层级结构 JSON 数据，帮助用户优化和修改 UI 设计。
          
当前选中的节点信息：
${JSON.stringify(context.currentNode, null, 2)}

可用的修改命令格式：
- 添加节点: { "action": "add", "node": {...} }
- 删除节点: { "action": "delete", "nodeId": "..." }
- 修改节点: { "action": "update", "nodeId": "...", "updates": {...} }
- 移动节点: { "action": "move", "nodeId": "...", "newParentId": "..." }

请以 JSON 格式返回修改命令，确保命令格式正确且可执行。`
                    },
                    { role: 'user', content: message }
                ],
                temperature: 0.7,
                max_tokens: 1000
            },
            {
                headers: {
                    'Authorization': `Bearer ${apiKey}`,
                    'Content-Type': 'application/json'
                }
            }
        );

        return {
            success: true,
            response: response.data.choices[0].message.content,
            usage: response.data.usage
        };
    } catch (error) {
        console.error('DeepSeek API error:', error.response?.data || error.message);
        return {
            success: false,
            error: error.response?.data?.error?.message || error.message
        };
    }
});

// 文件操作 IPC 处理器
ipcMain.handle('dialog:saveFile', async (event, data) => {
    try {
        const result = await dialog.showSaveDialog(mainWindow, {
            title: '导出 JSON 文件',
            defaultPath: `ios-ui-layout-${new Date().toISOString().split('T')[0]}.json`,
            filters: [
                { name: 'JSON Files', extensions: ['json'] },
                { name: 'All Files', extensions: ['*'] }
            ],
            properties: ['createDirectory', 'showOverwriteConfirmation']
        });

        if (result.canceled) {
            return { success: false, message: '用户取消了保存操作' };
        }

        const filePath = result.filePath;

        // 确保文件以 .json 结尾
        if (!filePath.endsWith('.json')) {
            return { success: false, message: '文件必须以 .json 扩展名结尾' };
        }

        // 写入文件
        fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');

        console.log('✅ 文件保存成功:', filePath);

        return {
            success: true,
            message: '文件导出成功',
            filePath: filePath,
            filename: path.basename(filePath)
        };
    } catch (error) {
        console.error('❌ 文件保存失败:', error);
        return {
            success: false,
            message: error.message,
            error: error
        };
    }
});

ipcMain.handle('dialog:openFile', async (event) => {
    try {
        const result = await dialog.showOpenDialog(mainWindow, {
            title: '导入 JSON 文件',
            filters: [
                { name: 'JSON Files', extensions: ['json'] },
                { name: 'All Files', extensions: ['*'] }
            ],
            properties: ['openFile']
        });

        if (result.canceled) {
            return { success: false, message: '用户取消了打开操作' };
        }

        const filePath = result.filePaths[0];
        const fileContent = fs.readFileSync(filePath, 'utf8');
        const data = JSON.parse(fileContent);

        console.log('✅ 文件读取成功:', filePath);

        return {
            success: true,
            message: '文件读取成功',
            filePath: filePath,
            filename: path.basename(filePath),
            data: data
        };
    } catch (error) {
        console.error('❌ 文件读取失败:', error);
        return {
            success: false,
            message: error.message,
            error: error
        };
    }
});
