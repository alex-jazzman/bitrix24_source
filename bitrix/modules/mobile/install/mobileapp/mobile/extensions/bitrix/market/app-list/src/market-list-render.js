/**
 * @module market/app-list/src/market-list-render
 */
jn.define('market/app-list/src/market-list-render', (require, exports, module) => {
	const { MarketListRenderer } = require('market/app-list/src/renderers/market-list-renderer');

	module.exports = {
		MarketList: MarketListRenderer,
		MarketListRenderer,
	};
});
