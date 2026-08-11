jn.define('src/util', (require, exports, module) => {
	const { Color } = require('tokens');

	const blankAvatar = '/bitrix/js/im/images/blank.gif';
	const GRIDVIEW_VERSION_IOS = '5.6.300';
	const GRIDVIEW_VERSION_ANDROID = '5.20.0';

	function convertHexToColorEnum(color)
	{
		return new Color('avatarColor', color);
	}

	function isVisible(num, min, max)
	{
		return num >= min && num <= max;
	}

	function getIsAndroid()
	{
		return device.platform === 'android';
	}

	function getIsLandscapeOrientation()
	{
		return device.screen.orientation === 'landscape' || device.screen.height < device.screen.width;
	}

	function getIsIos()
	{
		return device.platform === 'iOS';
	}

	function isAvatarBlank(url)
	{
		return typeof (url) !== 'string' || url === '' || url.endsWith(blankAvatar);
	}

	function versionToNumber(v)
	{
		const [major, minor, patch] = v.split(' ')[0].split('.').map(Number);
		return major * 1e6 + minor * 1e3 + patch;
	}

	function isGridViewSupported()
	{
		const appVersion = versionToNumber(Application.getAppVersion());
		return (getIsIos() && appVersion >= versionToNumber(GRIDVIEW_VERSION_IOS))
			|| (getIsAndroid() && appVersion >= versionToNumber(GRIDVIEW_VERSION_ANDROID));
	}

	module.exports = {
		convertHexToColorEnum,
		isVisible,
		getIsAndroid,
		getIsLandscapeOrientation,
		getIsIos,
		isAvatarBlank,
		isGridViewSupported,
	};
});
