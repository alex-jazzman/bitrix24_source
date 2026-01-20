/**
 * @module settings-v2/const
 */
jn.define('settings-v2/const', (require, exports, module) => {
	const { withCurrentDomain } = require('utils/url');
	const { Modules, ModuleToTitle } = require('settings-v2/const/src/modules');

	/**
	 * @type SettingsPageId
	 */
	const SettingsPageId = {
		ROOT: 'root',
		MESSENGER: 'messenger',
		THEME: 'theme',
		VIDEO_QUALITY: 'videoQuality',
		SYNC: 'sync',
		SECURITY: 'security',
		MEMORY: 'memory',
		LOC: 'loc',
		LICENSE: 'license',
		FEEDBACK: 'feedback',
		DEBUG: 'debug',
		DEVELOPER: 'developer',
		NOTIFICATIONS_ROOT: 'notificationsRoot',
		NOTIFICATIONS_MODULE: 'notificationsModule',
		NOTIFICATIONS_PUSH: 'notificationsPush',
		NOTIFICATIONS_COUNTER: 'notificationsCounter',
	};

	/**
	 * @type SettingItemType
	 */
	const SettingItemType = {
		SECTION: 'section',
		LINK: 'link',
		CACHE_INFO: 'info',
		TOGGLE: 'toggle',
		BUTTON: 'button',
		LINK_BUTTON: 'link-button',
		THEME: 'theme',
		DESCRIPTION: 'description',
		VIDEO_QUALITY: 'video-quality',
		VIDEO_BANNER: 'video-banner',
		LOC_SELECTOR: 'loc-selector',
		CACHE_INTERVAL: 'cache-interval',
		CACHE_BANNER: 'cache-banner',
		CACHE_INFO_BUTTON: 'cache-info-button',
		BANNER: 'banner',
		IMAGE: 'image',
		STYLE: 'style',
		SECURITY_INFO: 'security-info',
		SECURITY_BANNER: 'security-banner',
		SECURITY_ALERT_BANNER: 'security-alert-banner',
		USER_SELECTOR: 'user-selector',
	};

	const ASSET_PATH = withCurrentDomain('/bitrix/mobileapp/mobile/extensions/bitrix/settings-v2/ui/assets/');

	const ThemeType = {
		LIGHT: 'light',
		DARK: 'dark',
		SYSTEM: 'system',
	};

	const StyleType = {
		ZEFIR: 'zefir',
		DEFAULT: 'default',
	};

	const VideoQualityType = {
		HIGH: 'HQ',
		MEDIUM: 'MQ',
		LOW: 'LQ',
	};

	const EventType = {
		changeVideoQuality: 'settings-v2:changeVideoQuality',
		changeChatSettings: 'ImMobile.Messenger.Settings.Chat:change',
		changeCacheSize: 'settings-v2:changeCacheSize',
		changeUserSelectorIsVisible: 'settings-v2:changeUserSelectorIsVisible',
		changeSecurityState: 'settings-v2:changeSecurityState',
	};

	const NotificationsCacheKey = {
		pushStatus: 'mobile.push.status',
		smartFilterStatus: 'mobile.push.smartfilter.status',
		pushTypes: 'mobile.push.types',
		pushConfig: 'mobile.push.config',
		counterTypes: 'mobile.counter.types',
		counterConfig: 'mobile.counter.config',
	};

	const NativeSettingsId = {
		CACHE_INTERVAL: 'cache_interval',
		CACHE_FILES: 'cache_files',
		CACHE_MEDIA: 'cache_media',
		APP_STYLE: 'app_style',
		APP_THEME: 'app_theme',
	};

	const BannerImageName = {
		THEME: 'theme',
		SYNC: 'sync',
		BIZPROC: 'bizproc',
		MAIL: 'mail',
		SOCIALNETWORK: 'socialnetwork',
		VOXIMPLANT: 'voximplant',
	};

	const SECURITY_SETTINGS_KEY = 'security-settings';

	const SecurityOption = {
		IS_TAKE_SCREENSHOT_DISABLED: 'isTakeScreenshotDisabled',
		IS_COPY_TEXT_DISABLED: 'isCopyTextDisabled',
		IS_OTP_ENABLED: 'isOtpEnabled',
		IS_OTP_ENABLED_FOR_USER: 'isOtpEnabledForUser',
		IS_OTP_MANDATORY: 'isOtpMandatory',
		TAKE_SCREENSHOT_RIGHTS: 'takeScreenshotRights',
		COPY_TEXT_RIGHTS: 'copyTextRights',
		IS_BIOMETRIC_AUTH_ENABLED: 'biometric_auth',
	};

	const SecuritySetActionByOption = {
		[SecurityOption.IS_TAKE_SCREENSHOT_DISABLED]: 'mobile.Settings.setTakeScreenshotDisabled',
		[SecurityOption.IS_COPY_TEXT_DISABLED]: 'mobile.Settings.setCopyTextDisabled',
		[SecurityOption.TAKE_SCREENSHOT_RIGHTS]: 'mobile.Settings.setTakeScreenshotRights',
		[SecurityOption.COPY_TEXT_RIGHTS]: 'mobile.Settings.setCopyTextRights',
		[SecurityOption.IS_OTP_ENABLED]: null,
		[SecurityOption.IS_OTP_ENABLED_FOR_USER]: null,
		[SecurityOption.IS_OTP_MANDATORY]: null,
	};

	const REDUX_LOGGER_ID = 'enableReduxLogger';

	const ImageName = {
		NOTIFICATIONS_PUSH: 'notifications-push',
		NOTIFICATIONS_COUNTER: 'notifications-counter',
	};

	module.exports = {
		SettingsPageId,
		SettingItemType,
		ThemeType,
		StyleType,
		VideoQualityType,
		ASSET_PATH,
		EventType,
		NotificationsCacheKey,
		NativeSettingsId,
		BannerImageName,
		Modules,
		ModuleToTitle,
		ImageName,
		REDUX_LOGGER_ID,
		SECURITY_SETTINGS_KEY,
		SecurityOption,
		SecuritySetActionByOption,
	};
});
