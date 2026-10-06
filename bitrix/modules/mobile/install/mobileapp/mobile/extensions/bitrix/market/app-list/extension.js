/**
 * @module market/app-list
 */
jn.define('market/app-list', (require, exports, module) => {
	const {
		MARKET_LIST_TYPE,
		resolveListType,
	} = require('market/app-list/src/providers/base-list-provider');
	const { InstalledListRenderer } = require('market/app-list/src/renderers/installed-list-renderer');
	const { MarketListRenderer } = require('market/app-list/src/renderers/market-list-renderer');

	function createMarketList(props = {})
	{
		const listType = resolveListType(props.listType ?? MARKET_LIST_TYPE.CATEGORY);
		if (listType === MARKET_LIST_TYPE.INSTALLED)
		{
			return new InstalledListRenderer(props);
		}

		return new MarketListRenderer(props);
	}

	module.exports = {
		MarketList: createMarketList,
	};
});
