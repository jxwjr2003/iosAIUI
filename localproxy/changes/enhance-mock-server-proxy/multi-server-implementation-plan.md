# 多服务器实例实现计划

## 需求概述
点击"启动模拟服务器"时，启动所有已保存的配置，每个配置独立运行在不同的端口上。

## 当前架构问题

### 1. 单实例限制
- `MockServerEngine` 只能运行单个服务器实例
- 使用单一的 `server` 和 `isRunning` 状态变量
- 无法同时管理多个配置的服务器

### 2. IPC 处理限制
- `ipcMain.handle('mock-server:start', ...)` 只支持启动单个配置
- 缺乏批量启动所有配置的机制

### 3. 状态管理缺失
- `ConfigManager` 只存储配置，不跟踪运行状态
- UI 无法显示多个服务器的运行状态

### 4. 日志区分不足
- 日志系统没有区分不同服务器的日志来源

## 解决方案架构

### 核心组件设计

#### 1. MockServerManager 类
```typescript
class MockServerManager extends EventEmitter {
  private instances: Map<string, MockServerInstance>;
  private configManager: ConfigManager;
  
  // 批量启动所有配置
  async startAll(): Promise<BatchStartResult>
  
  // 批量停止所有服务器
  async stopAll(): Promise<void>
  
  // 启动单个配置
  async startServer(configId: string): Promise<StartResult>
  
  // 停止单个服务器
  async stopServer(configId: string): Promise<void>
  
  // 获取所有服务器状态
  getServerStatuses(): ServerStatus[]
}
```

#### 2. MockServerInstance 包装器
```typescript
class MockServerInstance {
  private engine: MockServerEngine;
  private config: MockServerConfig;
  private isRunning: boolean;
  
  async start(): Promise<void>
  async stop(): Promise<void>
  getStatus(): ServerStatus
}
```

#### 3. 接口定义
```typescript
interface ServerStatus {
  id: string;
  name: string;
  port: number;
  protocol: string;
  isRunning: boolean;
  config: MockServerConfig;
}

interface BatchStartResult {
  success: boolean;
  started: string[];
  failed: Array<{id: string, error: string}>;
  portConflicts: string[];
}

interface StartResult {
  success: boolean;
  error?: string;
}
```

## 实施步骤

### 阶段1：核心架构改造
1. **创建 MockServerManager 类**
   - 管理多个服务器实例
   - 提供批量操作接口
   - 处理端口冲突检测

2. **修改 MockServerEngine**
   - 保持单实例模式不变
   - 增强错误处理和状态管理

3. **更新主进程 IPC 处理**
   - 添加批量启动接口 `mock-server:start-all`
   - 添加获取状态接口 `mock-server:get-statuses`
   - 保持向后兼容性

### 阶段2：配置和状态管理
4. **增强配置管理器**
   - 添加运行状态跟踪
   - 支持端口冲突检测
   - 提供批量配置操作

5. **更新日志系统**
   - 区分不同服务器的日志来源
   - 增强日志上下文信息

### 阶段3：用户界面更新
6. **修改渲染进程 UI**
   - 添加"启动所有服务器"按钮
   - 显示多个服务器状态
   - 支持选择性启动/停止

7. **更新 preload.ts**
   - 添加新的 IPC 接口
   - 保持类型安全

## 详细文件修改清单

### 需要创建的新文件
- `src/mock-server/mock-server-manager.ts` - 多服务器管理器
- `src/mock-server/mock-server-instance.ts` - 单个服务器实例包装器
- `src/types/server-types.ts` - 类型定义

### 需要修改的现有文件
- `src/main.ts` - 更新 IPC 处理程序
- `src/mock-server/mock-server-engine.ts` - 小幅度优化
- `src/config/config-manager.ts` - 增强状态管理
- `src/preload.ts` - 添加新接口
- `renderer/renderer.js` - 更新 UI 逻辑
- `renderer/index.html` - 添加新控件

## 技术考虑

### 端口冲突处理
- 启动前检查端口占用情况
- 提供清晰的错误信息
- 支持端口自动分配（可选）

### 性能优化
- 限制并发启动的服务器数量
- 实现懒加载机制
- 优化内存使用

### 错误处理
- 单个服务器失败不影响其他服务器
- 提供详细的错误报告
- 支持重试机制

## 测试策略

### 单元测试
- MockServerManager 功能测试
- 端口冲突检测测试
- 批量操作测试

### 集成测试
- 多服务器同时运行测试
- UI 状态同步测试
- 错误处理测试

### 性能测试
- 内存使用监控
- 启动时间测试
- 并发请求处理

## 向后兼容性

### API 兼容性
- 保持现有单个服务器启动接口
- 新增批量操作接口
- 不破坏现有功能

### 配置兼容性
- 现有配置文件格式保持不变
- 自动迁移运行状态信息
- 保持配置导入/导出功能

## 风险评估

### 技术风险
- 端口冲突可能导致启动失败
- 资源泄漏需要仔细管理
- 并发控制复杂性

### 缓解措施
- 实现完善的错误处理
- 添加资源监控和清理
- 进行充分的测试

## 实施时间估算

- 阶段1：2-3天
- 阶段2：1-2天  
- 阶段3：2-3天
- 测试和优化：2天
- 总计：7-10个工作日

## 下一步行动

1. 切换到 Code 模式开始实施
2. 按照阶段顺序进行开发
3. 每个阶段完成后进行测试
4. 最终集成测试和性能优化