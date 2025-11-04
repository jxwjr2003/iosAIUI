# Project Context

## Purpose
LocalProxy 是一个基于 Electron 的桌面应用程序，主要功能是提供多个代理服务器管理，类似于 Postman 的工具。它支持接口转发、接口模拟、请求拦截和响应处理，帮助开发者在本地环境中测试和调试 API 接口。

## Tech Stack
- **桌面框架**: Electron
- **前端语言**: TypeScript
- **后端运行时**: Node.js
- **可选集成**: Python（用于特定功能扩展）
- **构建工具**: 基于 Electron 的构建流程

## Project Conventions

### Code Style
- 使用 TypeScript 进行类型安全的开发
- 遵循 ESLint 和 Prettier 代码规范
- 使用 2 空格缩进
- 函数和变量使用 camelCase 命名
- 类和接口使用 PascalCase 命名
- 常量使用 UPPER_SNAKE_CASE 命名

### Architecture Patterns
- 主进程-渲染进程分离的 Electron 架构
- 事件驱动的跨进程通信（IPC）
- 模块化的代理服务器管理
- 插件化的接口模拟功能
- 配置驱动的代理规则管理

### Testing Strategy
- 单元测试覆盖核心代理逻辑
- 集成测试验证 IPC 通信
- 端到端测试模拟用户操作
- 代理规则的功能测试

### Git Workflow
- 使用 OpenSpec 规范进行变更管理
- 功能分支开发，主分支发布
- 提交信息遵循约定式提交规范
- 代码审查和自动化测试流程

## Domain Context
- **代理服务器**: 支持 HTTP/HTTPS 代理，可配置多个代理实例
- **接口转发**: 将请求转发到目标服务器，支持请求/响应修改
- **接口模拟**: 创建模拟接口，返回预定义的响应数据
- **请求拦截**: 拦截特定请求，进行自定义处理
- **规则配置**: 基于 URL 模式、请求方法等条件的规则匹配

## Important Constraints
- 跨平台兼容性：支持 Windows、macOS、Linux
- 性能考虑：代理服务器需要低延迟和高并发处理
- 安全性：处理敏感请求数据时需要加密存储
- 资源限制：Electron 应用的内存和 CPU 使用优化
- 网络隔离：代理服务器的网络访问控制和隔离

## External Dependencies
- **Electron**: 桌面应用框架
- **Node.js**: 后端运行时环境
- **TypeScript**: 类型安全的 JavaScript 超集
- **可能的 Python 集成**: 用于特定算法或数据处理
- **网络库**: 用于代理请求处理（如 axios、node-fetch）
- **配置管理**: 用于代理规则和设置的持久化存储
