# LocalProxy

![LocalProxy Screenshot](screenshot.png)

一个基于Electron的本地代理服务器和模拟服务器管理工具，帮助开发者在开发过程中拦截、修改和模拟网络请求。

## 核心功能

- **HTTP/HTTPS代理服务器**：拦截并转发本地请求到目标服务器
- **模拟服务器**：创建自定义API响应，无需后端支持
- **请求/响应日志**：详细记录所有经过的请求和响应
- **配置管理**：保存和加载代理/模拟配置
- **实时监控**：查看请求流量和响应状态

## 技术架构

- **框架**：Electron + TypeScript
- **代理引擎**：Node.js HTTP/HTTPS模块
- **进程通信**：Electron IPC
- **日志系统**：自定义日志管理

## 安装与使用

### 安装依赖

```bash
cd localproxy
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
npm run dist
```

## 目录结构

```
localproxy/
├── AGENTS.md                 # 项目代理说明
├── CLINE.md                  # Cline工具配置
├── package.json              # 项目配置
├── tsconfig.json             # TypeScript配置
├── changes/                  # 变更记录
│   └── enhance-mock-server-proxy/
│       ├── design.md         # 设计文档
│       ├── proposal.md       # 提案文档
│       ├── tasks.md          # 任务列表
│       └── specs/            # 详细规范
│           ├── config-management/
│           ├── logging-monitoring/
│           ├── mock-server-capability/
│           └── proxy-enhancement/
├── openspec/                 # 项目规范文档
│   ├── project.md            # 项目概述
│   └── changes/              # 变更记录
├── release/                  # 构建输出目录
├── renderer/                 # 渲染进程
│   ├── index.html            # 主HTML文件
│   ├── renderer.js           # 渲染进程主逻辑
│   └── styles.css            # 样式文件
└── src/                      # 源代码
    ├── main.ts               # Electron主进程
    ├── preload.ts            # 预加载脚本
    ├── config/               # 配置管理
    │   └── config-manager.ts # 配置管理器
    ├── logging/              # 日志系统
    │   └── log-manager.ts    # 日志管理器
    ├── mock-server/          # 模拟服务器
    │   └── mock-server-engine.ts # 模拟服务器引擎
    └── proxy-server/         # 代理服务器
        └── proxy-server-engine.ts # 代理服务器引擎
```

## 使用指南

### 代理服务器配置

1. **启动代理服务器**：
   - 在"代理服务器"标签页中配置
   - 设置监听端口（如8080）
   - 设置目标服务器地址（如http://api.example.com）
   - 点击"启动"按钮

2. **配置浏览器代理**：
   - 将浏览器或系统代理设置为http://localhost:8080
   - 所有请求将通过LocalProxy转发

3. **查看请求日志**：
   - 在"日志"标签页中查看所有经过的请求
   - 可筛选特定方法、URL或状态码

### 模拟服务器配置

1. **创建模拟配置**：
   - 在"模拟服务器"标签页中点击"新建配置"
   - 设置监听端口（如3000）
   - 添加路由规则（如/api/users）

2. **配置响应**：
   - 为每个路由设置HTTP方法（GET/POST等）
   - 配置响应状态码、头信息和JSON体
   - 支持动态响应（使用JavaScript函数）

3. **启动模拟服务器**：
   - 点击"启动"按钮
   - 应用程序将使用模拟服务器代替真实API

### 高级功能

- **请求修改**：在代理过程中修改请求头、参数或体
- **响应修改**：修改响应内容、状态码或头信息
- **场景切换**：保存不同配置作为场景，快速切换
- **导入/导出**：导出配置供团队共享

## 配置示例

### 代理服务器配置

```json
{
  "id": "proxy_1",
  "name": "开发环境代理",
  "port": 8080,
  "protocol": "http",
  "target": "https://api.example.com"
}
```

### 模拟服务器配置

```json
{
  "id": "mock_1",
  "name": "用户API模拟",
  "port": 3000,
  "routes": [
    {
      "id": "route_1",
      "method": "GET",
      "path": "/api/users",
      "response": {
        "status": 200,
        "headers": {
          "Content-Type": "application/json"
        },
        "body": {
          "users": [
            { "id": 1, "name": "John Doe" },
            { "id": 2, "name": "Jane Smith" }
          ]
        }
      }
    },
    {
      "id": "route_2",
      "method": "POST",
      "path": "/api/users",
      "response": {
        "status": 201,
        "headers": {
          "Content-Type": "application/json"
        },
        "body": {
          "id": "{{autoIncrement}}",
          "name": "{{request.body.name}}",
          "createdAt": "{{now}}"
        }
      }
    }
  ]
}
```

## 开发指南

### 项目结构

- **主进程**：处理服务器启动、IPC通信
- **渲染进程**：UI界面和用户交互
- **配置管理**：保存和加载配置
- **日志系统**：记录请求和响应

### 扩展功能

1. **添加新的代理功能**：
   - 修改`proxy-server-engine.ts`
   - 添加新的请求处理逻辑

2. **扩展模拟服务器**：
   - 在`mock-server-engine.ts`中添加新功能
   - 支持更复杂的响应逻辑

3. **自定义日志格式**：
   - 修改`log-manager.ts`
   - 添加新的日志格式选项

## 贡献指南

欢迎贡献！请遵循以下步骤：

1. Fork本仓库
2. 创建新分支 (`git checkout -b feature/your-feature`)
3. 提交更改 (`git commit -am 'Add some feature'`)
4. 推送到分支 (`git push origin feature/your-feature`)
5. 创建Pull Request

## 许可证

本项目采用ISC许可证 - 详见[license](LICENSE)文件。
