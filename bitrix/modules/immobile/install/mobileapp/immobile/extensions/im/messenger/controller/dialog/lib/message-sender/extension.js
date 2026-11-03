/**
 * @module im/messenger/controller/dialog/lib/message-sender
 */
jn.define('im/messenger/controller/dialog/lib/message-sender', (require, exports, module) => {
	const { Type } = require('type');
	const { Uuid } = require('utils/uuid');
	const { PerfPoint } = require('debug/prism');

	const {
		DraftType,
		ErrorCode,
		MessageComponent,
		OwnMessageStatus,
		FileType,
		CopilotGenerationStatus,
	} = require('im/messenger/const');
	const { ObjectUtils } = require('im/messenger/lib/utils');
	const { getLoggerWithContext } = require('im/messenger/lib/logger');
	const { DialogHelper, MessageHelper } = require('im/messenger/lib/helper');
	const { serviceLocator } = require('im/messenger/lib/di/service-locator');
	const { Feature } = require('im/messenger/lib/feature');
	const { Notification } = require('im/messenger/lib/ui/notification');
	const { getSendBlockedText } = require('im/messenger/lib/copilot/file-validator');

	const { MessageRest, CopilotRest } = require('im/messenger/provider/rest');
	const { SendingService } = require('im/messenger/provider/services/sending');

	const { AppRatingClient } = require('im/messenger/controller/dialog/lib/app-rating-client');

	const logger = getLoggerWithContext('dialog--message-sender', 'MessageSender');

	const { SenderEventHandler } = require('im/messenger/controller/dialog/lib/message-sender/src/event-handler');
	const { getFailedForwardMessages } = require(
		'im/messenger/controller/dialog/lib/message-sender/src/forward-result',
	);
	const { OutgoingMessageBuilder } = require('im/messenger/controller/dialog/lib/message-sender/src/outgoing-message-builder');
	const { ForwardingMessageBuilder } = require('im/messenger/controller/dialog/lib/message-sender/src/forwarding-message-builder');
	const { RecentMessageUpdater } = require('im/messenger/controller/dialog/lib/message-sender/src/recent-message-updater');

	const createMessageMetadataForLog = (message = {}) => ({
		id: message?.id ?? null,
		templateId: message?.templateId ?? null,
		chatId: message?.chatId ?? null,
		type: message?.type ?? null,
		componentId: message?.params?.COMPONENT_ID ?? null,
		hasText: Type.isStringFilled(message?.text),
		filesCount: Array.isArray(message?.files) ? message.files.length : 0,
		sending: message?.sending === true,
		error: message?.error === true,
		errorReason: message?.errorReason ?? null,
	});

	const createSendMessageParamsForLog = (sendMessageParams = {}) => {
		const requestParams = sendMessageParams.requestParams ?? {};
		const forwardingMessages = Array.isArray(sendMessageParams.forwardingMessages)
			? sendMessageParams.forwardingMessages
			: [];

		return {
			request: {
				dialogId: requestParams.dialogId ?? null,
				templateId: requestParams.templateId ?? null,
				hasText: Type.isStringFilled(requestParams.text),
				hasContact: Type.isPlainObject(requestParams.contact),
				hasSticker: Type.isPlainObject(requestParams.stickerParams),
				forwardCount: Array.isArray(requestParams.forwardIds) ? requestParams.forwardIds.length : 0,
			},
			message: createMessageMetadataForLog(sendMessageParams.message),
			forwardingMessages: forwardingMessages.map((message) => createMessageMetadataForLog(message)),
		};
	};

	/**
	 * @desc Handles message sending API operations.
	 * WARNING: All messaging operations require prior initialization
	 * of dialog. Call Dialog.initManagers() before using this class.
	 *
	 * @requires Dialog.initManagers
	 *
	 * @class MessageSender
	 */
	class MessageSender
	{
		/**
		 * True only while a submit that came from attach state is being dispatched to
		 * sendFilesWithText (message registration + first upload task start; the byte
		 * upload itself is event-driven and NOT awaited, so the window is short and does
		 * not grow with file size). During that window sendTextMessage drops any re-entrant
		 * submit: the attach flag is reset synchronously before the async dispatch, so a
		 * second rapid tap would otherwise fall through to the plain-text branch and send a
		 * stray text-only copy. A genuine text sent after the dispatch is not blocked.
		 * @type {boolean}
		 */
		#isDispatchingAttachSend = false;

		/**
		 * @param {DialogLocator} dialogLocator
		 */
		constructor(dialogLocator)
		{
			/** @private */
			this.dialogLocator = dialogLocator;

			this.eventHandler = new SenderEventHandler(this, dialogLocator);

			/** @private */
			this.resendQueuePromise = Promise.resolve();
			/** @private */
			this.sendQueuePromise = Promise.resolve();
		}

		// region getters
		/**
		 * @private
		 * @return {SendingService}
		 */
		get sendingService()
		{
			return serviceLocator.get('sending-service');
		}

		/**
		 * @private
		 * @return {DialogView}
		 */
		get view()
		{
			return this.dialogLocator.get('view');
		}

		/**
		 * @private
		 * @return {DraftManager}
		 * */
		get draftManager()
		{
			return this.dialogLocator.get('draft-manager');
		}

		/**
		 * @private
		 * @return {MentionManager}
		*/
		get mentionManager()
		{
			return this.dialogLocator.get('mention-manager');
		}

		/**
		 * @private
		 * @return {MessageService}
		*/
		get messageService()
		{
			return this.dialogLocator.get('message-service');
		}

		/**
		 * @private
		 * @return {AssistantButtonManager}
		 * */
		get assistantButtonManager()
		{
			return this.dialogLocator.get('assistant-button-manager');
		}

		/**
		 * @private
		 * @return {ReplyManager}
		*/
		get replyManager()
		{
			return this.dialogLocator.get('reply-manager');
		}

		/**
		 * @private
		 * @return {ContextManager}
		*/
		get contextManager()
		{
			return this.dialogLocator.get('context-manager');
		}

		/**
		 * @private
		 * @return {InputActionManager}
		*/
		get inputActionManager()
		{
			return this.dialogLocator.get('input-action-manager');
		}

		/**
		 * @private
		 * @return {MessageRenderer}
		*/
		get messageRenderer()
		{
			return this.dialogLocator.get('message-renderer');
		}

		get dialogId()
		{
			return this.dialogLocator.get('dialogId');
		}

		/**
		 * @private
		 * @return {MessengerCoreStore}
		*/
		get store()
		{
			return serviceLocator.get('core').getStore();
		}

		/**
		 * @private
		 * @return {MessengerCoreStoreManager}
		*/
		get storeManager()
		{
			return serviceLocator.get('core').getStoreManager();
		}

		/**
		 * @private
		 * @return {?DialoguesModelState}
		*/
		get dialog()
		{
			return this.store.getters['dialoguesModel/getById'](this.dialogId);
		}

		/**
		 * @private
		 * @return {number | undefined}
		 */
		get chatId()
		{
			return this.dialog?.chatId;
		}

		/**
		 * @private
		 * @return {DialogHelper|null}
		 */
		get dialogHelper()
		{
			return DialogHelper.createByDialogId(this.dialogId);
		}

		// endregion getters

		subscribeViewEvents()
		{
			this.eventHandler.subscribeViewEvents();
		}

		unsubscribeViewEvents()
		{
			this.eventHandler.unsubscribeViewEvents();
		}

		subscribeExternalEvents()
		{
			this.eventHandler.subscribeExternalEvents();
		}

		unsubscribeExternalEvents()
		{
			this.eventHandler.unsubscribeExternalEvents();
		}

		subscribeStoreEvents()
		{
			this.eventHandler.subscribeStoreEvents();
		}

		unsubscribeStoreEvents()
		{
			this.eventHandler.unsubscribeStoreEvents();
		}

		/**
		 * @desc The stop state is allowed only in a one-on-one copilot chat with an active
		 * generation, and only when the feature is double-gated on (server + native flags).
		 * The live predicate is read from the store and the gate, not from a cached flag.
		 * @return {boolean}
		 */
		isStopStateActive()
		{
			if (!Feature.isStopGenerationAvailable)
			{
				return false;
			}

			if (!this.dialogHelper?.isCopilotDirect)
			{
				return false;
			}

			return this.dialog?.copilotGenerationState?.status === CopilotGenerationStatus.generating;
		}

		/**
		 * @desc Requests the stop of the active BitrixGPT generation. On a server error the local
		 * state is silently reset — chat-load and pull will restore the truth.
		 * @return {Promise<void>}
		 */
		async stopGeneration()
		{
			logger.log(`${this.constructor.name}.stopGeneration`, this.dialogId);

			try
			{
				const { status, initiatorId } = await CopilotRest.stopGeneration({ dialogId: this.dialogId });

				await this.store.dispatch('dialoguesModel/setCopilotGenerationState', {
					dialogId: this.dialogId,
					status,
					initiatorId,
				});
			}
			catch (error)
			{
				logger.error(`${this.constructor.name}.stopGeneration error`, error);

				await this.store.dispatch('dialoguesModel/clearCopilotGenerationState', {
					dialogId: this.dialogId,
				});
			}
		}

		tryResendMessages()
		{
			this.#resendMessages()
				.catch((error) => {
					logger.error('resendMessages error', error);
				})
			;
		}

		/**
		 * @param {string} text
		 * @param {string} [promptCode]
		 * @param {boolean} [shouldFinishTextFieldActions]
		 * @return {Promise<void>}
		 */
		async sendTextMessage(text, promptCode = null, shouldFinishTextFieldActions = true)
		{
			// Drop a repeated submit while a media-with-text send is still dispatching.
			// Its first tap reset isAttachInProcess synchronously, so without this guard the
			// second tap (which may still carry the same text) would send a stray text message.
			if (this.#isDispatchingAttachSend)
			{
				return;
			}

			if (this.replyManager.isAttachInProcess)
			{
				this.#isDispatchingAttachSend = true;
				this.sendFilesWithText(text).finally(() => {
					this.#isDispatchingAttachSend = false;
				});

				return;
			}

			if (shouldFinishTextFieldActions)
			{
				this.view.clearInput();
				await this.draftManager.clearDraft();
				this.inputActionManager.cancelInputActionRequest();
			}

			if (this.mentionManager?.isMentionProcessed)
			{
				this.mentionManager?.finishMentioning();
			}

			if (this.replyManager.isEditInProcess && shouldFinishTextFieldActions)
			{
				const messageId = this.replyManager.getEditMessage().id;
				this.#updateMessageText(messageId, text);
				this.replyManager.finishEditingMessage();

				return;
			}

			if (ObjectUtils.isStringFullSpace(text) && !this.replyManager.isForwardInProcess)
			{
				return;
			}

			const sendMessageParams = this.#prepareMessageToSend({
				text,
				promptCode,
			});

			await this.#sendMessage(sendMessageParams, {
				shouldFinishTextFieldActions,
			})
				.catch((error) => {
					logger.error('#sendMessage error', error);
				});
		}

		/**
		 * @desc Saves the edited text and recovers it when saving failed. The edit mode is closed
		 *   optimistically right after the call, so the outcome is applied when the answer comes.
		 * @private
		 * @param {MessageId} messageId
		 * @param {string} text
		 */
		#updateMessageText(messageId, text)
		{
			// the type is taken now: by the time the answer comes the message may be gone from the model
			const isVideoNote = Boolean(MessageHelper.createById(messageId)?.isVideoNote);

			this.messageService.updateText(messageId, text, this.dialogId)
				.then((outcome) => this.#handleUpdateTextOutcome({ messageId, text, isVideoNote }, outcome))
				.catch((error) => logger.error('#updateMessageText error', error))
			;
		}

		/**
		 * @private
		 * @param {{messageId: MessageId, text: string, isVideoNote: boolean}} attempt
		 * @param {MessageUpdateTextResult} outcome
		 */
		#handleUpdateTextOutcome(attempt, outcome)
		{
			// a queued request is not a failure: it is accepted and goes to the server later, nothing to wait for.
			// The answer of a superseded attempt must not overwrite the result of the newest one
			if (outcome.success || outcome.queued || !outcome.isLatestAttempt)
			{
				return;
			}

			const { messageId, text, isVideoNote } = attempt;
			if (!isVideoNote)
			{
				logger.error('#handleUpdateTextOutcome: updating the text failed', outcome.reason);

				return;
			}

			this.#recoverEditedText(messageId, text);
			this.#showUpdateTextFailureToast(outcome.reason);
		}

		/**
		 * @desc Returns the user to the edit mode of the same message with the typed text, or keeps the text
		 *   in the draft of the chat when the return is not allowed and the draft is free to take it.
		 * @private
		 * @param {MessageId} messageId
		 * @param {string} text
		 */
		#recoverEditedText(messageId, text)
		{
			// the draft is keyed by the chat, so a busy field owns the draft too and neither may be written
			if (this.#isInputFieldBusy(messageId))
			{
				return;
			}

			const messageModel = this.store.getters['messagesModel/getById'](messageId);
			if (this.#isEditModeReturnAllowed(messageModel))
			{
				this.replyManager.startEditingMessage(messageModel);
				// startEditingMessage fills the input and the draft from the model, the typed text goes on top
				this.view.setInput(text);
				this.#saveRecoveredTextToEditDraft(text);

				return;
			}

			this.#saveEditedTextToDraft(text);
		}

		/**
		 * @desc The input field of this dialog holds the user's own work: freshly typed text or the edit
		 *   panel of another message. A field that is not alive holds nothing and is never busy.
		 * @private
		 * @param {MessageId} messageId
		 * @return {boolean}
		 */
		#isInputFieldBusy(messageId)
		{
			if (!this.#isInputFieldAlive())
			{
				return false;
			}

			const editMessageId = this.replyManager.getEditMessage()?.id;
			if (this.replyManager.isEditInProcess && String(editMessageId) !== String(messageId))
			{
				return true;
			}

			const inputText = this.view.getInput();
			if (ObjectUtils.isStringFullSpace(inputText))
			{
				return false;
			}

			// finishEditingMessage returns the text that was in the field before the edit back into it,
			// synchronously with the send: an untouched field holds that buffer, not new text of the user
			return inputText !== this.replyManager.inputTextBuffer;
		}

		/**
		 * @desc The field belongs to this very dialog instance: the live dialogCode of the chat separates
		 *   the instance that still owns the field from one the user has left and come back to.
		 * @private
		 * @return {boolean}
		 */
		#isInputFieldAlive()
		{
			const liveDialogCode = serviceLocator.get(this.dialogId)?.dialogCode;

			return Type.isStringFilled(liveDialogCode) && liveDialogCode === this.dialogLocator.get('dialogCode');
		}

		/**
		 * @private
		 * @param {MessagesModelState} messageModel
		 * @return {boolean}
		 */
		#isEditModeReturnAllowed(messageModel)
		{
			// a message gone from the model or marked deleted has no edit panel to return to
			if (Type.isNil(messageModel?.id) || MessageHelper.createByModel(messageModel)?.isDeleted)
			{
				return false;
			}

			if (!this.#isInputFieldAlive())
			{
				return false;
			}

			// startEditingMessage asks for the native keyboard, so the return needs the chat on screen
			return this.#isDialogOnScreen();
		}

		/**
		 * @desc The top of the stack of the open dialogs: a chat opened on top takes the screen from this one.
		 * @private
		 * @return {boolean}
		 */
		#isDialogOnScreen()
		{
			// openDialogId normalizes a chatId through Number(), so the ids are compared as strings
			const openedDialogId = this.store.getters['applicationModel/getCurrentOpenedDialogId']();

			return String(openedDialogId) === String(this.dialogId);
		}

		/**
		 * @desc Brings the draft of the chat to the typed text: view.setInput emits textSet, which
		 *   DraftManager does not listen to, so without this the draft keeps the text before the edit.
		 * @private
		 * @param {string} text
		 */
		#saveRecoveredTextToEditDraft(text)
		{
			// the same queue of DraftManager, so the record lands after the one of startEditingMessage
			const editMessage = this.replyManager.getEditMessage();

			this.draftManager.setQuotMessageInStore(editMessage, DraftType.edit, text)
				.catch((error) => logger.error('#saveRecoveredTextToEditDraft error', error))
			;
		}

		/**
		 * @private
		 * @param {string} text
		 */
		#saveEditedTextToDraft(text)
		{
			// the field holds nothing of the user's here. DraftManager.saveDraft() is muted until the
			// next input change, so the record is set directly
			this.draftManager.setInStore({
				dialogId: this.dialogId,
				type: DraftType.text,
				text,
			})
				.catch((error) => logger.error('#saveEditedTextToDraft error', error))
			;
		}

		/**
		 * @private
		 * @param {?RunActionError} reason
		 */
		#showUpdateTextFailureToast(reason)
		{
			// no new phrase: the reason comes from the answer, the generic wording is the toast default
			const params = Type.isStringFilled(reason?.message) ? { message: reason.message } : {};

			Notification.showErrorToast(params);
		}

		/**
		 * @param {string} text
		 */
		async sendFilesWithText(text)
		{
			const files = this.replyManager.attachFiles;
			if (!Type.isArrayFilled(files))
			{
				return;
			}

			// Copilot client validation gate: block sending while any attach file is still being
			// checked or failed validation. Non-copilot chats have no statuses, so this is a no-op.
			if (this.replyManager.hasBlockingAttachFiles())
			{
				Notification.showToastWithParams({ message: getSendBlockedText() });

				return;
			}

			// Capture replyId synchronously BEFORE any async reset (P1 moves quote to background,
			// but getQuoteMessage() still returns the quoteMessage at this point).
			// CAP-01: Only attach replyId on the file path when both native build and server
			// support reply-with-media (Feature.isReplyWithMediaAvailable).
			// When false, files are sent without reply link (graceful degradation).
			// Regular text reply is NOT affected by this gate.
			const sendParams = {};
			if (
				Feature.isReplyWithMediaAvailable
				&& (this.replyManager.isQuoteInProcess || this.replyManager.isQuoteInBackground)
			)
			{
				const quoteMessage = this.replyManager.getQuoteMessage();
				const quoteMessageId = Number(quoteMessage?.id);
				if (Number.isFinite(quoteMessageId) && quoteMessageId > 0)
				{
					sendParams.replyId = quoteMessageId;
				}
			}

			// Reset the attach state and clear the input synchronously, before the async upload.
			// sendFiles() resolves only after the upload finishes, so leaving isAttachInProcess=true
			// until then lets a repeated send tap re-enter this path and send the same files again.
			this.inputActionManager.startSendingFile();
			this.replyManager.finishAttachingFiles(false);
			this.view.clearInput();
			this.draftManager.clearDraft(this.dialogId);

			const point = new PerfPoint('IM Reply With Media', 'sendFilesWithText').start();
			try
			{
				await this.sendingService.sendFiles(this.dialogId, files, text, sendParams)
					.catch((error) => logger.error(`${this.constructor.name}.sendFilesWithText`, error))
				;
			}
			finally
			{
				point.end();
			}
		}

		/**
		 * @param {FullStickerData} stickerParams
		 * @return {Promise<void>}
		 */
		async sendStickerMessage(stickerParams)
		{
			// In reply-with-media mode, close the reply plaque after sticker send; input text is preserved.
			const shouldFinishReply = Feature.isReplyWithMediaAvailable
				&& this.replyManager.isQuoteInProcess;

			const sendMessageParams = this.#prepareMessageToSend({
				stickerParams,
			});

			await this.#sendMessage(sendMessageParams, {
				shouldFinishTextFieldActions: false,
				shouldFinishReplyOnly: shouldFinishReply,
			})
				.catch((error) => {
					logger.error('#sendMessage error', error);
				});
		}

		async sendContactMessage(contact)
		{
			const shouldFinishReply = this.replyManager.isQuoteInProcess;
			const sendMessageParams = this.#prepareMessageToSend({ contact });
			if (contact.photoId)
			{
				await this.store.dispatch('filesModel/set', {
					id: contact.photoId,
					chatId: this.chatId,
					authorId: serviceLocator.get('core').getUserId(),
					messageId: sendMessageParams.message.templateId,
					type: FileType.image,
					name: 'contact-photo.jpg',
					urlPreview: contact.photoUrl || '',
					urlDownload: contact.photoUrl || '',
				});
			}

			await this.#sendMessage(sendMessageParams, {
				shouldFinishTextFieldActions: false,
				shouldFinishReplyOnly: shouldFinishReply,
			});
		}

		/**
		 * @param {DialogId} dialogId
		 * @returns {Promise<void>}
		 */
		async sendForwardMessageToNotes(dialogId)
		{
			const sendMessageParams = this.#prepareMessageToSend({
				dialogId,
			});

			await this.#sendMessageToAnotherDialog(sendMessageParams)
				.catch((error) => {
					logger.error('#sendMessageToAnotherDialog error', error);
				});
		}

		/**
		 * @param {number|Object} index
		 * @param {MessagesModelState|Message} message
		 * @returns {Promise<void>}
		 */
		async resendMessage(index, message)
		{
			if (Type.isPlainObject(index))
			{
				// eslint-disable-next-line no-param-reassign
				({ message } = index);
			}

			const modelMessage = this.store.getters['messagesModel/getById'](message.id);
			if (Type.isNil(modelMessage?.id))
			{
				return;
			}

			const messageHelper = MessageHelper.createById(message.id);
			if (messageHelper.isVote)
			{
				return;
			}

			if (messageHelper.isForward)
			{
				await this.#resendForwardMessage(index, modelMessage);

				return;
			}

			if (messageHelper.getComponentId() === MessageComponent.contact)
			{
				await this.#resendContactMessage(index, modelMessage);

				return;
			}

			if (messageHelper.isWithFile)
			{
				await this.#resendMessageWithFiles(modelMessage);

				return;
			}

			if (Type.isPlainObject(message.stickerParams))
			{
				await this.#resendStickerMessage(index, modelMessage);

				return;
			}

			await this.#resendTextMessage(index, modelMessage);
		}

		/**
		 * @desc Set recent item new message
		 * @param {string|number} messageId
		 * @return {Promise}
		 */
		async setRecentNewMessage(messageId)
		{
			if (Type.isNumber(messageId))
			{
				return Promise.resolve(true);
			}

			const helper = this.dialogHelper;
			if (helper?.isComment || helper?.isTaskComment)
			{
				return Promise.resolve(true);
			}

			const dialogId = this.dialogId;
			const recentModel = this.store.getters['recentModel/getById'](dialogId);
			const messageModel = this.store.getters['messagesModel/getById'](messageId);

			if (!recentModel && Type.isUndefined(messageModel.id))
			{
				return Promise.resolve(true);
			}

			const recentMessageUpdater = new RecentMessageUpdater({
				dialogId: this.dialogId,
				recentItem: recentModel,
			});

			return recentMessageUpdater.updateByMessageId(messageId, this.#isManualSend);
		}

		/**
		 * @param {SendMessageParams} sendMessageParams
		 * @param {{shouldFinishTextFieldActions: boolean, shouldFinishReplyOnly?: boolean}} options
		 * @return {Promise<void>}
		 */
		async #sendMessage(sendMessageParams, options)
		{
			const isCopilotAnimatedScroll = Feature.isCopilotAnimatedScrollSupported && this.dialogHelper?.isCopilotDirect;
			const shouldScrollFirstOwnMessage = this.#shouldScrollFirstOwnMessage(sendMessageParams);

			if (!isCopilotAnimatedScroll && this.#shouldGoToBottomMessageContext())
			{
				await this.contextManager.goToBottomMessageContext();
			}

			this.#sendMessageToModel(sendMessageParams)
				.then(async () => {
					if (options.shouldFinishTextFieldActions)
					{
						this.#cancelReplyHandler();
						this.draftManager.clearDraft();
					}
					else if (options.shouldFinishReplyOnly)
					{
						this.#cancelReplyHandler();
					}

					if (!isCopilotAnimatedScroll)
					{
						await this.view.scrollToBottomSmoothly();
					}
					else if (shouldScrollFirstOwnMessage)
					{
						this.view.scrollLastMessageToTop(true);
					}
					await this.#sendMessageToServer(sendMessageParams);
					AppRatingClient.increaseSendMessageCounter(this.dialogHelper?.isCopilot);
				})
				.catch((error) => logger.error('sendMessage.error', error))
			;
		}

		/**
		 * @return {boolean}
		 */
		#shouldGoToBottomMessageContext()
		{
			const messageRenderer = this.messageRenderer;
			if (!messageRenderer || !Type.isArrayFilled(messageRenderer.messageList))
			{
				return true;
			}

			const dialog = this.store.getters['dialoguesModel/getById'](this.dialogId);

			return dialog?.hasNextPage === true;
		}

		/**
		 * @param {SendMessageParams} sendMessageParams
		 * @return {boolean}
		 */
		#shouldScrollFirstOwnMessage(sendMessageParams)
		{
			const chatWasEmpty = !Type.isArrayFilled(this.store.getters['messagesModel/getByChatId'](this.chatId));
			const isMessageFromCurrentUser = sendMessageParams.message.authorId === serviceLocator.get('core').getUserId();

			return chatWasEmpty && isMessageFromCurrentUser;
		}

		/**
		 * @param {SendMessageParams} sendMessageParams
		 * @return {Promise<void>}
		 */
		async #sendMessageToAnotherDialog(sendMessageParams)
		{
			try
			{
				await this.#sendMessageToModel(sendMessageParams);
				await this.#sendMessageToServer(sendMessageParams);
				AppRatingClient.increaseSendMessageCounter(this.dialogHelper?.isCopilot);
			}
			catch (error)
			{
				logger.error('sendMessageToAnotherDialog.error', error);
			}
		}

		/**
		 * @private
		 */
		#cancelReplyHandler()
		{
			if (this.replyManager.isEditInProcess)
			{
				this.replyManager.finishEditingMessage();

				return;
			}

			if (this.replyManager.isQuoteInProcess)
			{
				this.replyManager.finishQuotingMessage();
			}

			if (this.replyManager.isForwardInProcess)
			{
				this.replyManager.finishForwardingMessage();
			}
		}

		/**
		 * @param {string} text
		 * @param {StickerParams} [stickerParams]
		 * @param [promptCode]
		 * @return {SendMessageParams}
		 */
		#prepareMessageToSend({
			text = '',
			stickerParams = null,
			promptCode = null,
			contact = null,
			dialogId = this.dialogId,
		})
		{
			const forwardingMessages = [];

			const messageUuid = Uuid.getV4();
			const messageBuilder = new OutgoingMessageBuilder(dialogId, messageUuid);

			const requestParams = {
				dialogId,
				text,
				templateId: messageUuid,
			};

			if (promptCode)
			{
				requestParams.copilot = { promptCode };
			}

			const copilotParams = this.#buildCopilotParams(requestParams.copilot);
			if (copilotParams)
			{
				requestParams.copilot = copilotParams;
			}

			if (Type.isStringFilled(text))
			{
				// eslint-disable-next-line no-param-reassign
				text = text.trim();

				messageBuilder.addProperty('text', text);
			}

			if (Type.isPlainObject(stickerParams))
			{
				requestParams.stickerParams = stickerParams;
				messageBuilder.addProperty('stickerParams', stickerParams);
				messageBuilder.addParam('STICKER_PARAMS', stickerParams);
			}

			if (Type.isPlainObject(contact))
			{
				requestParams.contact = messageBuilder.addContact(contact);
			}

			if (this.replyManager.isQuoteInProcess)
			{
				const quoteMessage = this.replyManager.getQuoteMessage();
				const quoteMessageId = Number(quoteMessage.id);
				requestParams.replyId = quoteMessageId;
				messageBuilder.addParam('replyId', quoteMessageId);
			}

			if (this.replyManager.isForwardInProcess)
			{
				const forwardMessageIds = this.replyManager.getForwardMessageIds(); // need to forward message to the same chat
				if (Type.isArrayFilled(forwardMessageIds))
				{
					requestParams.forwardIds = {};
				}

				for (const id of forwardMessageIds)
				{
					const forwardingMessageBuilder = new ForwardingMessageBuilder(id, dialogId);

					requestParams.forwardIds[forwardingMessageBuilder.getTemplateId()] = forwardingMessageBuilder.getOriginalId();
					forwardingMessages.push(forwardingMessageBuilder.getMessageState());
				}

				if (this.replyManager.isQuoteInBackground) // TODO future scenario
				{
					const quoteMessage = this.replyManager.getQuoteMessage();
					const quoteMessageId = Number(quoteMessage.id);
					requestParams.replyId = quoteMessageId;
					messageBuilder.addParam('replyId', quoteMessageId);
				}
			}

			return {
				message: messageBuilder.getMessageState(),
				forwardingMessages,
				requestParams,
			};
		}

		/**
		 * @param {Object|null} currentCopilot
		 * @return {Object|null}
		 */
		#buildCopilotParams(currentCopilot = null)
		{
			const manager = this.assistantButtonManager;
			if (!manager)
			{
				return currentCopilot;
			}

			const copilot = { ...(currentCopilot ?? {}) };

			if (manager.isReasoningActive)
			{
				copilot.reasoning = 'Y';
			}

			if (manager.isSearchModeActive)
			{
				copilot.forceSearch = 'Y';
			}

			if (manager.isAgentModeActive)
			{
				copilot.agentMode = 'Y';
			}

			if (Type.isInteger(manager.mcpSelectedAuthId))
			{
				copilot.mcpAuthId = manager.mcpSelectedAuthId;
			}

			return Object.keys(copilot).length > 0 ? copilot : null;
		}

		/**
		 * @param {SendMessageParams} sendMessageParams
		 * @return {Promise<void>}
		 */
		async #sendMessageToModel(sendMessageParams)
		{
			const {
				message,
				forwardingMessages,
			} = sendMessageParams;

			await this.#sendSameMessageToModel(message);

			if (Type.isArrayFilled(forwardingMessages))
			{
				const addForwardMessagePromiseCollection = [];
				for (const forwardingMessage of forwardingMessages)
				{
					addForwardMessagePromiseCollection.push(
						this.store.dispatch('messagesModel/add', forwardingMessage),
					);
				}
				await Promise.all(addForwardMessagePromiseCollection);
			}
		}

		/**
		 * @param {MessagesModelState} message
		 * @return {Promise<any>}
		 */
		// eslint-disable-next-line consistent-return
		async #sendSameMessageToModel(message)
		{
			if (Type.isStringFilled(message.text)) // check when forward without comment message
			{
				return this.store.dispatch('messagesModel/add', message);
			}

			if (Type.isPlainObject(message.stickerParams))
			{
				return this.store.dispatch('messagesModel/add', message);
			}
		}

		/**
		 * @private
		 * @param {SendMessageParams} sendMessageParams
		 * @return {Promise}
		 */
		async #sendMessageToServer(sendMessageParams)
		{
			logger.log(
				`${this.constructor.name}.sendMessageToServer`,
				createSendMessageParamsForLog(sendMessageParams),
			);
			let id = 0;

			try
			{
				const sendPromise = this.sendQueuePromise
					.then(() => {
						return MessageRest.send(sendMessageParams.requestParams);
					});

				this.sendQueuePromise = sendPromise.catch(() => {});
				const response = await sendPromise;
				logger.log(`${this.constructor.name}.sendMessageToServer response`, response);

				if (response.id) // check when forward without comment message
				{
					id = response.id;
					await this.store.dispatch('messagesModel/updateWithId', {
						id: sendMessageParams.message.templateId,
						fields: {
							id: response.id,
							templateId: sendMessageParams.message.templateId,
							error: false,
						},
					});
				}

				if (Type.isPlainObject(response.uuidMap))
				{
					for await (const [uuid, messageId] of Object.entries(response.uuidMap))
					{
						id = messageId;
						await this.store.dispatch('messagesModel/updateWithId', {
							id: uuid,
							fields: {
								id: messageId,
								templateId: uuid,
								error: false,
							},
						});
					}
				}

				const failedForwardMessages = getFailedForwardMessages(
					sendMessageParams.forwardingMessages,
					response.failureMap,
				);
				if (!id && Type.isArrayFilled(failedForwardMessages))
				{
					id = failedForwardMessages[0].templateId;
				}
				for (const failedForwardMessage of failedForwardMessages)
				{
					const code = ErrorCode[failedForwardMessage.code] || 0;
					await this.store.dispatch('messagesModel/update', {
						id: failedForwardMessage.templateId,
						fields: {
							error: true,
							errorReason: code,
						},
					});
				}
			}
			catch (response)
			{
				logger.warn(`${this.constructor.name}.sendMessageToServer catch`, response);
				id = sendMessageParams.message.templateId;

				const code = ErrorCode[response?.[0]?.code] || 0;
				await this.store.dispatch('messagesModel/update', {
					id: sendMessageParams.message.templateId,
					fields: {
						error: true,
						errorReason: code,
					},
				});

				if (Type.isArrayFilled(sendMessageParams.forwardingMessages))
				{
					const updateForwardMessagePromiseCollection = [];
					for (const forwardingMessage of sendMessageParams.forwardingMessages)
					{
						updateForwardMessagePromiseCollection.push(
							this.store.dispatch('messagesModel/update', {
								id: forwardingMessage.templateId,
								fields: {
									error: true,
									errorReason: code,
								},
							}),
						);
					}
					await Promise.all(updateForwardMessagePromiseCollection);
				}
			}
			finally
			{
				await this.setRecentNewMessage(id);
			}
		}

		/**
		 * @desc Resend all break messages from current chat ( if three days wait is expired )
		 */
		async #resendMessages()
		{
			let resolveResend = Promise.resolve();
			// eslint-disable-next-line no-unused-vars
			let rejectResend = Promise.reject();
			const resendPromise = new Promise((resolve, reject) => {
				resolveResend = resolve;
				rejectResend = reject;
			});

			this.resendQueuePromise = this.resendQueuePromise
				.then(() => {
					const resendInternalPromise = this.#resendInternal();

					return resendInternalPromise
						.then(() => {
							logger.log(`${this.constructor.name}.resendInternal: complete`);

							resolveResend();
						})
						.catch((error) => {
							logger.log(`${this.constructor.name}.resendInternal error:`, error);

							// eslint-disable-next-line promise/no-return-wrap
							return Promise.resolve();
						})
					;
				})
			;

			await resendPromise;
		}

		async #resendInternal()
		{
			const breakMessages = this.store.getters['messagesModel/getBreakMessages'](this.chatId);
			logger.info(
				`${this.constructor.name}.resendMessages`,
				breakMessages.map((message) => createMessageMetadataForLog(message)),
			);

			for (const message of breakMessages)
			{
				if (this.#isManualSend(message))
				{
					continue;
				}

				const bottomMessage = this.view.getBottomMessage();
				const isBottomMessage = bottomMessage.id === message.id;

				// eslint-disable-next-line no-await-in-loop
				await this.resendMessage(Number(!isBottomMessage), message);
			}
		}

		/**
		 * @desc Resend break message
		 * @param {number | {message: Message, index: null}} index
		 * @param {MessagesModelState} rawMessage
		 * @private
		 */
		async #resendTextMessage(index, rawMessage)
		{
			const { message, messageIndex } = this.#prepareResendingParams(index, rawMessage);

			logger.log(
				`${this.constructor.name}.resendMessage`,
				messageIndex,
				createMessageMetadataForLog(message),
			);
			const modelMessage = this.store.getters['messagesModel/getById'](message.id);
			const messageToSend = {
				dialogId: this.dialogId,
				text: modelMessage.text,
				messageType: 'self',
				templateId: message.id,
			};

			const replyId = modelMessage.params?.replyId;
			if (Number.isInteger(replyId) && replyId > 0)
			{
				messageToSend.replyId = replyId;
			}

			const copilotParams = this.#buildCopilotParams();
			if (copilotParams)
			{
				messageToSend.copilot = copilotParams;
			}

			if (messageIndex > 0)
			{
				await this.#rerenderResendingMessage(message.id, modelMessage);
			}
			await this.#markMessageAsSending(message.id);

			return this.#sendMessageToServer({
				requestParams: messageToSend,
				message: modelMessage,
			});
		}

		/**
		 * @param {number | {message: Message, index: null}} index
		 * @param {MessagesModelState} rawMessage
		 * @return {Promise<void>}
		 */
		async #resendStickerMessage(index, rawMessage)
		{
			const { message, messageIndex } = this.#prepareResendingParams(index, rawMessage);

			logger.log(
				`${this.constructor.name}.resendMessage`,
				messageIndex,
				createMessageMetadataForLog(message),
			);
			const modelMessage = this.store.getters['messagesModel/getById'](message.id);
			const messageToSend = {
				dialogId: this.dialogId,
				messageType: 'self',
				templateId: message.id,
				stickerParams: modelMessage.stickerParams,
			};

			const replyId = modelMessage.params?.replyId;
			if (Number.isInteger(replyId) && replyId > 0)
			{
				messageToSend.replyId = replyId;
			}

			if (messageIndex > 0)
			{
				await this.#rerenderResendingMessage(message.id, modelMessage);
			}
			await this.#markMessageAsSending(message.id);

			return this.#sendMessageToServer({
				requestParams: messageToSend,
				message: modelMessage,
			});
		}

		async #resendContactMessage(index, rawMessage)
		{
			const { message, messageIndex } = this.#prepareResendingParams(index, rawMessage);
			const modelMessage = this.store.getters['messagesModel/getById'](message.id);
			const params = modelMessage.params?.COMPONENT_PARAMS ?? {};
			const photo = this.store.getters['filesModel/getListByMessageId'](message.id)?.find(
				(file) => file.type === FileType.image,
			);
			const contact = {
				...(params.firstName ? { firstName: params.firstName } : {}),
				...(params.lastName ? { lastName: params.lastName } : {}),
				phones: params.phones ?? [],
				...(photo?.id ? { photoId: photo.id } : {}),
			};
			const replyId = modelMessage.params?.replyId;

			if (messageIndex > 0)
			{
				await this.#rerenderResendingMessage(message.id, modelMessage);
			}
			await this.#markMessageAsSending(message.id);

			return this.#sendMessageToServer({
				requestParams: {
					dialogId: this.dialogId,
					templateId: message.id,
					contact,
					...(Number.isInteger(replyId) && replyId > 0 ? { replyId } : {}),
				},
				message: modelMessage,
			});
		}

		/**
		 * @param {MessagesModelState} message
		 */
		async #resendMessageWithFiles(message)
		{
			const filesModelList = this.store.getters['filesModel/getListByMessageId'](message.id);

			if (!Type.isArrayFilled(filesModelList))
			{
				return Promise.resolve(true);
			}

			const fileList = filesModelList.map((file) => {
				const sizeParams = {
					width: file.image?.width ?? 0,
					height: file.image?.height ?? 0,
					previewWidth: file.image?.width ?? 0,
					previewHeight: file.image?.height ?? 0,
				};

				return {
					id: file.id,
					previewUrl: file.urlPreview,
					url: file.localUrl,
					type: file.type || FileType.file,
					name: file.name,
					isVideoNote: file.isVideoNote,
					isVoiceNote: file.isVoiceNote,
					isTranscribable: file.isTranscribable,
					...sizeParams,
				};
			});

			return this.sendingService.resendMessageWithFiles({
				dialogId: this.dialogId,
				temporaryMessageId: message.id,
				fileList,
			});
		}

		/**
		 * @desc Resend break message
		 * @param {number | {message: Message, index: null}} index
		 * @param {MessagesModelState} rawMessage
		 * @private
		 */
		async #resendForwardMessage(index, rawMessage)
		{
			const {
				message,
				messageIndex,
				forwardIds,
				forwardingMessages,
			} = this.#prepareResendingParams(index, rawMessage);

			logger.log(
				`${this.constructor.name}.resendMessage`,
				messageIndex,
				createMessageMetadataForLog(message),
			);
			const modelMessage = this.store.getters['messagesModel/getById'](message.id);
			const messageToSend = {
				dialogId: this.dialogId,
				messageType: 'self',
				templateId: message.id,
				forwardIds,
			};

			if (messageIndex > 0)
			{
				await this.#rerenderResendingMessage(message.id, modelMessage);
			}
			await this.#markMessageAsSending(message.id);

			return this.#sendMessageToServer({
				requestParams: messageToSend,
				message: modelMessage,
				forwardingMessages,
			});
		}

		/**
		 * @param {number | {message: Message, index: null}} index
		 * @param {MessagesModelState} message
		 * @return {{message, messageIndex: number}}
		 */
		#prepareResendingParams(index, message)
		{
			let messageIndex = 0;
			if (Type.isObject(index)) // when the method is called from an event with MessengerEmitter
			{
				// eslint-disable-next-line no-param-reassign
				({ message } = index);
				const bottomMessage = this.view.getBottomMessage();
				if (message.id !== bottomMessage.id)
				{
					messageIndex = 1;
				}
			}
			else
			{
				messageIndex = index;
			}

			const forwardIds = {};
			const forwardingMessages = [];
			if (message.forward?.id)
			{
				forwardIds[message.templateId] = message.forward.id.split('/')[1];
				forwardingMessages.push(message);
			}

			return {
				message,
				messageIndex,
				forwardIds,
				forwardingMessages,
			};
		}

		/**
		 * @param {MessageId} messageId
		 * @param {MessagesModelState} modelMessage
		 * @return {Promise<void>}
		 */
		async #rerenderResendingMessage(messageId, modelMessage)
		{
			await this.messageRenderer.delete([messageId]);
			await this.messageRenderer.render([modelMessage]);
			await this.view.scrollToBottomSmoothly();
		}

		async #markMessageAsSending(messageId)
		{
			await this.store.dispatch('messagesModel/update', {
				id: messageId,
				fields: {
					error: false,
					errorReason: OwnMessageStatus.sending,
				},
			});
		}

		#isManualSend = (message) => {
			return this.#isWaitSendExpired(message.date)
				|| message.errorReason === 0
				|| message.errorReason === ErrorCode.INTERNAL_SERVER_ERROR
			;
		};

		/**
		 * @desc Check is expired 3 days after sending
		 * @param {object} dateMessageSend
		 * @return {boolean}
		 */
		#isWaitSendExpired(dateMessageSend)
		{
			const dateSend = Type.isDate(dateMessageSend) ? dateMessageSend : new Date();
			const dateThreeDayAgo = new Date();
			dateThreeDayAgo.setDate(dateThreeDayAgo.getDate() - 3);

			return dateSend.getTime() < dateThreeDayAgo.getTime();
		}
	}

	module.exports = {
		MessageSender,
		createMessageMetadataForLog,
		createSendMessageParamsForLog,
	};
});
