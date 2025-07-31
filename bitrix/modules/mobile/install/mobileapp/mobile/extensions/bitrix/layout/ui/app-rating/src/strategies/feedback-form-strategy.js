/**
 * @module layout/ui/app-rating/src/strategies/feedback-form-strategy
 */
jn.define('layout/ui/app-rating/src/strategies/feedback-form-strategy', (require, exports, module) => {
	const AppTheme = require('apptheme');
	const { BackdropHeight } = require('layout/ui/app-rating/src/rating-constants');
	const { Color } = require('tokens');
	const { BaseAppRatingStrategy } = require('layout/ui/app-rating/src/strategies/strategy');

	const hiddenFields = encodeURIComponent(JSON.stringify({
		from_domain: currentDomain,
		back_version: Application.getAppVersion(),
		os_phone: Application.getPlatform(),
		app_version: Application.getApiVersion(),
		region_model: env.languageId,
		sender_page: 'mobile_rating_drawer',
		phone_model: device.model,
		os_version: device.version,
	}));

	class FeedbackFormStrategy extends BaseAppRatingStrategy
	{
		isApplicable(props)
		{
			return true;
		}

		execute(props)
		{
			props.parentWidget.close(() => {
				BX.postComponentEvent('app-feedback:onShouldOpenFeedback', [], 'background');
			});
		}

		shouldRender()
		{
			return false;
		}

		/**
		 * @returns {void}
		 */
		static openAppFeedbackForm()
		{
			const formId = AppTheme.id === 'dark' ? 'appFeedbackDark' : 'appFeedbackLight';
			PageManager.openPage({
				backgroundColor: Color.bgSecondary.toHex(),
				url: `${env.siteDir}mobile/settings?formId=${formId}&hiddenFields=${hiddenFields}`,
				modal: true,
				backdrop: {
					mediumPositionHeight: BackdropHeight,
					hideNavigationBar: true,
					swipeAllowed: true,
					forceDismissOnSwipeDown: false,
					showOnTop: false,
					adoptHeightByKeyboard: true,
					shouldResizeContent: true,
				},
			});
		}
	}

	module.exports = {
		FeedbackFormStrategy,
	};
});
