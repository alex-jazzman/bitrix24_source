/**
 * @module market/search/opener
 */
jn.define('market/search/opener', (require, exports, module) => {
	const { Loc } = require('loc');
	const { MarketSearch } = require('market/search');

	const SEARCH_BACKDROP = {
		showOnTop: true,
		onlyMediumPosition: true,
		mediumPositionPercent: 90,
		horizontalSwipeAllowed: false,
		hideNavigationBar: false,
		swipeContentAllowed: true,
	};

	class MarketSearchOpener
	{
		static open({
			initialCategories = [],
			parentWidget = PageManager,
		} = {})
		{
			parentWidget.openWidget('layout', {
				grabTitle: false,
				titleParams: {
					type: 'dialog',
					text: Loc.getMessage('MOBILE_MARKET_SEARCH_OPENER_TITLE'),
				},
				backdrop: SEARCH_BACKDROP,
			}).then((layoutWidget) => {
				layoutWidget.showComponent(
					MarketSearch({
						layout: layoutWidget,
						initialCategories: Array.isArray(initialCategories) ? initialCategories : [],
					}),
				);
			}).catch(console.error);
		}
	}

	module.exports = {
		MarketSearchOpener,
	};
});
