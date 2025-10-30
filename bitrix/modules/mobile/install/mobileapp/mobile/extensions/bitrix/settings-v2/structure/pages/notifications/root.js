/**
 * @module settings-v2/structure/pages/notifications/root
 */
jn.define('settings-v2/structure/pages/notifications/root', (require, exports, module) => {
	const {
		createToggle,
		createLink,
		createSection,
	} = require('settings-v2/structure/src/item-create-helper');
	const { SettingsPageId, PushConfigKeys } = require('settings-v2/const');
	const { NotificationLoadService } = require('settings-v2/services/notification-load');
	const { PushStatusSettingController } = require('settings-v2/controller/push-status');
	const { SmartFilterStatusSettingController } = require('settings-v2/controller/smartfilter-status');
	const { Loc } = require('loc');
	const { Type } = require('type');

	const requestSettingsData = () => {
		return new Promise((resolve, reject) => {
			const cachedPushTypes = Application.storage.get(PushConfigKeys.TYPES);
			const cachedPushConfig = Application.storage.get(PushConfigKeys.CONFIG);

			if (cachedPushTypes && cachedPushConfig)
			{
				resolve(cachedPushTypes);

				return;
			}

			(new NotificationLoadService()).fetchAll().then((data) => {
				resolve(data.pushTypes);
			}).catch(console.error);
		});
	};

	const prepareItems = (pushTypes) => {
		const items = [];

		pushTypes.forEach((pushType) => {
			items.push(
				createLink({
					id: `notifications-${pushType.module_id}`,
					title: pushType.name,
					nextPage: SettingsPageId.NOTIFICATIONS_MODULE,
					nextPageParams: {
						moduleId: pushType.module_id,
						title: pushType.name,
					},
				}),
			);
		});

		return items;
	};

	/** @type SettingPage */
	const NotificationsRootPage = {
		id: SettingsPageId.NOTIFICATIONS_ROOT,
		title: Loc.getMessage('SETTINGS_V2_STRUCTURE_NOTIFICATIONS_ROOT_TITLE'),
		requestSettingsData,
		items: [
			createSection({
				id: 'notifications-section',
				items: [
					createToggle({
						id: 'enable-notifications',
						title: Loc.getMessage('SETTINGS_V2_STRUCTURE_NOTIFICATIONS_ROOT_RECEIVE_NOTIFICATIONS'),
						controller: new PushStatusSettingController({ settingId: 'enable-notifications' }),
					}),
				],
			}),
			createSection({
				id: 'intelligent-filtering-section',
				items: [
					createToggle({
						id: 'enable-intelligent-filtering',
						title: Loc.getMessage('SETTINGS_V2_STRUCTURE_NOTIFICATIONS_ROOT_INTELLIGENT_FILTERING'),
						subtitle: Loc.getMessage('SETTINGS_V2_STRUCTURE_NOTIFICATIONS_ROOT_INTELLIGENT_DESCRIPTION'),
						controller: new SmartFilterStatusSettingController({ settingId: 'enable-intelligent-filtering' }),
					}),
				],
			}),
			createSection({
				id: 'notifications-counter-section',
				items: [
					createLink({
						id: 'notifications-counter',
						title: Loc.getMessage('SETTINGS_V2_STRUCTURE_NOTIFICATIONS_ROOT_NOTIFICATION_COUNTER'),
						subtitle: Loc.getMessage('SETTINGS_V2_STRUCTURE_NOTIFICATIONS_ROOT_NOTIFICATION_COUNTER_DESCRIPTION'),
						nextPage: SettingsPageId.NOTIFICATIONS_COUNTER,
					}),
				],
			}),
			createSection({
				id: 'advanced-notifications-section',
				title: Loc.getMessage('SETTINGS_V2_STRUCTURE_NOTIFICATIONS_ROOT_ADVANCED_NOTIFICATIONS_SECTION_TITLE'),
				items: [],
				prepareItems,
			}),
		],
	};

	module.exports = {
		NotificationsRootPage,
	};
});
