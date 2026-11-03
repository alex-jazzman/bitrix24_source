/**
 * @module timeman/work-reports/listeners
 */
jn.define('timeman/work-reports/listeners', (require, exports, module) => {
	const { ComponentHelper } = require('helpers/component');
	const { getFeatureFlags, FeatureFlagType } = require('feature-flag');

	const subscribeDayCloseListener = () => {
		getFeatureFlags()
			.then(({ data }) => {
				const isEnabled = data[FeatureFlagType.WORK_REPORTS] && data[FeatureFlagType.WORK_REPORTS_WITH_AI];
				if (!isEnabled)
				{
					return;
				}

				BX.addCustomEvent('OnTimemanDayHasBeenChanged', (payload) => {
					if (payload?.action !== 'close')
					{
						return;
					}

					const rawId = payload?.data?.ID;
					const recordId = rawId ? Number(rawId) : null;

					ComponentHelper.openLayout({
						name: 'timeman:workday-report',
						canOpenInDefault: true,
						object: 'layout',
						componentParams: {
							recordId,
						},
						widgetParams: {
							modal: true,
							backdrop: {
								adoptHeightByKeyboard: true,
								bounceEnable: true,
								forceDismissOnSwipeDown: true,
								hideNavigationBar: true,
								horizontalSwipeAllowed: false,
								onlyMediumPosition: false,
								shouldResizeContent: true,
								showOnTop: false,
								swipeAllowed: false,
								swipeContentAllowed: false,
							},
						},
					});
				});
			}).catch(console.error);
	};

	module.exports = { subscribeDayCloseListener };
});
