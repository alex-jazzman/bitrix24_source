/**
 * @module im/messenger/controller/dialog/lib/reaction
 */
jn.define('im/messenger/controller/dialog/lib/reaction', (require, exports, module) => {
	const { Type } = require('type');
	const { debounce } = require('utils/function');
	const { ReactionPicker, ReactionPack, OrderType } = require('layout/ui/reaction/picker');

	const { EventType, ReactionType, DialogViewUpdatingBlocksType } = require('im/messenger/const');
	const { ReactionViewerController } = require('im/messenger/controller/reaction-viewer');
	const { serviceLocator } = require('im/messenger/lib/di/service-locator');
	const { Feature } = require('im/messenger/lib/feature');
	const { AnalyticsService } = require('im/messenger/provider/services/analytics');
	const { getLoggerWithContext } = require('im/messenger/lib/logger');
	const logger = getLoggerWithContext('dialog--reaction-manager', 'ReactionManager');

	/**
	 * @class ReactionManager
	 */
	class ReactionManager
	{
		/**
		 * @param {DialogLocator} dialogLocator
		 * @param {DialogId} dialogId
		 * @param {ChatId} chatId
		 */
		constructor(dialogLocator, dialogId, chatId)
		{
			/** @type {DialogLocator} */
			this.locator = dialogLocator;
			/** @type {DialogId} */
			this.dialogId = dialogId;
			/** @type {ChatId} */
			this.chatId = chatId;
			/** @type {DialogView} */
			this.view = this.locator.get('view');
			/** @type {MessengerCoreStore} */
			this.store = this.locator.get('store');

			this.bindMethods();
		}

		/**
		 * @return {MessageService|null}
		 */
		get messageService()
		{
			return this.locator.get('message-service') ?? null;
		}

		/**
		 * @return {ReplyManager|null}
		 */
		get replyManager()
		{
			return this.locator.get('reply-manager') ?? null;
		}

		/**
		 * @return {MessageRenderer|null}
		 */
		get messageRenderer()
		{
			return this.locator.get('message-renderer') ?? null;
		}

		/**
		 * @return {DialoguesModelState|null}
		 */
		getDialog()
		{
			return this.store.getters['dialoguesModel/getById'](this.dialogId) || null;
		}

		bindMethods()
		{
			this.showMoreReactionsTapHandler = this.showMoreReactionsTapHandler.bind(this);
			this.reactionTapHandler = debounce((reaction, message, isUpdateUi = false, shouldAnimated = false) => {
				this.setReaction(reaction, message, shouldAnimated, isUpdateUi);
			}, 30);
			this.reactionLongTapHandler = this.openReactionViewer.bind(this);
			this.messageDoubleTapHandler = this.messageDoubleTapHandler.bind(this);

			this.updateReactionHandler = this.redrawReactionMessages.bind(this);
			this.redrawReactionMessageHandler = this.redrawReactionMessage.bind(this);
		}

		subscribeViewEvents()
		{
			this.view
				.on(EventType.dialog.showMoreReactionsTap, this.showMoreReactionsTapHandler)
				.on(EventType.dialog.reactionTap, this.reactionTapHandler)
				.on(EventType.dialog.reactionLongTap, this.reactionLongTapHandler)
				.on(EventType.dialog.messageDoubleTap, this.messageDoubleTapHandler);
		}

		unsubscribeViewEvents()
		{
			this.view
				.off(EventType.dialog.showMoreReactionsTap, this.showMoreReactionsTapHandler)
				.off(EventType.dialog.reactionTap, this.reactionTapHandler)
				.off(EventType.dialog.reactionLongTap, this.reactionLongTapHandler)
				.off(EventType.dialog.messageDoubleTap, this.messageDoubleTapHandler);
		}

		subscribeStoreEvents()
		{
			serviceLocator.get('core').getStoreManager()
				.on('messagesModel/reactionsModel/set', this.updateReactionHandler)
				.on('messagesModel/reactionsModel/updateWithId', this.redrawReactionMessageHandler)
				.on('messagesModel/reactionsModel/add', this.redrawReactionMessageHandler);
		}

		unsubscribeStoreEvents()
		{
			serviceLocator.get('core').getStoreManager()
				.off('messagesModel/reactionsModel/set', this.updateReactionHandler)
				.off('messagesModel/reactionsModel/updateWithId', this.redrawReactionMessageHandler)
				.off('messagesModel/reactionsModel/add', this.redrawReactionMessageHandler);
		}

		/**
		 * @param {string} messageId
		 */
		showMoreReactionsTapHandler(messageId)
		{
			logger.log('showMoreReactionsTap messageId:', messageId);

			this.openReactionPicker(messageId)
				.catch((error) => logger.error('showMoreReactionsTapHandler.openReactionPicker catch:', error));
		}

		/**
		 * @param {string} messageId
		 */
		async openReactionPicker(messageId)
		{
			await ReactionPicker.open({
				customPack: ReactionPack.ALL,
				order: OrderType.CURRENT_USER_FAVORITES,
				onReactionPick: (reactionId) => {
					if (Type.isString(reactionId))
					{
						this.setReaction(reactionId, { id: messageId }, true);
					}
				},
			});

			AnalyticsService.getInstance().sendAnalyticsExpandReactionList(this.dialogId);
		}

		/**
		 * @param {string} index
		 * @param {object} message
		 * @param {boolean} isUpdateUi
		 */
		messageDoubleTapHandler(index, message, isUpdateUi = false)
		{
			if (!message.showReaction)
			{
				return;
			}

			this.setReaction(ReactionType.like, message, false, isUpdateUi);
		}

		/**
		 * @param {string|Array<string>} reaction
		 * @param {object} message
		 * @param {boolean} [shouldAnimated=false]
		 * @param {boolean} [isUpdateUi=false]
		 */
		setReaction(reaction, message, shouldAnimated = false, isUpdateUi = false)
		{
			logger.log('setReaction:', reaction, message, shouldAnimated, isUpdateUi);

			if (
				Type.isNil(reaction)
				|| Type.isNil(message)
				|| (Type.isArray(reaction) && !Type.isArrayFilled(reaction))
			)
			{
				logger.warn('setReaction error: reactionId or messageId is empty');

				return;
			}

			const messageId = Number(message.id);
			if (Type.isArrayFilled(reaction))
			{
				try
				{
					reaction.forEach((reactionId) => {
						this.messageService.setReaction(reactionId, messageId, { shouldAnimated, isUpdateUi });
					});
				}
				catch (error)
				{
					logger.error('setReaction catch', error);
				}

				return;
			}

			this.messageService?.setReaction(reaction, messageId, { shouldAnimated, isUpdateUi });
		}

		/**
		 * @param {ReactionType} reactionId
		 * @param {Message} message
		 */
		openReactionViewer(reactionId, message)
		{
			ReactionViewerController.open({
				messageId: message.id,
				dialogId: this.dialogId,
			});
		}

		/**
		 * @param {MutationPayload<ReactionsSetData, ReactionsSetActions>} payload
		 */
		async redrawReactionMessages({ payload })
		{
			if (payload.actionName !== 'setFromPullEvent')
			{
				return;
			}
			logger.log(`redrawReactionMessages ${this.dialogId}`, payload);

			/** @type {Array<MessagesModelState>} */
			const result = [];
			let reactionUpdatingBlocks = {};
			payload.data.reactionList.forEach((reaction) => {
				const messageId = reaction.messageId;

				const message = this.store.getters['messagesModel/getById'](messageId);
				if (Type.isNil(message?.id))
				{
					return;
				}

				if (message.chatId !== this.chatId && message.id !== this.getDialog().parentMessageId)
				{
					return;
				}

				const validateQuoteMessage = this.validateQuote(message);
				result.push(validateQuoteMessage);

				reactionUpdatingBlocks = { ...reactionUpdatingBlocks, ...this.collectReactionUpdateBlock(message, false) };
			});

			if (result.length === 0)
			{
				return;
			}
			logger.log(`redrawReactionMessages ${this.dialogId}`, result);

			await this.messageRenderer.updateMessageList(result, reactionUpdatingBlocks, true);

			if (Object.keys(reactionUpdatingBlocks).length > 0)
			{
				await this.clearMessageReactionState(reactionUpdatingBlocks);
			}
		}

		/**
		 * @param {MutationPayload<ReactionsAddData|ReactionsUpdateWithIdData,
		 * ReactionsAddActions|ReactionsUpdateWithIdActions>} payload
		 */
		async redrawReactionMessage({ payload })
		{
			logger.log(`redrawReactionMessage ${this.dialogId} payload:`, payload);
			const message = this.store.getters['messagesModel/getById'](payload.data.reaction.messageId);
			if (Type.isNil(message?.id))
			{
				return;
			}

			if (message.chatId !== this.chatId && message.id !== this.getDialog().parentMessageId)
			{
				return;
			}

			const validateQuoteMessage = this.validateQuote(message);
			let withoutUpdateUi = false;
			if (['setReactionSilent', 'removeReactionSilent'].includes(payload.actionName))
			{
				withoutUpdateUi = true;
			}
			const reactionUpdatingBlocks = this.collectReactionUpdateBlock(message, withoutUpdateUi);

			logger.log(`redrawReactionMessage messageId: ${message.id} validateQuoteMessage:`, validateQuoteMessage);

			await this.messageRenderer?.updateMessageList([validateQuoteMessage], reactionUpdatingBlocks, true);

			if (Object.keys(reactionUpdatingBlocks).length > 0)
			{
				await this.clearMessageReactionState(reactionUpdatingBlocks);
			}
		}

		/**
		 * @param {MessagesModelState} message
		 * @param {boolean} withoutUpdateUi
		 * @return {object}
		 */
		collectReactionUpdateBlock(message, withoutUpdateUi)
		{
			if (!Feature.isReactionsV2Enabled)
			{
				return {};
			}

			const reactionUpdatingBlocks = {};
			if (this.view.isMessageWithIdOnScreen(message.id) || this.view.isMessageWithIdOnScreen(message.templateId))
			{
				const lastReaction = this.getUpdateBlockReactionForAnimate(message);
				if (lastReaction)
				{
					reactionUpdatingBlocks[message.id] = lastReaction;
				}

				if (Type.isNil(lastReaction) && withoutUpdateUi)
				{
					reactionUpdatingBlocks[message.id] = DialogViewUpdatingBlocksType.withoutUi;
				}
			}

			return reactionUpdatingBlocks;
		}

		/**
		 * @param {MessagesModelState} message
		 * @return {null|string}
		 */
		getUpdateBlockReactionForAnimate(message)
		{
			if (message.reactionsViewed || !Type.isStringFilled(message.lastReactionId))
			{
				return null;
			}

			return `${DialogViewUpdatingBlocksType.reactionAnimate}${message.lastReactionId}`;
		}

		/**
		 * @param {object} reactionUpdatingBlocks
		 * @return {Promise<void>}
		 */
		async clearMessageReactionState(reactionUpdatingBlocks)
		{
			const updatePromises = Object.keys(reactionUpdatingBlocks).map(async (messageId) => {
				try
				{
					await this.store.dispatch('messagesModel/updateReactionState', {
						id: messageId,
						fields: {
							reactionsViewed: true,
							lastReactionId: '',
						},
					});
				}
				catch (error)
				{
					logger.error(`updateMessageReactionState catch: failed to update reaction state for message ${messageId}`, error);
				}
			});

			await Promise.allSettled(updatePromises);
		}

		/**
		 * @desc Check and validate text message quote
		 * @param {MessagesModelState} message
		 * @return {MessagesModelState}
		 */
		validateQuote(message)
		{
			const validateQuoteMessage = message;
			if (this.replyManager?.isHasQuote(validateQuoteMessage))
			{
				const quoteText = this.replyManager?.getQuoteText({ id: message.params?.replyId });
				if (Type.isStringFilled(quoteText))
				{
					validateQuoteMessage.text = `${quoteText}${message.text}`;
				}
			}

			return validateQuoteMessage;
		}
	}

	module.exports = {
		ReactionManager,
	};
});
