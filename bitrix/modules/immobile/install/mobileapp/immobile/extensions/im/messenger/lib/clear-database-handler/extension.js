/**
 * @module im/messenger/lib/clear-database-handler
 */
jn.define('im/messenger/lib/clear-database-handler', (require, exports, module) => {
	const { EventType } = require('im/messenger/const');
	const { serviceLocator } = require('im/messenger/lib/di/service-locator');

	const SYNC_IN_PROGRESS_ERROR = 'im.messenger: drop database refused, synchronization is in progress';

	function clearDatabaseHandler()
	{
		if (isSyncInProgress())
		{
			BX.postComponentEvent(EventType.messenger.clearDatabaseResult, [{
				success: false,
				errorText: SYNC_IN_PROGRESS_ERROR,
			}]);

			return;
		}

		try
		{
			serviceLocator.get('core').getRepository().drop();
			// The recent snapshots live in their own storage and survive the drop: left alone they
			// would show chats of a database that no longer exists on the next start.
			serviceLocator.get('recent-manager')?.invalidateSnapshots();
			BX.postComponentEvent(EventType.messenger.clearDatabaseResult, [{
				success: true,
				errorText: '',
			}]);

			// reboot is mandatory in the current architecture
			Application.relogin();
		}
		catch (error)
		{
			BX.postComponentEvent(EventType.messenger.clearDatabaseResult, [{
				success: false,
				errorText: `im.messenger: drop database error: ${error.name}: ${error.message}`,
			}]);
		}
	}

	/**
	 * @desc Wiping the database under a running filler leaves the local state inconsistent, so the
	 * check belongs next to the drop and not to the calling side: `sync-service` is registered in the
	 * messenger component - the very context this handler runs in - so here the flag is readable for
	 * any caller, and no round trip is left between reading it and dropping the tables.
	 * @return {boolean}
	 */
	function isSyncInProgress()
	{
		return serviceLocator.get('sync-service')?.syncInProgress === true;
	}

	module.exports = {
		clearDatabaseHandler,
	};
});
