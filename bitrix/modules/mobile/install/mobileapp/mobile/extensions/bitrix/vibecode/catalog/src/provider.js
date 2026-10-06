/**
 * @module vibecode/catalog/src/provider
 */
jn.define('vibecode/catalog/src/provider', (require, exports, module) => {
	const { Loc } = require('loc');
	const { RunActionExecutor } = require('rest/run-action-executor');
	const { withCurrentDomain } = require('utils/url');
	const { CATALOG_STATE } = require('vibecode/catalog/src/const');
	const { normalizePositiveInteger } = require('vibecode/catalog/src/utils');

	const DEFAULT_ITEMS_LOAD_LIMIT = 20;
	const STATEFUL_LIST_CACHE_TTL = 3 * 86400;
	const CATALOG_STATE_VALUES = [
		CATALOG_STATE.ACTIVE,
		CATALOG_STATE.HIDDEN,
		CATALOG_STATE.NEW,
		CATALOG_STATE.ALL,
	];

	class VibeCodeCatalogProvider
	{
		constructor(params = {})
		{
			this.setParams(params);
		}

		setParams(params = {})
		{
			this.params = params ?? {};
		}

		getDefaultListData()
		{
			return {
				isAvailable: true,
				title: Loc.getMessage('MOBILE_VIBECODE_CATALOG_TITLE_TEXT'),
				showSortMenu: false,
				items: [],
				pagination: {
					offset: 0,
					limit: DEFAULT_ITEMS_LOAD_LIMIT,
					hasNext: false,
				},
			};
		}

		getActionName()
		{
			return 'vibecodeconnector.Catalog.myList';
		}

		getActionParams()
		{
			const json = {};
			const searchQuery = this.getSearchQuery();
			const previewUserId = this.getPreviewUserId();
			const state = this.getState();
			const viewSession = this.getViewSession();

			if (searchQuery)
			{
				json.q = searchQuery;
			}

			json.state = state;

			if (previewUserId !== null)
			{
				json.previewUserId = previewUserId;
			}

			if (state === CATALOG_STATE.NEW && viewSession !== null)
			{
				json.viewSession = viewSession;
			}

			return json;
		}

		getNewAppsCount()
		{
			const params = {};
			const previewUserId = this.getPreviewUserId();
			if (previewUserId !== null)
			{
				params.previewUserId = previewUserId;
			}

			return (new RunActionExecutor('vibecodeconnector.Catalog.getNewAppsCount', params))
				.call(false)
				.then((response) => {
					const errors = Array.isArray(response?.errors) ? response.errors : [];
					if (errors.length > 0)
					{
						throw response;
					}

					const count = Number(response?.data?.count);

					return (Number.isInteger(count) && count > 0 ? count : 0);
				});
		}

		getCacheName()
		{
			return [
				'vibecode-catalog',
				this.getPortalCacheKey(),
				this.getUserCacheKey(),
				this.getPreviewUserId() ?? 'current',
				this.getState(),
				encodeURIComponent(this.getSearchQuery() || '__all__'),
			].join('/');
		}

		mergeLoadedListData(currentListData = {}, responseData = {})
		{
			return {
				...currentListData,
				...responseData,
				items: [],
				showSortMenu: false,
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
				showSortMenu: listData.showSortMenu,
				pagination: listData.pagination,
			});
		}

		isAllItemsLoaded({ response = {}, items = [], itemsLoadLimit = DEFAULT_ITEMS_LOAD_LIMIT } = {})
		{
			if (typeof response?.pagination?.hasNext === 'boolean')
			{
				return response.pagination.hasNext === false;
			}

			return items.length < itemsLoadLimit;
		}

		getSearchQuery()
		{
			return String(this.params.q ?? this.params.searchQuery ?? '').trim();
		}

		getState()
		{
			return this.normalizeState(this.params.state);
		}

		normalizeState(value = null)
		{
			const state = String(value ?? '').trim();

			return CATALOG_STATE_VALUES.includes(state) ? state : CATALOG_STATE.ACTIVE;
		}

		getViewSession()
		{
			return normalizePositiveInteger(this.params.viewSession);
		}

		getPreviewUserId()
		{
			const value = Number(this.params.previewUserId ?? null);

			return (Number.isInteger(value) && value > 0 ? value : null);
		}

		getPortalCacheKey()
		{
			return encodeURIComponent(String(withCurrentDomain('/')));
		}

		getUserCacheKey()
		{
			return String((typeof env === 'object' ? env.userId : null) ?? 'anonymous');
		}
	}

	module.exports = {
		DEFAULT_ITEMS_LOAD_LIMIT,
		STATEFUL_LIST_CACHE_TTL,
		VibeCodeCatalogProvider,
	};
});
