/**
 * @module settings-v2/controller/notification-counter
 */
jn.define('settings-v2/controller/notification-counter', (require, exports, module) => {
	const { BaseSettingController } = require('settings-v2/controller/base');
	const { NotificationsCacheKey } = require('settings-v2/const');
	const { Type } = require('type');
	const { MessengerDBService } = require('settings-v2/services/db/messenger');

	class NotificationCounterSettingController extends BaseSettingController
	{
		constructor(props)
		{
			super(props);

			if (!props.counterType)
			{
				throw new Error('Missing required counterType');
			}

			this.counterType = props.counterType;
		}

		async get()
		{
			return new Promise((resolve, reject) => {
				const cached = Application.storage.get(NotificationsCacheKey.counterConfig);
				if (cached)
				{
					const preparedResult = cached.find((item) => item.type === this.counterType).value;
					if (!Type.isNil(preparedResult))
					{
						resolve(preparedResult);

						return;
					}
				}

				BX.rest.callMethod('mobile.counter.config.get', {}, (response) => {
					if (response.error())
					{
						resolve(this.fallbackValue);

						return;
					}

					Application.storage.set(NotificationsCacheKey.counterConfig, response.answer.result);
					const preparedResult = response.answer.result.find((item) => item.type === this.counterType).value;

					resolve(preparedResult);
				});
			});
		}

		async set(value)
		{
			return new Promise((resolve, reject) => {
				this.setToCache(value);

				BX.rest.callMethod('mobile.counter.config.set', this.getSetConfig(value), (response) => {
					if (response.error())
					{
						reject(response.error());
					}
					else
					{
						resolve(response.answer.result);
					}
				});
			});
		}

		getSetConfig(value)
		{
			return {
				config: {
					[this.counterType]: value ? '1' : '0',
				},
			};
		}

		setToCache(value)
		{
			const counterConfig = Application.storage.get(NotificationsCacheKey.counterConfig);
			const itemIndex = counterConfig.findIndex((item) => item.type === this.counterType);

			counterConfig[itemIndex].value = value;
			Application.storage.set(NotificationsCacheKey.counterConfig, counterConfig);

			(new MessengerDBService())
				.setNotifyConfig({ counterConfig })
				.then(
					() => {
						const configToEvent = Object.fromEntries(
							counterConfig.map((item) => [item.type, item.value]),
						);
						BX.postComponentEvent('onUpdateConfig', [configToEvent], 'communication');
					},
				)
				.catch(console.error);
		}
	}

	module.exports = {
		NotificationCounterSettingController,
	};
});
