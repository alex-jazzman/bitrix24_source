/**
 * @module layout/ui/app-rating/src/go-to-store-strategy
 */
jn.define('layout/ui/app-rating/src/go-to-store-strategy', (require, exports, module) => {
	const { Loc } = require('loc');
	const { Color } = require('tokens');
	const { makeLibraryImagePath } = require('asset-manager');
	const { LottiePath } = require('layout/ui/app-rating/src/rating-constants');
	const { AppRatingAnalytics } = require('layout/ui/app-rating/src/analytics');
	const { Feature } = require('feature');
	const { store } = require('native/store') || {};

	class GoToStoreStrategy
	{
		constructor(props)
		{
			this.props = props ?? {};
		}

		isFilledButton()
		{
			return true;
		}

		getButtonText()
		{
			return Loc.getMessage('M_UI_APP_RATING_SEND_FEEDBACK_BUTTON_TEXT');
		}

		buttonHandler(triggerEvent, sendAnalytics)
		{
			this.props.parentWidget.close(() => {
				if (Feature.isNativeStoreSupported())
				{
					store.requestReview();
				}

				if (sendAnalytics)
				{
					AppRatingAnalytics.sendClickStore({
						section: triggerEvent,
					});
				}

				this.props.onGoToStoreButtonClick?.();
			});
		}

		getDescription()
		{
			return Loc.getMessage('M_UI_APP_RATING_GRATEFUL_DESCRIPTION');
		}

		getSubtitle()
		{
			return Loc.getMessage('M_UI_APP_RATING_GRATEFUL_SUBTITLE_MSGVER_1');
		}

		renderConfetti()
		{
			return Image({
				style: {
					width: '100%',
					height: 114,
					position: 'absolute',
					top: -28,
					left: 0,
				},
				svg: {
					uri: makeLibraryImagePath('confetti.svg', 'graphic'),
				},
				resizeMode: 'stretch',
			});
		}

		renderContent()
		{
			return LottieView(
				{
					style: {
						width: 208,
						height: 162,
						alignSelf: 'center',
						backgroundColor: Color.bgSecondary.toHex(),
					},
					data: {
						uri: GoToStoreStrategy.#getAnimationPath(),
					},
					params: {
						loopMode: 'playOnce',
					},
					autoPlay: true,
				},
			);
		}

		/**
		 * @returns {string}
		 */
		static #getAnimationPath()
		{
			return `${LottiePath}/heart.json`;
		}
	}

	module.exports = {
		GoToStoreStrategy,
	};
});
