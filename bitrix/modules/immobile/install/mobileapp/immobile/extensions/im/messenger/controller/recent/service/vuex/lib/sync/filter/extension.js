/**
 * @module im/messenger/controller/recent/service/vuex/lib/sync/filter
 */
jn.define('im/messenger/controller/recent/service/vuex/lib/sync/filter', (require, exports, module) => {
	const { Type } = require('type');
	const { NavigationTabId, RecentFilterId } = require('im/messenger/const');
	const { serviceLocator } = require('im/messenger/lib/di/service-locator');

	/**
	 * @class RecentFilteredSync
	 * @description Centralized sync of recentFilteredModel with recentModel.
	 * Subscribes to storeManager mutations and invokes sync/clear on changes.
	 */
	class RecentFilteredSync
	{
		/**
		 * @param {RecentLocator} recentLocator
		 * @param {Logger} logger
		 */
		constructor(recentLocator, logger)
		{
			/**
			 * @private
			 * @type {RecentLocator}
			 */
			this.recentLocator = recentLocator;
			/**
			 * @private
			 * @type {Logger}
			 */
			this.logger = logger;
			/**
			 * @private
			 * @type {MessengerCoreStore}
			 */
			this.store = serviceLocator.get('core').getStore();
			/**
			 * @private
			 * @type {MessengerCoreStoreManager}
			 */
			this.storeManager = serviceLocator.get('core').getStoreManager();
		}

		/**
		 * @returns {string}
		 */
		get tabId()
		{
			return this.recentLocator.get('id');
		}

		/**
		 * @description Subscribes to mutations that affect the filtered collection.
		 * @returns {void}
		 */
		subscribeStoreMutation()
		{
			this.storeManager
				.on('recentModel/setChatIdCollection', this.setChatIdCollectionHandler)
				.on('recentModel/setTaskIdCollection', this.setTaskIdCollectionHandler)
				.on('recentModel/storeIdCollection', this.storeIdCollectionHandler)
				.on('recentModel/delete', this.deleteHandler)
				.on('recentModel/recentFilteredModel/setCurrentFilter', this.setCurrentFilterHandler)
				.on('counterModel/set', this.counterSetHandler)
				.on('counterModel/delete', this.counterDeleteHandler)
			;
		}

		/**
		 * @description Handles recentModel/setChatIdCollection mutation.
		 */
		setChatIdCollectionHandler = async () => {
			if (this.tabId === NavigationTabId.chats)
			{
				this.logger.log('recentFilteredSync: setChatIdCollectionHandler');
				await this.#syncForTab(this.tabId);
			}
		};

		/**
		 * @description Handles recentModel/setTaskIdCollection mutation.
		 */
		setTaskIdCollectionHandler = async () => {
			if (this.tabId === NavigationTabId.task)
			{
				this.logger.log('recentFilteredSync: setTaskIdCollectionHandler');
				await this.#syncForTab(this.tabId);
			}
		};

		/**
		 * @description Handles recentModel/storeIdCollection mutation.
		 * @param {MutationPayload<RecentStoreIdCollectionData, RecentStoreIdCollectionActions>} payload
		 * @returns {Promise<void>}
		 */
		storeIdCollectionHandler = async ({ payload }) => {
			const tab = payload?.data?.tab;
			if (Type.isStringFilled(tab) && tab === this.tabId)
			{
				this.logger.log('recentFilteredSync: storeIdCollectionHandler', { tab });
				await this.#syncForTab(this.tabId);
			}
		};

		/**
		 * @description Handles recentModel/delete mutation.
		 */
		deleteHandler = async () => {
			this.logger.log('recentFilteredSync: deleteHandler');
			await this.#syncForTab(this.tabId);
		};

		/**
		 * @description Handles recentModel/recentFilteredModel/setCurrentFilter mutation.
		 * @param {MutationPayload<
		 * 		RecentFilteredSetCurrentFilterData,
		 * 		RecentFilteredModelSetCurrentFilterActions
		 * >} payload
		 */
		setCurrentFilterHandler = async ({ payload }) => {
			const { tabId, filterId } = payload?.data || {};

			if (!Type.isStringFilled(tabId) || tabId !== this.tabId)
			{
				return;
			}

			this.logger.log('recentFilteredSync: setCurrentFilterHandler', { tabId, filterId });

			if (filterId === RecentFilterId.all)
			{
				await this.#clearForTab(this.tabId);
			}
			else if (Type.isStringFilled(filterId))
			{
				await this.#syncForTab(this.tabId);
			}
		};

		/**
		 * @description Handles counterModel/set mutation.
		 */
		counterSetHandler = async () => {
			this.logger.log('recentFilteredSync: counterSetHandler');
			await this.#syncForTab(this.tabId);
		};

		/**
		 * @description Handles counterModel/delete mutation.
		 */
		counterDeleteHandler = async () => {
			this.logger.log('recentFilteredSync: counterDeleteHandler');
			await this.#syncForTab(this.tabId);
		};

		/**
		 * @description Dispatches sync for given tab.
		 * @param {string} tabId
		 */
		#syncForTab(tabId)
		{
			return this.store.dispatch('recentModel/syncFilteredIdCollection', { tabId });
		}

		/**
		 * @description Clears filtered collection for given tab.
		 * @param {string} tabId
		 */
		async #clearForTab(tabId)
		{
			await this.store.dispatch('recentModel/recentFilteredModel/clearIdCollection', { tabId });
		}
	}

	module.exports = { RecentFilteredSync };
});
