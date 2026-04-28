/**
 * @module im/messenger/lib/chat-search/src/service/server-search-service
 */

jn.define('im/messenger/lib/chat-search/src/service/server-search-service', (require, exports, module) => {
	const { Type } = require('type');
	const { getLogger } = require('im/messenger/lib/logger');
	const { runAction } = require('im/messenger/lib/rest');
	const { ChatSearchItem } = require('im/messenger/lib/chat-search/src/search-item');
	const { StoreUpdater } = require('im/messenger/lib/chat-search/src/store-updater');

	const ENTITY_ID = 'im-recent-v2';

	const logger = getLogger('chat-search');

	class ChatServerSearchService
	{
		/**
		 * @param {BaseSearchConfig} config
		 */
		constructor(config)
		{
			/**
			 * @private
			 * @type {BaseSearchConfig}
			 */
			this.config = config;

			/**
			 * @type {StoreUpdater}
			 */
			this.storeUpdater = new StoreUpdater();
		}

		/**
		 * @param {string} recentTab
		 * @return Promise<Array<string>>
		 */
		async loadRecent(recentTab)
		{
			return this.#loadRecentRequest(recentTab)
				.then((response) => {
					const { items, recentItems } = response.dialog;
					if (items.length === 0 || recentItems.length === 0)
					{
						return new Map();
					}
					const itemMap = this.#createItemsMap(items);
					const itemsFromRecentItems = this.#getItemsFromRecentItems(recentItems, itemMap);

					return this.#processLoadRecentResponse(itemsFromRecentItems);
				})
				.then((processedItems) => {
					return this.#getDialogIds(processedItems);
				})
				.catch((error) => {
					logger.error('ChatServerSearchService.loadRecent error', error);
				})
			;
		}

		/**
		 * @param {Array<string>} searchingWords
		 * @param {string} originalQuery
		 * @param {string} [recentTab]
		 * @return {Promise<RecentSearchResult>}
		 */
		async search(searchingWords, originalQuery, recentTab)
		{
			const response = await this.#searchRequest(searchingWords, originalQuery, recentTab);

			logger.log('after resp', response);

			const { items } = response.dialog;
			const itemsCollection = this.#createItemsMap(items);
			await this.#processLoadRecentResponse(itemsCollection);

			return response;
		}

		/**
		 * @param {DialogId} dialogId
		 */
		async saveItemToRecent(dialogId)
		{
			const recentItems = [{ id: dialogId, entityId: ENTITY_ID }];

			const config = this.config.getConfig();
			config.json.recentItems = recentItems;

			return runAction(this.config.getSaveItemEndpoint(), config);
		}

		/**
		 * @param {string} [recentTab]
		 * @return {Promise<RecentSearchResult>}
		 */
		async #loadRecentRequest(recentTab)
		{
			if (Type.isStringFilled(recentTab))
			{
				this.config.setOption({ searchRecentSection: recentTab });
			}

			/**
			 * @type {RecentSearchResult}
			 */
			const response = await runAction(this.config.getLoadLatestResultEndpoint(), this.config.getConfig());
			logger.warn('ChatServerSearchService.loadRecent response', response);

			return response;
		}

		/**
		 * @param {Array<string>} searchingWords
		 * @param {string} originalQuery
		 * @param {string} [recentTab]
		 * @return {Promise<RecentSearchResult>}
		 */
		async #searchRequest(searchingWords, originalQuery, recentTab)
		{
			if (Type.isStringFilled(recentTab))
			{
				this.config.setOption({ searchRecentSection: recentTab });
			}

			const config = this.config.getConfig();
			config.json.searchQuery = {
				queryWords: searchingWords,
				query: originalQuery,
			};

			/**
			 * @type {RecentSearchResult}
			 */
			const response = await runAction(this.config.getSearchRequestEndpoint(), config);
			logger.warn('ChatServerSearchService.search response', response);

			return response;
		}

		/**
		 * @param {Array<[string, string || number]>} recentItems
		 * @param {Map<string, ChatSearchItem>} items
		 * @return {Map<string, ChatSearchItem>}
		 */
		#getItemsFromRecentItems(recentItems, items)
		{
			const filledRecentItems = new Map();
			recentItems.forEach((recentItem) => {
				const [, dialogId] = recentItem;
				const itemFromMap = items.get(dialogId.toString());
				if (itemFromMap)
				{
					filledRecentItems.set(itemFromMap.dialogId, itemFromMap);
				}
			});

			return filledRecentItems;
		}

		/**
		 * @param {Array<RecentProviderItem>} items
		 * @return {Map<string, ChatSearchItem>}
		 */
		#createItemsMap(items)
		{
			const map = new Map();

			items.forEach((item) => {
				const mapItem = new ChatSearchItem(item);
				map.set(mapItem.dialogId, mapItem);
			});

			return map;
		}

		/**
		 * @param {Map<string, ChatSearchItem>} items
		 * @return {Promise<Map<string, ChatSearchItem>>}
		 */
		async #processLoadRecentResponse(items)
		{
			await this.storeUpdater.update(items);

			return items;
		}

		/**
		 * @param {Map<string, ChatSearchItem>} items
		 * @return {Array<string>}
		 */
		#getDialogIds(items)
		{
			return [...items.values()].map((item) => {
				return item.dialogId;
			});
		}
	}

	module.exports = { ChatServerSearchService };
});
