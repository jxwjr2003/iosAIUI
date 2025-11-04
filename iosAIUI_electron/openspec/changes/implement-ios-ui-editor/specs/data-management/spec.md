## ADDED Requirements
### Requirement: JSON 数据格式标准
系统 SHALL 使用以下标准化的 JSON 数据格式来存储和交换 UI 层级结构数据：

```json
{
  "version": "1.0",
  "timestamp": "2025-10-30T10:00:00.000Z",
  "rootNodeIdCounter": 1,
  "treeData": [
    {
      "nodeId": "01",
      "nodeName": "RootComponent",
      "nodeType": "UIView",
      "description": "This is a root view component with custom layout",
      "attributes": [
        {
          "id": 1,
          "key": "backgroundColor",
          "value": "#FFFFFF",
          "type": "color"
        }
      ],
      "memberVariables": [
        {
          "id": 1,
          "name": "customTitle",
          "type": "String",
          "defaultValue": "默认标题"
        }
      ],
      "constraintPackages": [],
      "functions": [
        {
          "funcName": "setupView",
          "funcLogic": "Configure the view appearance and layout"
        }
      ],
      "eventFunctions": [
        {
          "funcName": "handleButtonTap",
          "funcLogic": "Handle button tap event with custom logic"
        }
      ],
      "protocols": [
        {
          "protocolName": "CustomDelegate",
          "protocolLogic": "Define custom delegate methods for interaction"
        }
      ],
      "children": [
        {
          "nodeId": "0101",
          "nodeName": "TitleLabel",
          "nodeType": "UILabel",
          "description": "Main title label with custom styling",
          "attributes": [
            {
              "id": 2,
              "key": "text",
              "value": "Hello World",
              "type": "string"
            },
            {
              "id": 3,
              "key": "fontSize",
              "value": "16",
              "type": "number"
            },
            {
              "id": 4,
              "key": "textColor",
              "value": "#000000",
              "type": "color"
            }
          ],
          "constraintPackages": [
            {
              "name": "默认约束包",
              "constraints": [
                {
                  "type": "edge",
                  "method": "top",
                  "relation": "equalTo",
                  "value": 20,
                  "reference": "01"
                },
                {
                  "type": "center",
                  "method": "centerX",
                  "relation": "equalTo",
                  "value": 0,
                  "reference": "01"
                }
              ],
              "isDefault": true
            }
          ],
          "functions": [],
          "eventFunctions": [],
          "protocols": [],
          "children": [],
          "subNodeLayout": "vertical"
        }
      ],
      "subNodeLayout": "horizontal"
    }
  ]
}
```

**字段定义**：
- `version`: 数据格式版本号
- `timestamp`: ISO 8601 格式的创建时间戳
- `rootNodeIdCounter`: 根节点ID计数器，用于生成新的根节点ID
- `treeData`: 包含所有根节点的数组
- `nodeId`: 层级节点ID，格式为"0101"表示第一个根节点的第一个子节点
- `nodeName`: 节点显示名称
- `nodeType`: 节点类型，支持基础UIKit类型和自定义类型
  - **基础类型**: UIView, UIButton, UILabel, UIImageView, UITextField, UIViewController, UITableViewCell, UITextView, UIScrollView, UITableView, UICollectionView, UIAlertView, UISearchBar, UIActivityIndicatorView, UIProgressView, UISwitch, UISlider, UISegmentedControl, UIPickerView, UIDatePicker, UIWebView, WKWebView, UIStackView, UIToolbar, UINavigationBar, UITabBar, UIStatusBar, UIPopoverController, UIActionSheet
  - **自定义类型**: 用户可以创建继承自基础类型的新类型，每个根节点可以定义自己的类型
- `attributes`: 节点属性数组，每个属性包含id、key、value、type字段
- `memberVariables`: 节点成员变量数组，每个成员变量包含id、name、type、defaultValue字段
- `constraintPackages`: 约束包数组，每个约束包包含一组约束
  - `name`: 约束包名称
  - `constraints`: 约束数组
    - `type`: 约束类型（size, edge, center, baseline, aspectRatio）
    - `method`: 约束方法（height, width, top, left, right, bottom, centerX, centerY, leading, trailing, baseline, aspectRatio）
    - `relation`: 约束关系（equalTo, greaterThanOrEqualTo, lessThanOrEqualTo）
    - `value`: 约束值
    - `reference`: 参考节点ID
  - `isDefault`: 是否为默认约束包
- `functions/eventFunctions/protocols`: 函数和协议定义数组
- `children`: 子节点数组
- `subNodeLayout`: 子节点布局方向，支持"vertical"和"horizontal"

#### Scenario: 验证标准数据格式
- **WHEN** 系统处理导入的JSON数据
- **THEN** 系统验证数据是否符合标准格式，包括协议集定义
- **AND** 拒绝不符合标准格式的数据并显示错误信息

#### Scenario: 协议集定义
- **WHEN** 用户为节点配置多个协议
- **THEN** 系统支持在protocols数组中定义多个协议
- **AND** 每个协议包含协议名称、方法列表和实现细节

### Requirement: JSON 数据导入导出
系统 SHALL 支持将 UI 层级结构以 JSON 格式导入和导出，便于数据交换和版本管理。

#### Scenario: 导出 JSON 数据
- **WHEN** 用户点击"导出 JSON"按钮
- **THEN** 系统将当前的 UI 层级结构转换为 JSON 格式
- **AND** 生成包含版本信息、时间戳和完整节点数据的 JSON 文件
- **AND** 自动下载 JSON 文件到用户本地

#### Scenario: 导入 JSON 数据
- **WHEN** 用户选择并上传一个 JSON 文件
- **THEN** 系统解析 JSON 文件内容并验证数据格式
- **AND** 如果数据有效且包含多个根节点，系统显示根节点选择界面
- **AND** 用户可以选择要导入和展示的根节点
- **AND** 系统用用户选择的根节点数据替换当前的 UI 层级结构
- **AND** 更新树形编辑器、模拟器和属性编辑器以反映新数据

#### Scenario: 导入数据验证
- **WHEN** 用户尝试导入格式错误的 JSON 文件
- **THEN** 系统检测到数据格式错误并显示详细的错误信息
- **AND** 阻止无效数据的导入，保持当前编辑状态不变

#### Scenario: 选择性展示根节点
- **WHEN** 导入的 JSON 数据包含大量根节点（例如超过5个）
- **THEN** 系统提示用户选择要展示的根节点
- **AND** 提供根节点列表供用户选择，支持多选
- **AND** 用户确认后，系统仅展示选中的根节点
- **AND** 未选中的根节点数据仍然保留在系统中，但不在树形编辑器中显示

### Requirement: UI 层级文本描述
系统 SHALL 能够将当前的 UI 层级结构转换为可读的文本描述。

#### Scenario: 生成文本描述
- **WHEN** 用户点击"生成文本描述"按钮
- **THEN** 系统将当前的 UI 层级结构转换为格式化的文本描述
- **AND** 文本描述包含节点的层级关系、类型、关键属性和约束信息
- **AND** 生成易于阅读和理解的层级结构说明

#### Scenario: 复制文本描述
- **WHEN** 用户点击"复制文本描述"按钮
- **THEN** 系统将生成的文本描述复制到剪贴板
- **AND** 显示复制成功的提示信息

#### Scenario: 保存文本描述
- **WHEN** 用户点击"保存文本描述"按钮
- **THEN** 系统将文本描述保存为文本文件
- **AND** 自动下载文本文件到用户本地

### Requirement: 数据持久化和恢复
系统 SHALL 支持数据的自动保存和恢复功能，防止意外数据丢失。

#### Scenario: 自动保存
- **WHEN** 用户对 UI 层级结构进行任何修改
- **THEN** 系统自动保存当前状态到浏览器的本地存储
- **AND** 在页面标题或状态栏显示保存状态指示

#### Scenario: 恢复上次编辑
- **WHEN** 用户重新打开编辑器页面
- **THEN** 系统自动检查并加载上次保存的编辑状态
- **AND** 如果存在未保存的数据，提示用户是否恢复

#### Scenario: 清除本地数据
- **WHEN** 用户选择"清除所有数据"选项
- **THEN** 系统清除浏览器本地存储中的所有编辑数据
- **AND** 重置编辑器到初始空状态
- **AND** 要求用户确认此操作以防止误操作

#### Scenario: AI 修改数据验证
- **WHEN** AI 助手返回修改命令
- **THEN** 系统验证修改后的数据格式是否符合标准
- **AND** 确保节点ID、属性类型、约束格式等关键字段的有效性
- **AND** 如果数据验证失败，阻止修改并显示错误信息

#### Scenario: AI 修改历史记录
- **WHEN** AI 助手成功应用修改
- **THEN** 系统记录修改历史，包括修改时间、修改内容和来源
- **AND** 支持撤销AI修改操作
- **AND** 在修改历史中标记AI建议的来源

#### Scenario: 数据格式严格验证
- **WHEN** 系统处理任何JSON数据（导入、AI修改、用户编辑）
- **THEN** 系统严格验证数据格式是否符合定义的JSON Schema
- **AND** 验证包括节点ID格式（必须为"030201"格式）、属性类型、约束包结构等所有字段
- **AND** 如果数据验证失败，阻止操作并显示详细的错误信息
- **AND** 支持数据版本兼容性，允许导入旧版本格式并自动升级

#### Scenario: 性能指标监控
- **WHEN** 系统处理复杂 UI 层级树（超过500个节点）
- **THEN** 系统监控渲染性能，确保响应时间小于100ms
- **AND** 支持虚拟滚动和懒加载优化大型树形结构
- **AND** 提供性能警告当节点数量接近1000个限制

#### Scenario: 安全数据传输
- **WHEN** 前端与 Electron 主进程通信
- **THEN** 所有 IPC 通信使用安全的进程间通信机制
- **AND** 对敏感数据进行加密处理

#### Scenario: 输入验证和清理
- **WHEN** 用户输入或导入外部数据
- **THEN** 系统对所有输入进行验证和清理
- **AND** 防止 XSS 攻击，对HTML特殊字符进行转义
- **AND** 防止 CSRF 攻击，使用令牌验证
- **AND** 验证文件类型和大小，防止恶意文件上传

#### Scenario: 约束包冲突检测
- **WHEN** 用户或AI修改约束包配置
- **THEN** 系统检测约束包中的约束冲突
- **AND** 如果检测到冲突的约束关系，显示警告信息
- **AND** 提供解决冲突的建议方案

#### Scenario: 节点ID唯一性保证
- **WHEN** 系统生成或修改节点ID
- **THEN** 确保所有节点ID在整个树形结构中保持唯一
- **AND** 如果检测到重复的节点ID，自动重新生成并更新相关引用
- **AND** 通知用户ID变更情况

#### Scenario: JSON Schema 验证
- **WHEN** 系统处理任何JSON数据操作（导入、导出、AI修改、用户编辑）
- **THEN** 系统使用预定义的JSON Schema进行严格验证
- **AND** 验证包括节点结构、属性类型、约束格式、成员变量定义等所有字段
- **AND** 如果验证失败，阻止操作并显示详细的错误信息，包括具体字段和验证规则

#### Scenario: 节点ID重新编号算法
- **WHEN** 用户删除节点或移动节点层级
- **THEN** 系统自动重新计算所有受影响的节点ID
- **AND** 保持层级编码的连续性和一致性（如删除"0102"后，"0103"自动变为"0102"）
- **AND** 更新所有相关引用（如约束包中的reference字段）

#### Scenario: 数据版本兼容性处理
- **WHEN** 用户导入旧版本（v1.0）的JSON数据
- **THEN** 系统检测数据版本并自动执行数据迁移
- **AND** 将旧版本数据转换为当前版本格式，保持向后兼容
- **AND** 记录迁移日志，显示版本变更详情

#### Scenario: 约束包冲突检测
- **WHEN** 用户或AI修改约束包配置
- **THEN** 系统实时检测约束包中的冲突约束
- **AND** 识别常见的约束冲突类型（如过度约束、约束矛盾等）
- **AND** 提供自动解决建议和手动调整选项
- **AND** 在模拟器中高亮显示冲突区域

#### Scenario: 数据完整性检查
- **WHEN** 系统保存或导出数据
- **THEN** 系统执行完整性检查，验证所有必需的字段和引用
- **AND** 确保节点ID引用有效，约束包配置完整
- **AND** 如果发现数据完整性问题，提示用户修复后再继续操作
