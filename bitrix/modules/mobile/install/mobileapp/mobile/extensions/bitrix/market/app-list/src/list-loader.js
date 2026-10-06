/**
 * @module market/app-list/src/list-loader
 */
jn.define('market/app-list/src/list-loader', (require, exports, module) => {
	const {
		BaseListProvider,
		DEFAULT_ITEMS_LOAD_LIMIT,
		INSTALLED_FILTER_UPDATES,
		MARKET_LIST_TYPE,
		STATEFUL_LIST_CACHE_TTL,
		resolveListType,
	} = require('market/app-list/src/providers/base-list-provider');
	const { InstalledListProvider } = require('market/app-list/src/providers/installed-list-provider');
	const { MarketListProvider } = require('market/app-list/src/providers/market-list-provider');

	module.exports = {
		BaseListProvider,
		DEFAULT_ITEMS_LOAD_LIMIT,
		INSTALLED_FILTER_UPDATES,
		InstalledListProvider,
		MARKET_LIST_TYPE,
		MarketListProvider,
		STATEFUL_LIST_CACHE_TTL,
		resolveListType,
	};
});
