## ADDED Requirements
### Requirement: UI 树形编辑器
系统 SHALL 提供一个可视化的 UI 树形编辑器，支持多根节点的层级结构编辑和管理。

#### Scenario: 创建新根节点
- **WHEN** 用户点击"添加根节点"按钮
- **THEN** 系统在树形结构中创建一个新的根节点，并自动生成节点 ID（如 "01"）
- **AND** 新节点显示在树形编辑器中，处于可编辑状态

#### Scenario: 添加子节点
- **WHEN** 用户选择一个节点并点击"添加子节点"按钮
- **THEN** 系统弹出组件类型选择对话框，显示可选的 iOS 组件类型
- **AND** 用户选择组件类型后，系统在该节点下创建对应类型的子节点
- **AND** 自动生成层级节点 ID（如 "0101"）
- **AND** 子节点显示在父节点的下方，树形结构保持展开状态

#### Scenario: 删除节点
- **WHEN** 用户选择一个节点并点击"删除"按钮
- **THEN** 系统删除该节点及其所有子节点
- **AND** 相关的节点 ID 自动重新生成以保持层级编码的一致性

#### Scenario: 复制节点
- **WHEN** 用户选择一个节点并点击"复制"按钮
- **THEN** 系统复制该节点及其所有子节点的完整层级结构
- **AND** 复制的内容保存在剪贴板中

#### Scenario: 粘贴子节点
- **WHEN** 用户选择一个节点并点击"粘贴"按钮
- **THEN** 系统将复制的节点结构粘贴为当前节点的子节点
- **AND** 所有粘贴节点的 ID 自动重新生成
- **AND** 约束关系重新评估和设置

#### Scenario: 节点拖拽排序
- **WHEN** 用户拖拽一个节点到另一个位置
- **THEN** 系统更新节点的父子关系和位置
- **AND** 节点 ID 自动更新以反映新的层级关系

#### Scenario: 多根节点管理
- **WHEN** 用户创建多个根节点
- **THEN** 系统在树形编辑器中并列显示所有根节点
- **AND** 每个根节点可以独立展开/折叠其子节点

#### Scenario: 节点选择与属性同步
- **WHEN** 用户点击任意节点
- **THEN** 系统立即选中该节点并高亮显示
- **AND** 右侧属性编辑器同步显示该节点的所有属性信息
- **AND** 中间模拟器区域根据选中节点类型进行相应更新

#### Scenario: 根节点选择与模拟器预览
- **WHEN** 用户选择一个根节点
- **THEN** 中间模拟器立即显示该根节点的完整 UI 层级结构
- **AND** 模拟器根据根节点的约束包进行布局渲染
- **AND** 根节点宽度默认与模拟器内容区域宽度一致
- **AND** 如果根节点约束包未提供高度约束，则使用整个屏幕高度

#### Scenario: 子节点修改溯源展示
- **WHEN** 用户在属性编辑器中修改非根节点（子节点）的属性
- **THEN** 模拟器自动向上溯源找到包含该子节点的根节点
- **AND** 在模拟器中展示该溯源到的根节点的完整 UI 层级
- **AND** 实时更新对应 UI 元素显示

### Requirement: 自动节点 ID 生成
系统 SHALL 自动生成和维护层级结构的节点 ID，格式为 "030201"。

#### Scenario: 根节点 ID 生成
- **WHEN** 用户创建第一个根节点
- **THEN** 系统分配节点 ID "01"
- **AND** 后续根节点依次分配 "02"、"03" 等

#### Scenario: 子节点 ID 生成
- **WHEN** 用户在 ID 为 "02" 的根节点下创建第一个子节点
- **THEN** 系统分配节点 ID "0201"
- **AND** 后续子节点依次分配 "0202"、"0203" 等

#### Scenario: 深层子节点 ID 生成
- **WHEN** 用户在 ID 为 "0201" 的子节点下创建第一个子节点
- **THEN** 系统分配节点 ID "020101"
- **AND** 后续子节点依次分配 "020102"、"020103" 等

#### Scenario: 节点删除后的 ID 更新
- **WHEN** 用户删除一个节点
- **THEN** 系统自动更新所有受影响的节点 ID
- **AND** 保持层级编码的连续性和一致性

### Requirement: 树形显示与交互
系统 SHALL 提供直观的树形显示和交互体验。

#### Scenario: 默认展开所有节点
- **WHEN** 用户打开树形编辑器或加载新数据
- **THEN** 系统默认展开所有节点及子节点，平铺展示完整层级结构
- **AND** 使用清晰的缩进和连接线显示层级关系

#### Scenario: 节点操作按钮
- **WHEN** 用户查看树形编辑器中的任意节点
- **THEN** 每个节点右侧显示操作按钮组：添加子节点、删除节点、复制节点、粘贴子节点
- **AND** 按钮图标清晰可识别，鼠标悬停时显示操作提示

#### Scenario: 组件类型选择
- **WHEN** 用户点击"添加子节点"按钮
- **THEN** 系统弹出组件类型选择对话框
- **AND** 对话框显示完整的 iOS 组件类型列表，包括：UIView, UIButton, UILabel, UIImageView, UITextField, UIViewController, UITableViewCell, UITextView, UIScrollView, UITableView, UICollectionView, UIAlertView, UISearchBar, UIActivityIndicatorView, UIProgressView, UISwitch, UISlider, UISegmentedControl, UIPickerView, UIDatePicker, UIWebView, WKWebView, UIStackView, UIToolbar, UINavigationBar, UITabBar, UIStatusBar, UIPopoverController, UIActionSheet
