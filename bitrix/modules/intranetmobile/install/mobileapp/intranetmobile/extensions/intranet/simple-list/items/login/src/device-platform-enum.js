/**
 * @module intranet/simple-list/items/login/src/device-platform-enum
 */
jn.define('intranet/simple-list/items/login/src/device-platform-enum', (require, exports, module) => {
	const { BaseEnum } = require('utils/enums/base');
	const { AppTheme } = require('apptheme/extended');
	const IMAGE_PATH = `${currentDomain}/bitrix/mobileapp/intranetmobile/extensions/intranet/simple-list/items/login/assets/`;

	/**
	 * @class DevicePlatform
	 * @extends {BaseEnum<DevicePlatform>}
	 */
	class DevicePlatform extends BaseEnum
	{
		static ANDROID = new DevicePlatform('Android', {
			imageUrl: `${IMAGE_PATH}android.png`,
		});

		static IOS = new DevicePlatform('iOS', {
			imageUrl: `${IMAGE_PATH}iphone.png`,
		});

		static WINDOWS = new DevicePlatform('Windows', {
			imageUrl: `${IMAGE_PATH}windows.png`,
		});

		static MACOS = new DevicePlatform('macOS', {
			imageUrl: `${IMAGE_PATH}mac.png`,
		});

		static LINUXRPM = new DevicePlatform('LinuxRpm', {
			imageUrl: `${IMAGE_PATH}linux.png`,
		});

		static LINUXDEB = new DevicePlatform('LinuxDeb', {
			imageUrl: `${IMAGE_PATH}linux.png`,
		});

		static UNKNOWN = new DevicePlatform('Unknown', {
			imageUrl: `${IMAGE_PATH}${AppTheme.id}-unknown.png`,
		});

		getImageUrl()
		{
			return this.getValue().imageUrl;
		}
	}

	module.exports = { DevicePlatform };
});
