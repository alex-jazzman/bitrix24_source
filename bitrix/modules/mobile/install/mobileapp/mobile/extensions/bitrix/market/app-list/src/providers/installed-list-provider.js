/**
 * @module market/app-list/src/providers/installed-list-provider
 */
jn.define('market/app-list/src/providers/installed-list-provider', (require, exports, module) => {
	const { normalizeInstalledFilter } = require('market/utils');
	const {
		BaseListProvider,
		MARKET_LIST_TYPE,
	} = require('market/app-list/src/providers/base-list-provider');

	class InstalledListProvider extends BaseListProvider
	{
		getListType()
		{
			return MARKET_LIST_TYPE.INSTALLED;
		}

		getInstalledFilter()
		{
			return normalizeInstalledFilter(
				this.params.installedFilter
				?? this.params.initialInstalledFilter
				?? '',
			);
		}

		getCacheName()
		{
			return [
				'market-list',
				this.getListType(),
				'__all__',
				'__all__',
				this.getInstalledFilter() || '__all__',
				this.getSortOrderCacheKey({}),
			].join('/');
		}

		getActionName()
		{
			return 'mobile.Market.getInstalledListData';
		}

		getActionParams()
		{
			return {
				installedFilter: this.getInstalledFilter(),
			};
		}
	}

	module.exports = {
		InstalledListProvider,
	};
});
