/* eslint-disable */
this.BX = this.BX || {};
this.BX.Messenger = this.BX.Messenger || {};
this.BX.Messenger.v2 = this.BX.Messenger.v2 || {};
(function (exports, main_core, im_v2_lib_search, im_v2_lib_logger, im_v2_lib_utils) {
	'use strict';

	const SEARCH_REQUEST_ENDPOINT = 'ui.entityselector.doSearch';
	const LOAD_LATEST_RESULTS_ENDPOINT = 'ui.entityselector.load';
	const SAVE_ITEM_ENDPOINT = 'ui.entityselector.saveRecentItems';
	class SearchService {
		#localSearch;
		#localCollection = new Map();
		#searchConfig;
		#storeUpdater;
		constructor(searchConfig) {
			this.#searchConfig = searchConfig;
			this.#storeUpdater = new im_v2_lib_search.StoreUpdater();
			this.#localSearch = new im_v2_lib_search.LocalSearch(searchConfig);
		}
		async loadLatestResults() {
			const response = await this.#loadLatestResultsRequest();
			const {
				items,
				recentItems
			} = response;
			if (items.length === 0 || recentItems.length === 0) {
				return [];
			}
			const itemsFromRecentItems = this.#getItemsFromRecentItems(recentItems, items);
			await this.#storeUpdater.update(itemsFromRecentItems);
			await this.updateCustomStore(itemsFromRecentItems);
			return this.#getDialogIdAndDate(itemsFromRecentItems);
		}
		searchLocal(query) {
			const localCollection = [...this.#localCollection.values()];
			return this.#localSearch.search(query, localCollection);
		}
		async search(query) {
			const items = await this.#searchRequest(query);
			await this.#storeUpdater.update(items);
			await this.updateCustomStore(items);
			const searchResult = this.#getDialogIdAndDate(items);
			searchResult.forEach(searchItem => {
				this.#localCollection.set(searchItem.dialogId, searchItem);
			});
			return searchResult;
		}
		saveItemToRecentSearch(dialogId) {
			const recentItems = [{
				id: dialogId,
				entityId: this.#searchConfig.entityId ?? im_v2_lib_search.EntityId
			}];
			const config = {
				json: {
					...im_v2_lib_search.getSearchConfig(this.#searchConfig),
					recentItems
				}
			};
			void main_core.ajax.runAction(SAVE_ITEM_ENDPOINT, config);
		}
		updateCustomStore(items) {
			return Promise.resolve();
		}
		clearSessionResult() {
			this.#localCollection.clear();
		}
		async #loadLatestResultsRequest() {
			const config = {
				json: im_v2_lib_search.getSearchConfig(this.#searchConfig)
			};
			let items = {
				items: [],
				recentItems: []
			};
			try {
				const response = await main_core.ajax.runAction(LOAD_LATEST_RESULTS_ENDPOINT, config);
				im_v2_lib_logger.Logger.warn('Search service: latest search request result', response);
				items = response.data.dialog;
			} catch (error) {
				im_v2_lib_logger.Logger.warn('Search service: latest search request error', error);
			}
			return items;
		}
		async #searchRequest(query) {
			const config = {
				json: im_v2_lib_search.getSearchConfig(this.#searchConfig)
			};
			config.json.searchQuery = {
				queryWords: im_v2_lib_utils.Utils.text.getWordsFromString(query),
				query
			};
			let items = [];
			try {
				const response = await main_core.ajax.runAction(SEARCH_REQUEST_ENDPOINT, config);
				im_v2_lib_logger.Logger.warn('Search service: request result', response);
				items = response.data.dialog.items;
			} catch (error) {
				im_v2_lib_logger.Logger.warn('Search service: error', error);
			}
			return items;
		}
		#getDialogIdAndDate(items) {
			return items.map(item => {
				return {
					dialogId: item.id.toString(),
					dateMessage: item.customData?.dateMessage ?? ''
				};
			});
		}
		#getItemsFromRecentItems(recentItems, items) {
			const filledRecentItems = [];
			recentItems.forEach(([, dialogId]) => {
				const found = items.find(recentItem => {
					return recentItem.id === dialogId.toString();
				});
				if (found) {
					filledRecentItems.push(found);
				}
			});
			return filledRecentItems;
		}
	}

	exports.SearchService = SearchService;

})(this.BX.Messenger.v2.Service = this.BX.Messenger.v2.Service || {}, BX, BX.Messenger.v2.Lib, BX.Messenger.v2.Lib, BX.Messenger.v2.Lib);
//# sourceMappingURL=registry.bundle.js.map
