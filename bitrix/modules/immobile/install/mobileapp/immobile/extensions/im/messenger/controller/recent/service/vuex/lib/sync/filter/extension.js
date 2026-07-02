/**
 * @module im/messenger/controller/recent/service/vuex/lib/sync/filter
 */
jn.define('im/messenger/controller/recent/service/vuex/lib/sync/filter', (require, exports, module) => {
	const { Type } = require('type');
	const { RecentFilterId, RecentTabByNavigationTab, ROOT_PARENT_CHAT_ID } = require('im/messenger/const');
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
		 * @returns {string}
		 */
		get recentSection()
		{
			return this.recentLocator.get('recentSection');
		}

		/**
		 * @returns {number}
		 */
		get parentChatId()
		{
			return this.recentLocator.get('parentChatId');
		}

		/**
		 * @description Subscribes to mutations that affect the filtered collection.
		 * @returns {void}
		 */
		subscribeStoreMutation()
		{
			this.storeManager
				.on('recentModel/setNestedIdCollection', this.setNestedIdCollectionHandler)
				.on('recentModel/storeNestedIdCollection', this.storeNestedIdCollectionHandler)
				.on('recentModel/delete', this.deleteHandler)
				.on('recentModel/recentFilteredModel/setCurrentFilter', this.setCurrentFilterHandler)
				.on('counterModel/set', this.counterSetHandler)
				.on('counterModel/delete', this.counterDeleteHandler)
			;
		}

		/**
		 * @description Unsubscribes from mutations that affect the filtered collection.
		 * @returns {void}
		 */
		unsubscribeStoreMutation()
		{
			this.storeManager
				.off('recentModel/setNestedIdCollection', this.setNestedIdCollectionHandler)
				.off('recentModel/storeNestedIdCollection', this.storeNestedIdCollectionHandler)
				.off('recentModel/delete', this.deleteHandler)
				.off('recentModel/recentFilteredModel/setCurrentFilter', this.setCurrentFilterHandler)
				.off('counterModel/set', this.counterSetHandler)
				.off('counterModel/delete', this.counterDeleteHandler)
			;
		}

		/**
		 * @description Handles recentModel/setNestedIdCollection mutation.
		 * Syncs filtered collection when items are accumulated into a tab at the top level.
		 * @param {MutationPayload<RecentSetNestedIdCollectionData>} payload
		 * @returns {Promise<void>}
		 */
		setNestedIdCollectionHandler = async ({ payload }) => {
			const { recentSection, parentChatId = ROOT_PARENT_CHAT_ID } = payload?.data ?? {};
			if (recentSection !== this.recentSection || parentChatId !== this.parentChatId)
			{
				return;
			}

			this.logger.log('recentFilteredSync: setNestedIdCollectionHandler', { recentSection, parentChatId });
			await this.#syncForTab(this.tabId, parentChatId);
		};

		/**
		 * @description Handles recentModel/storeNestedIdCollection mutation.
		 * Syncs filtered collection when a tab's Set is fully replaced at the top level.
		 * @param {MutationPayload<RecentStoreNestedIdCollectionData>} payload
		 * @returns {Promise<void>}
		 */
		storeNestedIdCollectionHandler = async ({ payload }) => {
			const { recentSection, parentChatId = ROOT_PARENT_CHAT_ID } = payload?.data ?? {};
			if (!Type.isStringFilled(recentSection) || recentSection !== this.recentSection || parentChatId !== this.parentChatId)
			{
				return;
			}

			this.logger.log('recentFilteredSync: storeNestedIdCollectionHandler', { recentSection, parentChatId });
			await this.#syncForTab(this.tabId, parentChatId);
		};

		/**
		 * @description Handles recentModel/delete mutation.
		 */
		deleteHandler = async () => {
			this.logger.log('recentFilteredSync: deleteHandler');
			await this.#syncForTab(this.tabId, this.parentChatId);
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

			if (!Type.isStringFilled(tabId) || RecentTabByNavigationTab[tabId] !== this.recentSection)
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
				await this.#syncForTab(this.tabId, this.parentChatId);
			}
		};

		/**
		 * @description Handles counterModel/set mutation.
		 */
		counterSetHandler = async () => {
			this.logger.log('recentFilteredSync: counterSetHandler');
			await this.#syncForTab(this.tabId, this.parentChatId);
		};

		/**
		 * @description Handles counterModel/delete mutation.
		 */
		counterDeleteHandler = async () => {
			this.logger.log('recentFilteredSync: counterDeleteHandler');
			await this.#syncForTab(this.tabId, this.parentChatId);
		};

		/**
		 * @description Dispatches sync for given tab.
		 * @param {string} tabId
		 * @param {number} [parentChatId]
		 */
		#syncForTab(tabId, parentChatId = ROOT_PARENT_CHAT_ID)
		{
			return this.store.dispatch('recentModel/syncFilteredIdCollection', { tabId, parentChatId });
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
