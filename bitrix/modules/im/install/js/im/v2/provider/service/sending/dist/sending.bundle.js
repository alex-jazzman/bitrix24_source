/* eslint-disable */
this.BX = this.BX || {};
this.BX.Messenger = this.BX.Messenger || {};
this.BX.Messenger.v2 = this.BX.Messenger.v2 || {};
(function (exports, main_core, main_core_events, ui_pageContext, im_v2_application_core, im_v2_const, im_v2_lib_logger, im_v2_lib_rest, im_v2_lib_utils, im_v2_provider_service_message) {
	'use strict';

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
			this.#sendScrollEvent({
				force: true,
				dialogId: message.dialogId
			});
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
			const sortForwardIds = [...forwardIds].sort();
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
			this.#sendScrollEvent({
				force: true,
				dialogId: message.dialogId
			});
		}
		async #sendAndProcessMessage(message) {
			const sendResult = await this.#sendMessageToServer(message).catch(errors => {
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
		#sendMessageToServer(message) {
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
				fields.copilot = message.copilot;
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
				uuidMap
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
			const chat = this.#getDialogByChatId(message.chatId);
			const isForward = this.#store.getters['messages/isForward'](messageId);
			const userId = isForward ? message.forward.userId : message.authorId;
			const chatType = isForward ? message.forward.chatType : chat.type;
			let chatTitle = isForward ? message.forward.chatTitle : chat.name;
			if (chatType === im_v2_const.ChatType.channel) {
				chatTitle = null;
			}
			return {
				id: this.#buildForwardContextId(message.chatId, messageId),
				userId,
				chatType,
				chatTitle
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
				this.#handleForwardMessageResponse({
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
			}
			return Promise.resolve();
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
			const mcpAuthId = store.getters['copilot/chats/getMcpAuth'](dialogId)?.id;
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
			if (mcpAuthId) {
				copilot.mcpAuthId = mcpAuthId;
			}
			copilot.pageContext = ui_pageContext.PageContext.getAll();
			return {
				copilot
			};
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

})(this.BX.Messenger.v2.Service = this.BX.Messenger.v2.Service || {}, BX, BX.Event, BX.UI.PageContext, BX.Messenger.v2.Application, BX.Messenger.v2.Const, BX.Messenger.v2.Lib, BX.Messenger.v2.Lib, BX.Messenger.v2.Lib, BX.Messenger.v2.Service);
//# sourceMappingURL=sending.bundle.js.map
