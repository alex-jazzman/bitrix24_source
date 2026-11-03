/**
 * @module im/messenger/lib/element/dialog/message/copilot
 */
jn.define('im/messenger/lib/element/dialog/message/copilot', (require, exports, module) => {
	const { Loc } = require('im/messenger/loc');

	const { Feature } = require('im/messenger/lib/feature');
	const {
		MessageType,
		CopilotButtonType,
	} = require('im/messenger/const');
	const { Color } = require('im/messenger/const');
	const { DialogHelper } = require('im/messenger/lib/helper');
	const { serviceLocator } = require('im/messenger/lib/di/service-locator');
	const { TextMessage } = require('im/messenger/lib/element/dialog/message/text');
	const { ActionButtons } = require('im/messenger/lib/element/dialog/message/element/actions/action-buttons');

	class CopilotMessage extends TextMessage
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
			const dialogId = options.dialogId;
			const messageId = modelMessage.id;
			const dialogHelper = DialogHelper.createByDialogId(dialogId);
			const canBeQuoted = Boolean(dialogHelper && !dialogHelper.isCopilot);

			this
				.setButtons()
				.setActions(dialogId, messageId)
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
				actions: this.actions,
				copilot: this.copilot,
			};
		}

		getType()
		{
			return MessageType.copilot;
		}

		setButtons()
		{
			if (Feature.isMessageActionsSupported && Feature.isBitrixGptV2Available)
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

		/**
		 * @param {DialogId} dialogId
		 * @param {number} messageId
		 */
		setActions(dialogId, messageId)
		{
			const store = serviceLocator.get('core').getStore();
			const vote = store.getters['dialoguesModel/copilotModel/getVoteByMessageId'](dialogId, Number(messageId));

			this.actions = ActionButtons.create({
				isLiked: vote?.like,
				isDisliked: vote?.dislike,
			}).toMessageFormat();

			return this;
		}

		setFootNote()
		{
			this.copilot.footnote = `${Loc.getMessageWithCopilotBotName('IMMOBILE_ELEMENT_DIALOG_MESSAGE_COPILOT_FOOT_NOTE_BASIC_MSGVER_2')} [U]${Loc.getMessage('IMMOBILE_ELEMENT_DIALOG_MESSAGE_COPILOT_FOOT_NOTE_UNDERLINE')}[/U]`;

			return this;
		}

		setCommentInfo(modelMessage, showCommentInfo)
		{
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
	}

	module.exports = { CopilotMessage };
});
