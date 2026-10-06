/**
 * @module market/app-list/src/providers/market-list-provider
 */
jn.define('market/app-list/src/providers/market-list-provider', (require, exports, module) => {
	const { normalizeDeveloperTag } = require('market/utils');
	const {
		BaseListProvider,
		MARKET_LIST_TYPE,
	} = require('market/app-list/src/providers/base-list-provider');

	class MarketListProvider extends BaseListProvider
	{
		getListType()
		{
			return MARKET_LIST_TYPE.CATEGORY;
		}

		getCategoryCode()
		{
			return String(this.params.categoryCode ?? '');
		}

		getDeveloperTag()
		{
			return normalizeDeveloperTag(
				this.params.developerTag
				?? this.params.initialTag
				?? '',
			);
		}

		getCacheName({ sortOrder = {} } = {})
		{
			return [
				'market-list',
				this.getListType(),
				this.getCategoryCode() || '__all__',
				this.getDeveloperTag() || '__all__',
				'__all__',
				this.getSortOrderCacheKey(sortOrder),
			].join('/');
		}

		getActionName()
		{
			return 'mobile.Market.getCategoryListData';
		}

		getActionParams({ order = {} } = {})
		{
			const json = {
				categoryCode: this.getCategoryCode(),
				developerTag: this.getDeveloperTag(),
			};
			const normalizedOrder = this.normalizeSortOrder(order);
			if (Object.keys(normalizedOrder).length > 0)
			{
				json.order = normalizedOrder;
			}

			return json;
		}
	}

	module.exports = {
		MarketListProvider,
	};
});
