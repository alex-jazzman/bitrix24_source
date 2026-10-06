/**
 * @module market/mobile
 */
jn.define('market/mobile', (require, exports, module) => {
	const { MarketListTabMode } = require('market/mobile/src/pages/list/tab-mode');
	const { MarketListTabs } = require('market/mobile/src/pages/list/tabs');

	module.exports = {
		MarketListTabMode,
		MarketListTabs,
	};
});
