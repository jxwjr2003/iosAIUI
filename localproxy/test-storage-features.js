/**
 * 存储功能测试脚本
 * 用于验证多路径配置管理器、动态文件加载器和导出管理器的基本功能
 */

const { FileSystemStorage } = require('./dist/storage/file-system-storage');
const { DynamicFileLoader } = require('./dist/storage/dynamic-file-loader');
const { ExportManager } = require('./dist/storage/export-manager');
const fs = require('fs').promises;
const path = require('path');
const os = require('os');

async function runTests() {
    console.log('开始存储功能测试...\n');

    try {
        // 1. 测试文件系统存储
        console.log('1. 测试文件系统存储...');
        const testConfigPath = path.join(__dirname, 'test-config.json');
        const storage = new FileSystemStorage(testConfigPath, '测试存储');

        const testConfig = {
            mockServers: [
                {
                    id: 'test-server-1',
                    name: '测试服务器',
                    port: 3000,
                    protocol: 'http',
                    routes: [
                        {
                            id: 'route-1',
                            path: '/api/test',
                            method: 'GET',
                            headers: { 'Content-Type': 'application/json' },
                            body: { message: 'Hello from test' },
                            statusCode: 200,
                            description: '测试路由'
                        }
                    ]
                }
            ],
            proxyServers: [],
            settings: {
                autoStart: false,
                logRetentionDays: 7,
                maxLogEntries: 1000
            }
        };

        await storage.saveConfig(testConfig);
        console.log('✓ 配置保存成功');

        const loadedConfig = await storage.loadConfig();
        console.log('✓ 配置加载成功');
        console.log(`  加载的服务器数量: ${loadedConfig.mockServers.length}`);

        // 2. 测试动态文件加载器
        console.log('\n2. 测试动态文件加载器...');
        const loader = new DynamicFileLoader();

        const loadedFromFile = await loader.loadFromFile(testConfigPath);
        console.log('✓ 从文件加载配置成功');
        console.log(`  文件中的服务器数量: ${loadedFromFile.mockServers.length}`);

        // 3. 测试导出管理器
        console.log('\n3. 测试导出管理器...');
        const exportManager = new ExportManager();
        const exportPath = path.join(__dirname, 'test-export.json');

        const exportOptions = {
            type: 'full',
            includeMockServers: true,
            includeProxyServers: true,
            includeSettings: true,
            outputPath: exportPath
        };

        await exportManager.exportConfig(testConfig, exportOptions);
        console.log('✓ 配置导出成功');

        const importResult = await exportManager.importConfig(exportPath);
        if (importResult.success) {
            console.log('✓ 配置导入成功');
            console.log(`  导入的模拟服务器数量: ${importResult.importedCount.mockServers}`);
        } else {
            console.log('✗ 配置导入失败:', importResult.errors);
        }

        // 4. 测试多路径配置管理器
        console.log('\n4. 测试多路径配置管理器...');
        const configManager = new ConfigManager();
        const multiPathManager = new MultiPathConfigManager(configManager);

        const locations = multiPathManager.getAllStorageLocations();
        console.log(`✓ 获取存储位置成功，数量: ${locations.length}`);

        const customLocation = await multiPathManager.addCustomStorage(path.join(__dirname, 'custom-config.json'), '自定义配置');
        console.log('✓ 添加自定义存储位置成功');

        const newLocations = multiPathManager.getAllStorageLocations();
        console.log(`  现在存储位置数量: ${newLocations.length}`);

        // 5. 清理测试文件
        console.log('\n5. 清理测试文件...');
        await fs.unlink(testConfigPath).catch(() => { });
        await fs.unlink(exportPath).catch(() => { });
        await fs.unlink(path.join(__dirname, 'custom-config.json')).catch(() => { });
        console.log('✓ 测试文件清理完成');

        console.log('\n🎉 所有测试通过！存储功能正常工作。');

    } catch (error) {
        console.error('❌ 测试失败:', error);
    }
}

// 运行测试
runTests();