/**
 * @module im/messenger/api/cleaning
 */
jn.define('im/messenger/api/cleaning', (require, exports, module) => {
	const { Type } = require('type');
	const { EntityReady } = require('entity-ready');
	const {
		EventType,
		ComponentCode,
		WaitingEntity,
	} = require('im/messenger/const');
	const { createPromiseWithResolvers } = require('im/messenger/lib/utils');
	const { getLogger } = require('im/messenger/lib/logger');
	const { serviceLocator } = require('im/messenger/lib/di/service-locator');

	const logger = getLogger('api--cleaning');

	const SYNC_IN_PROGRESS_ERROR = 'im.messenger: database cleaning refused, synchronization is in progress';

	/**
	 * @description Clear the messenger database and restart the application
	 * @return {Promise<void>} rejects with the reason when the cleaning is refused
	 */
	async function clearDatabaseAndRestart()
	{
		await EntityReady.wait(WaitingEntity.chat);

		if (isSyncInProgress())
		{
			logger.error('clearDatabaseAndRestart: refused, synchronization is in progress');

			// the same channel the failure branch of clearDatabaseResult uses, so the caller tells
			// "refused" from "cleaned" the same way on both paths
			return Promise.reject(new Error(SYNC_IN_PROGRESS_ERROR));
		}

		return requestClearDatabase();
	}

	/**
	 * @return {Promise<void>}
	 */
	function requestClearDatabase()
	{
		const {
			promise,
			resolve,
			reject,
		} = createPromiseWithResolvers();

		registerClearDatabaseResultHandler(resolve, reject);
		sendClearDatabaseEvent();

		return promise;
	}

	/**
	 * @desc The readiness signal is published before the changelog pass, so the cleaning checks the
	 * synchronization on its own: wiping the database under a running filler leaves the local state
	 * inconsistent. Here the check is a fast path only - `sync-service` is registered in the messenger
	 * component, so outside that context it resolves to nothing and the guard that actually protects
	 * the database sits next to the drop, in `im/messenger/lib/clear-database-handler`.
	 * This is a developer menu action, so a plain refusal is enough: no waiting.
	 * @return {boolean}
	 */
	function isSyncInProgress()
	{
		return serviceLocator.get('sync-service')?.syncInProgress === true;
	}

	function sendClearDatabaseEvent()
	{
		BX.postComponentEvent(EventType.messenger.clearDatabase, [], ComponentCode.imMessenger);
	}

	function registerClearDatabaseResultHandler(successHandler, errorHandler)
	{
		const handler = ({ errorText }) => {
			BX.removeCustomEvent(EventType.messenger.clearDatabaseResult, handler);
			if (Type.isStringFilled(errorText))
			{
				errorHandler(new Error(errorText));

				return;
			}

			successHandler();
		};

		BX.addCustomEvent(EventType.messenger.clearDatabaseResult, handler);

		return handler;
	}

	module.exports = {
		clearDatabaseAndRestart,
	};
});
