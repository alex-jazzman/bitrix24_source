/**
 * @module market/app-list/src/providers/base-list-provider
 */
jn.define('market/app-list/src/providers/base-list-provider', (require, exports, module) => {
	const { Loc } = require('loc');
	const {
		INSTALLED_FILTER_UPDATES,
		MARKET_LIST_TYPE,
		resolveListType,
	} = require('market/utils');

	const DEFAULT_ITEMS_LOAD_LIMIT = 20;
	const STATEFUL_LIST_CACHE_TTL = 3 * 86400;

	class BaseListProvider
	{
		constructor(params = {})
		{
			this.setParams(params);
		}

		setParams(params = {})
		{
			this.params = params ?? {};
		}

		getListType()
		{
			return resolveListType(this.params.listType ?? MARKET_LIST_TYPE.CATEGORY);
		}

		normalizeSortOrder(value = {})
		{
			return (value && typeof value === 'object' && !Array.isArray(value) ? value : {});
		}

		getSortOrderCacheKey(value = {})
		{
			return encodeURIComponent(JSON.stringify(this.normalizeSortOrder(value)) || '{}');
		}

		areSortOrdersEqual(left = {}, right = {})
		{
			return this.getSortOrderCacheKey(left) === this.getSortOrderCacheKey(right);
		}

		getDefaultListData()
		{
			return {
				isAvailable: true,
				listType: this.getListType(),
				developerTag: '',
				installedFilter: '',
				title: Loc.getMessage('MOBILE_MARKET_LIST_DEFAULT_TITLE'),
				sortInfo: null,
				showSortMenu: false,
				tabs: null,
				items: [],
				pagination: {
					currentPage: 1,
					pages: 1,
				},
				emptyState: null,
				unavailableState: null,
			};
		}

		getCacheName({ sortOrder = {} } = {})
		{
			return [
				'market-list',
				this.getListType(),
				this.getSortOrderCacheKey(sortOrder),
			].join('/');
		}

		getActionName()
		{
			return '';
		}

		getActionParams()
		{
			return {};
		}

		mergeLoadedListData(currentListData = {}, responseData = {})
		{
			return {
				...currentListData,
				...responseData,
				items: [],
				pagination: responseData.pagination ?? currentListData.pagination,
			};
		}

		isListMetadataChanged(currentListData = {}, nextListData = {})
		{
			return this.getComparableMetadata(currentListData) !== this.getComparableMetadata(nextListData);
		}

		getComparableMetadata(listData = {})
		{
			return JSON.stringify({
				isAvailable: listData.isAvailable,
				title: listData.title,
				sortInfo: listData.sortInfo,
				showSortMenu: listData.showSortMenu,
				tabs: listData.tabs,
				emptyState: listData.emptyState,
				unavailableState: listData.unavailableState,
			});
		}

		isAllItemsLoaded({ response = {} } = {})
		{
			const currentPage = Number(response?.pagination?.currentPage ?? 1);
			const totalPages = Number(response?.pagination?.pages ?? 1);

			return currentPage >= totalPages;
		}
	}

	module.exports = {
		BaseListProvider,
		DEFAULT_ITEMS_LOAD_LIMIT,
		INSTALLED_FILTER_UPDATES,
		MARKET_LIST_TYPE,
		STATEFUL_LIST_CACHE_TTL,
		resolveListType,
	};
});
