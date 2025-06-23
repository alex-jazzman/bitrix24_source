/**
 * @module layout/ui/app-rating/src/support-chat-strategy
 */
jn.define('layout/ui/app-rating/src/support-chat-strategy', (require, exports, module) => {
	const { Loc } = require('loc');
	const { makeLibraryImagePath } = require('asset-manager');
	const { DialogOpener } = require('im/messenger/api/dialog-opener');
	const { AppRatingAnalytics } = require('layout/ui/app-rating/src/analytics');

	class SupportChatStrategy
	{
		constructor(props)
		{
			this.supportChat = props.botId ?? null;
			this.parentWidget = props.parentWidget ?? null;
		}

		isFilledButton()
		{
			return false;
		}

		getButtonText()
		{
			return Loc.getMessage('M_UI_APP_RATING_QUESTION_BUTTON_TEXT');
		}

		buttonHandler(triggerEvent, sendAnalytics)
		{
			if (this.supportChat && this.parentWidget)
			{
				this.parentWidget.close(() => {
					void DialogOpener.open({ dialogId: this.supportChat });
				});
			}

			if (sendAnalytics)
			{
				AppRatingAnalytics.sendClickSupport({
					section: triggerEvent,
				});
			}
		}

		getDescription()
		{
			return Loc.getMessage('M_UI_APP_RATING_QUESTION_DESCRIPTION');
		}

		getSubtitle()
		{
			return Loc.getMessage('M_UI_APP_RATING_QUESTION_SUBTITLE');
		}

		renderConfetti()
		{
			return View({});
		}

		renderContent()
		{
			return Image(
				{
					style: {
						width: 119,
						height: 119,
						alignSelf: 'center',
						marginTop: 38,
					},
					svg: {
						uri: makeLibraryImagePath('support.svg', 'graphic'),
					},
				},
			);
		}
	}

	module.exports = {
		SupportChatStrategy,
	};
});
