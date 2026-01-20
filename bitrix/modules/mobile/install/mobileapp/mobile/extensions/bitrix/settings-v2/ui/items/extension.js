/**
 * @module settings-v2/ui/items
 */
jn.define('settings-v2/ui/items', (require, exports, module) => {
	const { SettingItemType } = require('settings-v2/const');
	const { ToggleItem } = require('settings-v2/ui/items/src/toggle');
	const { LinkItem } = require('settings-v2/ui/items/src/link');
	const { ButtonItem } = require('settings-v2/ui/items/src/button');
	const { LinkButtonItem } = require('settings-v2/ui/items/src/link-button');
	const { ThemeSwitchItem } = require('settings-v2/ui/items/src/theme-switch');
	const { DescriptionItem } = require('settings-v2/ui/items/src/description');
	const { VideoQualitySwitchItem } = require('settings-v2/ui/items/src/video-quality-switch');
	const { VideoBannerItem } = require('settings-v2/ui/items/src/video-banner');
	const { LocSelectorItem } = require('settings-v2/ui/items/src/loc-selector');
	const { CacheIntervalSelectorItem } = require('settings-v2/ui/items/src/cache-interval-selector');
	const { CacheInfoItem } = require('settings-v2/ui/items/src/cache-info');
	const { CacheBannerItem } = require('settings-v2/ui/items/src/cache-banner');
	const { BannerItem } = require('settings-v2/ui/items/src/banner');
	const { ImageItem } = require('settings-v2/ui/items/src/image');
	const { StyleSwitchItem } = require('settings-v2/ui/items/src/style-switch');
	const { CacheInfoButtonItem } = require('settings-v2/ui/items/src/cache-info-button');
	const { SecurityInfoItem } = require('settings-v2/ui/items/src/security-info');
	const { SecurityBannerItem } = require('settings-v2/ui/items/src/security-banner');
	const { SecurityAlertBannerItem } = require('settings-v2/ui/items/src/security-alert-banner');
	const { UserSelectorItem } = require('settings-v2/ui/items/src/user-selector');

	class ItemFactory
	{
		static make(item)
		{
			switch (item.type)
			{
				case SettingItemType.LINK:
					return new LinkItem(item);
				case SettingItemType.TOGGLE:
					return new ToggleItem(item);
				case SettingItemType.BUTTON:
					return new ButtonItem(item);
				case SettingItemType.LINK_BUTTON:
					return new LinkButtonItem(item);
				case SettingItemType.THEME:
					return new ThemeSwitchItem(item);
				case SettingItemType.DESCRIPTION:
					return new DescriptionItem(item);
				case SettingItemType.VIDEO_QUALITY:
					return new VideoQualitySwitchItem(item);
				case SettingItemType.VIDEO_BANNER:
					return new VideoBannerItem(item);
				case SettingItemType.LOC_SELECTOR:
					return new LocSelectorItem(item);
				case SettingItemType.CACHE_INTERVAL:
					return new CacheIntervalSelectorItem(item);
				case SettingItemType.CACHE_INFO:
					return new CacheInfoItem(item);
				case SettingItemType.CACHE_BANNER:
					return new CacheBannerItem(item);
				case SettingItemType.CACHE_INFO_BUTTON:
					return new CacheInfoButtonItem(item);
				case SettingItemType.BANNER:
					return new BannerItem(item);
				case SettingItemType.IMAGE:
					return new ImageItem(item);
				case SettingItemType.STYLE:
					return new StyleSwitchItem(item);
				case SettingItemType.SECURITY_INFO:
					return new SecurityInfoItem(item);
				case SettingItemType.SECURITY_BANNER:
					return new SecurityBannerItem(item);
				case SettingItemType.USER_SELECTOR:
					return new UserSelectorItem(item);
				case SettingItemType.SECURITY_ALERT_BANNER:
					return new SecurityAlertBannerItem(item);
				default:
					return null;
			}
		}
	}

	module.exports = {
		ItemFactory,
	};
});
