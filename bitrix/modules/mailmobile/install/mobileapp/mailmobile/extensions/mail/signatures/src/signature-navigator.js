/**
 * @module mail/signatures/src/signature-navigator
 */
jn.define('mail/signatures/src/signature-navigator', (require, exports, module) => {
	const { Loc } = require('loc');
	const { showErrorToast } = require('toast');
	const { SignatureApi } = require('mail/signatures/compose');
	const { SignatureList } = require('mail/signatures/src/signature-list');

	class SignatureNavigator
	{
		/**
		 * @param {SignatureNavigatorOptions} options
		 */
		static open({ onOpened, perfPoint } = {})
		{
			PageManager.openWidget('layout', {
				titleParams: {
					text: Loc.getMessage('MAILMOBILE_SIGNATURES_LIST_TITLE'),
					type: 'section',
				},
				onReady: (layoutWidget) => {
					layoutWidget.showComponent(new SignatureList({
						layoutWidget,
						api: new SignatureApi(),
						perfPoint,
						onOpened,
						onUnavailable: () => {
							layoutWidget.close();
							showErrorToast({
								message: Loc.getMessage('MAILMOBILE_SIGNATURES_UNAVAILABLE'),
							});
						},
					}));
				},
			});
		}
	}

	module.exports = { SignatureNavigator };
});
