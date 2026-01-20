/**
 * @module settings-v2/services/assets-preload
 */
jn.define('settings-v2/services/assets-preload', (require, exports, module) => {
	const {
		ASSET_PATH,
		BannerImageName,
		ImageName,
		StyleType,
		ThemeType,
		VideoQualityType,
	} = require('settings-v2/const');
	const { downloadImages } = require('asset-manager');
	const AppTheme = require('apptheme');

	const BANNER_ASSET_PATH = `${ASSET_PATH}banner/${AppTheme.id}`;
	const IMAGE_ASSET_PATH = `${ASSET_PATH}image/${AppTheme.id}`;
	const STYLE_ASSET_PATH = `${ASSET_PATH}style/${AppTheme.id}`;
	const THEME_ASSET_PATH = `${ASSET_PATH}theme/${AppTheme.id}`;
	const VIDEO_ASSET_PATH = `${ASSET_PATH}video`;

	const SettingsAssets = {
		BANNERS: [
			`${BANNER_ASSET_PATH}/${BannerImageName.THEME}.png`,
			`${BANNER_ASSET_PATH}/${BannerImageName.SYNC}.png`,
			`${BANNER_ASSET_PATH}/${BannerImageName.BIZPROC}.png`,
			`${BANNER_ASSET_PATH}/${BannerImageName.MAIL}.png`,
			`${BANNER_ASSET_PATH}/${BannerImageName.SOCIALNETWORK}.png`,
			`${BANNER_ASSET_PATH}/${BannerImageName.VOXIMPLANT}.png`,
		],
		IMAGES: [
			`${IMAGE_ASSET_PATH}/${ImageName.NOTIFICATIONS_PUSH}.png`,
			`${IMAGE_ASSET_PATH}/${ImageName.NOTIFICATIONS_COUNTER}.png`,
		],
		STYLES: [
			`${STYLE_ASSET_PATH}/${StyleType.ZEFIR}.png`,
			`${STYLE_ASSET_PATH}/${StyleType.DEFAULT}.png`,
		],
		THEMES: [
			`${THEME_ASSET_PATH}/${ThemeType.DARK}.svg`,
			`${THEME_ASSET_PATH}/${ThemeType.LIGHT}.svg`,
			`${THEME_ASSET_PATH}/${ThemeType.SYSTEM}.svg`,
		],
		VIDEO: [
			`${VIDEO_ASSET_PATH}/${VideoQualityType.HIGH}.svg`,
			`${VIDEO_ASSET_PATH}/${VideoQualityType.LOW}.svg`,
			`${VIDEO_ASSET_PATH}/${VideoQualityType.MEDIUM}.svg`,
			`${VIDEO_ASSET_PATH}/${VideoQualityType.HIGH}-banner.png`,
			`${VIDEO_ASSET_PATH}/${VideoQualityType.LOW}-banner.png`,
			`${VIDEO_ASSET_PATH}/${VideoQualityType.MEDIUM}-banner.png`,
		],
	};

	const ALL_ASSETS_LIST = [
		...SettingsAssets.BANNERS,
		...SettingsAssets.IMAGES,
		...SettingsAssets.STYLES,
		...SettingsAssets.THEMES,
		...SettingsAssets.VIDEO,
	];

	function preloadAssets()
	{
		void downloadImages(ALL_ASSETS_LIST);
	}

	module.exports = {
		preloadAssets,
	};
});
