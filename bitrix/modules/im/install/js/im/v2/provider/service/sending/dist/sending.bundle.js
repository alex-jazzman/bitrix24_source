/* eslint-disable */
this.BX = this.BX || {};
this.BX.Messenger = this.BX.Messenger || {};
this.BX.Messenger.v2 = this.BX.Messenger.v2 || {};
(function (exports, main_core, main_core_events, ui_pageContext, im_v2_application_core, im_v2_const, im_v2_lib_feature, im_v2_lib_logger, im_v2_lib_rest, im_v2_lib_utils, im_v2_provider_service_message) {
	'use strict';

	/**
	 * Mirrors the canonical scroll-pin policy (im.v2.component.dialog.chat/scroll-pin-policy).
	 * Kept here inline because the sending service cannot import the dialog.chat extension
	 * without creating a dependency cycle (dialog.chat -> entity-selector -> sending).
	 */
	function isQuestionPinApplicable(dialogId) {
		if (!im_v2_lib_feature.FeatureManager.isFeatureAvailable(im_v2_lib_feature.Feature.isBitrixGptScrollPinAvailable) || !im_v2_lib_feature.FeatureManager.isFeatureAvailable(im_v2_lib_feature.Feature.isBitrixGptV2Available)) {
			return false;
		}
		const dialog = im_v2_application_core.Core.getStore().getters['chats/get'](dialogId, true);
		return dialog?.type === im_v2_const.ChatType.copilot;
	}

	/**
	 * Starts pinning of a just-sent question for applicable chats (EVENT-01).
	 * Returns whether the pin event was emitted, so callers can fall back to the
	 * legacy scroll-to-bottom for non-applicable chats.
	 *
	 * Contract: only genuine send/retry paths call this. A future answer-regeneration
	 * method must NOT emit pinQuestion — a regenerated answer is not a question.
	 */
	function emitQuestionPin(params) {
		const {
			dialogId,
			messageId
		} = params;
		if (!isQuestionPinApplicable(dialogId)) {
			return false;
		}
		main_core_events.EventEmitter.emit(im_v2_const.EventType.dialog.pinQuestion, {
			dialogId,
			messageId
		});
		return true;
	}

	const EXTENSION_NAME = 'im.v2.provider.service.sending.forward';
	class LazyForwardOperation {
		#options;
		#operation = null;
		#loadingPromise = null;
		constructor(options) {
			this.#options = options;
		}
		async run() {
			const operation = await this.#getOperation();
			return operation.run();
		}
		async retry() {
			const operation = await this.#getOperation();
			return operation.retry();
		}
		canRetry() {
			return this.#operation?.canRetry() ?? false;
		}
		async #getOperation() {
			if (this.#operation) {
				return this.#operation;
			}
			this.#loadingPromise ??= main_core.Runtime.loadExtension(EXTENSION_NAME).then(({
				ForwardOperation
			}) => {
				return new ForwardOperation(this.#options);
			});
			try {
				this.#operation = await this.#loadingPromise;
			} catch (error) {
				this.#loadingPromise = null;
				throw error;
			}
			return this.#operation;
		}
	}

	// upper bound for the copilot MCP selection to reach the ready status before a send leaves for the
	// server: the only thing waited for here is a write of the selection still in flight, which takes
	// hundreds of milliseconds, since the chat data is always in before a send is possible at all. The
	// one case that runs to the timeout is a server reporting no selection whatsoever, so the shorter
	// the bound, the sooner such a message goes out
	const MCP_SELECTION_READY_TIMEOUT = 2000;
	class SendingService {
		#store;
		static instance = null;
		static getInstance() {
			if (!this.instance) {
				this.instance = new this();
			}
			return this.instance;
		}
		constructor() {
			this.#store = im_v2_application_core.Core.getStore();
		}
		async sendMessage(params) {
			const {
				text = ''
			} = params;
			if (!main_core.Type.isStringFilled(text)) {
				return;
			}
			im_v2_lib_logger.Logger.warn('SendingService: sendMessage', params);
			const message = this.#prepareMessage(params);
			void this.#processMessageSending(message);
		}
		async sendMessageWithFiles(params) {
			const {
				text = '',
				fileIds = []
			} = params;
			if (!main_core.Type.isStringFilled(text) && !main_core.Type.isArrayFilled(fileIds)) {
				return Promise.resolve();
			}
			im_v2_lib_logger.Logger.warn('SendingService: sendMessage with files', params);
			const message = this.#prepareMessageWithFiles(params);
			await this.#handlePagination(message.dialogId);
			await this.#addLoadingMessage(message);
			await this.#addMessageToRecent(message);
			await this.#clearLastMessageViews(message.dialogId);
			this.#emitSendScroll(message.dialogId, message.temporaryId);
			return Promise.resolve();
		}
		async sendMessageWithSticker(params) {
			const {
				stickerParams
			} = params;
			if (!main_core.Type.isPlainObject(stickerParams)) {
				return;
			}
			im_v2_lib_logger.Logger.warn('SendingService: sendMessage with sticker', params);
			const message = this.#prepareMessageWithSticker(params);
			void this.#processMessageSending(message);
		}
		async forwardMessages(params) {
			const {
				forwardIds,
				dialogId,
				text
			} = params;
			if (!main_core.Type.isArrayFilled(forwardIds)) {
				return Promise.resolve();
			}
			im_v2_lib_logger.Logger.warn('SendingService: forwardMessages', params);
			await this.#handlePagination(dialogId);
			let commentMessage = null;
			if (main_core.Type.isStringFilled(text)) {
				commentMessage = this.#prepareMessage(params);
				await this.#addMessageToModels(commentMessage);
			}
			const sortForwardIds = [...forwardIds].sort((firstId, secondId) => firstId - secondId);
			const forwardUuidMap = this.#getForwardUuidMap(sortForwardIds);
			const forwardedMessages = this.#prepareForwardMessages(params, forwardUuidMap);
			await this.#addForwardsToModels(forwardedMessages);
			this.#sendScrollEvent({
				force: true,
				dialogId
			});
			return this.#sendForwardRequest({
				forwardUuidMap,
				commentMessage,
				dialogId
			});
		}
		createForwardOperation(params) {
			return new LazyForwardOperation({
				operationId: im_v2_lib_utils.Utils.text.getUuidV4(),
				messageIds: params.forwardIds,
				recipientDialogIds: params.recipientDialogIds,
				uuidFactory: () => im_v2_lib_utils.Utils.text.getUuidV4(),
				deliver: (dialogId, forwardUuidMap) => {
					return this.#sendForwardDelivery(dialogId, forwardUuidMap);
				},
				getRecipientTitle: dialogId => this.#getDialog(dialogId)?.name ?? dialogId
			});
		}
		async retrySendMessage(params) {
			const {
				tempMessageId,
				dialogId
			} = params;
			const unsentMessage = this.#store.getters['messages/getById'](tempMessageId);
			if (!unsentMessage) {
				return Promise.resolve();
			}
			this.#removeMessageError(tempMessageId);
			const message = this.#prepareMessage({
				text: unsentMessage.text,
				dialogId,
				tempMessageId: unsentMessage.id,
				replyId: unsentMessage.replyId
			});
			if (main_core.Type.isStringFilled(unsentMessage.forward.id)) {
				const [, forwardId] = unsentMessage.forward.id.split('/');
				const forwardUuidMap = {
					[unsentMessage.id]: forwardId
				};
				return this.#sendForwardRequest({
					forwardUuidMap,
					dialogId
				});
			}

			// AC-018: retrying a question re-pins it (applicable chats only); other
			// chats keep the prior behaviour of not emitting a scroll event on retry.
			emitQuestionPin({
				dialogId,
				messageId: message.temporaryId
			});
			return this.#sendAndProcessMessage(message);
		}
		async sendCopilotPrompt(copilotPromptMessageParams) {
			const {
				text = ''
			} = copilotPromptMessageParams;
			if (!main_core.Type.isStringFilled(text)) {
				return Promise.resolve();
			}
			im_v2_lib_logger.Logger.warn('SendingService: sendCopilotPrompt', copilotPromptMessageParams);
			const message = this.#prepareCopilotPromptMessage(copilotPromptMessageParams);
			return this.#processMessageSending(message);
		}
		async #addLoadingMessage(message) {
			return this.#store.dispatch('messages/addLoadingMessage', {
				message
			});
		}
		async #processMessageSending(message) {
			await this.#handleAddingMessageToModels(message);
			return this.#sendAndProcessMessage(message);
		}
		async #handleAddingMessageToModels(message) {
			await this.#handlePagination(message.dialogId);
			await this.#addMessageToModels(message);
			this.#emitSendScroll(message.dialogId, message.temporaryId);
		}
		async #sendAndProcessMessage(message) {
			const mcpAuthId = await this.#resolveConfirmedMcpAuthId(message.dialogId);
			const sendResult = await this.#sendMessageToServer(message, mcpAuthId).catch(errors => {
				this.#updateMessageError(message.temporaryId);
				this.#logSendErrors(errors, 'sendAndProcessMessage');
			});
			im_v2_lib_logger.Logger.warn('SendingService: sendAndProcessMessage result -', sendResult);
			const {
				id
			} = sendResult;
			if (!id) {
				return Promise.resolve();
			}
			this.#updateModels({
				oldId: message.temporaryId,
				newId: id,
				dialogId: message.dialogId
			});
			return Promise.resolve();
		}
		#prepareCustomFields(dialogId, temporaryId) {
			const customsFieldsSources = main_core_events.EventEmitter.emit(im_v2_const.EventType.sending.onBeforeAddMessageToModel, {
				temporaryId,
				dialogId
			});
			let customFields = {};
			for (const source of customsFieldsSources) {
				if (main_core.Type.isPlainObject(source)) {
					customFields = {
						...customFields,
						...source
					};
				}
			}
			return customFields;
		}
		#prepareMessage(params) {
			const {
				text,
				tempMessageId,
				dialogId,
				replyId,
				forwardIds
			} = params;
			const defaultFields = {
				authorId: im_v2_application_core.Core.getUserId(),
				unread: false,
				sending: true
			};
			const copilotParams = this.#prepareCopilotMessageParams(dialogId);
			const aiAssistantParams = this.#prepareAiAssistantMessageParams(dialogId);
			const customFields = this.#prepareCustomFields(dialogId, tempMessageId);
			return {
				text,
				dialogId,
				chatId: this.#getDialog(dialogId).chatId,
				temporaryId: tempMessageId ?? im_v2_lib_utils.Utils.text.getUuidV4(),
				replyId,
				forwardIds,
				viewedByOthers: this.#needToSetAsViewed(dialogId),
				...copilotParams,
				...aiAssistantParams,
				...defaultFields,
				...customFields
			};
		}
		#prepareMessageWithFiles(params) {
			const {
				fileIds
			} = params;
			if (!main_core.Type.isArrayFilled(fileIds)) {
				throw new Error('SendingService: sendMessageWithFile: no fileId provided');
			}
			return {
				...this.#prepareMessage(params),
				params: {
					FILE_ID: fileIds
				}
			};
		}
		#prepareMessageWithSticker(params) {
			const {
				stickerParams
			} = params;
			if (!main_core.Type.isPlainObject(stickerParams)) {
				throw new TypeError('SendingService: sendMessageWithSticker: no stickerParams provided');
			}
			return {
				...this.#prepareMessage(params),
				stickerParams
			};
		}
		#prepareCopilotPromptMessage(promptMessageParams) {
			const promptCode = promptMessageParams.copilot?.promptCode;
			if (!promptCode) {
				throw new Error('SendingService: preparePrompt: no code provided');
			}
			const preparedMessage = this.#prepareMessage(promptMessageParams);
			return {
				...preparedMessage,
				copilot: {
					...preparedMessage.copilot,
					promptCode
				}
			};
		}
		async #handlePagination(dialogId) {
			if (!this.#getDialog(dialogId).hasNextPage) {
				return Promise.resolve();
			}
			im_v2_lib_logger.Logger.warn('SendingService: sendMessage: there are unread pages, move to chat end');
			const messageService = new im_v2_provider_service_message.MessageService({
				chatId: this.#getDialog(dialogId).chatId
			});
			await messageService.loadContext(this.#getDialog(dialogId).lastMessageId);
			this.#sendScrollEvent({
				dialogId
			});
			return Promise.resolve();
		}
		#addMessageToModels(message) {
			this.#addMessageToRecent(message);
			const hasMessageSticker = main_core.Type.isPlainObject(message.stickerParams);
			if (hasMessageSticker) {
				void this.#store.dispatch('stickers/recent/update', message.stickerParams);
				void this.#store.dispatch('stickers/messages/set', [{
					messageId: message.temporaryId,
					...message.stickerParams
				}]);
			}
			void this.#clearLastMessageViews(message.dialogId);
			return this.#store.dispatch('messages/add', message);
		}
		#addMessageToRecent(message) {
			const hasMessageText = main_core.Type.isStringFilled(message.text);
			const hasMessageFile = main_core.Type.isArrayFilled(message.params?.FILE_ID);
			const hasMessageSticker = main_core.Type.isPlainObject(message.stickerParams);
			if (hasMessageText || hasMessageFile || hasMessageSticker) {
				void this.#store.dispatch('recent/update', {
					dialogId: message.dialogId,
					fields: {
						messageId: message.temporaryId
					}
				});
			}
		}
		#sendMessageToServer(message, mcpAuthId = null) {
			const fields = {};
			if (message.replyId) {
				fields.replyId = message.replyId;
			}
			if (message.forwardIds) {
				fields.forwardIds = message.forwardIds;
			}
			if (message.text) {
				fields.message = message.text;
				fields.templateId = message.temporaryId;
			}
			if (message.copilot) {
				fields.copilot = mcpAuthId ? {
					...message.copilot,
					mcpAuthId
				} : message.copilot;
			}
			if (message.aiAssistant) {
				fields.aiAssistant = message.aiAssistant;
			}
			if (message.stickerParams) {
				// todo: this is temp fix. We need to figure it out, why templateId is set only for text messages (see above)
				fields.templateId = message.temporaryId;
				fields.stickerParams = message.stickerParams;
			}
			const queryData = {
				dialogId: message.dialogId.toString(),
				fields
			};
			return im_v2_lib_rest.runAction(im_v2_const.RestMethod.imV2ChatMessageSend, {
				data: queryData
			});
		}
		#updateModels(params) {
			const {
				oldId,
				newId,
				dialogId
			} = params;
			void this.#store.dispatch('messages/updateWithId', {
				id: oldId,
				fields: {
					id: newId
				}
			});
			void this.#store.dispatch('messages/builder/updateWithId', {
				oldId,
				newId
			});
			void this.#store.dispatch('chats/update', {
				dialogId,
				fields: {
					lastId: newId,
					lastMessageId: newId
				}
			});
			void this.#store.dispatch('recent/update', {
				dialogId,
				fields: {
					messageId: newId
				}
			});
			const isSticker = this.#store.getters['stickers/messages/isSticker'](oldId);
			if (isSticker) {
				void this.#store.dispatch('stickers/messages/updateWithId', {
					oldId,
					newId
				});
			}
		}
		#updateMessageError(messageId) {
			void this.#store.dispatch('messages/update', {
				id: messageId,
				fields: {
					error: true
				}
			});
		}
		#removeMessageError(messageId) {
			void this.#store.dispatch('messages/update', {
				id: messageId,
				fields: {
					sending: true,
					error: false
				}
			});
		}
		#sendScrollEvent(params = {}) {
			const {
				force = false,
				dialogId
			} = params;
			main_core_events.EventEmitter.emit(im_v2_const.EventType.dialog.scrollToBottom, {
				chatId: this.#getDialog(dialogId).chatId,
				threshold: force ? im_v2_const.DialogScrollThreshold.none : im_v2_const.DialogScrollThreshold.halfScreenUp
			});
		}

		// Pin the just-sent question for applicable chats, otherwise fall back to the
		// legacy force scroll-to-bottom. The question keeps its own scroll behaviour.
		#emitSendScroll(dialogId, messageId) {
			if (emitQuestionPin({
				dialogId,
				messageId
			})) {
				return;
			}
			this.#sendScrollEvent({
				force: true,
				dialogId
			});
		}
		#getDialog(dialogId) {
			return this.#store.getters['chats/get'](dialogId, true);
		}
		#getDialogByChatId(chatId) {
			return this.#store.getters['chats/getByChatId'](chatId, true);
		}
		#needToSetAsViewed(dialogId) {
			return this.#store.getters['users/bots/isNetwork'](dialogId);
		}
		#handleForwardMessageResponse(params) {
			const {
				response,
				dialogId,
				commentMessage
			} = params;
			const {
				id,
				uuidMap = {},
				failureMap = {}
			} = response;
			if (id) {
				this.#updateModels({
					oldId: commentMessage.temporaryId,
					newId: id,
					dialogId
				});
			}
			Object.entries(uuidMap).forEach(([uuid, messageId]) => {
				this.#updateModels({
					oldId: uuid,
					newId: messageId,
					dialogId
				});
			});
			Object.keys(failureMap).forEach(uuid => {
				this.#updateMessageError(uuid);
			});
			return Object.keys(failureMap).length === 0;
		}
		#handleForwardMessageError({
			commentMessage,
			forwardUuidMap
		}) {
			if (commentMessage) {
				void this.#store.dispatch('messages/update', {
					id: commentMessage.temporaryId,
					fields: {
						error: true
					}
				});
			}
			Object.keys(forwardUuidMap).forEach(uuid => {
				void this.#store.dispatch('messages/update', {
					id: uuid,
					fields: {
						error: true
					}
				});
			});
		}
		#sendForwardDelivery(dialogId, forwardUuidMap) {
			const requestParams = this.#prepareSendForwardRequest({
				forwardUuidMap,
				commentMessage: null,
				dialogId
			});
			return this.#sendMessageToServer(requestParams);
		}
		#prepareForwardMessages(params, forwardUuidMap) {
			const {
				forwardIds,
				dialogId
			} = params;
			if (forwardIds.length === 0) {
				return [];
			}
			const preparedMessages = [];
			Object.entries(forwardUuidMap).forEach(([uuid, messageId]) => {
				const message = this.#store.getters['messages/getById'](messageId);
				if (!message) {
					return;
				}
				const prepared = {
					...this.#prepareMessage({
						dialogId,
						text: message.text,
						tempMessageId: uuid,
						replyId: message.replyId
					}),
					forward: this.#prepareForwardParams(messageId),
					attach: message.attach,
					isDeleted: message.isDeleted,
					files: message.files
				};
				const isSticker = this.#store.getters['stickers/messages/isSticker'](messageId);
				if (isSticker) {
					prepared.stickerParams = this.#store.getters['stickers/messages/getStickerByMessageId'](messageId);
				}
				this.#copyBuilderBlocks(messageId, uuid);
				preparedMessages.push(prepared);
			});
			return preparedMessages;
		}
		#copyBuilderBlocks(sourceMessageId, targetMessageId) {
			const originalBlocks = this.#store.getters['messages/builder/getBlocks'](sourceMessageId);
			if (!main_core.Type.isArrayFilled(originalBlocks)) {
				return;
			}
			const originalParams = this.#store.getters['messages/builder/getParams'](sourceMessageId);
			void this.#store.dispatch('messages/builder/set', {
				id: targetMessageId,
				block: {
					config: originalParams,
					elements: originalBlocks
				}
			});
		}
		#prepareForwardParams(messageId) {
			const message = this.#store.getters['messages/getById'](messageId);
			const isForward = this.#store.getters['messages/isForward'](messageId);
			// a fragment forwarded on keeps the context of its first source, so it is carried over
			const source = isForward ? message.forward : this.#describeForwardSource(this.#getDialogByChatId(message.chatId));
			return {
				id: this.#buildForwardContextId(message.chatId, messageId),
				userId: isForward ? message.forward.userId : message.authorId,
				chatType: source.chatType,
				chatTitle: source.chatType === im_v2_const.ChatType.channel ? null : source.chatTitle ?? null,
				parentChatId: source.parentChatId ?? 0,
				parentMessageId: source.parentMessageId ?? 0,
				parentChatType: source.parentChatType ?? null
			};
		}

		/**
		 * A discussion is named by its parent chat rather than by itself, and the server resolves that
		 * name only when the feed is read. Taking the whole context from the store leaves the caption of
		 * the optimistic message the one the answer brings, instead of letting it change twice.
		 */
		#describeForwardSource(chat) {
			if (chat.type !== im_v2_const.ChatType.comment) {
				return {
					chatType: chat.type,
					chatTitle: chat.name,
					parentChatId: 0,
					parentMessageId: 0,
					parentChatType: null
				};
			}

			// No confirmed state is asked of the parent, unlike the reader path in im.v2.provider.pull: the
			// block is optimistic, it is built for the author, whose access the forward itself has proved,
			// and never reaches the server. Requiring inited here would only make the caption change twice.
			const parentChat = this.#store.getters['chats/getByChatId'](chat.parentChatId);
			return {
				chatType: chat.type,
				chatTitle: main_core.Type.isStringFilled(parentChat?.name) ? parentChat.name : null,
				parentChatId: chat.parentChatId,
				parentMessageId: this.#store.getters['messages/comments/getMessageIdByChatId'](chat.chatId) ?? 0,
				parentChatType: parentChat?.type ?? null
			};
		}
		#prepareSendForwardRequest(params) {
			const {
				dialogId,
				forwardUuidMap,
				commentMessage
			} = params;
			const requestPrams = {
				dialogId,
				forwardIds: forwardUuidMap
			};
			if (commentMessage) {
				requestPrams.text = commentMessage.text;
				requestPrams.temporaryId = commentMessage.temporaryId;
			}
			return requestPrams;
		}
		#addForwardsToModels(forwardedMessages) {
			const addPromises = [];
			forwardedMessages.forEach(message => {
				addPromises.push(this.#addMessageToModels(message));
			});
			return Promise.all(addPromises);
		}
		#getForwardUuidMap(forwardIds) {
			const uuidMap = {};
			forwardIds.forEach(id => {
				uuidMap[im_v2_lib_utils.Utils.text.getUuidV4()] = id;
			});
			return uuidMap;
		}
		#buildForwardContextId(chatId, messageId) {
			const dialogId = this.#getDialogByChatId(chatId).dialogId;
			if (dialogId.startsWith(im_v2_const.DialogIdChatPrefix)) {
				return `${dialogId}/${messageId}`;
			}
			const currentUser = im_v2_application_core.Core.getUserId();
			return `${dialogId}:${currentUser}/${messageId}`;
		}
		#logSendErrors(errors, methodName) {
			errors.forEach(error => {
				console.error(`SendingService: ${methodName} error: code: ${error.code} message: ${error.message}`);
			});
		}
		#clearLastMessageViews(dialogId) {
			return this.#store.dispatch('chats/clearLastMessageViews', {
				dialogId
			});
		}
		async #sendForwardRequest({
			forwardUuidMap,
			commentMessage,
			dialogId
		}) {
			try {
				const requestParams = this.#prepareSendForwardRequest({
					forwardUuidMap,
					commentMessage,
					dialogId
				});
				const response = await this.#sendMessageToServer(requestParams);
				im_v2_lib_logger.Logger.warn('SendingService: forwardMessage result -', response);
				return this.#handleForwardMessageResponse({
					response,
					dialogId,
					commentMessage
				});
			} catch (errors) {
				this.#handleForwardMessageError({
					commentMessage,
					forwardUuidMap
				});
				this.#logSendErrors(errors, 'forwardMessage');
				return false;
			}
		}
		#prepareCopilotMessageParams(dialogId) {
			const isAiAssistantChat = this.#getDialog(dialogId).type === im_v2_const.ChatType.copilot;
			if (!isAiAssistantChat) {
				return {};
			}
			const store = im_v2_application_core.Core.getStore();
			const isReasoningEnabled = store.getters['copilot/chats/isReasoningEnabled'](dialogId);
			const isForceSearchEnabled = store.getters['copilot/chats/isForceSearchEnabled'](dialogId);
			const isAgentModeEnabled = store.getters['copilot/chats/isAgentModeEnabled'](dialogId);
			const copilot = {};
			if (isReasoningEnabled) {
				copilot.reasoning = 'Y';
			}
			if (isForceSearchEnabled) {
				copilot.forceSearch = 'Y';
			}
			if (isAgentModeEnabled) {
				copilot.agentMode = 'Y';
			}
			copilot.pageContext = ui_pageContext.PageContext.getAll();
			return {
				copilot
			};
		}
		#getConfirmedMcpAuthId(dialogId) {
			const mcpAuth = this.#store.getters['copilot/chats/getMcpAuth'](dialogId);
			if (!mcpAuth?.id) {
				return null;
			}
			if (!im_v2_lib_feature.FeatureManager.isFeatureAvailable(im_v2_lib_feature.Feature.isAiAssistantMcpSelectionRestoreAvailable)) {
				return mcpAuth.id;
			}
			return this.#isMcpAuthConfirmedByServer(dialogId) ? mcpAuth.id : null;
		}
		#isMcpAuthConfirmedByServer(dialogId) {
			return Boolean(this.#store.getters['copilot/chats/isMcpAuthConfirmed'](dialogId));
		}

		// ALG-01: the confirmed selection is an asynchronous value - in a copilot chat under the restore
		// flag it arrives once the selection has settled and comes back empty if it never does. The
		// message is therefore prepared and shown without it, and only the request waits for it
		async #resolveConfirmedMcpAuthId(dialogId) {
			if (this.#isMcpSelectionGateActive(dialogId)) {
				await this.#waitForMcpSelectionReady(dialogId);
			}
			return this.#getConfirmedMcpAuthId(dialogId);
		}
		#isMcpSelectionGateActive(dialogId) {
			if (!im_v2_lib_feature.FeatureManager.isFeatureAvailable(im_v2_lib_feature.Feature.isAiAssistantMcpSelectionRestoreAvailable)) {
				return false;
			}
			return this.#getDialog(dialogId).type === im_v2_const.ChatType.copilot;
		}

		// the wait never blocks the send: on timeout the selection goes to the error status and the
		// message leaves without MCP, which the chip reports
		#waitForMcpSelectionReady(dialogId) {
			const readStatus = () => this.#store.getters['copilot/chats/getMcpSelectionStatus'](dialogId);
			// only a selection being written is worth waiting for: a settled one (ready, error or
			// unavailable) is the answer already, so a failed selection does not delay the next send
			if (readStatus() !== im_v2_const.CopilotMcpSelectionStatus.restoring) {
				return Promise.resolve();
			}
			return new Promise(resolve => {
				let unwatch = null;
				let timeoutId = null;
				const settle = () => {
					clearTimeout(timeoutId);
					unwatch?.();
					resolve();
				};
				unwatch = this.#store.watch(readStatus, status => {
					if (status !== im_v2_const.CopilotMcpSelectionStatus.restoring) {
						settle();
					}
				});

				// the selection never settled: the message leaves without MCP. The chip reports a failure
				// only once the chat data is in: a chat still waiting for its data has nothing that failed
				// yet, so its chip keeps loading until the data arrives
				timeoutId = setTimeout(() => {
					if (this.#store.getters['copilot/chats/isMcpSelectionLoaded'](dialogId)) {
						void this.#store.dispatch('copilot/chats/setMcpSelectionStatus', {
							dialogId,
							status: im_v2_const.CopilotMcpSelectionStatus.error
						});
					}
					settle();
				}, MCP_SELECTION_READY_TIMEOUT);
			});
		}
		#prepareAiAssistantMessageParams(dialogId) {
			const isAiAssistant = im_v2_application_core.Core.getStore().getters['users/bots/isAiAssistant'](dialogId);
			if (!isAiAssistant) {
				return {};
			}
			const mcpAuthId = im_v2_application_core.Core.getStore().getters['aiAssistant/getMcpAuthId'];
			if (!mcpAuthId) {
				return {};
			}
			return {
				aiAssistant: {
					mcpAuthId
				}
			};
		}
	}

	exports.SendingService = SendingService;

})(this.BX.Messenger.v2.Service = this.BX.Messenger.v2.Service || {}, BX, BX.Event, BX.UI.PageContext, BX.Messenger.v2.Application, BX.Messenger.v2.Const, BX.Messenger.v2.Lib, BX.Messenger.v2.Lib, BX.Messenger.v2.Lib, BX.Messenger.v2.Lib, BX.Messenger.v2.Service);
//# sourceMappingURL=sending.bundle.js.map
