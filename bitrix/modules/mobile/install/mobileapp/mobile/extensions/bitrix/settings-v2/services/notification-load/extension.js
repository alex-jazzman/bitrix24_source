/**
 * @module settings-v2/services/notifications-load
 */
jn.define('settings-v2/services/notification-load', (require, exports, module) => {
	const { NotificationsCacheKey } = require('settings-v2/const');

	class NotificationLoadService
	{
		static async fetchPushSettings()
		{
			return new Promise((resolve) => {
				BX.rest.callBatch(
					{
						pushConfig: ['mobile.push.config.get'],
						pushTypes: ['mobile.push.types.get'],
					},
					(result) => {
						const pushTypes = NotificationLoadService.processResponse(
							result.pushTypes,
							NotificationsCacheKey.pushTypes,
						);
						const pushConfig = NotificationLoadService.processResponse(
							result.pushConfig,
							NotificationsCacheKey.pushConfig,
						);

						resolve({
							pushTypes,
							pushConfig,
						});
					},
				);
			});
		}

		static async fetchCounterSettings()
		{
			return new Promise((resolve) => {
				BX.rest.callBatch(
					{
						counterTypes: ['mobile.counter.types.get'],
						counterConfig: ['mobile.counter.config.get'],
					},
					(result) => {
						const counterTypes = NotificationLoadService.processResponse(
							result.counterType,
							NotificationsCacheKey.counterTypes,
						);
						const counterConfig = NotificationLoadService.processResponse(
							result.counterConfig,
							NotificationsCacheKey.counterConfig,
						);

						resolve({
							counterTypes,
							counterConfig,
						});
					},
				);
			});
		}

		static async fetchAll()
		{
			return new Promise((resolve) => {
				BX.rest.callBatch(
					{
						smartFilter: ['mobile.push.smartfilter.status.get'],
						pushStatus: ['mobile.push.status.get'],
						pushConfig: ['mobile.push.config.get'],
						pushTypes: ['mobile.push.types.get'],
						counterTypes: ['mobile.counter.types.get'],
						counterConfig: ['mobile.counter.config.get'],
					},
					(result) => {
						const pushTypes = NotificationLoadService.processResponse(
							result.pushTypes,
							NotificationsCacheKey.pushTypes,
						);
						const pushConfig = NotificationLoadService.processResponse(
							result.pushConfig,
							NotificationsCacheKey.pushConfig,
						);
						const counterTypes = NotificationLoadService.processResponse(
							result.counterTypes,
							NotificationsCacheKey.counterTypes,
						);
						const counterConfig = NotificationLoadService.processResponse(
							result.counterConfig,
							NotificationsCacheKey.counterConfig,
						);
						const pushStatus = NotificationLoadService.processResponse(
							result.pushStatus,
							NotificationsCacheKey.pushStatus,
						);
						const smartFilter = NotificationLoadService.processResponse(
							result.smartFilter,
							NotificationsCacheKey.smartFilterStatus,
						);

						resolve({
							pushStatus,
							smartFilter,
							pushTypes,
							pushConfig,
							counterTypes,
							counterConfig,
						});
					},
				);
			});
		}

		static processResponse(response, key)
		{
			if (response.answer?.error)
			{
				console.error(response.answer?.error);

				return null;
			}

			const result = response.answer.result;
			Application.storage.set(key, result);

			return result;
		}
	}

	module.exports = {
		NotificationLoadService,
	};
});
