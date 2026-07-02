/**
 * @module im/messenger/lib/element/dialog/message/error
 */
jn.define('im/messenger/lib/element/dialog/message/error', (require, exports, module) => {
	const { Feature } = require('im/messenger/lib/feature');
	const { MessageType, Color: MessengerColor } = require('im/messenger/const');
	const { TextMessage } = require('im/messenger/lib/element/dialog/message/text');
	const { Color } = require('tokens');
	const { UserHelper } = require('im/messenger/lib/helper');

	class ErrorMessage extends TextMessage
	{
		constructor(modelMessage, options = {})
		{
			super(modelMessage, options);

			if (!Feature.isBitrixGptV2Enabled)
			{
				if (Feature.isErrorMessageAvailable)
				{
					this.error = {};
				}
				else
				{
					/** @type {CopilotMessageCopilotData} */
					this.copilot = {};
				}
			}

			this
				.setError()
				.setCanBeQuoted(false)
				.setCanBeChecked(false)
			;
		}

		/**
		 * @return {CopilotErrorDialogWidgetItem}
		 */
		toDialogWidgetItem()
		{
			const dialogWidgetItem = {
				...super.toDialogWidgetItem(),
			};

			if (Feature.isBitrixGptV2Enabled)
			{
				return dialogWidgetItem;
			}

			const errorData = Feature.isErrorMessageAvailable ? { error: this.error } : { copilot: this.copilot };

			return {
				...super.toDialogWidgetItem(),
				...errorData,
			};
		}

		getType()
		{
			return Feature.isErrorMessageAvailable ? MessageType.error : MessageType.copilotError;
		}

		setError()
		{
			if (Feature.isBitrixGptV2Enabled)
			{
				return this;
			}

			if (Feature.isErrorMessageAvailable)
			{
				this.error = {
					text: this.username,
				};

				return this;
			}

			this.copilot = {
				error: {
					text: this.username,
				},
			};

			return this;
		}

		/**
		 * @param {MessagesModelState} modelMessage
		 */
		setTitle(modelMessage)
		{
			super.setTitle(modelMessage);

			if (Feature.isBitrixGptV2Enabled)
			{
				this.title.color = Color.chatOtherBase1_1.toHex();

				const isCopilotBot = UserHelper.createByUserId(modelMessage.authorId)?.isCopilotBot;
				if (isCopilotBot)
				{
					this.title.colorGradient = MessengerColor.copilotGradient;
				}
			}

			return this;
		}

		/**
		 * @param {MessagesModelState} modelMessage
		 * @param {boolean} setShowUsername
		 */
		setShowUsername(modelMessage, setShowUsername)
		{
			if (!Feature.isBitrixGptV2Enabled)
			{
				super.setShowUsername(modelMessage, setShowUsername);

				return this;
			}

			this.showUsername = true;

			return this;
		}
	}

	module.exports = { ErrorMessage };
});
