/**
 * 组件属性配置
 * 定义所有支持的iOS UI组件的属性及其配置
 */

const COMPONENT_ATTRIBUTES = {
    // 基础视图
    'UIView': {
        backgroundColor: { type: 'color', defaultValue: '#FFFFFF' },
        alpha: { type: 'number', defaultValue: 1.0, min: 0, max: 1, step: 0.1 },
        cornerRadius: { type: 'number', defaultValue: 0, min: 0 },
        cornerMask: { type: 'cornerMask', defaultValue: '' },
        borderWidth: { type: 'number', defaultValue: 0, min: 0 },
        borderColor: { type: 'color', defaultValue: '#000000' }
    },
    'UIViewController': {
        backgroundColor: { type: 'color', defaultValue: '#FFFFFF' },
        alpha: { type: 'number', defaultValue: 1.0, min: 0, max: 1, step: 0.1 },
        cornerRadius: { type: 'number', defaultValue: 0, min: 0 },
        cornerMask: { type: 'cornerMask', defaultValue: '' },
        borderWidth: { type: 'number', defaultValue: 0, min: 0 },
        borderColor: { type: 'color', defaultValue: '#000000' }
    },
    'UIButton': {
        backgroundColor: { type: 'color', defaultValue: '#FFFFFF' },
        alpha: { type: 'number', defaultValue: 1.0, min: 0, max: 1, step: 0.1 },
        cornerRadius: { type: 'number', defaultValue: 0, min: 0 },
        cornerMask: { type: 'cornerMask', defaultValue: '' },
        borderWidth: { type: 'number', defaultValue: 0, min: 0 },
        borderColor: { type: 'color', defaultValue: '#000000' },
        font: {
            type: 'select',
            defaultValue: 'system',
            options: [
                { value: 'system', label: '系统字体' },
                { value: 'system-bold', label: '系统粗体' },
                { value: 'preferred-headline', label: '标题' },
                { value: 'preferred-body', label: '正文' }
            ]
        },
        fontSize: { type: 'number', defaultValue: 17, min: 8, max: 72, step: 1 },
        title: { type: 'text', defaultValue: 'Button' },
        titleColor: { type: 'color', defaultValue: '#007AFF' },
        isEnabled: { type: 'boolean', defaultValue: true },
        states: { type: 'stateGroup', defaultValue: { normal: { title: 'Button', titleColor: '#007AFF', backgroundColor: '#FFFFFF' } } }
    },
    'UILabel': {
        text: { type: 'text', defaultValue: 'Label' },
        font: {
            type: 'select',
            defaultValue: 'system',
            options: [
                { value: 'system', label: '系统字体' },
                { value: 'system-bold', label: '系统粗体' },
                { value: 'system-italic', label: '系统斜体' },
                { value: 'preferred-headline', label: '标题' },
                { value: 'preferred-body', label: '正文' },
                { value: 'preferred-caption1', label: '说明文字1' },
                { value: 'preferred-caption2', label: '说明文字2' },
                { value: 'preferred-footnote', label: '脚注' }
            ]
        },
        fontSize: { type: 'number', defaultValue: 17, min: 8, max: 72, step: 1 },
        textColor: { type: 'color', defaultValue: '#000000' },
        textAlignment: {
            type: 'select',
            defaultValue: 'left',
            options: [
                { value: 'left', label: '左对齐' },
                { value: 'center', label: '居中' },
                { value: 'right', label: '右对齐' },
                { value: 'justified', label: '两端对齐' },
                { value: 'natural', label: '自然' }
            ]
        },
        numberOfLines: { type: 'number', defaultValue: 1, min: 0 },
        lineBreakMode: {
            type: 'select',
            defaultValue: 'byTruncatingTail',
            options: [
                { value: 'byWordWrapping', label: '按单词换行' },
                { value: 'byCharWrapping', label: '按字符换行' },
                { value: 'byClipping', label: '裁剪' },
                { value: 'byTruncatingHead', label: '截断头部' },
                { value: 'byTruncatingTail', label: '截断尾部' },
                { value: 'byTruncatingMiddle', label: '截断中间' }
            ]
        },
        backgroundColor: { type: 'color', defaultValue: '#FFFFFF' },
        alpha: { type: 'number', defaultValue: 1.0, min: 0, max: 1, step: 0.1 },
        cornerRadius: { type: 'number', defaultValue: 0, min: 0 },
        cornerMask: { type: 'cornerMask', defaultValue: '' },
        borderWidth: { type: 'number', defaultValue: 0, min: 0 },
        borderColor: { type: 'color', defaultValue: '#000000' }
    },
    'UITextField': {
        placeholder: { type: 'text', defaultValue: '请输入文本' },
        text: { type: 'text', defaultValue: '' },
        font: {
            type: 'select',
            defaultValue: 'system',
            options: [
                { value: 'system', label: '系统字体' },
                { value: 'system-bold', label: '系统粗体' },
                { value: 'preferred-body', label: '正文' }
            ]
        },
        fontSize: { type: 'number', defaultValue: 17, min: 8, max: 72, step: 1 },
        textColor: { type: 'color', defaultValue: '#000000' },
        textAlignment: { type: 'select', defaultValue: 'left', options: [] },
        borderStyle: { type: 'select', defaultValue: 'roundedRect', options: [] },
        secureTextEntry: { type: 'boolean', defaultValue: false },
        clearButtonMode: { type: 'select', defaultValue: 'never', options: [] },
        backgroundColor: { type: 'color', defaultValue: '#FFFFFF' },
        alpha: { type: 'number', defaultValue: 1.0, min: 0, max: 1, step: 0.1 },
        cornerRadius: { type: 'number', defaultValue: 0, min: 0 },
        cornerMask: { type: 'cornerMask', defaultValue: '' },
        borderWidth: { type: 'number', defaultValue: 0, min: 0 },
        borderColor: { type: 'color', defaultValue: '#000000' }
    },
    'UITextView': {
        text: { type: 'text', defaultValue: '' },
        font: { type: 'select', defaultValue: 'system-17', options: [] },
        fontSize: { type: 'number', defaultValue: 17, min: 8, max: 72, step: 1 },
        textColor: { type: 'color', defaultValue: '#000000' },
        textAlignment: { type: 'select', defaultValue: 'left', options: [] },
        editable: { type: 'boolean', defaultValue: true },
        selectable: { type: 'boolean', defaultValue: true },
        dataDetectorTypes: { type: 'select', defaultValue: 'none', options: [] },
        backgroundColor: { type: 'color', defaultValue: '#FFFFFF' },
        alpha: { type: 'number', defaultValue: 1.0, min: 0, max: 1, step: 0.1 },
        cornerRadius: { type: 'number', defaultValue: 0, min: 0 },
        cornerMask: { type: 'cornerMask', defaultValue: '' },
        borderWidth: { type: 'number', defaultValue: 0, min: 0 },
        borderColor: { type: 'color', defaultValue: '#000000' }
    },
    'UISwitch': {
        isOn: { type: 'boolean', defaultValue: false },
        onTintColor: { type: 'color', defaultValue: '#007AFF' },
        thumbTintColor: { type: 'color', defaultValue: '#FFFFFF' },
        tintColor: { type: 'color', defaultValue: '#C7C7CC' },
        backgroundColor: { type: 'color', defaultValue: '#FFFFFF' },
        alpha: { type: 'number', defaultValue: 1.0, min: 0, max: 1, step: 0.1 },
        cornerRadius: { type: 'number', defaultValue: 0, min: 0 },
        cornerMask: { type: 'cornerMask', defaultValue: '' },
        borderWidth: { type: 'number', defaultValue: 0, min: 0 },
        borderColor: { type: 'color', defaultValue: '#000000' }
    },
    'UISlider': {
        value: { type: 'number', defaultValue: 0.5, min: 0, max: 1, step: 0.1 },
        minimumValue: { type: 'number', defaultValue: 0, min: 0 },
        maximumValue: { type: 'number', defaultValue: 1, min: 0 },
        minimumTrackTintColor: { type: 'color', defaultValue: '#007AFF' },
        maximumTrackTintColor: { type: 'color', defaultValue: '#C7C7CC' },
        thumbTintColor: { type: 'color', defaultValue: '#007AFF' },
        backgroundColor: { type: 'color', defaultValue: '#FFFFFF' },
        alpha: { type: 'number', defaultValue: 1.0, min: 0, max: 1, step: 0.1 },
        cornerRadius: { type: 'number', defaultValue: 0, min: 0 },
        cornerMask: { type: 'cornerMask', defaultValue: '' },
        borderWidth: { type: 'number', defaultValue: 0, min: 0 },
        borderColor: { type: 'color', defaultValue: '#000000' }
    },
    'UISegmentedControl': {
        selectedSegmentIndex: { type: 'number', defaultValue: 0, min: 0 },
        segments: { type: 'textArray', defaultValue: ['第一项', '第二项'] },
        tintColor: { type: 'color', defaultValue: '#007AFF' },
        isMomentary: { type: 'boolean', defaultValue: false },
        backgroundColor: { type: 'color', defaultValue: '#FFFFFF' },
        alpha: { type: 'number', defaultValue: 1.0, min: 0, max: 1, step: 0.1 },
        cornerRadius: { type: 'number', defaultValue: 0, min: 0 },
        cornerMask: { type: 'cornerMask', defaultValue: '' },
        borderWidth: { type: 'number', defaultValue: 0, min: 0 },
        borderColor: { type: 'color', defaultValue: '#000000' }
    },
    'UIImageView': {
        testUrl: { type: 'text', defaultValue: '' },
        imageName: { type: 'text', defaultValue: 'placeholder' },
        contentMode: { type: 'select', defaultValue: 'scaleToFill', options: [] },
        backgroundColor: { type: 'color', defaultValue: '#FFFFFF' },
        alpha: { type: 'number', defaultValue: 1.0, min: 0, max: 1, step: 0.1 },
        cornerRadius: { type: 'number', defaultValue: 0, min: 0 },
        cornerMask: { type: 'cornerMask', defaultValue: '' },
        borderWidth: { type: 'number', defaultValue: 0, min: 0 },
        borderColor: { type: 'color', defaultValue: '#000000' }
    },
    'UIScrollView': {
        contentSize: { type: 'size', defaultValue: '320,480' },
        contentOffset: { type: 'point', defaultValue: '0,0' },
        contentInset: { type: 'edgeInsets', defaultValue: '0,0,0,0' },
        showsHorizontalScrollIndicator: { type: 'boolean', defaultValue: true },
        showsVerticalScrollIndicator: { type: 'boolean', defaultValue: true },
        bounces: { type: 'boolean', defaultValue: true },
        alwaysBounceVertical: { type: 'boolean', defaultValue: false },
        alwaysBounceHorizontal: { type: 'boolean', defaultValue: false },
        pagingEnabled: { type: 'boolean', defaultValue: false },
        scrollEnabled: { type: 'boolean', defaultValue: true },
        directionalLockEnabled: { type: 'boolean', defaultValue: false },
        backgroundColor: { type: 'color', defaultValue: '#FFFFFF' },
        alpha: { type: 'number', defaultValue: 1.0, min: 0, max: 1, step: 0.1 },
        cornerRadius: { type: 'number', defaultValue: 0, min: 0 },
        cornerMask: { type: 'cornerMask', defaultValue: '' },
        borderWidth: { type: 'number', defaultValue: 0, min: 0 },
        borderColor: { type: 'color', defaultValue: '#000000' }
    },
    'UITableView': {
        style: { type: 'select', defaultValue: 'plain', options: [] },
        separatorStyle: { type: 'select', defaultValue: 'singleLine', options: [] },
        separatorColor: { type: 'color', defaultValue: '#C7C7CC' },
        rowHeight: { type: 'number', defaultValue: 44, min: 0 },
        estimatedRowHeight: { type: 'number', defaultValue: 44, min: 0 },
        backgroundColor: { type: 'color', defaultValue: '#FFFFFF' },
        alpha: { type: 'number', defaultValue: 1.0, min: 0, max: 1, step: 0.1 },
        cornerRadius: { type: 'number', defaultValue: 0, min: 0 },
        cornerMask: { type: 'cornerMask', defaultValue: '' },
        borderWidth: { type: 'number', defaultValue: 0, min: 0 },
        borderColor: { type: 'color', defaultValue: '#000000' }
    },
    'UICollectionView': {
        collectionViewLayout: { type: 'select', defaultValue: 'flow', options: [] },
        scrollDirection: { type: 'select', defaultValue: 'vertical', options: [] },
        minimumLineSpacing: { type: 'number', defaultValue: 10, min: 0 },
        minimumInteritemSpacing: { type: 'number', defaultValue: 10, min: 0 },
        backgroundColor: { type: 'color', defaultValue: '#FFFFFF' },
        alpha: { type: 'number', defaultValue: 1.0, min: 0, max: 1, step: 0.1 },
        cornerRadius: { type: 'number', defaultValue: 0, min: 0 },
        cornerMask: { type: 'cornerMask', defaultValue: '' },
        borderWidth: { type: 'number', defaultValue: 0, min: 0 },
        borderColor: { type: 'color', defaultValue: '#000000' }
    },
    'UIStackView': {
        axis: { type: 'select', defaultValue: 'horizontal', options: [] },
        distribution: { type: 'select', defaultValue: 'fill', options: [] },
        alignment: { type: 'select', defaultValue: 'fill', options: [] },
        spacing: { type: 'number', defaultValue: 0, min: 0 },
        backgroundColor: { type: 'color', defaultValue: '#FFFFFF' },
        alpha: { type: 'number', defaultValue: 1.0, min: 0, max: 1, step: 0.1 },
        cornerRadius: { type: 'number', defaultValue: 0, min: 0 },
        cornerMask: { type: 'cornerMask', defaultValue: '' },
        borderWidth: { type: 'number', defaultValue: 0, min: 0 },
        borderColor: { type: 'color', defaultValue: '#000000' }
    },
    'UIAlertView': {
        title: { type: 'text', defaultValue: '警告' },
        message: { type: 'text', defaultValue: '这是一个警告消息' },
        alertViewStyle: { type: 'select', defaultValue: 'default', options: [] },
        backgroundColor: { type: 'color', defaultValue: '#FFFFFF' },
        alpha: { type: 'number', defaultValue: 1.0, min: 0, max: 1, step: 0.1 },
        cornerRadius: { type: 'number', defaultValue: 0, min: 0 },
        cornerMask: { type: 'cornerMask', defaultValue: '' },
        borderWidth: { type: 'number', defaultValue: 0, min: 0 },
        borderColor: { type: 'color', defaultValue: '#000000' }
    },
    'UISearchBar': {
        placeholder: { type: 'text', defaultValue: '搜索' },
        text: { type: 'text', defaultValue: '' },
        barStyle: { type: 'select', defaultValue: 'default', options: [] },
        searchBarStyle: { type: 'select', defaultValue: 'default', options: [] },
        showsCancelButton: { type: 'boolean', defaultValue: false },
        showsBookmarkButton: { type: 'boolean', defaultValue: false },
        showsSearchResultsButton: { type: 'boolean', defaultValue: false },
        backgroundColor: { type: 'color', defaultValue: '#FFFFFF' },
        alpha: { type: 'number', defaultValue: 1.0, min: 0, max: 1, step: 0.1 },
        cornerRadius: { type: 'number', defaultValue: 0, min: 0 },
        cornerMask: { type: 'cornerMask', defaultValue: '' },
        borderWidth: { type: 'number', defaultValue: 0, min: 0 },
        borderColor: { type: 'color', defaultValue: '#000000' }
    },
    'UIActivityIndicatorView': {
        isAnimating: { type: 'boolean', defaultValue: false },
        color: { type: 'color', defaultValue: '#007AFF' },
        hidesWhenStopped: { type: 'boolean', defaultValue: true },
        style: { type: 'select', defaultValue: 'medium', options: [] },
        backgroundColor: { type: 'color', defaultValue: '#FFFFFF' },
        alpha: { type: 'number', defaultValue: 1.0, min: 0, max: 1, step: 0.1 },
        cornerRadius: { type: 'number', defaultValue: 0, min: 0 },
        cornerMask: { type: 'cornerMask', defaultValue: '' },
        borderWidth: { type: 'number', defaultValue: 0, min: 0 },
        borderColor: { type: 'color', defaultValue: '#000000' }
    },
    'UIProgressView': {
        progress: { type: 'number', defaultValue: 0.5, min: 0, max: 1, step: 0.1 },
        progressTintColor: { type: 'color', defaultValue: '#007AFF' },
        trackTintColor: { type: 'color', defaultValue: '#C7C7CC' },
        progressViewStyle: { type: 'select', defaultValue: 'default', options: [] },
        backgroundColor: { type: 'color', defaultValue: '#FFFFFF' },
        alpha: { type: 'number', defaultValue: 1.0, min: 0, max: 1, step: 0.1 },
        cornerRadius: { type: 'number', defaultValue: 0, min: 0 },
        cornerMask: { type: 'cornerMask', defaultValue: '' },
        borderWidth: { type: 'number', defaultValue: 0, min: 0 },
        borderColor: { type: 'color', defaultValue: '#000000' }
    },
    'UIPickerView': {
        showsSelectionIndicator: { type: 'boolean', defaultValue: true },
        dataSource: { type: 'text', defaultValue: '["选项1", "选项2", "选项3"]' },
        backgroundColor: { type: 'color', defaultValue: '#FFFFFF' },
        alpha: { type: 'number', defaultValue: 1.0, min: 0, max: 1, step: 0.1 },
        cornerRadius: { type: 'number', defaultValue: 0, min: 0 },
        cornerMask: { type: 'cornerMask', defaultValue: '' },
        borderWidth: { type: 'number', defaultValue: 0, min: 0 },
        borderColor: { type: 'color', defaultValue: '#000000' }
    },
    'UIDatePicker': {
        datePickerMode: { type: 'select', defaultValue: 'dateAndTime', options: [] },
        locale: { type: 'text', defaultValue: 'zh_CN' },
        timeZone: { type: 'text', defaultValue: 'Asia/Shanghai' },
        minimumDate: { type: 'text', defaultValue: '' },
        maximumDate: { type: 'text', defaultValue: '' },
        backgroundColor: { type: 'color', defaultValue: '#FFFFFF' },
        alpha: { type: 'number', defaultValue: 1.0, min: 0, max: 1, step: 0.1 },
        cornerRadius: { type: 'number', defaultValue: 0, min: 0 },
        borderWidth: { type: 'number', defaultValue: 0, min: 0 },
        borderColor: { type: 'color', defaultValue: '#000000' }
    },
    'UIWebView': {
        scalesPageToFit: { type: 'boolean', defaultValue: true },
        allowsInlineMediaPlayback: { type: 'boolean', defaultValue: false },
        mediaPlaybackRequiresUserAction: { type: 'boolean', defaultValue: true },
        dataDetectorTypes: { type: 'select', defaultValue: 'none', options: [] },
        backgroundColor: { type: 'color', defaultValue: '#FFFFFF' },
        alpha: { type: 'number', defaultValue: 1.0, min: 0, max: 1, step: 0.1 },
        cornerRadius: { type: 'number', defaultValue: 0, min: 0 },
        borderWidth: { type: 'number', defaultValue: 0, min: 0 },
        borderColor: { type: 'color', defaultValue: '#000000' }
    },
    'WKWebView': {
        allowsBackForwardNavigationGestures: { type: 'boolean', defaultValue: true },
        allowsLinkPreview: { type: 'boolean', defaultValue: true },
        configuration: { type: 'text', defaultValue: 'default' },
        backgroundColor: { type: 'color', defaultValue: '#FFFFFF' },
        alpha: { type: 'number', defaultValue: 1.0, min: 0, max: 1, step: 0.1 },
        cornerRadius: { type: 'number', defaultValue: 0, min: 0 },
        cornerMask: { type: 'cornerMask', defaultValue: '' },
        borderWidth: { type: 'number', defaultValue: 0, min: 0 },
        borderColor: { type: 'color', defaultValue: '#000000' }
    },
    'UIToolbar': {
        barStyle: { type: 'select', defaultValue: 'default', options: [] },
        translucent: { type: 'boolean', defaultValue: true },
        items: { type: 'textArray', defaultValue: [] },
        backgroundColor: { type: 'color', defaultValue: '#F2F2F7' },
        alpha: { type: 'number', defaultValue: 1.0, min: 0, max: 1, step: 0.1 },
        cornerRadius: { type: 'number', defaultValue: 0, min: 0 },
        cornerMask: { type: 'cornerMask', defaultValue: '' },
        borderWidth: { type: 'number', defaultValue: 0, min: 0 },
        borderColor: { type: 'color', defaultValue: '#000000' }
    },
    'UINavigationBar': {
        barStyle: { type: 'select', defaultValue: 'default', options: [] },
        translucent: { type: 'boolean', defaultValue: true },
        title: { type: 'text', defaultValue: '标题' },
        titleTextAttributes: { type: 'text', defaultValue: '{}' },
        items: { type: 'textArray', defaultValue: [] },
        backgroundColor: { type: 'color', defaultValue: '#F2F2F7' },
        alpha: { type: 'number', defaultValue: 1.0, min: 0, max: 1, step: 0.1 },
        cornerRadius: { type: 'number', defaultValue: 0, min: 0 },
        borderWidth: { type: 'number', defaultValue: 0, min: 0 },
        borderColor: { type: 'color', defaultValue: '#000000' }
    },
    'UITabBar': {
        barStyle: { type: 'select', defaultValue: 'default', options: [] },
        translucent: { type: 'boolean', defaultValue: true },
        items: { type: 'textArray', defaultValue: [] },
        selectedItem: { type: 'text', defaultValue: '' },
        backgroundColor: { type: 'color', defaultValue: '#F2F2F7' },
        alpha: { type: 'number', defaultValue: 1.0, min: 0, max: 1, step: 0.1 },
        cornerRadius: { type: 'number', defaultValue: 0, min: 0 },
        borderWidth: { type: 'number', defaultValue: 0, min: 0 },
        borderColor: { type: 'color', defaultValue: '#000000' }
    },
    'UIStatusBar': {
        style: { type: 'select', defaultValue: 'default', options: [] },
        hidden: { type: 'boolean', defaultValue: false },
        animation: { type: 'select', defaultValue: 'none', options: [] },
        backgroundColor: { type: 'color', defaultValue: '#000000' },
        alpha: { type: 'number', defaultValue: 1.0, min: 0, max: 1, step: 0.1 },
        cornerRadius: { type: 'number', defaultValue: 0, min: 0 },
        borderWidth: { type: 'number', defaultValue: 0, min: 0 },
        borderColor: { type: 'color', defaultValue: '#000000' }
    },
    'UIPopoverController': {
        contentViewController: { type: 'text', defaultValue: '' },
        passthroughViews: { type: 'textArray', defaultValue: [] },
        popoverContentSize: { type: 'size', defaultValue: '320,480' },
        backgroundColor: { type: 'color', defaultValue: '#FFFFFF' },
        alpha: { type: 'number', defaultValue: 1.0, min: 0, max: 1, step: 0.1 },
        cornerRadius: { type: 'number', defaultValue: 0, min: 0 },
        borderWidth: { type: 'number', defaultValue: 0, min: 0 },
        borderColor: { type: 'color', defaultValue: '#000000' }
    },
    'UIActionSheet': {
        title: { type: 'text', defaultValue: '操作表' },
        destructiveButtonIndex: { type: 'number', defaultValue: -1, min: -1 },
        cancelButtonIndex: { type: 'number', defaultValue: -1, min: -1 },
        otherButtonTitles: { type: 'textArray', defaultValue: ['确定', '取消'] },
        backgroundColor: { type: 'color', defaultValue: '#FFFFFF' },
        alpha: { type: 'number', defaultValue: 1.0, min: 0, max: 1, step: 0.1 },
        cornerRadius: { type: 'number', defaultValue: 0, min: 0 },
        borderWidth: { type: 'number', defaultValue: 0, min: 0 },
        borderColor: { type: 'color', defaultValue: '#000000' }
    },
    'UITableViewCell': {
        style: { type: 'select', defaultValue: 'default', options: [] },
        selectionStyle: { type: 'select', defaultValue: 'default', options: [] },
        accessoryType: { type: 'select', defaultValue: 'none', options: [] },
        textLabel: { type: 'text', defaultValue: '单元格' },
        detailTextLabel: { type: 'text', defaultValue: '' },
        backgroundColor: { type: 'color', defaultValue: '#FFFFFF' },
        alpha: { type: 'number', defaultValue: 1.0, min: 0, max: 1, step: 0.1 },
        cornerRadius: { type: 'number', defaultValue: 0, min: 0 },
        cornerMask: { type: 'cornerMask', defaultValue: '' },
        borderWidth: { type: 'number', defaultValue: 0, min: 0 },
        borderColor: { type: 'color', defaultValue: '#000000' }
    }
};

/**
 * 获取组件属性定义
 * @param {string} componentType - 组件类型
 * @returns {Object} 组件属性定义
 */
function getComponentAttributes(componentType) {
    return COMPONENT_ATTRIBUTES[componentType] || {};
}

/**
 * 获取所有支持的组件类型
 * @returns {Array} 组件类型数组
 */
function getSupportedComponentTypes() {
    return Object.keys(COMPONENT_ATTRIBUTES);
}

// 导出到全局作用域以便其他模块使用
if (typeof window !== 'undefined') {
    window.COMPONENT_ATTRIBUTES = COMPONENT_ATTRIBUTES;
    window.getComponentAttributes = getComponentAttributes;
    window.getSupportedComponentTypes = getSupportedComponentTypes;
}
