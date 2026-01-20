/**
 * @module settings-v2/services/db/messenger
 */
jn.define('settings-v2/services/db/messenger', (require, exports, module) => {
	// eslint-disable-next-line no-undef
	const DatabaseName = ChatDatabaseName;
	// eslint-disable-next-line no-undef
	const Tables = ChatTables;

	/**
	 * @class MessengerDBService
	 * @description Service to interact with the Messenger database for notification settings.
	 * @see mobile/install/mobileapp/mobile/components/bitrix/communication/component.js: loadFromCache
	 */
	class MessengerDBService
	{
		constructor()
		{
			// eslint-disable-next-line no-undef
			this.database = new ReactDatabase(DatabaseName, env.userId, env.languageId, env.siteId);
		}

		async setNotifyConfig({
			pushStatus = null,
			smartFilter = null,
			pushTypes = null,
			pushConfig = null,
			counterTypes = null,
			counterConfig = null,
		}) {
			const table = await this.database.table(Tables.notifyConfig);
			const items = await table.get();

			if (!items || items.length === 0)
			{
				await table.delete();
				await table.add({
					value: {
						values: { push: pushStatus, smart: smartFilter },
						pushTypes: this.#preparePushTypes(pushTypes, pushConfig),
						counterTypes: this.#prepareCounterTypes(counterTypes, counterConfig),
					},
				});

				return;
			}

			const cachedData = JSON.parse(items[0].VALUE);

			const updatedData = {
				values: {
					push: pushStatus ?? cachedData.values.push,
					smart: smartFilter ?? cachedData.values.smart,
				},
				pushTypes: this.#mergePushTypes(cachedData.pushTypes, pushConfig),
				counterTypes: this.#mergeCounterTypes(cachedData.counterTypes, counterConfig),
			};

			await table.delete();
			await table.add({ value: updatedData });
		}

		#mergePushTypes(cachedPushTypes, newPushConfig)
		{
			if (!newPushConfig)
			{
				return cachedPushTypes;
			}

			return this.#preparePushTypes(cachedPushTypes, newPushConfig);
		}

		#mergeCounterTypes(cachedCounterTypes, newCounterConfig)
		{
			if (!newCounterConfig)
			{
				return cachedCounterTypes;
			}

			return this.#prepareCounterTypes(cachedCounterTypes, newCounterConfig);
		}

		#preparePushTypes(pushTypes, pushConfig)
		{
			const preparedPushTypes = [];

			pushTypes.forEach((moduleConfig) => {
				const preparedModule = {
					...moduleConfig,
					types: moduleConfig.types.map((type) => {
						const typeConfig = pushConfig.find((config) => {
							return config.module_id === moduleConfig.module_id && config.type === type.type;
						});

						return {
							...type,
							value: typeConfig ? typeConfig.active : type.value,
						};
					}),
				};
				preparedPushTypes.push(preparedModule);
			});

			return preparedPushTypes;
		}

		#prepareCounterTypes(counterTypes, counterConfig)
		{
			const preparedCounterTypes = [];

			counterTypes.forEach((counterType) => {
				preparedCounterTypes.push({
					...counterType,
					value: counterConfig.find((config) => config.type === counterType.type).value,
				});
			});

			return preparedCounterTypes;
		}
	}

	module.exports = {
		MessengerDBService,
	};
});
