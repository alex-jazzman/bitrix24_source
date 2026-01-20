/**
 * @module im/messenger/controller/dialog/lib/message-sender
 */
jn.define('im/messenger/controller/dialog/lib/message-sender', (require, exports, module) => {
	const { Type } = require('type');
	const { Uuid } = require('utils/uuid');

	const {
		ErrorCode,
		MessageParams,
		OwnMessageStatus,
		FileType,
	} = require('im/messenger/const');
	const { ObjectUtils } = require('im/messenger/lib/utils');
	const { getLoggerWithContext } = require('im/messenger/lib/logger');
	const { DialogHelper } = require('im/messenger/lib/helper');
	const { serviceLocator } = require('im/messenger/lib/di/service-locator');

	const { MessageRest } = require('im/messenger/provider/rest');
	const { SendingService } = require('im/messenger/provider/services/sending');

	const { AppRatingClient } = require('im/messenger/controller/dialog/lib/app-rating-client');

	const logger = getLoggerWithContext('dialog--message-sender', 'MessageSender');

	const { SenderEventHandler } = require('im/messenger/controller/dialog/lib/message-sender/src/event-handler');
	const { OutgoingMessageBuilder } = require('im/messenger/controller/dialog/lib/message-sender/src/outgoing-message-builder');
	const { ForwardingMessageBuilder } = require('im/messenger/controller/dialog/lib/message-sender/src/forwarding-message-builder');
	const { RecentMessageUpdater } = require('im/messenger/controller/dialog/lib/message-sender/src/recent-message-updater');

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
			return SendingService.getInstance();
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
			if (this.replyManager.isAttachInProcess)
			{
				void this.sendFilesWithText(text);

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
				this.messageService.updateText(messageId, text, this.dialogId);
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
		 * @param {string} text
		 */
		async sendFilesWithText(text)
		{
			const files = this.replyManager.attachFiles;
			if (!Type.isArrayFilled(files))
			{
				return;
			}

			await this.sendingService.sendFiles(this.dialogId, files, text)
				.catch((error) => logger.error(`${this.constructor.name}.sendFilesWithText`, error))
			;

			this.inputActionManager.startSendingFile();
			this.replyManager.finishAttachingFiles();
			this.view.clearInput();
			this.draftManager.clearDraft(this.dialogId);
		}

		/**
		 * @param {FullStickerData} stickerParams
		 * @return {Promise<void>}
		 */
		async sendStickerMessage(stickerParams)
		{
			const sendMessageParams = this.#prepareMessageToSend({
				stickerParams,
			});

			await this.#sendMessage(sendMessageParams, {
				shouldFinishTextFieldActions: false,
			})
				.catch((error) => {
					logger.error('#sendMessage error', error);
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

			if (modelMessage.params.componentId === MessageParams.ComponentId.VoteMessage)
			{
				return;
			}

			if (Type.isArrayFilled(modelMessage.files))
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
		 * @param sendMessageParams
		 * @param {{shouldFinishTextFieldActions: boolean}} options
		 * @return {Promise<void>}
		 */
		async #sendMessage(sendMessageParams, options)
		{
			await this.contextManager.goToBottomMessageContext();

			this.#sendMessageToModel(sendMessageParams)
				.then(async () => {
					if (options.shouldFinishTextFieldActions)
					{
						this.#cancelReplyHandler();
						this.draftManager.clearDraft();
					}

					await this.view.scrollToBottomSmoothly();
					await this.#sendMessageToServer(sendMessageParams);

					AppRatingClient.increaseSendMessageCounter(this.dialogHelper?.isCopilot);
				})
				.catch((error) => logger.error('sendMessage.error', error))
			;
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
		 * @return {{message, forwardingMessages: *[], requestParams: {dialogId: *, text: string, templateId: string}}}
		 */
		#prepareMessageToSend({
			text = '',
			stickerParams = null,
			promptCode = null,
		})
		{
			const dialogId = this.dialogId;
			const forwardingMessages = [];

			const messageUuid = Uuid.getV4();
			const messageBuilder = new OutgoingMessageBuilder(this.dialogId, messageUuid);

			const requestParams = {
				dialogId,
				text,
				templateId: messageUuid,
			};

			if (promptCode)
			{
				requestParams.copilot = { promptCode };
			}

			const isReasoningActive = this.assistantButtonManager?.isReasoningActive;
			if (isReasoningActive)
			{
				const copilot = requestParams.copilot ?? {};
				requestParams.copilot = { ...copilot, reasoning: isReasoningActive };
			}

			const mcpSelectedAuthId = this.store.getters['dialoguesModel/aiAssistantModel/getMCPSelectedAuthId']();
			if (this.dialogHelper?.isAiAssistant && Type.isInteger(mcpSelectedAuthId))
			{
				requestParams.aiAssistant = { mcpAuthId: mcpSelectedAuthId };
			}

			if (Type.isStringFilled(text))
			{
				messageBuilder.addProperty('text', text);
			}

			if (Type.isPlainObject(stickerParams))
			{
				requestParams.stickerParams = stickerParams;
				messageBuilder.addProperty('stickerParams', stickerParams);
				messageBuilder.addParam('STICKER_PARAMS', stickerParams);
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
		 * @param {{message: MessagesModelState, forwardingMessages: Array<MessagesModelState>}} sendMessageParams
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
		 * @param {{message: Object, forwardingMessages: Array<Object|null>, requestParams: Object}} sendMessageParams
		 * @return {Promise}
		 */
		async #sendMessageToServer(sendMessageParams)
		{
			logger.log(`${this.constructor.name}.sendMessageToServer`, sendMessageParams);
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
			logger.info(`${this.constructor.name}.resendMessages`, breakMessages);

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

			logger.log(`${this.constructor.name}.resendMessage`, messageIndex, message);
			const modelMessage = this.store.getters['messagesModel/getById'](message.id);
			const messageToSend = {
				dialogId: this.dialogId,
				text: modelMessage.text,
				messageType: 'self',
				templateId: message.id,
			};

			const isReasoningActive = this.assistantButtonManager?.isReasoningActive;
			if (isReasoningActive)
			{
				messageToSend.copilot.reasoning = isReasoningActive;
			}

			const mcpSelectedAuthId = this.store.getters['dialoguesModel/aiAssistantModel/getMCPSelectedAuthId']();
			if (this.dialogHelper?.isAiAssistant && Type.isInteger(mcpSelectedAuthId))
			{
				messageToSend.aiAssistant = { mcpAuthId: mcpSelectedAuthId };
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

			logger.log(`${this.constructor.name}.resendMessage`, messageIndex, message);
			const modelMessage = this.store.getters['messagesModel/getById'](message.id);
			const messageToSend = {
				dialogId: this.dialogId,
				messageType: 'self',
				templateId: message.id,
				stickerParams: modelMessage.stickerParams,
			};

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

			return { message, messageIndex };
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

	module.exports = { MessageSender };
});
