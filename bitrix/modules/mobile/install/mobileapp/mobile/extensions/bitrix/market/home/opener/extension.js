/**
 * @module market/home/opener
 */
jn.define('market/home/opener', (require, exports, module) => {
	const { ComponentHelper } = require('helpers/component');
	const { Loc } = require('loc');

	class MarketHomeOpener
	{
		static open({ parentWidget = PageManager } = {})
		{
			ComponentHelper.openLayout({
				name: 'market.home',
				canOpenInDefault: true,
				widgetParams: {
					grabTitle: false,
					titleParams: {
						type: 'dialog',
						text: Loc.getMessage('MOBILE_MARKET_HOME_OPENER_TITLE'),
					},
				},
			}, parentWidget);
		}
	}

	module.exports = {
		MarketHomeOpener,
	};
});
