/**
 * @module intranet/results-year/ui-manager
 */
jn.define('intranet/results-year/ui-manager', (require, exports, module) => {
	const { canFirstShowResultsYear, markShowAction } = require('intranet/results-year/rest');
	const { BackgroundUIManager } = require('background/ui-manager');

	const RESULT_YEAR = 'intranet:result-year';

	class ResultsYearUIManager
	{
		/**
		 * @public
		 */
		static openComponent()
		{
			PageManager.openComponent('JSStackComponent', {
				componentCode: RESULT_YEAR,
				// eslint-disable-next-line no-undef
				scriptPath: availableComponents[RESULT_YEAR].publicUrl,
				canOpenInDefault: true,
				rootWidget: {
					name: 'layout',
					componentCode: RESULT_YEAR,
					settings: {
						objectName: 'layout',
						modal: true,
						backdrop: {
							disableTopInset: true,
							showOnTop: false,
							mediumPositionHeight: 0.5,
							forceDismissOnSwipeDown: true,
							horizontalSwipeAllowed: false,
							swipeContentAllowed: true,
							hideNavigationBar: true,
						},
					},
				},
			});
		}

		/**
		 * @public
		 */
		static openComponentInBackground()
		{
			canFirstShowResultsYear().then((response) => {
				if (response?.data === true)
				{
					BackgroundUIManager.openComponent('resul-year', ResultsYearUIManager.openComponent, 5);
					void markShowAction();
				}
			}).catch(console.error);
		}
	}

	module.exports = {
		ResultsYearUIManager,
	};
});
