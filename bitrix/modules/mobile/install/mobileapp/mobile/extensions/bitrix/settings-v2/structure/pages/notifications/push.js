/**
 * @module settings-v2/structure/pages/notifications/push
 */
jn.define('settings-v2/structure/pages/notifications/push', (require, exports, module) => {
	const {
		createToggle,
		createLink,
		createSection,
		createImage,
	} = require('settings-v2/structure/helpers/item-create-helper');
	const { SettingsPageId, NotificationsCacheKey } = require('settings-v2/const');
	const { NotificationLoadService } = require('settings-v2/services/notification-load');
	const { PushStatusSettingController } = require('settings-v2/controller/push-status');
	const { SmartFilterStatusSettingController } = require('settings-v2/controller/smartfilter-status');
	const { Loc } = require('loc');
	const { ModuleToTitle, ImageName } = require('settings-v2/const');

	const requestSettingsData = async () => {
		const cachedPushTypes = Application.storage.get(NotificationsCacheKey.pushTypes);
		const cachedPushConfig = Application.storage.get(NotificationsCacheKey.pushConfig);

		if (cachedPushTypes && cachedPushConfig)
		{
			return cachedPushTypes;
		}

		const data = await NotificationLoadService.fetchAll();

		return data.pushTypes;
	};

	const prepareItems = (pushTypes) => {
		const items = [];

		pushTypes.forEach((pushType) => {
			const title = ModuleToTitle[pushType.module_id] || pushType.name;

			items.push(
				createLink({
					id: `notifications-${pushType.module_id}`,
					title,
					nextPage: SettingsPageId.NOTIFICATIONS_MODULE,
					nextPageParams: {
						moduleId: pushType.module_id,
						title,
					},
				}),
			);
		});

		return items;
	};

	/** @type SettingPage */
	const NotificationsPushPage = {
		id: SettingsPageId.NOTIFICATIONS_ROOT,
		title: Loc.getMessage('SETTINGS_V2_STRUCTURE_NOTIFICATIONS_ROOT_NOTIFICATION_PUSH'),
		requestSettingsData,
		items: [
			createImage({
				id: 'notifications-push-image',
				name: ImageName.NOTIFICATIONS_PUSH,
				externalStyle: {
					height: 246,
				},
			}),
			createSection({
				id: 'notifications-section',
				items: [
					createToggle({
						id: 'enable-notifications',
						title: Loc.getMessage('SETTINGS_V2_STRUCTURE_NOTIFICATIONS_ROOT_NOTIFICATION_PUSH'),
						subtitle: Loc.getMessage('SETTINGS_V2_STRUCTURE_NOTIFICATIONS_ROOT_NOTIFICATION_PUSH_SUBTITLE'),
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
				id: 'advanced-notifications-section',
				title: Loc.getMessage('SETTINGS_V2_STRUCTURE_NOTIFICATIONS_ROOT_ADVANCED_NOTIFICATIONS_SECTION_TITLE'),
				items: [],
				prepareItems,
			}),
		],
	};

	module.exports = {
		NotificationsPushPage,
	};
});
