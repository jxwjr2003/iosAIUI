## ADDED Requirements
### Requirement: 节点属性编辑器
系统 SHALL 提供一个属性编辑器，允许用户编辑选中节点的各种属性和配置。

#### Scenario: 节点ID只读展示
- **WHEN** 用户在树形编辑器中选择一个节点
- **THEN** 属性编辑器自动显示该节点的层级ID（030201格式）
- **AND** 节点ID字段为只读状态，不可编辑
- **AND** 提供复制按钮便于用户复制节点ID

#### Scenario: 节点名称编辑
- **WHEN** 用户编辑节点的名称
- **THEN** 属性编辑器提供可编辑的节点名称文本框
- **AND** 节点名称修改实时同步到树形编辑器和数据模型
- **AND** 提供字符长度限制和格式验证

#### Scenario: 节点类型选择
- **WHEN** 用户编辑节点的类型
- **THEN** 属性编辑器提供完整的UIKit组件类型列表供选择：
  - 基础视图：UIView, UIViewController
  - 控件：UIButton, UILabel, UITextField, UITextView, UISwitch, UISlider, UISegmentedControl
  - 容器视图：UIScrollView, UITableView, UICollectionView, UIStackView
  - 系统组件：UIAlertView, UISearchBar, UIActivityIndicatorView, UIProgressView
  - 选择器：UIPickerView, UIDatePicker
  - Web视图：UIWebView, WKWebView
  - 导航组件：UIToolbar, UINavigationBar, UITabBar, UIStatusBar
  - 其他：UIPopoverController, UIActionSheet, UITableViewCell, UIImageView
- **AND** 类型变更时自动重置相关属性

#### Scenario: 根节点类型同步
- **WHEN** 用户修改根节点的名称
- **THEN** 属性编辑器自动将该根节点名称添加到节点类型选择器中
- **AND** 所有节点都可以选择该自定义类型作为节点类型
- **AND** 保持与树形编辑器的数据同步

#### Scenario: 颜色属性编辑
- **WHEN** 用户编辑颜色相关的属性（如backgroundColor、textColor等）
- **THEN** 属性编辑器支持16进制颜色格式（#RRGGBB或#RGB）
- **AND** 支持RGB格式输入（三个0-255的数值输入框）
- **AND** 输入框旁显示10×10像素的颜色预览方块
- **AND** 默认显示16进制输入框，提供"切换RGB"按钮
- **AND** 点击颜色方块弹出系统颜色选择器

#### Scenario: Attributes属性管理
- **WHEN** 用户管理节点的attributes属性
- **THEN** 属性编辑器默认显示空attributes状态
- **AND** 提供"新增属性"按钮，点击后弹出属性选择对话框
- **AND** 属性选择对话框显示基于当前节点类型的常见属性列表
- **AND** 支持自定义属性，用户可手动输入key、value、type
- **AND** 属性key在同一节点内必须唯一，重复时显示错误提示
- **AND** 每个属性显示为独立行，支持编辑value、type和删除操作



#### Scenario: 成员变量管理
- **WHEN** 用户管理节点的成员变量
- **THEN** 属性编辑器默认显示空成员变量状态
- **AND** 提供"添加变量"按钮，弹出成员变量表单
- **AND** 成员变量表单包含：变量名称（文本输入）、变量类型（下拉选择）、默认值（类型相关输入）
- **AND** 变量类型选项：String、Int、Bool、Double、Float、UIColor、UIFont等
- **AND** 根据类型显示对应的默认值输入控件
- **AND** 支持成员变量的编辑和删除操作
- **AND** 变量名称在同一节点内必须唯一

#### Scenario: 函数管理
- **WHEN** 用户管理节点的functions
- **THEN** 属性编辑器默认显示空functions状态
- **AND** 提供"添加函数"按钮，弹出函数编辑表单
- **AND** 函数编辑表单包含：funcName（函数名称）、funcLogic（函数逻辑，多行文本域）
- **AND** 支持函数的编辑和删除操作

#### Scenario: 事件函数管理
- **WHEN** 用户管理节点的eventFunctions
- **THEN** 属性编辑器默认显示空eventFunctions状态
- **AND** 提供"添加事件函数"按钮，弹出事件函数编辑表单
- **AND** 事件函数编辑表单包含：funcName（函数名称）、funcLogic（函数逻辑，多行文本域）
- **AND** 支持事件函数的编辑和删除操作

#### Scenario: 协议管理
- **WHEN** 用户管理节点的protocols
- **THEN** 属性编辑器默认显示空protocols状态
- **AND** 提供"添加协议"按钮，弹出协议编辑表单
- **AND** 协议编辑表单包含：protocolName（协议名称）、protocolLogic（协议逻辑，多行文本域）
- **AND** 支持协议的编辑和删除操作

#### Scenario: 子节点布局选择
- **WHEN** 用户设置节点的子节点布局
- **THEN** 属性编辑器提供布局方向选择器：horizontal（横向）或 vertical（竖向）
- **AND** 默认值为horizontal
- **AND** 仅当节点有子节点时显示和生效该选项
- **AND** 布局方向切换时立即更新模拟器显示

#### Scenario: 节点备注编辑
- **WHEN** 用户编辑节点的备注信息
- **THEN** 属性编辑器提供description字段的多行文本输入框
- **AND** 支持富文本输入，用于节点功能说明和设计意图描述
- **AND** 实时保存备注内容，无字符限制

#### Scenario: 组件特定属性自动选择
- **WHEN** 用户选择或更改节点的组件类型
- **THEN** 属性编辑器自动显示该组件类型的常见属性
- **AND** 提供预定义的属性模板，减少手动输入
- **AND** 支持用户自定义添加额外的属性

#### Scenario: 基础视图属性编辑
- **WHEN** 用户编辑 UIView 类型节点的属性
- **THEN** 属性编辑器自动提供常见属性：backgroundColor、alpha、isHidden、clipsToBounds、cornerRadius、borderWidth、borderColor
- **AND** 支持颜色选择器、数值输入、开关控件等

#### Scenario: 按钮属性编辑
- **WHEN** 用户编辑 UIButton 类型节点的属性
- **THEN** 属性编辑器自动提供常见属性：title、titleColor、font、backgroundColor、image、backgroundImage、isEnabled、contentEdgeInsets
- **AND** 支持文本输入、颜色选择、图片选择等控件

#### Scenario: 标签属性编辑
- **WHEN** 用户编辑 UILabel 类型节点的属性
- **THEN** 属性编辑器自动提供常见属性：text、font、textColor、textAlignment、numberOfLines、lineBreakMode、attributedText
- **AND** 支持多行文本输入、字体选择、对齐方式选择等控件

#### Scenario: 文本字段属性编辑
- **WHEN** 用户编辑 UITextField 类型节点的属性
- **THEN** 属性编辑器自动提供常见属性：placeholder、text、font、textColor、borderStyle、keyboardType、secureTextEntry、clearButtonMode
- **AND** 支持占位符设置、键盘类型选择、安全输入开关等控件

#### Scenario: 图片视图属性编辑
- **WHEN** 用户编辑 UIImageView 类型节点的属性
- **THEN** 属性编辑器自动提供常见属性：image、contentMode、isUserInteractionEnabled、animationImages、animationDuration
- **AND** 支持图片选择、内容模式选择、动画设置等控件

#### Scenario: 样式属性编辑
- **WHEN** 用户编辑节点的样式属性
- **THEN** 属性编辑器提供颜色选择器、字体大小输入、背景颜色设置等控件
- **AND** 支持实时预览样式变化效果

#### Scenario: 约束包管理
- **WHEN** 用户配置节点的约束关系
- **THEN** 属性编辑器提供约束包管理界面
- **AND** 支持创建、编辑、删除约束包
- **AND** 支持设置默认约束包
- **AND** 每个约束包可以包含多个约束

#### Scenario: 约束配置
- **WHEN** 用户编辑约束包中的约束
- **THEN** 属性编辑器提供完整的约束类型选择（size、edge、center、baseline、aspectRatio）
- **AND** 支持设置约束方法（height、width、top、left、right、bottom、centerX、centerY、leading、trailing、baseline、aspectRatio）
- **AND** 支持设置约束关系（equalTo、greaterThanOrEqualTo、lessThanOrEqualTo）
- **AND** 支持设置约束值和参考节点

#### Scenario: 约束包管理
- **WHEN** 用户管理节点的约束包
- **THEN** 属性编辑器默认显示空约束包状态
- **AND** 提供"新增约束包"按钮，支持输入约束包名称
- **AND** 第一个创建的约束包自动标记为默认约束包
- **AND** 支持约束包的命名、设置默认、删除操作
- **AND** 每个约束包内提供"添加约束"按钮

#### Scenario: 约束配置
- **WHEN** 用户添加约束
- **THEN** 属性编辑器提供约束类型选择：size、edge、center、baseline、aspectRatio
- **AND** 根据约束类型显示对应的方法选择器
- **AND** 支持设置约束关系（equalTo、greaterThanOrEqualTo、lessThanOrEqualTo）
- **AND** 支持设置约束数值（手动输入）
- **AND** 支持选择参考节点（仅显示父节点和兄弟节点）
- **AND** 系统实时检测约束冲突并显示警告信息
- 
#### Scenario: 国际化约束配置
- **WHEN** 用户配置leading或trailing约束
- **THEN** 属性编辑器支持根据阅读方向自动调整约束行为
- **AND** 在模拟器中正确渲染leading和trailing约束效果

#### Scenario: 文本基线约束配置
- **WHEN** 用户配置baseline约束
- **THEN** 属性编辑器支持文本组件的基线对齐约束
- **AND** 在模拟器中正确渲染文本基线对齐效果

#### Scenario: 宽高比约束配置
- **WHEN** 用户配置aspectRatio约束
- **THEN** 属性编辑器支持设置组件的宽高比例
- **AND** 在模拟器中正确渲染宽高比约束效果

#### Scenario: 中心约束配置
- **WHEN** 用户配置中心约束
- **THEN** 属性编辑器支持 centerX 和 centerY 约束类型
- **AND** 支持设置中心约束的参考节点和偏移值
- **AND** 在模拟器中正确渲染中心约束效果

#### Scenario: 函数和协议配置
- **WHEN** 用户配置节点的函数和协议
- **THEN** 属性编辑器提供函数名称输入、参数定义、逻辑描述等字段
- **AND** 支持协议方法定义和实现细节配置

#### Scenario: 协议集配置
- **WHEN** 用户配置节点的协议集
- **THEN** 属性编辑器支持添加、编辑和删除多个协议
- **AND** 每个协议可以包含协议名称、方法列表和实现细节
- **AND** 支持协议方法的参数定义和返回值类型设置

#### Scenario: 添加成员变量
- **WHEN** 用户为节点添加新的成员变量
- **THEN** 属性编辑器提供成员变量名称输入、类型选择和默认值设置
- **AND** 支持的数据类型包括：String、Int、Bool、Double、Float、UIColor、UIFont等
- **AND** 根据选择的类型提供相应的默认值输入控件
- **AND** 确保成员变量名称在同一节点内唯一

#### Scenario: 编辑成员变量
- **WHEN** 用户编辑现有的成员变量
- **THEN** 属性编辑器允许修改成员变量的名称、类型和默认值
- **AND** 支持类型变更时的默认值格式验证
- **AND** 提供实时验证确保数据格式正确

#### Scenario: 删除成员变量
- **WHEN** 用户删除不需要的成员变量
- **THEN** 属性编辑器支持移除选中的成员变量
- **AND** 要求用户确认删除操作以防止误操作
- **AND** 自动更新节点数据并刷新显示

#### Scenario: 成员变量类型验证
- **WHEN** 用户设置成员变量的默认值
- **THEN** 系统根据选择的类型验证默认值的格式
- **AND** 对于String类型，接受任意字符串
- **AND** 对于Int类型，验证是否为整数
- **AND** 对于Bool类型，提供开关控件选择true/false
- **AND** 对于UIColor类型，提供颜色选择器
- **AND** 对于UIFont类型，提供字体选择界面

#### Scenario: 成员变量名称唯一性检查
- **WHEN** 用户输入或修改成员变量名称
- **THEN** 系统检查同一节点内是否已存在相同名称的成员变量
- **AND** 如果名称重复，显示错误提示并阻止保存
- **AND** 提示用户修改名称以确保唯一性

### Requirement: 布局方向设置
系统 SHALL 支持设置节点的子节点布局方向。

#### Scenario: 设置垂直布局
- **WHEN** 用户将节点的子节点布局设置为 "vertical"
- **THEN** 该节点的所有子节点在模拟器中垂直排列
- **AND** 子节点按照添加顺序从上到下显示

#### Scenario: 设置水平布局
- **WHEN** 用户将节点的子节点布局设置为 "horizontal"
- **THEN** 该节点的所有子节点在模拟器中水平排列
- **AND** 子节点按照添加顺序从左到右显示

#### Scenario: 布局方向切换
- **WHEN** 用户切换节点的布局方向
- **THEN** 系统自动调整子节点的约束关系以适应新的布局方向
- **AND** 模拟器实时更新显示效果

### Requirement: 属性验证和错误处理
系统 SHALL 对用户输入的属性进行验证，并提供清晰的错误提示。

#### Scenario: 属性格式验证
- **WHEN** 用户输入无效的属性值（如非法的颜色值、超出范围的数值）
- **THEN** 系统显示错误提示信息
- **AND** 高亮显示有问题的输入字段
- **AND** 阻止无效数据的保存

#### Scenario: 约束关系验证
- **WHEN** 用户配置了冲突的约束关系
- **THEN** 系统检测到约束冲突并显示警告信息
- **AND** 提供解决冲突的建议方案

#### Scenario: AI 修改属性同步
- **WHEN** AI 助手应用修改命令
- **THEN** 属性编辑器自动更新以反映修改后的节点属性
- **AND** 实时显示新的节点名称、类型、属性、约束等信息
- **AND** 保持与树形编辑器和模拟器的数据同步

#### Scenario: 属性编辑器刷新
- **WHEN** AI 修改导致当前选中的节点属性发生变化
- **THEN** 属性编辑器立即刷新显示新的属性值
- **AND** 支持属性编辑器的撤销/重做功能，包括AI修改

#### Scenario: 属性修改与模拟器实时同步
- **WHEN** 用户在属性编辑器中修改任何节点属性
- **THEN** 模拟器在100ms内响应并更新对应的 UI 元素显示
- **AND** 保持布局约束关系的正确性
- **AND** 提供视觉反馈（如高亮变化的元素）

#### Scenario: 子节点修改溯源展示
- **WHEN** 用户在属性编辑器中修改非根节点（子节点）的属性
- **THEN** 模拟器自动向上溯源找到包含该子节点的根节点
- **AND** 在模拟器中展示该溯源到的根节点的完整 UI 层级
- **AND** 实时更新对应 UI 元素显示
