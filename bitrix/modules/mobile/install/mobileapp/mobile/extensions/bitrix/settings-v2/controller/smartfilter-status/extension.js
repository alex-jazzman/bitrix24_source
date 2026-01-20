/**
 * @module settings-v2/controller/smartfilter-status
 */
jn.define('settings-v2/controller/smartfilter-status', (require, exports, module) => {
	const { BaseSettingController } = require('settings-v2/controller/base');
	const { Type } = require('type');
	const { NotificationsCacheKey } = require('settings-v2/const');
	const { MessengerDBService } = require('settings-v2/services/db/messenger');

	class SmartFilterStatusSettingController extends BaseSettingController
	{
		async get()
		{
			return new Promise((resolve) => {
				const cachedSmartFilterStatus = Application.storage.get(NotificationsCacheKey.smartFilterStatus);

				if (!Type.isNil(cachedSmartFilterStatus))
				{
					resolve(cachedSmartFilterStatus);

					return;
				}

				BX.rest.callMethod('mobile.push.smartfilter.status.get', {}, (response) => {
					if (response.answer?.error || Type.isNil(response.answer?.result))
					{
						resolve(null);

						return;
					}

					const result = response.answer.result;
					this.setToCache(result);

					resolve(result);
				});
			});
		}

		async set(value)
		{
			this.setToCache(value);
			BX.rest.callMethod('mobile.push.smartfilter.status.set', this.getSetConfig(value));
		}

		getSetConfig(value)
		{
			return { active: value ? '1' : '0' };
		}

		setToCache(value)
		{
			Application.storage.set(NotificationsCacheKey.smartFilterStatus, value);
			(new MessengerDBService()).setNotifyConfig({ smartFilter: value });
		}
	}

	module.exports = {
		SmartFilterStatusSettingController,
	};
});
