/**
 * @module im/messenger/controller/recent/service/vuex/lib/sync/filter
 */
jn.define('im/messenger/controller/recent/service/vuex/lib/sync/filter', (require, exports, module) => {
	const { Type } = require('type');
	const { RecentFilterId, ROOT_PARENT_CHAT_ID } = require('im/messenger/const');
	const { serviceLocator } = require('im/messenger/lib/di/service-locator');
	const { FolderComposition } = require('im/messenger/controller/recent/service/lib/folder-composition');

	/**
	 * @class RecentFilteredSync
	 * @description Centralized sync of recentFilteredModel with recentModel.
	 * Subscribes to storeManager mutations and invokes sync/clear on changes.
	 */
	class RecentFilteredSync
	{
		/**
		 * @private
		 * @type {?Promise<void>}
		 */
		#pendingSync = null;

		/**
		 * @private
		 * @type {number}
		 */
		#syncToken = 0;

		/**
		 * @param {RecentLocator} recentLocator
		 * @param {Logger} logger
		 * @param {string|null} [recentSection]
		 */
		constructor(recentLocator, logger, recentSection = null)
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
			this.explicitRecentSection = recentSection;
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
			/**
			 * @private
			 * @type {boolean}
			 */
			this.isSubscribed = false;
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
			return this.explicitRecentSection ?? this.recentLocator.get('recentSection');
		}

		/**
		 * Recent sections the tab is made of. A tab with a section of its own is that one
		 * section; a composite tab ("All") has none and takes the composition its list service
		 * already keeps, falling back to the static resolution while the service is not there.
		 * The composition is not cached here: the list service owns the cache and drops it on
		 * the folder mutations able to change it.
		 *
		 * @returns {Set<string>}
		 */
		get sectionSet()
		{
			if (Type.isStringFilled(this.recentSection))
			{
				return new Set([this.recentSection]);
			}

			return this.recentLocator.get('vuex')?.sections ?? FolderComposition.getSectionsByTabId(this.tabId);
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
			if (this.isSubscribed)
			{
				return;
			}
			this.isSubscribed = true;

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
			if (!this.isSubscribed)
			{
				return;
			}
			this.isSubscribed = false;

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
			if (parentChatId !== this.parentChatId || !this.sectionSet.has(recentSection))
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
			if (parentChatId !== this.parentChatId || !this.sectionSet.has(recentSection))
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
			const { tabId, parentChatId = ROOT_PARENT_CHAT_ID, filterId } = payload?.data || {};

			if (!Type.isStringFilled(tabId) || tabId !== this.tabId || parentChatId !== this.parentChatId)
			{
				return;
			}

			this.logger.log('recentFilteredSync: setCurrentFilterHandler', { tabId, parentChatId, filterId });

			if (filterId === RecentFilterId.all)
			{
				await this.#clearForTab(this.tabId, this.parentChatId);
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
		 * @description Recalculates the filtered collection of this tab on demand. Used when the
		 * composition of a composite tab changes: the set was built for the previous sections, and
		 * a source added to the folder brings unread chats the set does not know yet.
		 * @returns {Promise<void>}
		 */
		resync()
		{
			this.logger.log('recentFilteredSync: resync');

			return this.#syncForTab(this.tabId, this.parentChatId);
		}

		/**
		 * @description Dispatches sync for given tab. The section set always travels with the payload:
		 * a tab addressed by a folder id has no entry in the map the model resolves sections by, and
		 * its live sync would otherwise recalculate over an empty set. A tab with a section of its own
		 * sends that one section, so the payload says the same thing the map would have said.
		 *
		 * One recalculation walks the whole union and resolves every chat, while a single seeded
		 * page commits a section mutation per item and per section of it. Calls made inside one
		 * synchronous burst therefore share a single recalculation: the dispatch is deferred by a
		 * microtask and the callers join the promise of the one already pending. Deferring by a
		 * microtask and not by a timer keeps the handlers awaitable: a caller awaiting a handler
		 * still observes the dispatch.
		 *
		 * The set of sections is read at dispatch time, so a burst that changes the composition
		 * along the way is answered by the composition it ends with.
		 *
		 * @param {string} tabId
		 * @param {number} [parentChatId]
		 * @returns {Promise<void>}
		 */
		#syncForTab(tabId, parentChatId = ROOT_PARENT_CHAT_ID)
		{
			if (this.#pendingSync)
			{
				return this.#pendingSync;
			}

			const token = ++this.#syncToken;

			this.#pendingSync = Promise.resolve().then(() => {
				this.#pendingSync = null;

				if (token !== this.#syncToken)
				{
					return undefined;
				}

				return this.store.dispatch('recentModel/syncFilteredIdCollection', {
					tabId,
					parentChatId,
					sections: this.sectionSet,
				});
			});

			return this.#pendingSync;
		}

		/**
		 * @description Drops a recalculation that has been scheduled but not dispatched yet. The
		 * token is what actually cancels it: the microtask is already queued and cannot be unqueued,
		 * so it checks the token and does nothing when a newer decision has been made.
		 */
		#cancelPendingSync()
		{
			this.#syncToken++;
			this.#pendingSync = null;
		}

		/**
		 * @description Clears filtered collection for given tab.
		 * @param {string} tabId
		 * @param {number} [parentChatId]
		 */
		async #clearForTab(tabId, parentChatId = ROOT_PARENT_CHAT_ID)
		{
			// a recalculation still pending would land after the set is dropped and refill it
			this.#cancelPendingSync();

			await this.store.dispatch('recentModel/recentFilteredModel/clearIdCollection', { tabId, parentChatId });
		}
	}

	module.exports = { RecentFilteredSync };
});
