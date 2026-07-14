/**
 * @module im/messenger/lib/chat-search/src/provider
 */
jn.define('im/messenger/lib/chat-search/src/provider', (require, exports, module) => {
	const { Type } = require('type');
	const { getLoggerWithContext } = require('im/messenger/lib/logger');
	const { serviceLocator } = require('im/messenger/lib/di/service-locator');
	const { DialogHelper, DateHelper } = require('im/messenger/lib/helper');
	const { DialogType } = require('im/messenger/const');
	const { MessengerParams } = require('im/messenger/lib/params');
	const { debounce } = require('utils/function');
	const { getWordsFromText } = require('im/messenger/lib/chat-search/src/helper/get-words-from-text');

	const nothing = () => {};

	class ChatSearchProvider
	{
		/**
		 * @param {object} params
		 * @param {LocalSearchStrategy} params.localStrategy
		 * @param {ServerSearchStrategy} params.serverStrategy
		 * @param {function(): void} [params.loadLatestSearchProcessed]
		 * @param {function(Array<string>): void} [params.loadLatestSearchComplete]
		 * @param {function(Array<string>, boolean): void} [params.loadSearchProcessed]
		 * @param {function(Array<string>, string): void} [params.loadSearchComplete]
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
			 * @protected
			 * @type {LocalSearchStrategy}
			 */
			this.localStrategy = params.localStrategy;
			/**
			 * @protected
			 * @type {ServerSearchStrategy}
			 */
			this.serverStrategy = params.serverStrategy;

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
			this.loadLatestSearchProcessedCallback = nothing;
			/**
			 * @protected
			 * @type {function(Array<string>): void}
			 */
			this.loadLatestSearchCompleteCallback = nothing;
			/**
			 * @protected
			 * @type {function(Array<string>, boolean): void}
			 */
			this.loadSearchProcessedCallback = nothing;
			/**
			 * @protected
			 * @type {function(Array<string>, string): void}
			 */
			this.loadSearchCompleteCallBack = nothing;

			this.setCallbacks(params);

			/**
			 * @protected
			 * @type {Map<string, Date|null>}
			 */
			this.searchDateCache = new Map();

			window.messengerDebug.localSearchDebugInfo = {};
		}

		/**
		 * @param {object} callbacks
		 * @param {function(): void} [callbacks.loadLatestSearchProcessed]
		 * @param {function(Array<string>): void} [callbacks.loadLatestSearchComplete]
		 * @param {function(Array<string>, boolean): void} [callbacks.loadSearchProcessed]
		 * @param {function(Array<string>, string): void} [callbacks.loadSearchComplete]
		 */
		setCallbacks(callbacks = {})
		{
			if (Type.isFunction(callbacks.loadLatestSearchProcessed))
			{
				this.loadLatestSearchProcessedCallback = callbacks.loadLatestSearchProcessed;
			}
			if (Type.isFunction(callbacks.loadLatestSearchComplete))
			{
				this.loadLatestSearchCompleteCallback = callbacks.loadLatestSearchComplete;
			}
			if (Type.isFunction(callbacks.loadSearchProcessed))
			{
				this.loadSearchProcessedCallback = callbacks.loadSearchProcessed;
			}
			if (Type.isFunction(callbacks.loadSearchComplete))
			{
				this.loadSearchCompleteCallBack = callbacks.loadSearchComplete;
			}
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
				localSearchResult = await this.localStrategy.search({
					searchText: wordsFromText.join(' '),
				});
			}
			catch (error)
			{
				// TODO: remove after solving local search error
				const errorText = `localStrategy.search(${text}) error 🚨: ${error.name}: ${error.message}`;
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
		 * @return {Promise<void>}
		 */
		async loadLatestSearch()
		{
			this.loadLatestSearchProcessedCallback();
			this.serverStrategy.loadRecent()
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
			return this.serverStrategy.saveItemToRecent(dialogId);
		}

		/**
		 * @protected
		 * @param {Array<string>} searchingWords
		 * @param {string} originalQuery
		 * @param {Array<string>} localSearchingIds
		 */
		searchOnServer(searchingWords, originalQuery, localSearchingIds)
		{
			void this.serverStrategy.search(searchingWords, originalQuery)
				.then((response) => {
					const { items } = response.dialog;
					this.logger.warn('searchOnServer response', items);

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
		 * @param {Array<RecentProviderItem>} items
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
