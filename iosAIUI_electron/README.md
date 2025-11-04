# iOS UI Editor

![iOS UI Editor Screenshot](screenshot.png)

一个基于Electron的iOS UI层级可视化编辑器，帮助开发者通过直观的界面构建和管理UI组件层级关系。

## 核心功能

- **可视化树形编辑器**：直观地创建和管理UI组件层级结构
- **实时iOS模拟器**：支持多种设备预设，实时预览UI效果
- **属性编辑系统**：全面编辑组件属性、约束、成员变量等
- **AI智能助手**：集成OpenAI API，提供设计建议和自动优化
- **JSON导入/导出**：支持UI结构的导入导出，便于分享和版本控制

## 技术架构

- **框架**：Electron
- **前端**：原生JavaScript/HTML/CSS
- **AI集成**：OpenAI API
- **布局引擎**：自定义约束布局引擎

## 安装与使用

### 安装依赖

```bash
cd iosAIUI_electron
npm install
```

### 启动应用

```bash
npm start
```

### 开发模式

```bash
npm run dev
```

### 构建应用

```bash
npm run build
# 或针对特定平台
npm run build:mac
npm run build:win
npm run build:linux
```

## 目录结构

```
iosAIUI_electron/
├── AGENTS.md                 # 项目代理说明
├── CLINE.md                  # Cline工具配置
├── index.html                # 主HTML文件
├── main.js                   # Electron主进程
├── package.json              # 项目配置
├── preload.js                # 预加载脚本
├── openspec/                 # 项目规范文档
│   ├── project.md            # 项目概述
│   └── changes/              # 变更记录
│       └── implement-ios-ui-editor/
│           ├── design.md     # 设计文档
│           ├── proposal.md   # 提案文档
│           ├── tasks.md      # 任务列表
│           └── specs/        # 详细规范
├── src/
│   ├── app.js                # 应用主逻辑
│   ├── components/           # UI组件
│   │   ├── aiChatAssistant.js # AI聊天助手
│   │   ├── jsonViewer.js     # JSON查看器
│   │   ├── propertyEditor.js # 属性编辑器
│   │   ├── simulator.js      # 模拟器
│   │   └── treeEditor.js     # 树形编辑器
│   ├── config/
│   │   └── componentAttributes.js # 组件属性配置
│   ├── managers/             # 管理器
│   │   ├── AttributeManager.js
│   │   ├── ConstraintManager.js
│   │   ├── FunctionManager.js
│   │   ├── MemberVariableManager.js
│   │   └── ProtocolManager.js
│   ├── services/
│   │   └── dataService.js    # 数据服务
│   ├── styles/               # 样式文件
│   └── utils/                # 工具函数
│       ├── constraintLayoutEngine.js # 约束布局引擎
│       ├── dataValidator.js  # 数据验证
│       ├── nodeIdGenerator.js # 节点ID生成器
│       └── stateManager.js   # 状态管理
```

## 使用指南

### 基本操作

1. **创建UI结构**：
   - 点击"新建根节点"按钮开始
   - 选择组件类型（如UIView、UILabel等）
   - 通过树形编辑器添加子节点

2. **编辑属性**：
   - 选择节点后，在右侧属性面板编辑属性
   - 支持基础属性、约束、成员变量等配置

3. **预览效果**：
   - 在中间的iOS模拟器区域实时查看UI效果
   - 可调整设备类型和缩放级别

4. **使用AI助手**：
   - 在底部AI聊天区域与助手交互
   - 可获取设计建议、优化布局等

### AI助手功能

- **布局优化**：分析当前UI结构并提供优化建议
- **组件推荐**：根据设计需求推荐合适的UI组件
- **约束检查**：检查约束配置的合理性
- **模板生成**：为常见UI场景生成布局模板

## 配置AI服务

1. 点击右上角"设置"按钮
2. 输入OpenAI API Key
3. 选择模型（默认GPT-4）
4. 点击"保存"应用配置

## 数据格式

项目使用JSON格式存储UI结构，示例：

```json
{
  "id": "root_1",
  "name": "RootView",
  "type": "UIView",
  "attributes": {
    "backgroundColor": "#FFFFFF",
    "width": 393,
    "height": 852
  },
  "constraintPackages": [
    {
      "id": "pkg_1",
      "name": "默认约束包",
      "isDefault": true,
      "constraints": [
        {
          "id": "constraint_1",
          "type": "size",
          "attribute": "width",
          "relation": "equalTo",
          "value": 393
        }
      ]
    }
  ],
  "children": [
    {
      "id": "child_1",
      "name": "Label",
      "type": "UILabel",
      "attributes": {
        "text": "Hello World",
        "textColor": "#000000",
        "fontSize": 17
      },
      "children": []
    }
  ]
}
```

## 贡献指南

欢迎贡献！请遵循以下步骤：

1. Fork本仓库
2. 创建新分支 (`git checkout -b feature/your-feature`)
3. 提交更改 (`git commit -am 'Add some feature'`)
4. 推送到分支 (`git push origin feature/your-feature`)
5. 创建Pull Request

## 许可证

本项目采用MIT许可证 - 详见[license](LICENSE)文件。
