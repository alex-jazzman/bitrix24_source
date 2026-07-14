/**
 * @module im/messenger/controller/dialog/lib/message-sender/src/forwarding-message-builder
 */
jn.define('im/messenger/controller/dialog/lib/message-sender/src/forwarding-message-builder', (require, exports, module) => {
	const { Type } = require('type');
	const { Uuid } = require('utils/uuid');
	const { serviceLocator } = require('im/messenger/lib/di/service-locator');

	/**
	 * @class ForwardingMessageBuilder
	 */
	class ForwardingMessageBuilder
	{
		constructor(messageId, dialogId)
		{
			this.messageId = messageId;
			this.dialogId = dialogId;

			this.state = {};

			this.#initState();
		}

		get currentUserId()
		{
			return serviceLocator.get('core').getUserId();
		}

		get store()
		{
			return serviceLocator.get('core').getStore();
		}

		get chatId()
		{
			return this.store.getters['dialoguesModel/getById'](this.dialogId).chatId;
		}

		getMessageState()
		{
			return this.state;
		}

		getOriginalId()
		{
			return this.messageId;
		}

		getTemplateId()
		{
			return this.state.templateId;
		}

		#initState()
		{
			const modelMessage = this.store
				.getters['messagesModel/getById'](Number(this.messageId))
			;

			const forwardUuid = Uuid.getV4();

			this.state = {
				id: forwardUuid,
				chatId: this.chatId,
				authorId: this.currentUserId,
				text: modelMessage.text,
				unread: false,
				templateId: forwardUuid,
				date: new Date(),
				sending: true,
				forward: {
					id: this.#buildContextId(),
					userId: modelMessage?.forward?.userId ?? modelMessage.authorId,
				},
				files: this.#getFiles(modelMessage),
				params: this.#buildParams(modelMessage),
				stickerParams: modelMessage.stickerParams,
				block: modelMessage.block,
			};
		}

		/**
		 * @param {MessagesModelState} modelMessage
		 */
		#buildParams(modelMessage)
		{
			const params = {};

			if (!Type.isNil(modelMessage.params?.ATTACH))
			{
				params.ATTACH = modelMessage.params.ATTACH;
			}

			if (!Type.isNil(modelMessage.params?.replyId))
			{
				params.replyId = modelMessage.params.replyId;
			}

			if (!Type.isNil(modelMessage.params?.STICKER_PARAMS))
			{
				params.STICKER_PARAMS = modelMessage.params.STICKER_PARAMS;
			}

			return params;
		}

		/**
		 * @param {MessagesModelState} modelMessage
		 * @return {Array<number>}
		 */
		#getFiles(modelMessage)
		{
			if (Type.isArrayFilled(modelMessage.files))
			{
				return modelMessage.files;
			}

			const blockData = modelMessage.block;
			if (Type.isPlainObject(blockData) && Type.isArrayFilled(blockData.elements))
			{
				return blockData.elements
					.filter((element) => Type.isArrayFilled(element.fileIds))
					.flatMap((element) => element.fileIds)
				;
			}

			return [];
		}

		#buildContextId()
		{
			const dialogId = this.dialogId;
			if (dialogId.startsWith('chat'))
			{
				return `${dialogId}/${this.messageId}`;
			}

			return `${dialogId}:${this.currentUserId}/${this.messageId}`;
		}
	}

	module.exports = { ForwardingMessageBuilder };
});
