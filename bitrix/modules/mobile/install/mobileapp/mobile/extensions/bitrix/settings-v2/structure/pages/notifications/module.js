/**
 * @module settings-v2/structure/pages/notifications/module
 */
jn.define('settings-v2/structure/pages/notifications/module', (require, exports, module) => {
	const {
		createSection,
		createToggle,
	} = require('settings-v2/structure/src/item-create-helper');
	const { PushConfigSettingController } = require('settings-v2/controller/push-config');
	const { SettingsPageId, PushConfigKeys } = require('settings-v2/const');
	const { NotificationLoadService } = require('settings-v2/services/notification-load');

	const requestSettingsData = ({ moduleId }) => {
		return new Promise((resolve, reject) => {
			const cachedPushTypes = Application.storage.get(PushConfigKeys.TYPES);
			const cachedPushConfig = Application.storage.get(PushConfigKeys.CONFIG);

			if (cachedPushTypes && cachedPushConfig)
			{
				const pushTypesByModule = cachedPushTypes.find((item) => item.module_id === moduleId);

				resolve(pushTypesByModule);

				return;
			}

			(new NotificationLoadService()).fetchPushSettings().then((data) => {
				const pushTypesByModule = data.pushTypes.find((item) => item.module_id === moduleId);

				resolve(pushTypesByModule);
			}).catch(console.error);
		});
	};

	const prepareItems = (moduleData) => {
		if (!moduleData)
		{
			return [];
		}

		return moduleData.types.map((typeItem) => {
			return createToggle({
				id: `notifications-${moduleData.module_id}-${typeItem.type}`,
				title: typeItem.name,
				controller: new PushConfigSettingController(
					{
						settingId: `notifications-${moduleData.module_id}-${typeItem.type}`,
						moduleId: moduleData.module_id,
						pushType: typeItem.type,
					},
				),
				disabled: typeItem.disabled,
			});
		});
	};

	/** @type SettingPage */
	const NotificationsModulePage = {
		id: SettingsPageId.NOTIFICATIONS_MODULE,
		requestSettingsData,
		items: [
			createSection(
				{
					id: 'notifications-module-section',
					items: [],
					prepareItems,
				},
			),
		],
	};

	module.exports = {
		NotificationsModulePage,
	};
});