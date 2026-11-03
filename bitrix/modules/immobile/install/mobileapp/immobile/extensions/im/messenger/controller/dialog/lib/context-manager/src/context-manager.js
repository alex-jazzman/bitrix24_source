/* eslint-disable no-param-reassign */

/**
 * @module im/messenger/controller/dialog/lib/context-manager/context-manager
 */
jn.define('im/messenger/controller/dialog/lib/context-manager/context-manager', (require, exports, module) => {
	const { Type } = require('type');
	const { AnalyticsEvent } = require('analytics');
	const { AfterScrollMessagePosition } = require('im/messenger/view/dialog');
	const {
		EventType,
		OpenDialogContextType,
		Analytics,
	} = require('im/messenger/const');
	const { Feature } = require('im/messenger/lib/feature');
	const { getLogger } = require('im/messenger/lib/logger');
	const { SoftLoader } = require('im/messenger/lib/helper');
	const { openPlanLimitsWidgetByError, openPlanLimitsWidget } = require('im/messenger/lib/plan-limit');
	const { DialogHelper } = require('im/messenger/lib/helper');
	const { serviceLocator } = require('im/messenger/lib/di/service-locator');

	const logger = getLogger('dialog--context-manager');

	/**
	 * @class ContextManager
	 */
	class ContextManager
	{
		#dialogId;
		#dialogLocator;
		#topLoader;
		#goToMessageContextHandler;
		#navigationSequence = 0;
		#feedWrite = Promise.resolve();
		#lastFeedMove = null;

		/**
		 * @param {number || string} dialogId
		 * @param {DialogLocator} dialogLocator
		 */
		constructor({ dialogId, dialogLocator })
		{
			this.#dialogId = dialogId;
			this.#dialogLocator = dialogLocator;

			this.#topLoader = new SoftLoader({
				safeDisplayTime: 2000,
				showDelay: 1000,
				onShow: () => {
					this.#view.showTopLoader();
				},
				onHide: () => {
					this.#view.hideTopLoader();
				},
			});

			this.#bindEvents();
			this.#subscribeEvents();
		}

		destructor()
		{
			// the dialog this manager moves is gone: a context still loading must not reach the feed
			// of the screen that came after it, and a scroll still running has no feed to go back to
			this.#startNavigation();
			this.#lastFeedMove = null;
			this.#unsubscribeEvents();
		}

		/**
		 * Counts the moves of the feed this manager has been asked for: a search result, a quotation,
		 * a pinned message, a link, a picked date - every one of them comes through here, and this is
		 * the only place that sees them all.
		 *
		 * The feed itself is guarded by the manager and not by the caller, see `#startNavigation`, so
		 * this counter is only ever needed by a caller that has something of ITS OWN besides the feed
		 * to undo - the jump by date draws a highlight over the day it went to. Such a caller reads
		 * the counter before and after: a value that changed means the feed has been taken somewhere
		 * newer, and the answer the caller is holding is no longer the one the user is waiting for.
		 *
		 * The value carries no meaning by itself and is only ever compared with an earlier reading of
		 * itself. Delegation therefore stays as it is: `goToMessageContextByCommentChatId` moves the
		 * counter and then moves it again through `goToMessageContext`, which changes nothing for a
		 * comparison and saves a shared class from a refactoring done for a counter alone.
		 *
		 * @return {number}
		 */
		get navigationSequence()
		{
			return this.#navigationSequence;
		}

		/**
		 * Numbers the move of the feed that starts right here, and every entry point of the manager
		 * starts with it - before anything that can await.
		 *
		 * The context of a message is loaded from the database or from the server, and while it loads
		 * the user is free to go somewhere newer: a search result, a quotation, a pinned message, a
		 * link, another day. The load itself cannot be called back, so the number is what tells the
		 * answer of an overtaken load that nobody waits for it any more.
		 *
		 * The number is asked for by the two places that touch the feed - `#replaceFeedContext` and
		 * `#goToRenderedMessageContext` - and NOT by the callers of the manager: a check left to the
		 * caller is a check the next caller forgets, and every side that moves this feed knows only
		 * about its own move anyway.
		 *
		 * @return {number}
		 */
		#startNavigation()
		{
			this.#navigationSequence += 1;

			return this.#navigationSequence;
		}

		/**
		 * @param {number} sequence
		 * @return {boolean}
		 */
		#isNavigationCurrent(sequence)
		{
			return sequence === this.#navigationSequence;
		}

		/**
		 * The one place the whole message collection of the feed is replaced from. The check of who
		 * the feed belongs to now lives here, together with the replacement it protects: a context
		 * overtaken by a newer one leaves the feed exactly as it was, whoever asked for either of
		 * them.
		 *
		 * Everything between the reset of the drawn rows and the filled collection goes inside
		 * `updateModel`, so the replacement is never abandoned halfway: past the reset the feed
		 * carries nothing. `updateModel` is a run of store dispatches and cannot be called back
		 * once begun, so a replacement waits out the one already writing before it asks whose the
		 * feed is - interleaved dispatches would let the older context land its collection last.
		 * The wait covers the writing alone: every load is behind us by the time we are here.
		 *
		 * @param {number} sequence
		 * @param {FeedContextReplacement} replacement
		 * @return {Promise<boolean>} whether the feed has been replaced
		 */
		async #replaceFeedContext(sequence, {
			messageId,
			withMessageHighlight = false,
			position = AfterScrollMessagePosition.top,
			updateModel,
		})
		{
			const landingWrite = this.#feedWrite;
			let finishWrite = () => {};
			this.#feedWrite = new Promise((resolve) => {
				finishWrite = resolve;
			});

			try
			{
				await landingWrite;

				if (!this.#isNavigationCurrent(sequence))
				{
					this.#log(`#replaceFeedContext: the context of ${messageId} is not the last one asked for`);

					return false;
				}

				// a new collection leaves an earlier scroll nothing to go back to, see `#undoOvertakenScroll`
				this.#lastFeedMove = { sequence };
				this.#resetRenderedState();
				this.#view.setContextOptions(messageId, withMessageHighlight, position);
				await updateModel();

				return true;
			}
			finally
			{
				finishWrite();
			}
		}

		/**
		 * @return {MessageService|null}
		 */
		get #messageService()
		{
			const messageService = this.#dialogLocator.get('message-service');
			if (messageService)
			{
				return messageService;
			}

			this.#logError('messageService is not initialized.');

			return null;
		}

		/**
		 * @return {MessageRenderer|null}
		 */
		get #messageRenderer()
		{
			const messageRenderer = this.#dialogLocator.get('message-renderer');
			if (messageRenderer)
			{
				return messageRenderer;
			}

			this.#logError('messageRenderer is not initialized.');

			return null;
		}

		/**
		 * @return {DialogView|null}
		 */
		get #view()
		{
			const view = this.#dialogLocator.get('view');
			if (view)
			{
				return view;
			}

			this.#logError('view is not initialized.');

			return null;
		}

		/**
		 * @return {MessengerCoreStore|null}
		 */
		get #store()
		{
			const store = this.#dialogLocator.get('store');
			if (store)
			{
				return store;
			}

			this.#logError('store is not initialized.');

			return null;
		}

		/**
		 * @return {CoreApplication|null}
		 */
		get #core()
		{
			const core = serviceLocator.get('core');
			if (core)
			{
				return core;
			}

			this.#logError('core is not initialized.');

			return null;
		}

		#bindEvents()
		{
			this.#goToMessageContextHandler = this.goToMessageContextInCurrentDialog.bind(this);
			this.goToMessageContext = this.goToMessageContext.bind(this);
		}

		#subscribeEvents()
		{
			BX.addCustomEvent(EventType.dialog.external.goToMessageContext, this.#goToMessageContextHandler);
		}

		#unsubscribeEvents()
		{
			BX.removeCustomEvent(EventType.dialog.external.goToMessageContext, this.#goToMessageContextHandler);
		}

		goToMessageContextInCurrentDialog(params)
		{
			if (params.dialogId !== this.#dialogId)
			{
				return;
			}

			void this.goToMessageContext(params);
		}

		/**
		 * @param {GoToMessageContextEvent} event
		 */
		async goToMessageContext({
			dialogId,
			messageId,
			parentMessageId = null,
			withMessageHighlight = true,
			targetMessagePosition = AfterScrollMessagePosition.top,
			showPlanLimitWidget = true,
			context = OpenDialogContextType.default,
		})
		{
			// before anything that can await: a caller reads the counter right after the call and
			// takes what it reads for the move of its own, see `navigationSequence`
			const sequence = this.#startNavigation();

			this.#log(`goToMessageContext: dialogId: ${dialogId}, messageId: ${messageId}, parentMessageId: ${parentMessageId}, withMessageHighlight: ${withMessageHighlight}`);

			const messageIdAsNumber = parseInt(messageId, 10);
			messageId = Type.isNumber(messageIdAsNumber) ? messageIdAsNumber : messageId;

			const isCurrentDialogContext = dialogId === this.#dialogId;
			if (!isCurrentDialogContext)
			{
				await this.#goToAnotherDialogMessageContext(
					dialogId,
					messageId,
					withMessageHighlight,
					parentMessageId,
					context,
				);

				return;
			}

			if (this.#isMessageRendered(messageId))
			{
				await this.#goToRenderedMessageContext(messageId, withMessageHighlight, sequence, targetMessagePosition);

				return;
			}

			if (Type.isStringFilled(messageId))
			{
				this.#log(`goToMessageContext: cannot access a template message through the database or server ${messageId}`);

				return;
			}

			if (showPlanLimitWidget === true)
			{
				const isChannel = DialogHelper.createByDialogId(this.#dialogId)?.isChannelOrComment;
				showPlanLimitWidget = isChannel !== true;
			}

			this.#abortLoadingContextFromServer();
			const isContextLoaded = await this.#goToLocalStorageMessageContext(
				messageId,
				withMessageHighlight,
				sequence,
				targetMessagePosition,
				showPlanLimitWidget,
			);
			// the local context is answered by the database, and the user is free to go somewhere
			// newer while it is being read. The newer move brings a context of its own, so this one
			// has nothing left to do - neither to fall back to the server, nor to refresh a feed that
			// no longer shows it
			if (!this.#isNavigationCurrent(sequence))
			{
				return;
			}

			if (isContextLoaded && messageId)
			{
				void this.#syncMessageContextFromServer(messageId);

				return;
			}

			await this.#goToServerMessageContext(
				messageId,
				withMessageHighlight,
				sequence,
				targetMessagePosition,
				showPlanLimitWidget,
			);
		}

		async #syncMessageContextFromServer(messageId)
		{
			this.#log(`syncMessageContextFromServer: messageId: ${messageId}`);
			try
			{
				this.#messageService.loadContextFromServer(messageId);
			}
			catch (error)
			{
				this.#logError(`syncMessageContextFromServer: messageId: ${messageId} error:`, error);
			}
		}

		#abortLoadingContextFromServer()
		{
			this.#messageService.abortLoadingContextFromServer();
		}

		async goToLastReadMessageContext()
		{
			const lastReadMessageId = this.#getDialogById(this.#dialogId).lastReadId;
			if (!Type.isNumber(lastReadMessageId) || lastReadMessageId === 0)
			{
				logger.warn(`${this.constructor.name}.goToLastReadMessageContext: without lastReadId`, lastReadMessageId);

				await this.goToBottomMessageContext();

				return;
			}

			/**
			 * @type GoToMessageContextEvent
			 */
			const goToMessageContextEvent = {
				dialogId: this.#dialogId,
				messageId: this.#getDialogById(this.#dialogId).lastReadId,
				withMessageHighlight: false,
			};

			this.#log('goToLastReadMessageContext()', goToMessageContextEvent);

			await this.goToMessageContext(goToMessageContextEvent);
		}

		async goToBottomMessageContext()
		{
			/**
			 * @type GoToMessageContextEvent
			 */
			const goToMessageContextEvent = {
				dialogId: this.#dialogId,
				messageId: this.#getDialogById(this.#dialogId).lastMessageId,
				withMessageHighlight: false,
				targetMessagePosition: AfterScrollMessagePosition.bottom,
				showPlanLimitWidget: false,
			};

			this.#log('goToBottomMessageContext()', goToMessageContextEvent);

			await this.goToMessageContext(goToMessageContextEvent);
		}

		/**
		 * @param {GoToPostMessageContextEvent} options
		 */
		async goToPostMessageContext({
			postMessageId,
			withMessageHighlight = true,
		} = {})
		{
			const sequence = this.#startNavigation();

			this.#log(`goToPostMessageContext: postMessageId: ${postMessageId}`);
			if (!Type.isNumber(postMessageId))
			{
				throw new TypeError('ContextManager.goToPostMessageContext: postMessageId must be a number value.');
			}

			if (this.#isMessageRendered(postMessageId))
			{
				await this.#goToRenderedMessageContext(postMessageId, withMessageHighlight, sequence);

				return;
			}

			// the page below replaces the whole collection, so a page or a context still loading for
			// the window that is about to go would be drawn into a feed it does not belong to. The
			// jump by message does exactly the same before its own replacement
			this.#abortLoadingContextFromServer();
			this.#topLoader.show();

			const result = await this.#messageService.loadFirstPage();
			const isFeedReplaced = await this.#replaceFeedContext(sequence, {
				messageId: postMessageId,
				withMessageHighlight,
				updateModel: () => this.#messageService.updateModelByContextResult(result),
			});

			this.#topLoader.hide();

			if (!isFeedReplaced)
			{
				return;
			}

			await this.#goToRenderedMessageContext(postMessageId, withMessageHighlight, sequence);
		}

		/**
		 * @param {GoToMessageContextByCommentsChatIdEvent} options
		 */
		async goToMessageContextByCommentChatId({
			dialogId,
			commentChatId,
			withMessageHighlight = true,
			targetMessagePosition = AfterScrollMessagePosition.bottom,
		})
		{
			const sequence = this.#startNavigation();

			this.#log(`goToMessageContextByCommentsChatId: dialogId: ${dialogId} commentChatId: ${commentChatId}`);
			if (!Type.isNumber(commentChatId))
			{
				throw new TypeError('ContextManager.goToMessageContextByCommentChatId: commentChatId must be a number value.');
			}

			const messageId = await this.#getParentMessageIdByCommentChatId(commentChatId);
			// the parent message is looked for in the database when the model does not know it, and a
			// newer move of the feed made meanwhile must not be pushed aside by the delegation below:
			// it starts a move of its own and would win the comparison by being the later one
			if (!this.#isNavigationCurrent(sequence))
			{
				return;
			}

			if (messageId)
			{
				await this.goToMessageContext({
					dialogId,
					messageId,
					withMessageHighlight: true,
					targetMessagePosition,
				});

				return;
			}

			this.#abortLoadingContextFromServer();
			this.#topLoader.show();

			const context = await this.#messageService.loadContextByCommentChatId(commentChatId);
			const contextMessageId = context.contextMessageId;
			const isFeedReplaced = await this.#replaceFeedContext(sequence, {
				messageId: contextMessageId,
				position: AfterScrollMessagePosition.bottom,
				updateModel: () => this.#messageService.updateModelByContextResult(context.result),
			});

			this.#topLoader.hide();

			if (!isFeedReplaced)
			{
				return;
			}

			await this.#goToRenderedMessageContext(
				contextMessageId,
				withMessageHighlight,
				sequence,
				AfterScrollMessagePosition.bottom,
			);
		}

		/**
		 * @param {number|string} dialogId
		 * @param {number|string} messageId
		 * @param {boolean} withMessageHighlight
		 * @param {number|string|null} [parentMessageId]
		 * @param {string} context
		 */
		async #goToAnotherDialogMessageContext(
			dialogId,
			messageId,
			withMessageHighlight,
			parentMessageId = null,
			context = OpenDialogContextType.default,
		)
		{
			return serviceLocator.get('dialog-manager').openDialog({
				dialogId,
				messageId,
				withMessageHighlight,
				context,
			});
		}

		/**
		 * The second of the two places that touch the feed, and the only one that scrolls it. The
		 * scroll is the visible half of a move: a scroll made on behalf of an overtaken context takes
		 * the user away from where the user has just asked to be, which is worse than not moving at
		 * all.
		 *
		 * Once handed over, a scroll cannot be called back - neither platform gives JS a stop, and
		 * Android runs a started scroll to its end - so the feed is guarded at BOTH ends: a scroll
		 * is not started for an already overtaken context, and one overtaken while it ran undoes
		 * itself, see `#undoOvertakenScroll`.
		 *
		 * @param {number|string} messageId
		 * @param {boolean} withMessageHighlight
		 * @param {number} sequence
		 * @param {string} [position]
		 */
		async #goToRenderedMessageContext(
			messageId,
			withMessageHighlight,
			sequence,
			position = AfterScrollMessagePosition.top,
		)
		{
			this.#log(`#goToRenderedMessageContext: messageId: ${messageId}, withMessageHighlight: ${withMessageHighlight}`);
			if (!Type.isStringFilled(messageId) && !Type.isNumber(messageId))
			{
				return;
			}

			if (parseInt(messageId, 10) <= 0)
			{
				return;
			}

			if (!this.#isNavigationCurrent(sequence))
			{
				this.#log(`#goToRenderedMessageContext: ${messageId} is not where the feed is going any more`);

				return;
			}

			this.#lastFeedMove = { sequence, anchorMessageId: this.#view.getTopMessageOnScreen().id };

			await this.#view.scrollToMessageById(messageId, true, () => {
				if (!this.#isNavigationCurrent(sequence))
				{
					this.#undoOvertakenScroll(sequence);

					return;
				}

				if (withMessageHighlight)
				{
					this.#view.highlightMessageById(messageId);
				}
			}, position);
		}

		/**
		 * Gives the feed back to where the scroll of `sequence` took it from: the newer move that
		 * overtook it can still fail to load its context, and then nothing would ever move the feed
		 * off the target of a jump the user had already cancelled.
		 *
		 * A feed moved again since belongs to that newer move, and taking it back would cancel what
		 * the user is waiting for.
		 *
		 * @param {number} sequence
		 */
		#undoOvertakenScroll(sequence)
		{
			if (this.#lastFeedMove?.sequence !== sequence)
			{
				return;
			}

			const { anchorMessageId } = this.#lastFeedMove;
			this.#lastFeedMove = null;
			if (!anchorMessageId)
			{
				return;
			}

			this.#log(`#undoOvertakenScroll: the feed goes back to ${anchorMessageId}`);

			void this.#view.scrollToMessageById(anchorMessageId, false, () => {}, AfterScrollMessagePosition.top);
		}

		/**
		 * @param {number} messageId
		 * @param {boolean} withMessageHighlight
		 * @param {number} sequence
		 * @param {string} targetMessagePosition
		 * @param {boolean} showPlanLimitWidget
		 * @return {Promise<boolean>} whether the feed shows this context now
		 */
		async #goToLocalStorageMessageContext(
			messageId,
			withMessageHighlight,
			sequence,
			targetMessagePosition = AfterScrollMessagePosition.top,
			showPlanLimitWidget = true,
		)
		{
			if (!Feature.isLocalStorageEnabled)
			{
				this.#log(`#goToLocalStorageMessageContext: messageId: ${messageId} skipped because local storage is disabled.`);

				return false;
			}

			this.#log(`#goToLocalStorageMessageContext: messageId: ${messageId}`);

			const result = await this.#messageService.loadLocalStorageContext(messageId);
			// the reading of the database is the longest pause of this path, and the widget of the
			// plan limits below opens a screen of its own: neither belongs to a context the user has
			// already left behind
			if (!this.#isNavigationCurrent(sequence))
			{
				this.#log(`#goToLocalStorageMessageContext: ${messageId} is not the last context asked for`);

				return false;
			}

			if (!result.isCompleteContext)
			{
				return false;
			}

			const isPlanLimitHistoryExceeded = result?.result?.dialogFields?.tariffRestrictions?.isHistoryLimitExceeded;
			if (isPlanLimitHistoryExceeded && showPlanLimitWidget)
			{
				const dialog = this.#getDialogById(this.#dialogId);

				const analytics = new AnalyticsEvent()
					.setSection(Analytics.Section.messageLink)
					.setP1(Analytics.P1[dialog?.type]);

				await openPlanLimitsWidget(analytics);

				return true;
			}

			const isHasContextMessage = result?.result?.hasContextMessage;
			if (!isHasContextMessage)
			{
				return false;
			}

			const isFeedReplaced = await this.#replaceFeedContext(sequence, {
				messageId,
				position: targetMessagePosition,
				updateModel: async () => {
					await this.#messageService.enablePageNavigation();
					await this.#messageService.updateModelByLocalStorageContextResult(result.result);
				},
			});
			if (!isFeedReplaced)
			{
				return false;
			}

			await this.#goToRenderedMessageContext(messageId, withMessageHighlight, sequence, targetMessagePosition);

			return true;
		}

		/**
		 * @param {number} messageId
		 * @param {boolean} withMessageHighlight
		 * @param {number} sequence
		 * @param {string} targetMessagePosition
		 * @param {boolean} showPlanLimitWidget
		 * @return {Promise}
		 */
		async #goToServerMessageContext(
			messageId,
			withMessageHighlight,
			sequence,
			targetMessagePosition = AfterScrollMessagePosition.top,
			showPlanLimitWidget = true,
		)
		{
			this.#log(`#goToServerMessageContext: messageId: ${messageId}`);

			this.#topLoader.show();

			try
			{
				const result = await this.#messageService.loadContextAndRead(messageId);
				// the answer of the server outlives the wish behind it just as the answer of the
				// database does, and the refusal it may carry belongs to that same wish: an alert
				// about a context nobody waits for lands over the screen the user went to instead
				if (!this.#isNavigationCurrent(sequence))
				{
					this.#log(`#goToServerMessageContext: ${messageId} is not the last context asked for`);
					this.#topLoader.hide();

					return;
				}

				if (result?.answer?.error)
				{
					this.#topLoader.hide();
					if (showPlanLimitWidget)
					{
						await this.checkPlanLimitByError(result?.answer?.error);
					}

					return;
				}

				const isFeedReplaced = await this.#replaceFeedContext(sequence, {
					messageId,
					position: targetMessagePosition,
					updateModel: () => this.#messageService.updateModelByContextResult(result),
				});
				this.#topLoader.hide();
				if (!isFeedReplaced)
				{
					return;
				}

				await this.#goToRenderedMessageContext(messageId, withMessageHighlight, sequence, targetMessagePosition);
			}
			catch (error)
			{
				this.#topLoader.hide();

				logger.error('ContextManager.#goToServerMessageContext: error', error);
			}
		}

		/**
		 * @param {object} error
		 * @return void
		 */
		async checkPlanLimitByError(error)
		{
			await openPlanLimitsWidgetByError(error);
		}

		#isMessageRendered(messageId)
		{
			return this.#messageRenderer.messageIdCollection.has(messageId);
		}

		#resetRenderedState()
		{
			this.#messageRenderer.resetState();
			this.#view.resetState();
		}

		/**
		 * @param {string|number} dialogId
		 *
		 * @return {DialoguesModelState|{}}
		 */
		#getDialogById(dialogId)
		{
			const dialog = this.#store.getters['dialoguesModel/getById'](dialogId);

			return dialog || {};
		}

		/**
		 * @param {number} commentChatId
		 *
		 * @return {number|null}
		 */
		async #getParentMessageIdByCommentChatId(commentChatId)
		{
			const commentInfo = this.#store.getters['commentModel/getCommentInfoByCommentChatId'](commentChatId);
			if (commentInfo)
			{
				return commentInfo.messageId;
			}

			const databaseCommentInfo = await this.#core.getRepository().comment.getByCommentChatId(commentChatId);
			if (databaseCommentInfo)
			{
				return databaseCommentInfo.parentMessageId;
			}

			return null;
		}

		#log(message)
		{
			logger.log(`${this.constructor.name}.${message}`);
		}

		#logError(message)
		{
			logger.error(`${this.constructor.name}.${message}`);
		}
	}

	module.exports = { ContextManager };
});
