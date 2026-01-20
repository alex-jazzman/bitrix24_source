/**
 * @module im/messenger/provider/services/anchor
 */
jn.define('im/messenger/provider/services/anchor', (require, exports, module) => {
	const { Type } = require('type');
	const { debounce } = require('utils/function');
	const { RestMethod, AnchorType } = require('im/messenger/const');
	const { Feature } = require('im/messenger/lib/feature');
	const { getLoggerWithContext } = require('im/messenger/lib/logger');
	const { serviceLocator } = require('im/messenger/lib/di/service-locator');

	class AnchorService
	{
		constructor(dialogId, dialogLocator)
		{
			this.logger = getLoggerWithContext('dialog--anchor-service', this);
			this.dialogId = dialogId;

			this.dialogLocator = dialogLocator;

			this.serviceLocator = serviceLocator;
			/**
			 * @type {CoreApplication}
			 */
			this.core = this.serviceLocator.get('core');
			/**
			 * @type {MessengerCoreStore}
			 */
			this.store = this.core.getStore();

			this.messagesToRead = new Set();
			this.messagesToAnimateReaction = new Map();

			this.debouncedReadMessageListAnchors = debounce(this.readMessageListAnchors, 500, this);
		}

		#getChatId = () => {
			return this.store.getters['dialoguesModel/getById'](this.dialogId)?.chatId ?? null;
		};

		/**
		 * @return {DialogView|null}
		 */
		get #view()
		{
			const view = this.dialogLocator.get('view');
			if (view)
			{
				return view;
			}

			this.logger.error('view is not initialized.');

			return null;
		}

		/**
		 * @public
		 * @param messageList
		 */
		readMessageListAnchors(messageList)
		{
			const anchorsToRead = this.#collectAnchorsFromMessages(messageList);
			if (Type.isArrayFilled(anchorsToRead))
			{
				anchorsToRead.forEach((anchor) => this.messagesToRead.add(anchor.messageId));
				this.#fillMessageReactionCollection();
			}

			return this.#executeRead();
		}

		/**
		 * @return void
		 */
		#fillMessageReactionCollection()
		{
			const anchorsReactionByChat = this.#collectAnchorsReactionByChatId();

			[...this.messagesToRead].forEach((messageId) => {
				const message = this.store.getters['messagesModel/getById'](messageId);
				if (Type.isBoolean(message.reactionsViewed) && message.reactionsViewed === false)
				{
					this.messagesToAnimateReaction.set(
						messageId,
						{
							reactionType: message.lastReactionId,
						},
					);

					return;
				}

				// If the reaction on the message has already been viewed, or the message was loaded from the local
				// database (which does not store the reactionsViewed field),
				// then search for the latest anchor-based reaction
				const lastAnchor = this.#findLastAnchorByMessageId(messageId, anchorsReactionByChat);
				if (Type.isNil(lastAnchor))
				{
					return;
				}

				const reactionType = lastAnchor.subType;
				this.messagesToAnimateReaction.set(
					messageId,
					{
						reactionType,
					},
				);
			});
		}

		/**
		 * @param {number} messageId
		 * @param {Array<AnchorModelState>} anchorsReactionByChat
		 * @return {AnchorModelState|null}
		 */
		#findLastAnchorByMessageId(messageId, anchorsReactionByChat)
		{
			for (let i = anchorsReactionByChat.length - 1; i >= 0; i--)
			{
				const anchor = anchorsReactionByChat[i];
				if (anchor.messageId === messageId && anchor.subType)
				{
					return anchor;
				}
			}

			return null;
		}

		/**
		 * @public
		 */
		readChatAnchors()
		{
			const anchors = this.store.getters['anchorModel/getByChatId'](this.#getChatId());
			if (!Type.isArrayFilled(anchors))
			{
				return;
			}

			this.store.dispatch('anchorModel/deleteByChatId', { chatId: this.#getChatId() });

			BX.ajax.runAction(RestMethod.imV2AnchorReadChat, {
				data: {
					chatId: this.#getChatId(),
				},
			}).catch((error) => {
				this.logger.error('AnchorService: read anchor error', error);
			})
			;
		}

		#collectAnchorsFromMessages(messageList)
		{
			const messageIdList = messageList.map((message) => Number(message.id));

			return this.store.getters['anchorModel/getByMessageIdList'](this.#getChatId(), messageIdList);
		}

		/**
		 * @return {Array<AnchorModelState>}
		 */
		#collectAnchorsReactionByChatId()
		{
			return this.store.getters['anchorModel/getByChatId'](this.#getChatId(), AnchorType.REACTION);
		}

		#executeRead = async () => {
			if (this.messagesToRead.size === 0)
			{
				return;
			}

			const messagesToReadAnchors = [...this.messagesToRead];
			this.messagesToRead.clear();

			this.store.dispatch('anchorModel/deleteByMessageIdList', {
				chatId: this.#getChatId(),
				messageIdList: messagesToReadAnchors,
			});

			this.#highlightMessages(messagesToReadAnchors);

			BX.ajax.runAction(RestMethod.imV2AnchorRead, {
				data: {
					messageIds: messagesToReadAnchors,
				},
			}).catch((error) => {
				this.logger.error('AnchorService: read anchor error', error);
			});
		};

		/**
		 * @param {Array<number>} messages
		 */
		#highlightMessages(messages)
		{
			messages.forEach((messageId) => {
				this.#view.highlightMessageById(messageId);
				this.#animateReaction(messageId);
			});
		}

		/**
		 * @param {number} messageId
		 * @return {any}
		 */
		#animateReaction(messageId)
		{
			if (!Feature.isReactionsV2Enabled)
			{
				return;
			}

			const reaction = this.messagesToAnimateReaction.get(messageId);
			if (reaction && reaction.reactionType)
			{
				this.#view.animateReaction(String(messageId), reaction.reactionType);

				this.messagesToAnimateReaction.delete(messageId);

				this.#clearMessageReactionState(messageId);
			}
		}

		/**
		 * @param {number} messageId
		 */
		#clearMessageReactionState(messageId)
		{
			return this.store.dispatch('messagesModel/updateReactionState', {
				id: messageId,
				fields: {
					reactionsViewed: true,
					lastReactionId: '',
				},
			});
		}
	}

	module.exports = { AnchorService };
});
