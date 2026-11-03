/**
 * @module im/messenger/controller/dialog/lib/message-sender/src/forwarding-message-builder
 */
jn.define('im/messenger/controller/dialog/lib/message-sender/src/forwarding-message-builder', (require, exports, module) => {
	const { Type } = require('type');
	const { Uuid } = require('utils/uuid');
	const { DialogType } = require('im/messenger/const');
	const { serviceLocator } = require('im/messenger/lib/di/service-locator');
	const { MessageHelper } = require('im/messenger/lib/helper');

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
					...this.#buildForwardSource(modelMessage),
				},
				files: this.#getFiles(modelMessage),
				params: this.#buildParams(modelMessage),
				stickerParams: modelMessage.stickerParams,
				block: modelMessage.block,
			};
		}

		/**
		 * A discussion is named by its parent chat rather than by itself, and the server resolves that
		 * name only when the feed is read. Taking the context from the store leaves the caption of the
		 * optimistic message the one the answer brings, instead of letting it change twice. This covers
		 * a discussion source only: chatType is not part of this block, so a channel source still has
		 * its caption refined once the answer arrives.
		 *
		 * parentMessageId mirrors the shape of the server payload; no client reads it today.
		 *
		 * @param {MessagesModelState} modelMessage
		 * @return {ForwardSource}
		 */
		#buildForwardSource(modelMessage)
		{
			// a fragment forwarded on keeps the context of its first source, so it is carried over
			if (modelMessage.forward?.id)
			{
				return {
					chatTitle: modelMessage.forward.chatTitle ?? null,
					parentChatId: modelMessage.forward.parentChatId ?? 0,
					parentMessageId: modelMessage.forward.parentMessageId ?? 0,
					parentChatType: modelMessage.forward.parentChatType ?? null,
				};
			}

			const sourceChat = this.store.getters['dialoguesModel/getByChatId'](modelMessage.chatId);
			if (sourceChat?.type !== DialogType.comment)
			{
				return { chatTitle: null, parentChatId: 0, parentMessageId: 0, parentChatType: null };
			}

			// No loaded state is asked of the parent, unlike the reader path in the web pull handler: the
			// block is optimistic, it is built for the author, whose access the forward itself has proved,
			// and never reaches the server. Such a check would only make the caption change twice.
			const parentChat = this.store.getters['dialoguesModel/getByChatId'](sourceChat.parentChatId);
			const commentInfo = this.store
				.getters['commentModel/getCommentInfoByCommentChatId'](sourceChat.chatId)
			;

			return {
				chatTitle: Type.isStringFilled(parentChat?.name) ? parentChat.name : null,
				parentChatId: sourceChat.parentChatId,
				parentMessageId: commentInfo?.messageId ?? 0,
				parentChatType: parentChat?.type ?? null,
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
				// the helper reads every file form of an element, the single file of an audio included
				return blockData.elements.flatMap((element) => MessageHelper.getBlockElementFileIds(element));
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
