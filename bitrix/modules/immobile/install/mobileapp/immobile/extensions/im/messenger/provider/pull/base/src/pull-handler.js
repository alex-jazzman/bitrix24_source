/* eslint-disable flowtype/require-return-type */

/**
 * @module im/messenger/provider/pull/base/pull-handler
 */
jn.define('im/messenger/provider/pull/base/pull-handler', (require, exports, module) => {
	const { serviceLocator } = require('im/messenger/lib/di/service-locator');
	const { SyncService } = require('im/messenger/provider/services/sync');
	const { Logger } = require('im/messenger/lib/logger');

	/**
	 * @class BasePullHandler
	 * @extends PullCommandHandler
	 */
	class BasePullHandler
	{
		constructor(options = {})
		{
			/** @type {Logger} */
			this.logger = options.logger || Logger;
		}

		getModuleId()
		{
			return 'im';
		}

		/**
		 * @protected
		 * @param {PullExtraParams} extra
		 * @param {object} options
		 * @param {boolean|undefined} options.ignoreServerTimeAgoCheck
		 * @param {boolean|undefined} options.ignoreSyncInterception keeps the event during a
		 *   sync/reconnect. Use only for events the sync never reloads, otherwise the event would be
		 *   applied on top of a sync snapshot that overwrites it. The staleness guard still applies.
		 * @return boolean
		 */
		interceptEvent(extra, options = {})
		{
			if (!options.ignoreServerTimeAgoCheck && extra.server_time_ago > 30)
			{
				return true;
			}

			if (options.ignoreSyncInterception)
			{
				return false;
			}

			const syncService = this.getSyncService();

			return syncService.checkPullEventNeedsIntercept();
		}

		/**
		 * @return {SyncService}
		 */
		getSyncService()
		{
			return serviceLocator.get('sync-service');
		}

		/**
		 * @desc get class name for logger
		 * @return {string}
		 */
		getClassName()
		{
			return this.constructor.name;
		}

		/**
		 * @return {MessengerCoreStore}
		 */
		get store()
		{
			return serviceLocator.get('core').getStore();
		}
	}

	module.exports = {
		BasePullHandler,
	};
});
