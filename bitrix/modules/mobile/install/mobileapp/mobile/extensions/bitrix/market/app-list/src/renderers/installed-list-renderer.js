/**
 * @module market/app-list/src/renderers/installed-list-renderer
 */
jn.define('market/app-list/src/renderers/installed-list-renderer', (require, exports, module) => {
	const { InstalledListProvider } = require('market/app-list/src/providers/installed-list-provider');
	const { MarketListRenderer } = require('market/app-list/src/renderers/market-list-renderer');

	class InstalledListRenderer extends MarketListRenderer
	{
		constructor(props)
		{
			super(props, new InstalledListProvider(props));
		}
	}

	module.exports = {
		InstalledListRenderer,
	};
});
