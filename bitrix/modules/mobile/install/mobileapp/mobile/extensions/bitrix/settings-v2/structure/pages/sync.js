/**
 * @module settings-v2/structure/pages/sync
 */
jn.define('settings-v2/structure/pages/sync', (require, exports, module) => {
	const { createToggle, createSection, createDescription } = require('settings-v2/structure/src/item-create-helper');
	const { SettingsPageId } = require('settings-v2/const');
	const { Loc } = require('loc');
	const { NativeSettingController } = require('settings-v2/controller/native');

	/**
	 * @param settingId
	 * @param fallbackValue
	 * @returns {NativeSettingController}
	 */
	const createSyncController = (settingId, fallbackValue) => {
		return new NativeSettingController({
			settingId,
			fallbackValue,
		});
	};

	const isAndroid = Application.getPlatform() === 'android';

	/** @type SettingPage */
	const SyncPage = {
		id: SettingsPageId.SYNC,
		title: Loc.getMessage('SETTINGS_V2_STRUCTURE_SYNC_TITLE'),
		items: [
			createSection({
				id: 'auto-sync',
				title: Loc.getMessage('SETTINGS_V2_STRUCTURE_SYNC_AUTO_SYNC'),
				items: [
					createToggle({
						id: 'sync-calendar',
						title: Loc.getMessage('SETTINGS_V2_STRUCTURE_SYNC_CALENDAR'),
						prefilter: () => isAndroid,
						controller: createSyncController('sync_calendar', false),
					}),
					createToggle({
						id: 'sync-contacts',
						title: Loc.getMessage('SETTINGS_V2_STRUCTURE_SYNC_CONTACTS'),
						divider: false,
						prefilter: () => isAndroid,
						controller: createSyncController('sync_contacts', false),
					}),
					createDescription({
						id: 'sync-description',
						text: Loc.getMessage('SETTINGS_V2_STRUCTURE_SYNC_DESCRIPTION'),
					}),
				],
			}),
		],
	};

	module.exports = {
		SyncPage,
	};
});
