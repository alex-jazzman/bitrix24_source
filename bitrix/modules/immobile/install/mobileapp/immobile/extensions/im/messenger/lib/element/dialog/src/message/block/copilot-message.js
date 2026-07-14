/**
 * @module im/messenger/lib/element/dialog/message/block/copilot-message
 */
jn.define('im/messenger/lib/element/dialog/message/block/copilot-message', (require, exports, module) => {
	const { Loc } = require('im/messenger/loc');
	const { Feature } = require('im/messenger/lib/feature');
	const { MessageType, CopilotButtonType, Color } = require('im/messenger/const');
	const { Color: ColorTokens } = require('tokens');
	const { BlockMessage } = require('im/messenger/lib/element/dialog/message/block/message');
	const { ActionButtons } = require('im/messenger/lib/element/dialog/message/element/actions/action-buttons');

	/**
	 * @class CopilotBlockMessage
	 */
	class CopilotBlockMessage extends BlockMessage
	{
		/**
		 * @param {MessagesModelState} modelMessage
		 * @param {CreateMessageOptions|{}} options
		 */
		constructor(modelMessage, options = {})
		{
			super(modelMessage, options);

			/** @type {CopilotMessageCopilotData|{}} */
			this.copilot = {};

			this
				.setFootNote()
				.setButtons()
				.setActions()
			;
		}

		/**
		 * @return {DialogWidgetItem}
		 */
		toDialogWidgetItem()
		{
			return {
				...super.toDialogWidgetItem(),
				actions: this.actions,
				copilot: this.copilot,
			};
		}

		setButtons()
		{
			if (Feature.isMessageActionsSupported)
			{
				return this;
			}

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

		setActions()
		{
			this.actions = ActionButtons.create({
				tint: ColorTokens.chatOtherCopilot2.toHex(),
			}).toMessageFormat();

			return this;
		}

		setFootNote()
		{
			this.copilot.footnote = `${Loc.getMessageWithCopilotBotName('IMMOBILE_ELEMENT_DIALOG_MESSAGE_COPILOT_FOOT_NOTE_BASIC_MSGVER_2')} [U]${Loc.getMessage('IMMOBILE_ELEMENT_DIALOG_MESSAGE_COPILOT_FOOT_NOTE_UNDERLINE')}[/U]`;

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
				this.title.colorGradient = Color.copilotGradient;
			}

			return this;
		}

		/**
		 * @return {string}
		 */
		getType()
		{
			return MessageType.copilot;
		}

		/**
		 * @return {object}
		 */
		get metaData()
		{
			return {};
		}
	}

	module.exports = {
		CopilotBlockMessage,
	};
});
