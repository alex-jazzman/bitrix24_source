/**
 * @module market/app-list/opener/src/loading-screen
 */
jn.define('market/app-list/opener/src/loading-screen', (require, exports, module) => {
	const { Color } = require('tokens');
	const { LoadingScreen } = require('layout/ui/loading-screen');
	const { Box } = require('ui-system/layout/box');

	class MarketListOpenerLoadingScreen extends LayoutComponent
	{
		render()
		{
			return Box(
				{
					testId: 'market-list-opener-loading',
					safeArea: {
						top: false,
						bottom: true,
					},
					style: {
						flex: 1,
						backgroundColor: Color.bgContentPrimary.toHex(),
					},
				},
				LoadingScreen({
					testId: 'market-list-opener-loading-screen',
				}),
			);
		}
	}

	module.exports = {
		MarketListOpenerLoadingScreen,
	};
});
