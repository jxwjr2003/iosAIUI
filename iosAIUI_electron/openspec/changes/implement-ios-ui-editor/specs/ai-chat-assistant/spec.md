## ADDED Requirements
### Requirement: AI 聊天助手
系统 SHALL 提供一个三栏布局的 AI 聊天助手，通过 Electron 主进程连接 AI 服务器，为用户提供智能化的 UI 设计建议和优化方案，支持当前选中节点上下文感知、命令逐一确认执行和完整的修改日志系统。

#### Scenario: 三栏布局界面
- **WHEN** 用户打开 AI 聊天助手
- **THEN** 系统显示三栏布局界面：
  - 左侧聊天历史区域（55%）：显示用户和AI的对话历史
  - 中间配置和上下文面板（25%）：显示服务器配置、AI设置和当前选中节点信息
  - 右侧修改日志面板（20%）：记录所有AI修改的历史记录
- **AND** 用户可以通过拖拽调整各栏宽度

#### Scenario: 当前选中节点显示和传递
- **WHEN** 用户在树形编辑器中选择一个节点
- **THEN** 配置和上下文面板实时显示选中节点的ID和名称
- **AND** 当用户发送AI聊天消息时，系统自动包含选中节点信息：
```json
{
  "json_data": {完整的UI结构JSON},
  "json_spec": "JSON规范描述",
  "question": "用户的问题",
  "selected_node": {
    "nodeId": "030201",
    "nodeName": "按钮组件",
    "nodeType": "UIButton",
    "isSelected": true
  },
  "conversation_history": []
}
```
- **AND** 支持节点引用语法：用户在聊天中输入 `@030201` 或 `@按钮组件` 来引用特定节点

#### Scenario: 启动 AI 聊天
- **WHEN** 用户点击底部 AI 聊天区域的输入框
- **THEN** 系统显示三栏布局的聊天界面，包含消息历史记录、上下文面板和输入区域
- **AND** 用户可以在输入框中输入关于 UI 设计的问题或需求

#### Scenario: 发送聊天消息
- **WHEN** 用户输入问题并点击发送按钮
- **THEN** 系统将当前的完整 JSON 数据结构和用户问题通过 IPC 发送到 Electron 主进程
- **AND** Electron 主进程直接连接 AI 服务器进行处理
- **AND** AI 服务器返回针对 UI 设计的建议和结构化修改命令
- **AND** 系统在聊天界面显示 AI 的回复和建议

#### Scenario: 命令格式解析
- **WHEN** AI 返回包含修改命令的响应
- **THEN** 系统解析命令格式并验证命令的有效性
- **AND** 命令格式遵循以下标准：
```json
{
  "suggestions": "AI提供的自然语言建议描述",
  "commands": [
    {
      "action": "update_node",
      "nodeId": "030201",
      "changes": {
        "nodeName": "新的节点名称",
        "nodeType": "新的节点类型",
        "attributes": [
          {
            "id": 1,
            "key": "backgroundColor",
            "value": "#FFFFFF",
            "type": "color"
          }
        ],
        "constraintPackages": [
          {
            "name": "新的约束包",
            "constraints": [...],
            "isDefault": true
          }
        ],
        "functions": [...],
        "eventFunctions": [...],
        "protocols": [...]
      }
    }
  ]
}
```
- **AND** 支持的操作类型包括：`update_node`, `add_node`, `remove_node`, `reorder_nodes`
- **AND** 节点 ID 必须使用 "030201" 格式的层级编码

#### Scenario: 命令逐一确认执行
- **WHEN** AI返回包含多个修改命令的响应
- **THEN** 系统弹出确认对话框，展示所有待执行命令的列表
- **AND** 用户可以选择：
  - "逐一确认"：逐个命令确认执行或跳过
  - "全部确认"：一次性执行所有命令
  - "取消"：不执行任何命令
- **AND** 在逐一确认模式下，系统展示每个命令的修改前后对比
- **AND** 用户确认执行的命令立即应用到JSON数据结构
- **AND** 自动刷新树形编辑器、模拟器和属性编辑器以反映修改

#### Scenario: 修改日志记录
- **WHEN** AI修改命令被执行（无论是确认执行还是跳过）
- **THEN** 系统在修改日志面板中添加一条记录，包含：
  - 时间戳（精确到秒）
  - 命令类型（update_node/add_node/remove_node/reorder_nodes）
  - 目标节点ID和名称
  - 执行状态（✅ 成功 / ❌ 失败 / ⏸️ 跳过）
  - 修改摘要
- **AND** 用户可以通过搜索框按节点ID、命令类型、时间范围搜索日志
- **AND** 用户可以通过筛选器按执行状态筛选日志
- **AND** 用户可以通过"详情"按钮查看完整的命令数据和修改前后对比

#### Scenario: 修改日志导出
- **WHEN** 用户需要导出修改日志
- **THEN** 系统提供"导出日志"按钮
- **AND** 用户可以选择导出格式（JSON或CSV）
- **AND** 导出的文件包含所有日志记录的完整信息
- **AND** 导出的文件可以用于审计和分析

#### Scenario: 修改确认和执行
- **WHEN** 系统检测到AI返回的修改命令
- **THEN** 系统显示修改确认对话框，展示修改前后的对比
- **AND** 用户可以选择确认应用修改或取消
- **AND** 用户确认后，系统自动应用所有修改到JSON数据结构
- **AND** 自动刷新树形编辑器、模拟器和属性编辑器以反映修改

#### Scenario: 上下文感知聊天
- **WHEN** 用户在聊天中提及特定的节点或组件
- **THEN** AI 能够理解当前 UI 结构的上下文
- **AND** AI 提供针对特定节点或组件的精确建议
- **AND** 系统在回复中高亮显示被讨论的节点

### Requirement: Electron 主进程 API 集成
系统 SHALL 通过 Electron 主进程 IPC 通信与 AI 服务进行通信，处理聊天请求和响应。

#### Scenario: IPC 通信调用
- **WHEN** 用户发送 AI 聊天消息
- **THEN** 渲染进程通过 IPC 调用 `ipcRenderer.invoke('ai-chat', ...)` 通道
- **AND** 请求包含完整的 JSON 数据结构、JSON 规范描述和用户问题：
```json
{
  "json_data": {完整的UI结构JSON},
  "json_spec": "可配置的JSON规范描述，包含数据格式定义和命令格式说明",
  "question": "用户的问题",
  "conversation_history": []  // 可选，对话历史
}
```
- **AND** Electron 主进程直接处理请求并返回标准化的响应格式

#### Scenario: JSON 规范描述配置
- **WHEN** 系统准备发送 AI 聊天请求
- **THEN** 系统自动生成当前 JSON 格式的完整规范描述
- **AND** 规范描述包含：
  - 基础数据结构定义
  - 节点字段定义和数据类型
  - 约束类型和支持的操作
  - 响应命令格式和可用操作类型
- **AND** 支持用户在系统设置中自定义规范描述内容
- **AND** 系统提供默认的规范描述模板

#### Scenario: 命令格式规范
- **WHEN** AI 生成响应命令
- **THEN** AI 基于规范描述理解可用的操作类型：
  - `update_node`: 更新现有节点
  - `add_node`: 添加新节点  
  - `remove_node`: 删除节点
  - `reorder_nodes`: 重新排序节点
- **AND** 命令必须遵循标准格式，包含必要的字段和验证规则
- **AND** 系统验证命令格式的有效性

#### Scenario: 健康检查
- **WHEN** 前端启动 AI 聊天功能
- **THEN** 前端通过 IPC 调用 `ipcRenderer.invoke('health-check', ...)` 检查主进程状态
- **AND** 如果主进程不可用，显示适当的错误信息
- **AND** 提供重试机制和离线模式

#### Scenario: AI 配置管理
- **WHEN** 用户配置 AI 服务参数
- **THEN** 前端提供配置界面，包含 API Key、模型选择等字段
- **AND** 前端通过 IPC 调用 `ipcRenderer.invoke('ai-config', ...)` 发送配置信息到主进程
- **AND** Electron 主进程验证配置有效性并返回配置状态
- **AND** 前端将配置状态保存在浏览器的 localStorage 中

#### Scenario: Electron 主进程架构
- **WHEN** 前端需要与 AI 服务通信
- **THEN** 前端通过 IPC 与 Electron 主进程通信，避免跨域问题
- **AND** Electron 主进程处理窗口管理、文件系统操作和 AI 服务集成
- **AND** 所有 AI 请求都通过主进程直接处理

#### Scenario: API Key 安全存储
- **WHEN** 用户配置 API Key
- **THEN** Electron 主进程使用 safeStorage 安全存储 API Key
- **AND** API Key 加密存储在系统安全区域
- **AND** 前端在 localStorage 中保存配置状态，但不保存实际的 API Key

#### Scenario: 模型发现和选择
- **WHEN** 用户需要选择 AI 模型
- **THEN** 前端通过 IPC 调用 `ipcRenderer.invoke('ai-models', ...)` 从主进程获取可用模型列表
- **AND** Electron 主进程从第三方 AI 服务获取模型列表并返回给前端
- **AND** 用户可以从列表中选择要使用的模型
- **AND** 选择的模型 ID 保存在前端配置中

#### Scenario: 连接测试
- **WHEN** 用户测试 AI 连接
- **THEN** 前端通过 IPC 调用 `ipcRenderer.invoke('ai-test', ...)` 发送测试请求
- **AND** Electron 主进程验证与第三方 AI 服务的连接状态
- **AND** 返回连接测试结果和错误信息（如有）

#### Scenario: 错误处理和重试
- **WHEN** API 调用失败或返回错误
- **THEN** 前端显示清晰的错误信息
- **AND** 提供重试机制和备选方案
- **AND** 记录错误日志以便调试

#### Scenario: AI 服务集成通信
- **WHEN** Electron 主进程收到 AI 聊天请求
- **THEN** 主进程通过 HTTP 请求调用兼容 OpenAI 接口的 AI 服务
- **AND** 使用专门的系统提示词理解 UI 结构：
```
你是一个专业的 iOS UI 设计助手。请分析提供的 UI 层级结构 JSON 数据，
根据用户的问题提供设计建议，并生成标准化的修改命令。
命令格式必须遵循指定的 JSON 结构。
```
- **AND** 生成包含自然语言建议和结构化命令的响应

#### Scenario: 命令生成和验证
- **WHEN** AI 服务返回响应
- **THEN** Electron 主进程解析响应并生成结构化命令
- **AND** 验证命令格式的有效性和完整性
- **AND** 确保节点 ID、属性类型等关键字段的正确性
- **AND** 如果命令无效，返回错误信息而不是执行

### Requirement: 智能建议功能
AI 聊天助手 SHALL 提供多种智能化的 UI 设计建议功能。

#### Scenario: 布局优化建议
- **WHEN** 用户询问关于布局优化的问题
- **THEN** AI 分析当前 UI 布局结构
- **AND** AI 提供布局改进建议，如约束优化、组件排列等
- **AND** 建议包含具体的修改方案和理由

#### Scenario: 组件选择建议
- **WHEN** 用户询问适合的组件类型
- **THEN** AI 根据用户需求和当前上下文
- **AND** AI 推荐最适合的 UIKit 组件类型
- **AND** 提供组件使用的最佳实践

#### Scenario: JSON 结构优化建议
- **WHEN** 用户请求优化 UI 结构
- **THEN** AI 分析当前 JSON 结构并提出优化建议
- **AND** 建议包含节点重组、约束优化、属性标准化等改进
- **AND** 提供优化理由和预期效果说明
