/**
 * 设备管理器
 * 负责管理设备预设、设备切换和分辨率显示
 */
class DeviceManager {
    constructor() {
        this.devicePresets = {
            iphone16: {
                width: 393 + 40,
                height: 852 + 40,
                name: 'iPhone 16',
                logicalResolution: '393×852 pt',
                physicalResolution: '1179×2556 px'
            },
            iphone16plus: {
                width: 428 + 40,
                height: 926 + 40,
                name: 'iPhone 16 Plus',
                logicalResolution: '428×926 pt',
                physicalResolution: '1284×2778 px'
            },
            iphone16pro: {
                width: 393 + 40,
                height: 852 + 40,
                name: 'iPhone 16 Pro',
                logicalResolution: '393×852 pt',
                physicalResolution: '1179×2556 px'
            },
            iphone16promax: {
                width: 430 + 40,
                height: 932 + 40,
                name: 'iPhone 16 Pro Max',
                logicalResolution: '430×932 pt',
                physicalResolution: '1290×2796 px'
            },
            iphone15: {
                width: 393 + 40,
                height: 852 + 40,
                name: 'iPhone 15',
                logicalResolution: '393×852 pt',
                physicalResolution: '1179×2556 px'
            },
            iphone15pro: {
                width: 393 + 40,
                height: 852 + 40,
                name: 'iPhone 15 Pro',
                logicalResolution: '393×852 pt',
                physicalResolution: '1179×2556 px'
            },
            iphone14: {
                width: 390 + 40,
                height: 844 + 40,
                name: 'iPhone 14',
                logicalResolution: '390×844 pt',
                physicalResolution: '1170×2532 px'
            },
            custom: {
                width: 393 + 40,
                height: 852 + 40,
                name: '自定义',
                logicalResolution: '393×852 pt',
                physicalResolution: '1179×2556 px'
            }
        };
        this.currentDevice = 'iphone16promax';
    }

    /**
     * 获取当前设备信息
     * @returns {Object} 设备信息
     */
    getCurrentDevice() {
        return this.devicePresets[this.currentDevice];
    }

    /**
     * 设置当前设备
     * @param {string} deviceId - 设备ID
     */
    setCurrentDevice(deviceId) {
        if (this.devicePresets[deviceId]) {
            this.currentDevice = deviceId;
        } else {
            console.warn(`设备ID "${deviceId}" 不存在，使用默认设备`);
            this.currentDevice = 'iphone16promax';
        }
    }

    /**
     * 设置自定义设备尺寸
     * @param {number} width - 宽度
     * @param {number} height - 高度
     */
    setCustomDeviceSize(width, height) {
        this.devicePresets.custom.width = width;
        this.devicePresets.custom.height = height;
        this.currentDevice = 'custom';
    }

    /**
     * 获取所有设备预设
     * @returns {Object} 设备预设对象
     */
    getAllDevicePresets() {
        return this.devicePresets;
    }

    /**
     * 获取设备列表（用于选择器）
     * @returns {Array} 设备列表
     */
    getDeviceList() {
        return Object.entries(this.devicePresets).map(([id, device]) => ({
            id,
            name: device.name,
            width: device.width,
            height: device.height
        }));
    }

    /**
     * 更新分辨率显示
     * @param {HTMLElement} resolutionDisplay - 分辨率显示元素
     */
    updateResolutionDisplay(resolutionDisplay) {
        const device = this.getCurrentDevice();
        if (!device || !resolutionDisplay) return;

        const resolutionText = resolutionDisplay.querySelector('.resolution-text');
        if (resolutionText) {
            resolutionText.textContent = `${device.logicalResolution} (${device.physicalResolution})`;
        }
    }

    /**
     * 验证设备尺寸
     * @param {number} width - 宽度
     * @param {number} height - 高度
     * @returns {boolean} 是否有效
     */
    validateDeviceSize(width, height) {
        return width > 0 && height > 0 && width <= 5000 && height <= 5000;
    }

    /**
     * 获取设备屏幕尺寸（减去边框）
     * @returns {Object} 屏幕尺寸 {width, height}
     */
    getScreenSize() {
        const device = this.getCurrentDevice();
        return {
            width: device.width - 40,
            height: device.height - 40
        };
    }
}

// 导出设备管理器
if (typeof module !== 'undefined' && module.exports) {
    module.exports = DeviceManager;
}

// 创建全局设备管理器实例
let deviceManager = null;

// 初始化设备管理器
document.addEventListener('DOMContentLoaded', () => {
    deviceManager = new DeviceManager();
    window.deviceManager = deviceManager;
});

console.log('📱 设备管理器已加载');
