/**
 * @module settings-v2/const
 */
jn.define('settings-v2/const', (require, exports, module) => {
	const { withCurrentDomain } = require('utils/url');

	/**
	 * @type SettingsPageId
	 */
	const SettingsPageId = {
		ROOT: 'root',
		MESSENGER: 'messenger',
		THEME: 'theme',
		VIDEO_QUALITY: 'videoQuality',
		SYNC: 'sync',
		MEMORY: 'memory',
		LOC: 'loc',
		LICENSE: 'license',
		FEEDBACK: 'feedback',
		DEBUG: 'debug',
		DEVELOPER: 'developer',
		NOTIFICATIONS_ROOT: 'notificationsRoot',
		NOTIFICATIONS_MODULE: 'notificationsModule',
		NOTIFICATIONS_COUNTER: 'notificationsCounter',
	};

	/**
	 * @type SettingItemType
	 */
	const SettingItemType = {
		SECTION: 'section',
		LINK: 'link',
		TOGGLE: 'toggle',
		BUTTON: 'button',
		THEME: 'theme',
		DESCRIPTION: 'description',
		VIDEO_QUALITY: 'video-quality',
		VIDEO_BANNER: 'video-banner',
		LOC_SELECTOR: 'loc-selector',
	};

	const ASSET_PATH = withCurrentDomain('/bitrix/mobileapp/mobile/extensions/bitrix/settings-v2/ui/assets/');

	const ThemeType = {
		LIGHT: 'light',
		DARK: 'dark',
		SYSTEM: 'system',
	};

	const VideoQualityType = {
		HIGH: 'HQ',
		MEDIUM: 'MQ',
		LOW: 'LQ',
	};

	const EventType = {
		changeVideoQuality: 'settings-v2:changeVideoQuality',
		changeChatSettings: 'ImMobile.Messenger.Settings.Chat:change',
	};

	const PushConfigKeys = {
		TYPES: 'mobile.push.types',
		CONFIG: 'mobile.push.config',
	};

	const NotificationCounterKey = {
		TYPES: 'mobile.counter.types',
		CONFIG: 'mobile.counter.config',
	};

	module.exports = {
		SettingsPageId,
		SettingItemType,
		ThemeType,
		VideoQualityType,
		ASSET_PATH,
		EventType,
		PushConfigKeys,
		NotificationCounterKey,
	};
});
