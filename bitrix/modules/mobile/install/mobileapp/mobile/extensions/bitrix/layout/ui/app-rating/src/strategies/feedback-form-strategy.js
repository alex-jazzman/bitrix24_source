/**
 * @module layout/ui/app-rating/src/strategies/feedback-form-strategy
 */
jn.define('layout/ui/app-rating/src/strategies/feedback-form-strategy', (require, exports, module) => {
	const { BaseAppRatingStrategy } = require('layout/ui/app-rating/src/strategies/strategy');
	const { FeedbackForm } = require('layout/ui/feedback-form-opener');

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
			(new FeedbackForm({
				sender_page: 'mobile_rating_drawer',
			})).openInBackdrop({
				hideNavigationBar: true,
				swipeAllowed: true,
				forceDismissOnSwipeDown: false,
				showOnTop: true,
				adoptHeightByKeyboard: true,
				shouldResizeContent: true,
			});
		}
	}

	module.exports = {
		FeedbackFormStrategy,
	};
});
