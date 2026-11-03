/**
 * @module im/messenger/controller/dialog/lib/reaction
 */
jn.define('im/messenger/controller/dialog/lib/reaction', (require, exports, module) => {
	const { Type } = require('type');
	const { debounce } = require('utils/function');
	const { clone } = require('utils/object');
	const { ReactionPicker, ReactionPack, OrderType } = require('layout/ui/reaction/picker');

	const { EventType, ReactionType, DialogViewUpdatingBlocksType } = require('im/messenger/const');
	const { Loc } = require('im/messenger/loc');
	const { ReactionViewerController } = require('im/messenger/controller/reaction-viewer');
	const { serviceLocator } = require('im/messenger/lib/di/service-locator');
	const { Feature } = require('im/messenger/lib/feature');
	const { AnalyticsService } = require('im/messenger/provider/services/analytics');
	const { getLoggerWithContext } = require('im/messenger/lib/logger');
	const logger = getLoggerWithContext('dialog--reaction-manager', 'ReactionManager');

	const DEFAULT_REACTION_PICKER_ONBOARDING_TOURIST_KEY = 'imMobileDefaultReactionPickerOnboarding';

	// Bounded wait for Tourist.ready() before opening the picker: on a cold cache ready() hits the
	// network (up to 3 one-second retries), so cap it to keep the first open responsive.
	const TOURIST_READY_TIMEOUT_MS = 500;

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
			this.defaultReactionUpdateHandler = this.defaultReactionUpdateHandler.bind(this);
		}

		subscribeViewEvents()
		{
			this.view
				.on(EventType.dialog.showMoreReactionsTap, this.showMoreReactionsTapHandler)
				.on(EventType.dialog.reactionTap, this.reactionTapHandler)
				.on(EventType.dialog.reactionLongTap, this.reactionLongTapHandler)
				.on(EventType.dialog.messageDoubleTap, this.messageDoubleTapHandler);

			this.pushPrimaryReactionToNative();
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
				.on('messagesModel/reactionsModel/add', this.redrawReactionMessageHandler)
				.on('applicationModel/setSettings', this.defaultReactionUpdateHandler);
		}

		unsubscribeStoreEvents()
		{
			serviceLocator.get('core').getStoreManager()
				.off('messagesModel/reactionsModel/set', this.updateReactionHandler)
				.off('messagesModel/reactionsModel/updateWithId', this.redrawReactionMessageHandler)
				.off('messagesModel/reactionsModel/add', this.redrawReactionMessageHandler)
				.off('applicationModel/setSettings', this.defaultReactionUpdateHandler);
		}

		/**
		 * @desc Re-pushes the main reaction to the native view when it changes (settings/Pull).
		 * The main reaction is persisted via the setSettings mutation with actionName
		 * 'setDefaultReaction'; other settings (audioRate, recordMediaType, ...) are ignored.
		 * @param {MutationPayload<{ defaultReaction?: string }, string>} [mutation]
		 */
		defaultReactionUpdateHandler(mutation)
		{
			if (mutation?.payload?.actionName !== 'setDefaultReaction')
			{
				return;
			}

			this.pushPrimaryReactionToNative();
		}

		/**
		 * @desc Returns the reaction used for the quick row/picker and the double-tap persist.
		 * When the main-reaction feature is unavailable on the native side, falls back to the
		 * pre-feature baseline ("like") so behaviour is unchanged for current users and Android.
		 * Otherwise returns the user's main reaction from the model (falling back to "like").
		 * @return {string}
		 */
		getDefaultReaction()
		{
			if (!Feature.isDefaultReactionAvailable)
			{
				return ReactionType.like;
			}

			return this.store.getters['applicationModel/getDefaultReaction']() || ReactionType.like;
		}

		/**
		 * @desc Tells the native view which reaction to draw on double-tap for the current dialog.
		 * No-op when the main-reaction feature is unavailable (native flag off) or the native
		 * method is missing (e.g. Android). Degrades safely with no regression.
		 */
		pushPrimaryReactionToNative()
		{
			if (!Feature.isDefaultReactionAvailable)
			{
				return;
			}

			const setPrimaryReaction = this.view?.ui?.setPrimaryReaction;
			if (!Type.isFunction(setPrimaryReaction))
			{
				return;
			}

			const reactionId = this.getDefaultReaction();
			logger.log('pushPrimaryReactionToNative:', reactionId);

			try
			{
				this.view.ui.setPrimaryReaction(reactionId);
			}
			catch (error)
			{
				logger.error('pushPrimaryReactionToNative catch:', error);
			}
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
			const options = {
				customPack: ReactionPack.ALL,
				order: OrderType.CURRENT_USER_FAVORITES,
				onReactionPick: (reactionId) => {
					if (Type.isString(reactionId))
					{
						this.setReaction(reactionId, { id: messageId }, true);
					}
				},
			};

			// When the feature is off, do not forward a primary reaction and do not offer the
			// "make quick reaction" long-press action: the picker keeps its pre-feature baseline.
			if (Feature.isDefaultReactionAvailable)
			{
				const Tourist = this.getTourist();

				options.primaryReactionId = this.getDefaultReaction();
				options.onSetPrimary = (reactionId) => {
					this.setPrimaryReactionFromPicker(reactionId);
				};

				// firstTime() reads synchronously; give Tourist.ready() a bounded window to load the
				// server events (so a returning user who already saw the hint is not shown it again),
				// but do not block the first picker open on the network: fall through on timeout.
				await this.waitForTouristReady(Tourist);

				// One-time hint teaching the long-press gesture, shown next to the primary reaction.
				if (Tourist.firstTime(DEFAULT_REACTION_PICKER_ONBOARDING_TOURIST_KEY))
				{
					options.primaryOnboarding = {
						title: Loc.getMessage('IMMOBILE_MESSENGER_DEFAULT_REACTION_ONBOARDING_TITLE'),
						description: Loc.getMessage('IMMOBILE_MESSENGER_DEFAULT_REACTION_ONBOARDING_DESCRIPTION'),
						testId: 'reaction-picker-primary-onboarding',
					};
					options.onPrimaryOnboardingShown = () => {
						Tourist.remember(DEFAULT_REACTION_PICKER_ONBOARDING_TOURIST_KEY);
					};
				}
			}

			await ReactionPicker.open(options);

			AnalyticsService.getInstance().sendAnalyticsExpandReactionList(this.dialogId);
		}

		/**
		 * @desc Lazily resolves the Tourist singleton. Kept behind a method (not a module-load require)
		 * so its MemoryStorage/network init is not triggered on every dialog open when the picker is
		 * never used; bundled via deps.php, so this resolves synchronously. Also a test seam.
		 * @return {Tourist}
		 */
		getTourist()
		{
			const { Tourist } = require('tourist');

			return Tourist;
		}

		/**
		 * @desc Waits for Tourist.ready() but no longer than TOURIST_READY_TIMEOUT_MS, so a cold-cache
		 * ready() (which may hit the network) cannot block the first picker open. Typical case: ready()
		 * resolves fast and onboarding is decided correctly; on timeout the caller falls through to the
		 * synchronous firstTime() check.
		 * @param {Tourist} Tourist
		 * @return {Promise<void>}
		 */
		async waitForTouristReady(Tourist)
		{
			await Promise.race([
				Tourist.ready(),
				new Promise((resolve) => setTimeout(resolve, TOURIST_READY_TIMEOUT_MS)),
			]).catch(() => {});
		}

		/**
		 * @return {DefaultReactionService}
		 */
		getDefaultReactionService()
		{
			return serviceLocator.get('default-reaction-service');
		}

		/**
		 * @desc Persists the chosen reaction as the user's main (quick) reaction via the shared
		 * settings write path (optimistic model update, REST update, success/error toast and rollback;
		 * an offline pick is rejected with the standard offline toast). Does NOT set the reaction on
		 * the message.
		 * @param {string} reactionId
		 */
		setPrimaryReactionFromPicker(reactionId)
		{
			if (!Type.isStringFilled(reactionId))
			{
				return;
			}

			void this.getDefaultReactionService().writeToServer(reactionId)
				.catch((error) => logger.error('ReactionManager.setPrimaryReactionFromPicker catch:', error));
		}

		/**
		 * @param {string} index
		 * @param {object} message
		 * @param {boolean} isUpdateUi
		 */
		messageDoubleTapHandler(index, message)
		{
			if (!message.showReaction)
			{
				return;
			}

			// The native view already draws the reaction on double-tap; JS persists the same
			// main reaction silently (isUpdateUi=false) so it does not redraw over the native one.
			this.setReaction(this.getDefaultReaction(), message, false, false);
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
		 * @desc Check and validate text message quote.
		 * Does not mutate the passed message: callers may pass a store model.
		 * @param {MessagesModelState} message
		 * @return {MessagesModelState}
		 */
		validateQuote(message)
		{
			const validateQuoteMessage = clone(message);
			if (this.replyManager?.isHasQuote(validateQuoteMessage))
			{
				// Transitional gate, symmetric to Dialog.validateQuote(): media/file replies keep their
				// previous look, without the quote block, until native reply-with-media support ships.
				if (Type.isArrayFilled(validateQuoteMessage.files) && !Feature.isReplyWithMediaAvailable)
				{
					return validateQuoteMessage;
				}

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
