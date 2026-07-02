/* eslint-disable */
this.BX = this.BX || {};
this.BX.Messenger = this.BX.Messenger || {};
this.BX.Messenger.v2 = this.BX.Messenger.v2 || {};
(function (exports, im_v2_application_core, im_v2_lib_rest, im_v2_lib_user, im_v2_lib_logger, im_v2_const, im_v2_lib_copilot, im_v2_lib_analytics, im_v2_lib_notifier, main_core_events, im_v2_lib_utils, im_v2_lib_permission) {
	'use strict';

	class LoadService {
		static MESSAGE_REQUEST_LIMIT = 25;
		#store;
		#chatId;
		#userManager;
		#preparedHistoryMessages = [];
		#preparedUnreadMessages = [];
		#isLoading = false;
		constructor(chatId) {
			this.#store = im_v2_application_core.Core.getStore();
			this.#userManager = new im_v2_lib_user.UserManager();
			this.#chatId = chatId;
		}
		async loadUnread() {
			if (this.#isLoading || !this.#getDialog().hasNextPage) {
				return Promise.resolve(false);
			}
			im_v2_lib_logger.Logger.warn('MessageService: loadUnread');
			const lastUnreadMessageId = this.#store.getters['messages/getLastId'](this.#chatId);
			if (!lastUnreadMessageId) {
				im_v2_lib_logger.Logger.warn('MessageService: no lastUnreadMessageId, cant load unread');
				return Promise.resolve(false);
			}
			this.#isLoading = true;
			const query = {
				chatId: this.#chatId,
				filter: {
					lastId: lastUnreadMessageId
				},
				order: {
					id: 'ASC'
				},
				limit: LoadService.MESSAGE_REQUEST_LIMIT
			};
			const result = await im_v2_lib_rest.runAction(im_v2_const.RestMethod.imV2ChatMessageTail, {
				data: query
			}).catch(error => {
				console.error('MessageService: loadUnread error:', error);
				this.#isLoading = false;
			});
			im_v2_lib_logger.Logger.warn('MessageService: loadUnread result', result);
			this.#preparedUnreadMessages = result.messages;
			const rawData = {
				...result,
				tariffRestrictions: this.#prepareTariffRestrictions(result.tariffRestrictions)
			};
			await this.#updateModels(rawData);
			this.#isLoading = false;
			return Promise.resolve();
		}
		async loadHistory() {
			if (this.#isLoading || !this.#getDialog().hasPrevPage) {
				return Promise.resolve(false);
			}
			im_v2_lib_logger.Logger.warn('MessageService: loadHistory');
			const lastHistoryMessageId = this.#store.getters['messages/getFirstId'](this.#chatId);
			if (!lastHistoryMessageId) {
				im_v2_lib_logger.Logger.warn('MessageService: no lastHistoryMessageId, cant load unread');
				return Promise.resolve();
			}
			this.#isLoading = true;
			const query = {
				chatId: this.#chatId,
				filter: {
					lastId: lastHistoryMessageId
				},
				order: {
					id: 'DESC'
				},
				limit: LoadService.MESSAGE_REQUEST_LIMIT
			};
			const result = await im_v2_lib_rest.runAction(im_v2_const.RestMethod.imV2ChatMessageTail, {
				data: query
			}).catch(error => {
				console.error('MessageService: loadHistory error:', error);
				this.#isLoading = false;
			});
			im_v2_lib_logger.Logger.warn('MessageService: loadHistory result', result);
			this.#preparedHistoryMessages = result.messages;
			const hasPrevPage = result.hasNextPage;
			const rawData = {
				...result,
				hasPrevPage,
				hasNextPage: null
			};
			await this.#updateModels(rawData);
			this.#isLoading = false;
			return Promise.resolve();
		}
		hasPreparedHistoryMessages() {
			return this.#preparedHistoryMessages.length > 0;
		}
		drawPreparedHistoryMessages() {
			if (!this.hasPreparedHistoryMessages()) {
				return Promise.resolve();
			}
			return this.#store.dispatch('messages/setChatCollection', {
				messages: this.#preparedHistoryMessages
			}).then(() => {
				this.#preparedHistoryMessages = [];
				return true;
			});
		}
		hasPreparedUnreadMessages() {
			return this.#preparedUnreadMessages.length > 0;
		}
		drawPreparedUnreadMessages() {
			if (!this.hasPreparedUnreadMessages()) {
				return Promise.resolve();
			}
			return this.#store.dispatch('messages/setChatCollection', {
				messages: this.#preparedUnreadMessages
			}).then(() => {
				this.#preparedUnreadMessages = [];
				return true;
			});
		}
		async loadFirstPage() {
			im_v2_lib_logger.Logger.warn('MessageService: loadFirstPage for: ', this.#chatId);
			this.#isLoading = true;
			const payload = {
				data: {
					chatId: this.#chatId,
					limit: LoadService.MESSAGE_REQUEST_LIMIT,
					order: {
						id: 'ASC'
					}
				}
			};
			const restResult = await im_v2_lib_rest.runAction(im_v2_const.RestMethod.imV2ChatMessageTail, payload).catch(([error]) => {
				console.error('MessageService: loadFirstPage error:', error);
				this.#isLoading = false;
				throw error;
			});
			im_v2_lib_logger.Logger.warn('MessageService: loadFirstPage result', restResult);
			await this.#handleLoadedMessages(restResult);
			await this.#store.dispatch('chats/update', {
				dialogId: this.#getDialog().dialogId,
				fields: {
					hasPrevPage: false,
					hasNextPage: restResult.hasNextPage
				}
			});
			this.#isLoading = false;
		}
		loadContext(messageId) {
			const query = {
				[im_v2_const.RestMethod.imV2ChatMessageGetContext]: {
					id: messageId,
					range: LoadService.MESSAGE_REQUEST_LIMIT
				},
				[im_v2_const.RestMethod.imV2ChatMessageRead]: {
					chatId: this.#chatId,
					ids: [messageId]
				}
			};
			im_v2_lib_logger.Logger.warn('MessageService: loadContext for: ', messageId);
			this.#isLoading = true;
			return im_v2_lib_rest.callBatch(query).then(data => {
				im_v2_lib_logger.Logger.warn('MessageService: loadContext result', data);
				return this.#handleLoadedMessages(data[im_v2_const.RestMethod.imV2ChatMessageGetContext]);
			}).catch(error => {
				this.#sendAnalytics(error);
				im_v2_lib_notifier.Notifier.message.handleLoadContextError(error);
				console.error('MessageService: loadContext error:', error);
			}).finally(() => {
				this.#isLoading = false;
			});
		}
		async loadContextByChatId(chatId) {
			const queryParams = {
				data: {
					commentChatId: chatId
				}
			};
			const result = await im_v2_lib_rest.runAction(im_v2_const.RestMethod.imV2ChatMessageGetContext, queryParams).catch(([error]) => {
				console.error('MessageService: loadContextByChatId error:', error);
				throw error;
			});
			const commentInfo = result.commentInfo;
			const targetCommentInfo = commentInfo.find(item => {
				return item.chatId === chatId;
			});
			const targetMessageId = targetCommentInfo?.messageId;
			im_v2_lib_logger.Logger.warn('MessageService: loadContextByChatId result', result);
			void this.#handleLoadedMessages(result);
			return targetMessageId;
		}
		reloadMessageList() {
			im_v2_lib_logger.Logger.warn('MessageService: loadChatOnExit for: ', this.#chatId);
			let targetMessageId = 0;
			if (this.#getDialog().chatId <= 0) {
				return;
			}
			if (this.#getDialog().markedId) {
				targetMessageId = this.#getDialog().markedId;
			} else if (this.#getDialog().savedPositionMessageId) {
				targetMessageId = this.#getDialog().savedPositionMessageId;
			}
			const wasInitedBefore = this.#getDialog().inited;
			this.#setDialogInited(false);
			if (targetMessageId) {
				void this.loadContext(targetMessageId).finally(() => {
					this.#setDialogInited(true, wasInitedBefore);
				});
			}
			void this.loadInitialMessages().finally(() => {
				this.#setDialogInited(true, wasInitedBefore);
			});
		}
		async loadInitialMessages() {
			im_v2_lib_logger.Logger.warn('MessageService: loadInitialMessages for: ', this.#chatId);
			this.#isLoading = true;
			const payload = {
				data: {
					chatId: this.#chatId,
					limit: LoadService.MESSAGE_REQUEST_LIMIT
				}
			};
			const restResult = await im_v2_lib_rest.runAction(im_v2_const.RestMethod.imV2ChatMessageList, payload).catch(([error]) => {
				console.error('MessageService: loadInitialMessages error:', error);
				this.#isLoading = false;
				throw error;
			});
			im_v2_lib_logger.Logger.warn('MessageService: loadInitialMessages result', restResult);
			restResult.messages = this.#prepareInitialMessages(restResult.messages);
			await this.#handleLoadedMessages(restResult);
			this.#isLoading = false;
			return Promise.resolve();
		}
		#prepareInitialMessages(rawMessages) {
			if (rawMessages.length === 0) {
				return rawMessages;
			}
			const lastMessageId = this.#getDialog().lastMessageId;
			const newMaxId = Math.max(...rawMessages.map(message => message.id));
			if (newMaxId >= lastMessageId) {
				return rawMessages;
			}
			const messagesCollection = this.#store.getters['messages/getByChatId'](this.#chatId);
			const additionalMessages = messagesCollection.filter(message => {
				return message.id > newMaxId;
			});
			im_v2_lib_logger.Logger.warn('MessageService: loadInitialMessages: local id is higher than server one', additionalMessages);
			return [...rawMessages, ...additionalMessages];
		}
		isLoading() {
			return this.#isLoading;
		}
		#handleLoadedMessages(restResult) {
			const {
				messages
			} = restResult;
			const messagesPromise = this.#store.dispatch('messages/setChatCollection', {
				messages,
				clearCollection: true
			});
			const updateModelsPromise = this.#updateModels(restResult);
			return Promise.all([messagesPromise, updateModelsPromise]);
		}
		#updateModels(rawData) {
			const {
				files,
				users,
				usersShort,
				reactions,
				hasPrevPage,
				hasNextPage,
				additionalMessages,
				commentInfo,
				copilot,
				tariffRestrictions,
				stickers,
				messages
			} = rawData;
			const dialogPromise = this.#store.dispatch('chats/update', {
				dialogId: this.#getDialog().dialogId,
				fields: {
					hasPrevPage,
					hasNextPage,
					tariffRestrictions
				}
			});
			const usersPromise = Promise.all([this.#userManager.setUsersToModel(users), this.#userManager.addUsersToModel(usersShort)]);
			const filesPromise = this.#store.dispatch('files/set', files);
			const reactionsPromise = this.#store.dispatch('messages/reactions/set', reactions);
			const additionalMessagesPromise = this.#store.dispatch('messages/store', additionalMessages);
			const commentInfoPromise = this.#store.dispatch('messages/comments/set', commentInfo);
			const copilotManager = new im_v2_lib_copilot.CopilotManager();
			const copilotPromise = copilotManager.handleChatLoadResponse(copilot);
			const stickersPromise = Promise.all([this.#store.dispatch('stickers/messages/set', this.#getStickerMessages(rawData)), this.#store.dispatch('stickers/set', stickers)]);
			const builderPromise = this.#store.dispatch('messages/builder/set', messages);
			return Promise.all([dialogPromise, filesPromise, usersPromise, reactionsPromise, additionalMessagesPromise, commentInfoPromise, copilotPromise, stickersPromise, builderPromise]);
		}
		#setDialogInited(flag, wasInitedBefore = true) {
			const fields = {
				inited: flag,
				loading: !flag
			};
			if (flag === true && !wasInitedBefore) {
				delete fields.inited;
			}
			this.#store.dispatch('chats/update', {
				dialogId: this.#getDialog().dialogId,
				fields
			});
		}
		#prepareTariffRestrictions(restrictions) {
			const dialogId = this.#getDialog().dialogId;
			const chat = this.#store.getters['chats/get'](dialogId);
			if (!chat) {
				return restrictions;
			}
			const {
				tariffRestrictions: {
					isHistoryLimitExceeded
				}
			} = chat;
			if (isHistoryLimitExceeded === true) {
				return {
					...restrictions,
					isHistoryLimitExceeded: true
				};
			}
			return restrictions;
		}
		#getDialog() {
			return this.#store.getters['chats/getByChatId'](this.#chatId);
		}
		#sendAnalytics(error) {
			if (error.code !== im_v2_const.ErrorCode.message.notFound) {
				return;
			}
			const chat = this.#getDialog();
			const dialogId = chat.dialogId;
			im_v2_lib_analytics.Analytics.getInstance().messageDelete.onNotFoundNotification({
				dialogId
			});
		}
		#getStickerMessages(rawData) {
			const stickerMessages = [];
			rawData.messages.forEach(message => {
				const isSticker = Boolean(message.params.STICKER_PARAMS);
				if (!isSticker) {
					return;
				}
				stickerMessages.push({
					messageId: message.id,
					...message.params.STICKER_PARAMS
				});
			});
			return stickerMessages;
		}
	}

	class PinService {
		#store;
		#restClient;
		constructor() {
			this.#store = im_v2_application_core.Core.getStore();
			this.#restClient = im_v2_application_core.Core.getRestClient();
		}
		pinMessage(chatId, messageId) {
			im_v2_lib_logger.Logger.warn(`Dialog: PinManager: pin message ${messageId}`);
			const payload = {
				chatId,
				messageId
			};
			void this.#store.dispatch('messages/pin/add', payload);
			this.#restClient.callMethod(im_v2_const.RestMethod.imV2ChatMessagePin, {
				id: messageId
			}).catch(result => {
				console.error('Dialog: PinManager: error pinning message', result.error());
				void this.#store.dispatch('messages/pin/delete', payload);
			});
		}
		unpinMessage(chatId, messageId) {
			im_v2_lib_logger.Logger.warn(`Dialog: PinManager: unpin message ${messageId}`);
			const payload = {
				chatId,
				messageId
			};
			void this.#store.dispatch('messages/pin/delete', payload);
			this.#restClient.callMethod(im_v2_const.RestMethod.imV2ChatMessageUnpin, {
				id: messageId
			}).catch(result => {
				console.error('Dialog: PinManager: error unpinning message', result.error());
				void this.#store.dispatch('messages/pin/add', payload);
			});
		}
	}

	class EditService {
		editMessageText(messageId, text) {
			im_v2_lib_logger.Logger.warn('MessageService: editMessageText', messageId, text);
			const message = this.#getMessage(messageId);
			if (!message) {
				return;
			}
			this.#updateMessageModel(messageId, text);
			const payload = {
				data: {
					id: messageId,
					fields: {
						message: text
					}
				}
			};
			im_v2_lib_rest.runAction(im_v2_const.RestMethod.imV2ChatMessageUpdate, payload).catch(([error]) => {
				console.error('MessageService: editMessageText error:', error);
			});
		}
		#updateMessageModel(messageId, text) {
			const message = this.#getMessage(messageId);
			const isEdited = message.viewedByOthers;
			im_v2_application_core.Core.getStore().dispatch('messages/update', {
				id: messageId,
				fields: {
					text,
					isEdited
				}
			});
		}
		#getMessage(messageId) {
			return im_v2_application_core.Core.getStore().getters['messages/getById'](messageId);
		}
	}

	class DeleteService {
		#store;
		#chatId;
		constructor(chatId) {
			this.#chatId = chatId;
			this.#store = im_v2_application_core.Core.getStore();
		}
		async deleteMessages(messageIds) {
			im_v2_lib_logger.Logger.warn('MessageService: deleteMessage', messageIds);
			const deleteMessageIds = [];
			messageIds.forEach(messageId => {
				if (im_v2_lib_utils.Utils.text.isUuidV4(messageId)) {
					this.#deleteTemporaryMessage(messageId);
					return;
				}
				this.#sendDeleteEvent(messageId);
				this.#updateModels(messageId);
				deleteMessageIds.push(messageId);
			});
			if (deleteMessageIds.length > 0) {
				void this.#deleteMessageOnServer(deleteMessageIds);
			}
		}
		#updateModels(messageId) {
			const message = this.#store.getters['messages/getById'](messageId);
			if (this.#canDeleteCompletely(message)) {
				void this.#completeMessageDelete(message);
				return;
			}
			void this.#shallowMessageDelete(message);
		}
		#shallowMessageDelete(message) {
			this.#store.dispatch('messages/update', {
				id: message.id,
				fields: {
					text: '',
					isDeleted: true,
					files: [],
					attach: [],
					replyId: 0
				}
			});
		}
		#canDeleteCompletely(message) {
			const chat = this.#getChat();
			const neverCompleteDeleteChats = [im_v2_const.ChatType.comment, im_v2_const.ChatType.lines];
			if (neverCompleteDeleteChats.includes(chat.type)) {
				return false;
			}
			const isMyOwnMessage = message.authorId === im_v2_application_core.Core.getUserId();
			const action = isMyOwnMessage ? im_v2_const.ActionByRole.deleteCompleteOwnMessage : im_v2_const.ActionByRole.deleteOthersMessage;
			const hasPermission = im_v2_lib_permission.PermissionManager.getInstance().canPerformActionByRole(action, chat.dialogId);
			if (hasPermission) {
				return true;
			}
			return !message.viewedByOthers;
		}
		#completeMessageDelete(message) {
			const chat = this.#getChat();
			if (message.id === chat.lastMessageId) {
				const newLastId = this.#getPreviousMessageId(message.id);
				this.#updateRecentForCompleteDelete(newLastId);
				this.#updateChatForCompleteDelete(newLastId);
			}
			this.#store.dispatch('messages/delete', {
				id: message.id
			});
		}
		#updateRecentForCompleteDelete(newLastId) {
			const chat = this.#getChat();
			if (!newLastId) {
				void this.#store.dispatch('recent/hide', {
					dialogId: chat.dialogId
				});
				return;
			}
			void this.#store.dispatch('recent/update', {
				dialogId: chat.dialogId,
				fields: {
					messageId: newLastId
				}
			});
		}
		#updateChatForCompleteDelete(newLastId) {
			const chat = this.#getChat();
			this.#store.dispatch('chats/update', {
				dialogId: chat.dialogId,
				fields: {
					lastMessageId: newLastId,
					lastId: newLastId
				}
			});
			this.#store.dispatch('chats/clearLastMessageViews', {
				dialogId: chat.dialogId
			});
		}
		#deleteMessageOnServer(messageIds) {
			return im_v2_lib_rest.runAction(im_v2_const.RestMethod.imV2ChatMessageDelete, {
				data: {
					messageIds
				}
			}).catch(error => {
				// eslint-disable-next-line no-console
				console.error('MessageService: deleteMessage error:', error);
			});
		}
		#deleteTemporaryMessage(messageId) {
			const chat = this.#getChat();
			const recentItem = this.#store.getters['recent/get'](chat.dialogId);
			if (recentItem.messageId === messageId) {
				const newLastId = this.#getPreviousMessageId(messageId);
				void this.#store.dispatch('recent/update', {
					dialogId: chat.dialogId,
					fields: {
						messageId: newLastId
					}
				});
			}
			void this.#store.dispatch('messages/delete', {
				id: messageId
			});
		}
		#getPreviousMessageId(messageId) {
			const previousMessage = this.#store.getters['messages/getPreviousMessage']({
				messageId,
				chatId: this.#chatId
			});
			return previousMessage?.id ?? 0;
		}
		#sendDeleteEvent(messageId) {
			main_core_events.EventEmitter.emit(im_v2_const.EventType.dialog.onMessageDeleted, {
				messageId
			});
		}
		#getChat() {
			return this.#store.getters['chats/getByChatId'](this.#chatId);
		}
	}

	class MarkService {
		#chatId;
		#store;
		#restClient;
		constructor(chatId) {
			this.#chatId = chatId;
			this.#store = im_v2_application_core.Core.getStore();
			this.#restClient = im_v2_application_core.Core.getRestClient();
		}
		markMessage(messageId) {
			im_v2_lib_logger.Logger.warn('MessageService: markMessage', messageId);
			const {
				dialogId
			} = this.#store.getters['chats/getByChatId'](this.#chatId);
			void this.#store.dispatch('chats/update', {
				dialogId,
				fields: {
					markedId: messageId
				}
			});
			this.#restClient.callMethod(im_v2_const.RestMethod.imV2ChatMessageMark, {
				dialogId,
				id: messageId
			}).catch(result => {
				console.error('MessageService: error marking message', result.error());
			});
		}
	}

	class FavoriteService {
		#chatId;
		#store;
		#restClient;
		constructor(chatId) {
			this.#chatId = chatId;
			this.#store = im_v2_application_core.Core.getStore();
			this.#restClient = im_v2_application_core.Core.getRestClient();
		}
		addMessageToFavorite(messageId) {
			im_v2_lib_logger.Logger.warn('MessageService: addMessageToFavorite', messageId);
			this.#restClient.callMethod(im_v2_const.RestMethod.imChatFavoriteAdd, {
				MESSAGE_ID: messageId
			}).catch(result => {
				console.error('MessageService: error adding message to favorite', result.error());
			});
			im_v2_lib_notifier.Notifier.message.onAddToFavoriteComplete();
		}
		removeMessageFromFavorite(messageId) {
			im_v2_lib_logger.Logger.warn('MessageService: removeMessageFromFavorite', messageId);
			void this.#store.dispatch('sidebar/favorites/deleteByMessageId', {
				chatId: this.#chatId,
				messageId
			});
			this.#restClient.callMethod(im_v2_const.RestMethod.imChatFavoriteDelete, {
				MESSAGE_ID: messageId
			}).catch(result => {
				console.error('MessageService: error removing message from favorite', result.error());
			});
		}
	}

	class TranscribeService {
		#store;
		constructor() {
			this.#store = im_v2_application_core.Core.getStore();
		}
		transcribe(fileId, messageId) {
			im_v2_lib_logger.Logger.warn('TranscribeService: transcribe:', fileId);
			const payload = {
				data: {
					messageId,
					fileId
				}
			};
			void this.#store.dispatch('files/setTranscription', {
				fileId,
				status: im_v2_const.TranscriptionStatus.PENDING,
				transcriptText: null,
				errorCode: null
			});
			return im_v2_lib_rest.runAction(im_v2_const.RestMethod.imV2DiskFileTranscribe, payload).then(result => {
				void this.#store.dispatch('files/setTranscription', result);
			}).catch(errors => {
				const [firstError] = errors;
				void this.#store.dispatch('files/setTranscription', {
					fileId,
					status: im_v2_const.TranscriptionStatus.ERROR,
					transcriptText: null,
					errorCode: firstError?.code
				});
				console.error('TranscribeService: transcribe error:', errors);
			});
		}
	}

	class MessageService {
		#loadService;
		#pinService;
		#editService;
		#deleteService;
		#markService;
		#favoriteService;
		#transcribeService;
		static getMessageRequestLimit() {
			return LoadService.MESSAGE_REQUEST_LIMIT;
		}
		constructor(params) {
			const {
				chatId
			} = params;
			this.#initServices(chatId);
		}
		#initServices(chatId) {
			this.#loadService = new LoadService(chatId);
			this.#editService = new EditService();
			this.#deleteService = new DeleteService(chatId);
			this.#pinService = new PinService();
			this.#markService = new MarkService(chatId);
			this.#favoriteService = new FavoriteService(chatId);
			this.#transcribeService = new TranscribeService();
		}

		// region 'pagination'
		loadUnread() {
			return this.#loadService.loadUnread();
		}
		loadHistory() {
			return this.#loadService.loadHistory();
		}
		hasPreparedHistoryMessages() {
			return this.#loadService.hasPreparedHistoryMessages();
		}
		drawPreparedHistoryMessages() {
			return this.#loadService.drawPreparedHistoryMessages();
		}
		hasPreparedUnreadMessages() {
			return this.#loadService.hasPreparedUnreadMessages();
		}
		drawPreparedUnreadMessages() {
			return this.#loadService.drawPreparedUnreadMessages();
		}
		isLoading() {
			return this.#loadService.isLoading();
		}
		// endregion 'pagination'

		// region 'context'
		loadContext(messageId) {
			return this.#loadService.loadContext(messageId);
		}
		loadContextByChatId(chatId) {
			return this.#loadService.loadContextByChatId(chatId);
		}
		loadFirstPage() {
			return this.#loadService.loadFirstPage();
		}
		// endregion 'context

		// region 'reload messages'
		reloadMessageList() {
			this.#loadService.reloadMessageList();
		}
		loadInitialMessages() {
			return this.#loadService.loadInitialMessages();
		}
		// endregion 'reload messages'

		// region 'pin'
		pinMessage(chatId, messageId) {
			this.#pinService.pinMessage(chatId, messageId);
		}
		unpinMessage(chatId, messageId) {
			this.#pinService.unpinMessage(chatId, messageId);
		}
		// endregion 'pin'

		// region 'mark'
		markMessage(messageId) {
			this.#markService.markMessage(messageId);
		}
		// endregion 'mark'

		// region 'favorite'
		addMessageToFavorite(messageId) {
			this.#favoriteService.addMessageToFavorite(messageId);
		}
		removeMessageFromFavorite(messageId) {
			this.#favoriteService.removeMessageFromFavorite(messageId);
		}
		// endregion 'favorite'

		// region 'edit'
		editMessageText(messageId, text) {
			this.#editService.editMessageText(messageId, text);
		}
		// endregion 'edit'

		// region 'delete'
		deleteMessages(messageIds) {
			this.#deleteService.deleteMessages(messageIds);
		}
		// endregion 'delete'

		// region 'transcribe'
		transcribe(fileId, messageId) {
			return this.#transcribeService.transcribe(fileId, messageId);
		}
		// endregion 'delete'
	}

	exports.MessageService = MessageService;

})(this.BX.Messenger.v2.Service = this.BX.Messenger.v2.Service || {}, BX.Messenger.v2.Application, BX.Messenger.v2.Lib, BX.Messenger.v2.Lib, BX.Messenger.v2.Lib, BX.Messenger.v2.Const, BX.Messenger.v2.Lib, BX.Messenger.v2.Lib, BX.Messenger.v2.Lib, BX.Event, BX.Messenger.v2.Lib, BX.Messenger.v2.Lib);
//# sourceMappingURL=message.bundle.js.map
