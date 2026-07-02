/**
 * @module im/messenger/lib/converter/ui/message
 */
jn.define('im/messenger/lib/converter/ui/message', (require, exports, module) => {
	const { Type } = require('type');

	const { serviceLocator } = require('im/messenger/lib/di/service-locator');
	const {
		DialogType,
	} = require('im/messenger/const');
	const { EmptyMessage } = require('im/messenger/lib/element/dialog');
	const { MessageHelper } = require('im/messenger/lib/helper');
	const { parser } = require('im/messenger/lib/parser');
	const { Logger } = require('im/messenger/lib/logger');
	const { messageTypeRules } = require('im/messenger/lib/converter/ui/message/src/message-type-rules');

	/**
	 * @class MessageUiConverter
	 */
	class MessageUiConverter
	{
		/**
		 * @constructor
		 * @param {DialogId} dialogId
		 * @param {DialogLocator} dialogCode
		 */
		constructor({ dialogId, dialogCode })
		{
			this.dialogCode = dialogCode;
			this.dialogId = dialogId;
		}

		/**
		 * @param {MessagesModelState} modelMessage
		 * @param {CreateMessageOptions|{}} options
		 * @return {Message}
		 */
		createMessage(modelMessage, options = {})
		{
			const messageHelper = MessageHelper.createByModel(modelMessage);

			try
			{
				return messageTypeRules.find((rule) => rule.isSuitable(messageHelper))
					.create(modelMessage, options)
				;
			}
			catch (error)
			{
				Logger.error('MessageUiConverter.createMessage catch error:', error);

				return new EmptyMessage(modelMessage);
			}
		}

		/**
		 * @param {Array<MessagesModelState>} modelMessageList
		 * @return {Array<Message>}
		 */
		createMessageList(modelMessageList)
		{
			if (!Type.isArrayFilled(modelMessageList))
			{
				return [];
			}

			const dialog = serviceLocator.get('core').getStore().getters['dialoguesModel/getById'](this.dialogId);
			const options = this.prepareSharedOptionsForMessages(dialog);

			return modelMessageList.map((modelMessage) => this.createMessage(modelMessage, options));
		}

		createMessageFromRecent()
		{
			const recentItem = serviceLocator.get('core').getStore().getters['recentModel/getById'](this.dialogId);
			const recentMessage = recentItem?.message;
			if (!recentMessage?.id || !recentMessage?.text)
			{
				return null;
			}

			const defaultOptions = {
				showUsername: false,
				showAvatar: false,
			};

			const defaultModelMessage = {
				id: recentMessage.id,
				templateId: '',
				chatId: 0,
				authorId: recentMessage.senderId,
				date: recentMessage.date,
				text: recentMessage.text,
				loadText: '',
				params: {},
				files: [],
				unread: false,
				viewed: true,
				viewedByOthers: false,
				sending: false,
				error: false,
				errorReason: 0,
				retry: false,
				isPlaying: false,
				playingTime: 0,
			};

			if (recentItem.message.sticker)
			{
				defaultModelMessage.text = parser.simplify({
					text: '',
					sticker: true,
				});
			}

			const dialog = serviceLocator.get('core').getStore().getters['dialoguesModel/getById'](this.dialogId);

			const options = dialog
				? this.prepareSharedOptionsForMessages(dialog)
				: defaultOptions
			;

			const storedMessage = serviceLocator.get('core').getStore().getters['messagesModel/getById'](recentMessage.id);

			const modelMessage = ('id' in storedMessage)
				? storedMessage
				: defaultModelMessage
			;

			return this.createMessage(modelMessage, options);
		}

		/**
		 *
		 * @param {DialoguesModelState} dialog
		 * @return {CreateMessageOptions}
		 */
		prepareSharedOptionsForMessages(dialog)
		{
			/** @type {CreateMessageOptions} */
			const options = {
				dialogCode: this.dialogCode,
			};
			if (dialog.type === DialogType.user || dialog.type === DialogType.private)
			{
				options.showUsername = false;
				options.showAvatar = false;
			}

			if (dialog.type === DialogType.copilot)
			{
				options.canBeQuoted = false;
			}

			if ([DialogType.openChannel, DialogType.channel, DialogType.generalChannel].includes(dialog.type))
			{
				options.showCommentInfo = true;
				options.showAvatarsInReaction = false;
			}

			if (dialog.type === DialogType.comment)
			{
				options.initialPostMessageId = String(dialog.parentMessageId);
			}

			const applicationSettingState = serviceLocator.get('core').getStore().getters['applicationModel/getSettings']();
			options.audioRate = applicationSettingState ? applicationSettingState.audioRate : 1;
			options.dialogId = dialog.dialogId;

			return options;
		}
	}

	module.exports = {
		MessageUiConverter,
	};
});
