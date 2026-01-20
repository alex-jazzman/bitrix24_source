/**
 * @module settings-v2/structure/pages/memory
 */
jn.define('settings-v2/structure/pages/memory', (require, exports, module) => {
	const { Loc } = require('loc');
	const { Icon } = require('assets/icons');
	const { Color } = require('tokens');
	const {
		createSection,
		createDescription,
	} = require('settings-v2/structure/helpers/item-create-helper');
	const {
		createCacheInfo,
		createCacheIntervalSelector,
		createCacheBanner,
		createCacheInfoButton,
	} = require('settings-v2/structure/helpers/cache-item-create-helper');
	const { CacheSettingController } = require('settings-v2/controller/cache');
	const { NativeCacheService } = require('settings-v2/services/native');
	const { SettingsPageId, EventType, NativeSettingsId } = require('settings-v2/const');
	const { SettingEmitter } = require('settings-v2/emitter');
	const { showToast } = require('toast');

	/** @type SettingPage */
	const MemoryPage = {
		id: SettingsPageId.MEMORY,
		title: Loc.getMessage('SETTINGS_V2_STRUCTURE_MEMORY_TITLE'),
		items: [
			createCacheBanner({
				id: 'cache-banner',
			}),
			createSection({
				id: 'info-section',
				items: [
					createCacheInfo({
						id: 'file-cache-size',
						title: Loc.getMessage('SETTINGS_V2_STRUCTURE_MEMORY_CACHE_INFO_FILES'),
						subtitle: Loc.getMessage('SETTINGS_V2_STRUCTURE_MEMORY_CACHE_INFO_FILES_SUBTITLE'),
						icon: Icon.FILE,
						iconColor: Color.accentMainPrimary,
						controller: new CacheSettingController({
							settingId: NativeSettingsId.CACHE_FILES,
							fallbackValue: 0,
						}),
					}),
					createCacheInfo({
						id: 'media-cache-size',
						title: Loc.getMessage('SETTINGS_V2_STRUCTURE_MEMORY_CACHE_INFO_MEDIA'),
						subtitle: Loc.getMessage('SETTINGS_V2_STRUCTURE_MEMORY_CACHE_INFO_MEDIA_SUBTITLE'),
						icon: Icon.IMAGE,
						iconColor: Color.accentMainSuccess,
						controller: new CacheSettingController({
							settingId: NativeSettingsId.CACHE_MEDIA,
							fallbackValue: 0,
						}),
						divider: false,
					}),
					createCacheInfoButton({
						id: 'clear-all-cache-button',
					}),
					createDescription({
						id: 'cache-info-description',
						text: Loc.getMessage('SETTINGS_V2_STRUCTURE_MEMORY_CACHE_INFO_DESCRIPTION'),
					}),
				],
			}),
			createSection({
				id: 'data-section',
				items: [
					createCacheIntervalSelector({
						id: 'clear-cache-timeout',
						title: Loc.getMessage('SETTINGS_V2_STRUCTURE_MEMORY_CACHE_INTERVAL'),
						controller: new CacheSettingController({
							settingId: 'cache_interval',
							fallbackValue: 'never',
						}),
					}),
					createCacheInfo({
						id: 'clear-system-cache-button',
						title: Loc.getMessage('SETTINGS_V2_STRUCTURE_MEMORY_SYSTEM_CACHE'),
						subtitle: Loc.getMessage('SETTINGS_V2_STRUCTURE_MEMORY_SYSTEM_CACHE_SUBTITLE'),
						modeText: Loc.getMessage('SETTINGS_V2_STRUCTURE_MEMORY_SYSTEM_CACHE_CLEAR'),
						modeColor: Color.accentMainAlert,
						onClick: async () => {
							await NativeCacheService.clearSystem();
							SettingEmitter.emit(EventType.changeCacheSize);
							showToast({
								icon: Icon.CHECK,
								message: Loc.getMessage('SETTINGS_V2_STRUCTURE_MEMORY_CACHE_CLEAR_SYSTEM_TOAST_MESSAGE'),
							});
						},
					}),
				],
			}),
		],
	};

	module.exports = {
		MemoryPage,
	};
});
