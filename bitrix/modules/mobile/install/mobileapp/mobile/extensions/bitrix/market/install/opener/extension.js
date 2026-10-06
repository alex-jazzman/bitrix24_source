/**
 * @module market/install/opener
 */
jn.define('market/install/opener', (require, exports, module) => {
	const { Loc } = require('loc');
	const { MarketInstall } = require('market/install');

	const INSTALL_BACKDROP = {
		showOnTop: true,
		onlyMediumPosition: true,
		mediumPositionPercent: 90,
		horizontalSwipeAllowed: false,
		hideNavigationBar: false,
		swipeContentAllowed: true,
	};

	class MarketInstallOpener
	{
		static async open({
			code = '',
			version = 0,
			checkHash = '',
			installHash = '',
			source = '',
			parentWidget = PageManager,
			onCompleted = null,
		} = {})
		{
			const normalizedCode = String(code ?? '').trim();
			if (!normalizedCode)
			{
				return;
			}

			parentWidget.openWidget('layout', {
				grabTitle: false,
				titleParams: {
					type: 'dialog',
					text: Loc.getMessage('MOBILE_MARKET_INSTALL_OPENER_TITLE'),
				},
				backdrop: INSTALL_BACKDROP,
			}).then((layoutWidget) => {
				layoutWidget.showComponent(
					MarketInstall({
						layout: layoutWidget,
						code: normalizedCode,
						version,
						checkHash,
						installHash,
						source,
						parentWidget,
						onCompleted,
					}),
				);
			}).catch(console.error);
		}
	}

	module.exports = {
		MarketInstallOpener,
	};
});
