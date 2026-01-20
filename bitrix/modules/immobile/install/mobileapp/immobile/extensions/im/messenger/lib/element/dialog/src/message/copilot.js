/**
 * @module im/messenger/lib/element/dialog/message/copilot
 */
jn.define('im/messenger/lib/element/dialog/message/copilot', (require, exports, module) => {
	const { Loc } = require('im/messenger/loc');

	const {
		MessageType,
		CopilotButtonType,
	} = require('im/messenger/const');
	const { DialogHelper } = require('im/messenger/lib/helper');
	const { TextMessage } = require('im/messenger/lib/element/dialog/message/text');

	class CopilotMessage extends TextMessage
	{
		/**
		 * @param {MessagesModelState} modelMessage
		 * @param {CreateMessageOptions} options
		 */
		constructor(modelMessage = {}, options = {})
		{
			super(modelMessage, options);

			/** @type {CopilotMessageCopilotData} */
			this.copilot = {};
			const dialogHelper = DialogHelper.createByDialogId(options.dialogId);
			const canBeQuoted = Boolean(dialogHelper && !dialogHelper.isCopilot);

			this
				.setButtons()
				.setFootNote()
				.setCanBeQuoted(canBeQuoted)
				.setCanBeChecked(true)
			;
		}

		/**
		 * @return {CopilotDialogWidgetItem}
		 */
		toDialogWidgetItem()
		{
			return {
				...super.toDialogWidgetItem(),
				copilot: this.copilot,
			};
		}

		getType()
		{
			return MessageType.copilot;
		}

		setButtons()
		{
			this.copilot.buttons = [
				{
					id: CopilotButtonType.copy,
					text: Loc.getMessage('IMMOBILE_ELEMENT_DIALOG_MESSAGE_COPILOT_BUTTON_COPY'),
					editable: false,
					leftIcon: `${currentDomain}/bitrix/mobileapp/immobile/extensions/im/messenger/assets/common/svg/copy.svg`,
				},
			];

			return this;
		}

		setFootNote()
		{
			this.copilot.footnote = `${Loc.getMessage('IMMOBILE_ELEMENT_DIALOG_MESSAGE_COPILOT_FOOT_NOTE_BASIC')} [U]${Loc.getMessage('IMMOBILE_ELEMENT_DIALOG_MESSAGE_COPILOT_FOOT_NOTE_UNDERLINE')}[/U]`;

			return this;
		}

		setCommentInfo(modelMessage, showCommentInfo)
		{
			return this;
		}
	}

	module.exports = { CopilotMessage };
});
