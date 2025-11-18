import * as fs from 'fs/promises';
import * as path from 'path';
import { ExportOptions, ImportResult } from '../types/storage-types';
import { AppConfig } from '../config/config-manager';

/**
 * 导出管理器
 */
export class ExportManager {
    /**
     * 导出配置到文件
     */
    async exportConfig(config: AppConfig, options: ExportOptions): Promise<void> {
        try {
            // 准备导出的数据
            const exportData = this.prepareExportData(config, options);

            // 确保输出目录存在
            const outputDir = path.dirname(options.outputPath);
            await fs.mkdir(outputDir, { recursive: true });

            // 写入文件
            await fs.writeFile(options.outputPath, JSON.stringify(exportData, null, 2), 'utf-8');

            console.log(`配置已导出到: ${options.outputPath}`);
        } catch (error) {
            console.error('导出配置失败:', error);
            throw error;
        }
    }

    /**
     * 从文件导入配置
     */
    async importConfig(filePath: string): Promise<ImportResult> {
        const result: ImportResult = {
            success: false,
            importedConfig: this.getEmptyConfig(),
            warnings: [],
            errors: [],
            importedCount: {
                mockServers: 0,
                proxyServers: 0
            }
        };

        try {
            console.log(`开始导入配置文件: ${filePath}`);

            const fileData = await fs.readFile(filePath, 'utf-8');
            console.log(`配置文件读取成功，文件大小: ${fileData.length} 字节`);

            const importData = JSON.parse(fileData);
            console.log('配置文件JSON解析成功');

            // 验证导入数据
            const validation = this.validateImportData(importData);
            console.log(`配置验证完成，是否有效: ${validation.isValid}, 错误数: ${validation.errors.length}, 警告数: ${validation.warnings.length}`);

            if (!validation.isValid) {
                result.errors = validation.errors;
                result.warnings = validation.warnings;
                console.error('配置验证失败:', validation.errors);
                return result;
            }

            // 提取配置
            const importedConfig = this.extractConfig(importData);
            result.importedConfig = importedConfig;
            result.warnings = validation.warnings;
            result.success = true;

            // 统计导入数量
            result.importedCount = {
                mockServers: importedConfig.mockServers.length,
                proxyServers: importedConfig.proxyServers.length
            };

            console.log(`从文件导入配置成功: ${filePath}`);
            console.log(`导入模拟服务器: ${result.importedCount.mockServers} 个`);
            console.log(`导入代理服务器: ${result.importedCount.proxyServers} 个`);
            console.log(`导入警告: ${result.warnings.length} 个`);

        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            result.errors.push(`导入文件失败: ${errorMessage}`);
            console.error('导入配置失败:', error);
            console.error('错误详情:', errorMessage);
        }

        return result;
    }

    /**
     * 准备导出数据
     */
    private prepareExportData(config: AppConfig, options: ExportOptions): any {
        const exportData: any = {
            version: '1.0',
            exportedAt: new Date().toISOString(),
            metadata: {
                serverCount: 0,
                exportType: options.type,
                description: this.getExportDescription(options)
            }
        };

        // 根据导出类型筛选配置
        let exportConfig: Partial<AppConfig> = {};

        if (options.type === 'full') {
            exportConfig = { ...config };
        } else if (options.type === 'selected' && options.selectedIds) {
            exportConfig = this.filterSelectedConfig(config, options.selectedIds);
        } else {
            exportConfig = this.filterByType(config, options);
        }

        exportData.config = exportConfig;
        exportData.metadata.serverCount =
            (exportConfig.mockServers?.length || 0) +
            (exportConfig.proxyServers?.length || 0);

        return exportData;
    }

    /**
     * 筛选选中的配置
     */
    private filterSelectedConfig(config: AppConfig, selectedIds: string[]): Partial<AppConfig> {
        const filteredConfig: Partial<AppConfig> = {
            settings: config.settings
        };

        if (config.mockServers) {
            filteredConfig.mockServers = config.mockServers.filter(server =>
                selectedIds.includes(server.id)
            );
        }

        if (config.proxyServers) {
            filteredConfig.proxyServers = config.proxyServers.filter(server =>
                selectedIds.includes(server.id)
            );
        }

        return filteredConfig;
    }

    /**
     * 按类型筛选配置
     */
    private filterByType(config: AppConfig, options: ExportOptions): Partial<AppConfig> {
        const filteredConfig: Partial<AppConfig> = {};

        if (options.includeMockServers) {
            filteredConfig.mockServers = config.mockServers;
        }

        if (options.includeProxyServers) {
            filteredConfig.proxyServers = config.proxyServers;
        }

        if (options.includeSettings) {
            filteredConfig.settings = config.settings;
        }

        return filteredConfig;
    }

    /**
     * 验证导入数据
     */
    private validateImportData(importData: any): { isValid: boolean; errors: string[]; warnings: string[] } {
        const errors: string[] = [];
        const warnings: string[] = [];

        console.log('开始验证导入数据结构...');

        if (!importData || typeof importData !== 'object') {
            const errorMsg = '导入数据必须是有效的 JSON 对象';
            errors.push(errorMsg);
            console.error('验证失败:', errorMsg);
            return { isValid: false, errors, warnings };
        }

        // 检测数据格式：标准导出格式 vs 直接配置格式
        let configData: any;
        let isStandardFormat = false;

        if (importData.config && typeof importData.config === 'object') {
            // 标准格式：包含 version 和 config
            configData = importData.config;
            isStandardFormat = true;
            console.log('检测到标准导入格式 (包含 version 和 config)');

            // 检查版本
            if (!importData.version) {
                warnings.push('导入数据缺少版本信息，可能不兼容');
                console.warn('导入数据缺少版本信息');
            } else {
                console.log(`导入数据版本: ${importData.version}`);
            }
        } else if (importData.mockServers !== undefined || importData.proxyServers !== undefined) {
            // 直接配置格式：直接包含 mockServers、proxyServers、settings
            configData = importData;
            isStandardFormat = false;
            console.log('检测到直接配置格式 (直接包含配置字段)');
            warnings.push('检测到直接配置格式，建议使用标准导出格式以获得更好的兼容性');
        } else {
            const errorMsg = '导入数据格式无法识别：必须包含 config 字段或直接包含 mockServers/proxyServers 配置';
            errors.push(errorMsg);
            console.error('验证失败:', errorMsg);
            return { isValid: false, errors, warnings };
        }

        console.log('配置数据验证开始...');

        // 验证 mockServers
        if (configData.mockServers !== undefined) {
            if (!Array.isArray(configData.mockServers)) {
                errors.push('mockServers 必须是数组');
                console.error('mockServers 不是数组');
            } else {
                console.log(`mockServers 数量: ${configData.mockServers.length}`);
            }
        } else {
            console.log('未找到 mockServers 配置');
        }

        // 验证 proxyServers
        if (configData.proxyServers !== undefined) {
            if (!Array.isArray(configData.proxyServers)) {
                warnings.push('proxyServers 不是数组，将忽略该字段');
                console.warn('proxyServers 不是数组');
            } else {
                console.log(`proxyServers 数量: ${configData.proxyServers.length}`);
            }
        } else {
            console.log('未找到 proxyServers 配置');
        }

        // 验证 settings
        if (configData.settings !== undefined) {
            if (typeof configData.settings !== 'object') {
                warnings.push('settings 不是对象，将使用默认设置');
                console.warn('settings 不是对象');
            } else {
                console.log('settings 配置存在');
            }
        } else {
            console.log('未找到 settings 配置');
        }

        // 如果没有找到任何配置数据，添加错误
        if (configData.mockServers === undefined && configData.proxyServers === undefined) {
            errors.push('导入数据中未找到有效的配置数据（mockServers 或 proxyServers）');
        }

        const validationResult = {
            isValid: errors.length === 0,
            errors,
            warnings
        };

        console.log(`验证完成: ${validationResult.isValid ? '通过' : '失败'}, 错误数: ${errors.length}, 警告数: ${warnings.length}`);
        return validationResult;
    }

    /**
     * 从导入数据中提取配置
     */
    private extractConfig(importData: any): AppConfig {
        const defaultConfig = this.getEmptyConfig();

        // 检测数据格式并提取配置
        let configData: any;

        if (importData.config && typeof importData.config === 'object') {
            // 标准格式：从 config 字段提取
            configData = importData.config;
            console.log('从标准格式提取配置');
        } else {
            // 直接配置格式：直接使用导入数据
            configData = importData;
            console.log('从直接配置格式提取配置');
        }

        return {
            mockServers: configData.mockServers || defaultConfig.mockServers,
            proxyServers: configData.proxyServers || defaultConfig.proxyServers,
            settings: {
                ...defaultConfig.settings,
                ...(configData.settings || {})
            }
        };
    }

    /**
     * 获取导出描述
     */
    private getExportDescription(options: ExportOptions): string {
        const parts: string[] = [];

        if (options.type === 'full') {
            parts.push('完整配置导出');
        } else if (options.type === 'selected') {
            parts.push('选择性导出');
        } else {
            parts.push('模板导出');
        }

        if (options.includeMockServers) parts.push('模拟服务器');
        if (options.includeProxyServers) parts.push('代理服务器');
        if (options.includeSettings) parts.push('设置');

        return parts.join(' + ');
    }

    /**
     * 获取空配置
     */
    private getEmptyConfig(): AppConfig {
        return {
            mockServers: [],
            proxyServers: [],
            settings: {
                autoStart: false,
                logRetentionDays: 7,
                maxLogEntries: 1000
            }
        };
    }

    /**
     * 生成导出文件名
     */
    generateExportFileName(baseName?: string): string {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const name = baseName || 'localproxy-config';
        return `${name}-${timestamp}.json`;
    }
}
