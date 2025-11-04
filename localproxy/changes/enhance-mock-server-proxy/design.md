# 架构设计

## 系统架构
```
应用层 (Renderer Process)
├── 配置管理界面
├── 实时日志显示
└── 服务器控制面板

业务层 (Main Process)  
├── 模拟服务器引擎
├── 代理服务器引擎
├── 配置管理服务
└── 日志管理服务

数据层
├── 配置持久化存储
└── 实时日志缓存
```

## 关键组件设计

### 模拟服务器引擎
- 基于 Node.js HTTP/HTTPS 模块
- 支持动态端口绑定
- 可配置的路由处理
- 错误码模拟器
- 并发请求队列管理（最大3个）

### 配置管理系统
- 使用 JSON 文件存储配置
- 配置结构：
  ```typescript
  interface MockServerConfig {
    id: string;
    name: string;
    port: number;
    protocol: 'http' | 'https';
    routes: RouteConfig[];
  }
  
  interface RouteConfig {
    path: string;
    method: 'GET' | 'POST';
    headers: Record<string, string>;
    body: any;
    statusCode: number;
  }
  ```

### 日志系统
- 实时事件发射器模式
- 支持过滤和搜索
- 内存缓存，不持久化
- 复制到剪贴板功能

### 代理服务器增强
- 请求拦截和转发
- 目标服务器配置
- 请求/响应日志记录
- 协议转换支持

## 技术考虑
- 使用 Electron IPC 进行进程间通信
- 配置存储使用 app.getPath('userData')
- 日志显示使用虚拟滚动处理大量数据
- 错误处理和超时管理
