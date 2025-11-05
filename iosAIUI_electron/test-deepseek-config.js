// DeepSeek配置功能测试脚本
console.log('🧪 测试DeepSeek配置功能...');

// 模拟测试AI聊天助手配置功能
function testDeepSeekConfig() {
    console.log('1. 测试配置加载...');

    // 测试配置加载
    const savedConfig = localStorage.getItem('deepseek-config');
    if (savedConfig) {
        console.log('✅ 配置加载成功:', JSON.parse(savedConfig));
    } else {
        console.log('ℹ️ 无保存的配置，使用默认配置');
    }

    console.log('2. 测试配置保存...');

    // 测试配置保存
    const testConfig = {
        url: 'https://api.deepseek.com/v1',
        apiKey: 'test-api-key',
        model: 'deepseek-chat',
        models: [
            { id: 'deepseek-chat', name: 'deepseek-chat' },
            { id: 'deepseek-coder', name: 'deepseek-coder' }
        ]
    };

    localStorage.setItem('deepseek-config', JSON.stringify(testConfig));
    console.log('✅ 配置保存成功');

    console.log('3. 测试配置验证...');

    // 验证配置
    const loadedConfig = JSON.parse(localStorage.getItem('deepseek-config'));
    if (loadedConfig && loadedConfig.url === testConfig.url) {
        console.log('✅ 配置验证成功');
    } else {
        console.log('❌ 配置验证失败');
    }

    console.log('4. 测试配置清理...');

    // 清理测试配置
    localStorage.removeItem('deepseek-config');
    console.log('✅ 配置清理完成');

    console.log('🎉 DeepSeek配置功能测试完成！');
}

// 运行测试
testDeepSeekConfig();
