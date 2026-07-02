/**
 * @module im/messenger/application/lib/event-handler/store
 */
jn.define('im/messenger/application/lib/event-handler/store', (require, exports, module) => {
	const { AppStatus } = require('im/messenger/const');
	const { getLoggerWithContext } = require('im/messenger/lib/logger');
	const { serviceLocator } = require('im/messenger/lib/di/service-locator');

	/**
	 * @implements {Unsubscribable}
	 * @class StoreEventHandler
	 */
	class StoreEventHandler
	{
		constructor()
		{
			this.logger = getLoggerWithContext('messenger--store-event-handler', this);
			this.isLaunched = false;
			this.appStatus = '';
		}

		/**
		 * @return {CoreApplication}
		 */
		get #core()
		{
			return serviceLocator.get('core');
		}

		/**
		 * @return {MessengerCoreStoreManager}
		 */
		get #storeManager()
		{
			return serviceLocator.get('core').getStoreManager();
		}

		/**
		 * @return {CountersUpdateSystem}
		 */
		get #countersUpdateSystem()
		{
			return serviceLocator.get('counters-update-system');
		}

		/**
		 * @return {MessengerHeaderManager}
		 */
		get #headerManager()
		{
			return serviceLocator.get('messenger-header-manager');
		}

		/**
		 * @type {Refresher|null}
		 */
		get #refresher()
		{
			return serviceLocator.get('refresher');
		}

		subscribeEvents()
		{
			if (this.isLaunched)
			{
				return;
			}

			this.#storeManager.on('applicationModel/setStatus', this.applicationSetStatusHandler);

			this.isLaunched = true;
		}

		unsubscribeEvents()
		{
			if (!this.isLaunched)
			{
				return;
			}

			this.#storeManager.off('applicationModel/setStatus', this.applicationSetStatusHandler);

			this.isLaunched = false;
		}

		applicationSetStatusHandler = async (mutation) => {
			const statusKey = mutation.payload.data.status.name;
			const statusValue = mutation.payload.data.status.value;

			const wasAppOnline = this.appStatus !== AppStatus.networkWaiting;
			const isAppOffline = (statusKey === AppStatus.networkWaiting && statusValue === true);
			if (wasAppOnline && isAppOffline)
			{
				this.#countersUpdateSystem.disableReadingQueue();
			}

			const wasAppOffline = this.appStatus === AppStatus.networkWaiting;
			const isAppOnline = (statusKey === AppStatus.networkWaiting && statusValue === false);
			if (wasAppOffline && isAppOnline)
			{
				void this.#refresher.refreshOnRestoreConnection();
			}

			this.#headerManager.redrawAllTitles();
			this.appStatus = this.#core.getAppStatus();
		};
	}

	module.exports = { StoreEventHandler };
});
