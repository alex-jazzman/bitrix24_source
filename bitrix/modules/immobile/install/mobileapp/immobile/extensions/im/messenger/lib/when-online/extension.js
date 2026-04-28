/**
 * @module im/messenger/lib/when-online
 */
jn.define('im/messenger/lib/when-online', (require, exports, module) => {
	const { ConnectionStatus } = require('im/messenger/const');
	const { serviceLocator } = require('im/messenger/lib/di/service-locator');

	const doNothing = () => {};

	/**
	 * Wraps a function so that it executes immediately when online,
	 * or defers execution until the connection is restored.
	 *
	 * @param {Function} callback
	 * @return {function(...*): function(): void} decorated function that returns an unsubscribe callback
	 */
	function whenOnline(callback)
	{
		return (...args) => {
			const connectionService = serviceLocator.get('connection-service');
			if (connectionService.isOnline())
			{
				callback(...args);

				return doNothing;
			}

			let cancelled = false;
			const handler = (status) => {
				if (status === ConnectionStatus.online && !cancelled)
				{
					cancelled = true;
					try
					{
						callback(...args);
					}
					finally
					{
						connectionService.offStatusChanged(handler);
					}
				}
			};

			connectionService.onStatusChanged(handler);

			return () => {
				if (!cancelled)
				{
					cancelled = true;
					connectionService.offStatusChanged(handler);
				}
			};
		};
	}

	module.exports = { whenOnline };
});
