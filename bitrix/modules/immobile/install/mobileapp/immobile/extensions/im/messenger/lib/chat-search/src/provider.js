/**
 * @module im/messenger/lib/chat-search/src/provider
 */
jn.define('im/messenger/lib/chat-search/src/provider', (require, exports, module) => {
	const { Type } = require('type');
	const { ChatSearchConfig } = require('im/messenger/lib/chat-search/src/config');
	const { LocalSearchService } = require('im/messenger/lib/chat-search/src/service/local-search-service');
	const { ChatServerSearchService } = require('im/messenger/lib/chat-search/src/service/server-search-service');
	const { getLoggerWithContext } = require('im/messenger/lib/logger');
	const { serviceLocator } = require('im/messenger/lib/di/service-locator');
	const { DialogHelper, DateHelper } = require('im/messenger/lib/helper');
	const { DialogType, RecentTab } = require('im/messenger/const');
	const { MessengerParams } = require('im/messenger/lib/params');
	const { debounce } = require('utils/function');
	const { getWordsFromText } = require('im/messenger/lib/chat-search/src/helper/get-words-from-text');

	const nothing = () => {};
	// TODO: FolderSupport, refact it after implementation folers
	/** @type {Record<string, DialoguesFilter>} */
	const RECENT_TAB_TO_FILTER = {
		[RecentTab.chat]: {
			exceptDialogTypes: [
				DialogType.copilot,
				DialogType.lines,
				DialogType.comment,
				DialogType.tasksTask,
			],
		},
		[RecentTab.tasksTask]: {
			dialogTypes: [DialogType.tasksTask],
		},
		[RecentTab.copilot]: {
			dialogTypes: [DialogType.copilot],
		},
		[RecentTab.openChannel]: {
			dialogTypes: [DialogType.copilot],
		},
		[RecentTab.collab]: {
			dialogTypes: [DialogType.collab],
		},
	};

	class ChatSearchProvider
	{
		/**
		 * @param {object} params
		 * @param {function(): void} params.loadLatestSearchProcessed
		 * @param {function(Array<string>): void} params.loadLatestSearchComplete return dialog ids latest elements
		 * @param {function(Array<string>, boolean): void} params.loadSearchProcessed return dialogId ids local elements
		 * and flag that load from server is started
		 * @param {function(Array<string>, string): void} params.loadSearchComplete return resulted dialog ids
		 * @param {DialoguesFilter} [params.filter]
		 * @param {string} [params.recentTab]
		 */
		constructor(params)
		{
			this.logger = getLoggerWithContext('chat-search', this);

			/**
			 * @private
			 * @type {MessengerCoreStore}
			 */
			this.store = serviceLocator.get('core').getStore();
			/**
			 * @private
			 * @type {MessengerCoreStoreManager}
			 */
			this.messengerStore = serviceLocator.get('core').getMessengerStore();
			/**
			 * @protected
			 * @type {ChatSearchConfig}
			 */
			this.config = null;
			/**
			 * @protected
			 * @type {string}
			 * @desc Used for a request to the server
			 */
			this.recentTab = params.recentTab;
			/**
			 * @protected
			 * @type {DialoguesFilter}
			 * @desc Used for a request to the local DB
			 */
			this.filter = params.filter ?? RECENT_TAB_TO_FILTER[params.recentTab];
			/**
			 * @protected
			 * @type {ChatServerSearchService}
			 */
			this.serverService = null;
			/**
			 * @protected
			 * @type {LocalSearchService}
			 */
			this.localService = null;

			/**
			 * @protected
			 * @type {(function(Array<string>, string): Promise<Array<string>>)}
			 */
			this.searchOnServerDelayed = debounce(this.searchOnServer, 400, this);

			/**
			 * @protected
			 * @type {number}
			 */
			this.minSearchSize = MessengerParams.get('SEARCH_MIN_SIZE', 3);
			/**
			 * @protected
			 * @type {function(): void}
			 */
			this.loadLatestSearchProcessedCallback = params.loadLatestSearchProcessed ?? nothing;
			/**
			 * @protected
			 * @type {function(Array<string>): void}
			 */
			this.loadLatestSearchCompleteCallback = params.loadLatestSearchComplete ?? nothing;
			/**
			 * @protected
			 * @type {function(Array<string>, boolean): void}
			 */
			this.loadSearchProcessedCallback = params.loadSearchProcessed ?? nothing;
			/**
			 * @protected
			 * @type {function(Array<string>, string): void}
			 */
			this.loadSearchCompleteCallBack = params.loadSearchComplete ?? nothing;

			/**
			 * @protected
			 * @type {Map<string, Date|null>}
			 */
			this.searchDateCache = new Map();

			this.initConfig(params);
			this.initServices();

			window.messengerDebug.localSearchDebugInfo = {};
		}

		/**
		 * @param {string} text
		 */
		async doSearch(text)
		{
			try
			{
				await this.doSearchInternal(text);
			}
			catch (error)
			{
				// TODO: remove after solving local search error
				const errorText = `doSearch(${text}) error 🚨: ${error.name}: ${error.message}`;
				this.logger.error(errorText);

				window.messengerDebug.localSearchDebugInfo.doSearchErrorText = errorText;
				window.messengerDebug.localSearchDebugInfo.doSearchError = error;
			}
		}

		/**
		 * @protected
		 * @param text
		 * @return {Promise<void>}
		 */
		async doSearchInternal(text)
		{
			if (text.length === 0)
			{
				this.loadSearchProcessedCallback([], false);

				return;
			}

			const wordsFromText = getWordsFromText(text);

			let localSearchResult = [];
			try
			{
				const searchParams = {
					searchText: wordsFromText.join(' '),
				};
				localSearchResult = await this.localService.search(searchParams, this.filter);
			}
			catch (error)
			{
				// TODO: remove after solving local search error
				const errorText = `localService.search(${text}) error 🚨: ${error.name}: ${error.message}`;
				this.logger.error(errorText);

				window.messengerDebug.localSearchDebugInfo.localSearchErrorText = errorText;
				window.messengerDebug.localSearchDebugInfo.localSearchError = error;
			}

			const localSearchingIds = this.sortByDate(localSearchResult);
			const needSearchFromServer = text.length >= this.minSearchSize;

			this.loadSearchProcessedCallback(localSearchingIds, needSearchFromServer);

			if (!needSearchFromServer)
			{
				return;
			}

			void this.searchOnServerDelayed(wordsFromText, text, localSearchingIds);
		}

		/**
		 * @return {Promise<Array<string>>}
		 */
		async loadLatestSearch()
		{
			this.loadLatestSearchProcessedCallback();
			this.serverService.loadRecent(this.recentTab)
				.then((recentIds) => {
					this.loadLatestSearchCompleteCallback(recentIds);
				})
				.catch((error) => {
					this.logger.error(error);
				})
			;
		}

		loadRecentUsers()
		{
			/**
			 * @type {Array<string>}
			 */
			const recentUsers = [];
			recentUsers.push(MessengerParams.getUserId());
			this.store.getters['recentModel/getSortedCollection']().forEach((recentItem) => {
				if (DialogHelper.isDialogId(recentItem.id))
				{
					return;
				}
				const user = this.store.getters['usersModel/getById'](recentItem.id);

				if (!user || user.bot || Number(user.id) === MessengerParams.getUserId())
				{
					return;
				}

				if (user)
				{
					recentUsers.push(user.id);
				}
			});

			return recentUsers;
		}

		async saveItemToRecent(dialogId)
		{
			return this.serverService.saveItemToRecent(dialogId);
		}

		/**
		 * @protected
		 */
		initServices()
		{
			/**
			 * @protected
			 * @type {ChatServerSearchService}
			 */
			this.serverService = new ChatServerSearchService(this.config);
			/**
			 * @protected
			 * @type {LocalSearchService}
			 */
			this.localService = new LocalSearchService();
		}

		/**
		 * @protected
		 */
		initConfig()
		{
			/**
			 * @protected
			 * @type {ChatSearchConfig}
			 */
			this.config = new ChatSearchConfig();
		}

		/**
		 * @protected
		 * @param {Array<string>} searchingWords
		 * @param {string} originalQuery
		 * @param {Array<string>} localSearchingIds
		 */

		searchOnServer(searchingWords, originalQuery, localSearchingIds)
		{
			void this.serverService.search(searchingWords, originalQuery, this.recentTab)
				.then((response) => {
					const { items } = response.dialog;

					this.fillSearchDateCache(items);

					return items.map((item) => item.id);
				})
				.then((remoteDialogIds) => {
					const mergedDialogIds = this.merge(localSearchingIds, remoteDialogIds);
					const resultedDialogIds = this.sortByDate(mergedDialogIds);

					this.loadSearchCompleteCallBack(resultedDialogIds, originalQuery);
				})
				.catch((error) => {
					this.logger.error(error);
				})
			;
		}

		/**
		 * @protected
		 * @param {Array<{ id: string, customData: { dateMessage: Date }}>} items
		 */
		fillSearchDateCache(items)
		{
			items.forEach((item) => {
				this.searchDateCache.set(item.id, item.customData?.dateMessage ?? null);
			});
		}

		closeSession()
		{
			this.searchDateCache.clear();
		}

		/**
		 * @private
		 * @param {Array<string>} dialogIds
		 * @return {Array<string>}
		 */
		sortByDate(dialogIds)
		{
			if (!Type.isArrayFilled(dialogIds))
			{
				return [];
			}

			dialogIds.sort((firstId, secondId) => {
				const firstItem = this.store.getters['recentModel/getById'](firstId);
				const secondItem = this.store.getters['recentModel/getById'](secondId);

				const firstDate = DateHelper.cast(firstItem?.dateMessage ?? this.searchDateCache.get(firstId), null);
				const secondDate = DateHelper.cast(secondItem?.dateMessage ?? this.searchDateCache.get(secondId), null);

				if (!firstDate || !secondDate)
				{
					if (!firstDate && !secondDate)
					{
						if (this.isExtranet(firstId))
						{
							return 1;
						}

						if (this.isExtranet(secondId))
						{
							return -1;
						}

						return 0;
					}

					return firstDate ? -1 : 1;
				}

				return secondDate - firstDate;
			});

			return dialogIds;
		}

		/**
		 * @private
		 * @param {string} dialogId
		 * @return {boolean}
		 */
		isExtranet(dialogId)
		{
			const dialog = this.store.getters['dialoguesModel/getById'](dialogId);
			if (!dialog)
			{
				return false;
			}

			if (dialog.type === DialogType.user)
			{
				const user = this.store.getters['usersModel/getById'](dialogId);

				return user && user.extranet;
			}

			return dialog.extranet;
		}

		/**
		 * @private
		 * @param {Array<string>} localDialogIds
		 * @param {Array<string>} remoteDialogIds
		 * @return {Array<string>}
		 */
		merge(localDialogIds, remoteDialogIds)
		{
			const result = [...remoteDialogIds];

			localDialogIds.forEach((localDialogId) => {
				if (!remoteDialogIds.includes(localDialogId))
				{
					result.push(localDialogId);
				}
			});

			return result;
		}
	}

	module.exports = { ChatSearchProvider };
});
