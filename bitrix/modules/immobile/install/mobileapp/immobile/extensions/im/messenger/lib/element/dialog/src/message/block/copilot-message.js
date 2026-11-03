/**
 * @module im/messenger/lib/element/dialog/message/block/copilot-message
 */
jn.define('im/messenger/lib/element/dialog/message/block/copilot-message', (require, exports, module) => {
	const { Loc } = require('im/messenger/loc');
	const { Feature } = require('im/messenger/lib/feature');
	const { MessageType, CopilotButtonType, Color } = require('im/messenger/const');
	const { serviceLocator } = require('im/messenger/lib/di/service-locator');
	const { BlockMessage } = require('im/messenger/lib/element/dialog/message/block/message');
	const { ActionButtons } = require('im/messenger/lib/element/dialog/message/element/actions/action-buttons');
	const { MessageHelper } = require('im/messenger/lib/helper');

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
			this.actions = [];

			this.setFootNote();

			// Transient "thinking" placeholder shows no footer buttons or like/dislike, only the footnote.
			if (MessageHelper.createByModel(modelMessage)?.isCopilotProcess)
			{
				return;
			}

			const dialogId = options.dialogId;
			const messageId = modelMessage.id;

			this
				.setButtons()
				.setActions(dialogId, messageId)
				.setAiAnimation(modelMessage)
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

		/**
		 * @desc AI glow animation runs on the copilot bubble only while the backend keeps the
		 *       message in the active generation state (placeholder message). The final message
		 *       arrives without the flag, so glow turns off. The native glow itself is gated by
		 *       the 'chat_ai_glow_animation' feature.
		 *       Unlike the web (im.v2.lib.copilot isCopilotGenerationActive) we deliberately rely on
		 *       the flag alone and skip the transitional fallback over the aiAssistantSearch block:
		 *       the backend sets the flag together with that block (aiassistant
		 *       PendingPlaceholderCreator), the fallback only covered legacy pre-flag pending
		 *       messages absent from the mobile flow, and it would add a block scan on every render.
		 * @param {MessagesModelState} modelMessage
		 * @return {CopilotBlockMessage}
		 */
		setAiAnimation(modelMessage)
		{
			const isGenerationActive = modelMessage.params?.COMPONENT_PARAMS?.copilotGenerationActive === true;

			/** @type {CopilotAiGlowData} */
			this.aiAnimation = {
				animate: isGenerationActive && Feature.isBitrixGptAiGlowAnimationEnabled,
			};

			return this;
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
