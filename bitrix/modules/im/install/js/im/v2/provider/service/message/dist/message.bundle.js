/* eslint-disable */
this.BX = this.BX || {};
this.BX.Messenger = this.BX.Messenger || {};
this.BX.Messenger.v2 = this.BX.Messenger.v2 || {};
(function (exports, im_v2_application_core, im_v2_lib_rest, im_v2_lib_user, im_v2_lib_logger, im_v2_const, im_v2_lib_copilot, im_v2_lib_analytics, im_v2_lib_notifier, main_core, main_core_events, im_v2_lib_utils, im_v2_lib_permission) {
	'use strict';

	/**
	 * The number of the last context load asked for in a chat, by chat id. A context load replaces the
	 * whole collection of its chat and cannot be called back, so the collection belongs to the context
	 * asked for LAST and not to the one the network happened to answer first.
	 *
	 * It is kept beside the class and not inside an instance because the sides asking for a context of
	 * one chat do not share a service: the dialog holds one, the send path builds its own to move the
	 * chat to its end, and each of them would otherwise count only its own loads. What the count belongs
	 * to is the chat whose collection is being replaced - one integer per chat opened in the session.
	 */
	const lastContextLoadRequest = new Map();
	class LoadService {
		static MESSAGE_REQUEST_LIMIT = 25;
		#store;
		#chatId;
		#userManager;
		#preparedHistoryMessages = [];
		#preparedUnreadMessages = [];
		#isLoading = false;
		#contextLoadsInFlight = 0;
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

		/**
		 * The answer replaces the whole message collection, and the request behind it cannot be called
		 * back. Two things therefore decide whether an answer is still wanted, and they are asked at the
		 * same point - between the answer and the collection, where an answer refused changes nothing at
		 * all and the list stays where the caller left it.
		 *
		 * The first belongs to the load itself and is asked of every caller alike: a context overtaken by
		 * a LATER context of the same chat is not the one the user asked for, whoever asked for either of
		 * them - a jump by date, a message sent while it was loading, a scroll to the end of the chat.
		 * Nobody has to pass anything for it, which is the point: an answer that has stopped being the
		 * last one asked for must not reach the collection even when the caller never thought about it.
		 *
		 * The second is `isActual`, and it says something the count cannot: the caller has moved on to
		 * something newer of ITS own, which is not always a load - a jump to a message already in the
		 * collection only scrolls, and leaves the count exactly where it was while making the context
		 * still on its way unwanted. Left out, every answer that is still the last one requested is
		 * applied, which is the behaviour of a single load.
		 */
		loadContext(messageId, options = {}) {
			const {
				isActual = () => true
			} = options;
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
			this.#contextLoadsInFlight++;
			this.#isLoading = true;
			const requestNumber = this.#numberContextLoadRequest();
			return im_v2_lib_rest.callBatch(query).then(data => {
				im_v2_lib_logger.Logger.warn('MessageService: loadContext result', data);
				const isLastRequested = requestNumber === lastContextLoadRequest.get(this.#chatId);
				if (!isLastRequested || !isActual()) {
					im_v2_lib_logger.Logger.warn('MessageService: loadContext for', messageId, 'is not wanted any more');
					return null;
				}
				return this.#handleLoadedMessages(data[im_v2_const.RestMethod.imV2ChatMessageGetContext]);
			}).catch(error => {
				this.#sendAnalytics(error);
				im_v2_lib_notifier.Notifier.message.handleLoadContextError(error);
				console.error('MessageService: loadContext error:', error);
			}).finally(() => {
				this.#contextLoadsInFlight--;
				// the loading is over for the pagination only once the LAST context is in: a context
				// still on its way replaces the whole collection when it lands, and a page loaded
				// into the meantime would be built on a list about to be thrown away
				this.#isLoading = this.#contextLoadsInFlight > 0;
			});
		}
		#numberContextLoadRequest() {
			const requestNumber = (lastContextLoadRequest.get(this.#chatId) ?? 0) + 1;
			lastContextLoadRequest.set(this.#chatId, requestNumber);
			return requestNumber;
		}
		async loadContextByChatId(chatId) {
			const queryParams = {
				data: {
					commentChatId: chatId
				}
			};
			const requestNumber = this.#numberContextLoadRequest();
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
			// the same collection and the same rule: the identifier of the post is answered back either
			// way, so the caller can go to it, but the context of a chat overtaken by a later one does
			// not get to replace the list on the way there
			if (requestNumber === lastContextLoadRequest.get(this.#chatId)) {
				void this.#handleLoadedMessages(result);
			}
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

	// the edit has no target any more: the message is deleted, the chat is gone or the author is out of it
	const EDIT_TARGET_GONE_CODES = new Set([im_v2_const.ErrorCode.message.notFound, im_v2_const.ErrorCode.message.accessDenied, im_v2_const.ErrorCode.chat.notFound, im_v2_const.ErrorCode.chat.accessDenied]);

	// a refusal on a saved message: rolling the model back would take away a published composition
	const APPLIED_DESPITE_ERROR_CODES = new Set([im_v2_const.ErrorCode.message.filesMismatch]);

	// mirrors FilesUpdater::EMPTY_COMPOSITION of the server, which owns this form of the field
	const EMPTY_COMPOSITION = '[]';
	class EditService {
		#attemptCountByMessageId = new Map();
		#chainByMessageId = new Map();
		async editMessageText(messageId, newText) {
			const attempt = this.#registerAttempt(messageId);
			im_v2_lib_logger.Logger.warn('MessageService: editMessageText', attempt.attemptId, newText);
			const message = this.#getMessage(messageId);
			if (!message) {
				return this.#buildResult(attempt, {
					success: false,
					textBeforeEdit: '',
					isEditedBeforeEdit: false
				});
			}
			this.#startAttempt(messageId, message);
			const isEditedAfterUpdate = this.#updateMessageModel(messageId, newText);
			const payload = {
				data: {
					id: messageId,
					fields: {
						message: newText
					}
				}
			};
			try {
				await im_v2_lib_rest.runAction(im_v2_const.RestMethod.imV2ChatMessageUpdate, payload);
			} catch (errors) {
				// the snapshot is read when the answer comes, not when the attempt starts: an attempt
				// of the same chain may have been accepted meanwhile and moved the base forward
				const snapshot = this.#getSnapshot(messageId);
				this.#finishAttempt(messageId);
				return this.#buildResult(attempt, {
					success: false,
					...snapshot,
					reason: errors?.[0]
				});
			}
			const snapshot = this.#getSnapshot(messageId);
			// the server accepted this text, so it is what the attempts still in flight roll back to
			this.#finishAttempt(messageId, {
				textBeforeEdit: newText,
				isEditedBeforeEdit: isEditedAfterUpdate
			});
			return this.#buildResult(attempt, {
				success: true,
				...snapshot
			});
		}

		/**
		 * Saves the composition of an already sent message along with its text - one save for both. The server
		 * takes the composition as a full replacement, and the answer tells the caller what became of the edit.
		 *
		 * The save of a composition keeps a snapshot of its own and does not join the chain of text attempts:
		 * the chain rolls a refused text back, while a refused composition rolls back both halves at once.
		 */
		async editMessageFiles(messageId, params) {
			const {
				fileIds,
				text
			} = params;
			im_v2_lib_logger.Logger.warn('MessageService: editMessageFiles', messageId, fileIds, text);
			const message = this.#getMessage(messageId);
			if (!message) {
				// the message left the model while the batch was uploading: there is nothing to save into
				this.#showEditError();
				return {
					saved: false,
					isApplied: false,
					isEditTargetGone: true
				};
			}
			const snapshot = {
				files: [...message.files],
				text: message.text
			};
			const nextComposition = {
				files: fileIds,
				text
			};

			// an emptied composition of a message without text is a deletion: written to the model as it stands, it
			// would show a deleted message before the server has answered, so this one save leaves the model alone
			const isModelWritten = !this.#emptiesMessage(nextComposition);
			if (isModelWritten) {
				this.#applyComposition(messageId, nextComposition);
			}
			try {
				await im_v2_lib_rest.runAction(im_v2_const.RestMethod.imV2ChatMessageUpdate, {
					data: {
						id: messageId,
						fields: {
							fileId: this.#serializeComposition(fileIds),
							message: text
						}
					}
				});
			} catch (errors) {
				const [error] = errors;
				return this.#handleRefusedComposition({
					messageId,
					error,
					snapshot: isModelWritten ? snapshot : null
				});
			}
			return {
				saved: true,
				isApplied: true,
				isEditTargetGone: false
			};
		}
		rollbackMessage(messageId, text, isEdited) {
			im_v2_lib_logger.Logger.warn('MessageService: rollbackMessage', messageId);
			im_v2_application_core.Core.getStore().dispatch('messages/update', {
				id: messageId,
				fields: {
					text,
					isEdited
				}
			});
		}
		#handleRefusedComposition(params) {
			const {
				messageId,
				error,
				snapshot
			} = params;
			const code = String(error?.code ?? '');
			const isApplied = APPLIED_DESPITE_ERROR_CODES.has(code);
			im_v2_lib_logger.Logger.error('MessageService: editMessageFiles error:', error);

			// a refusal that came back on a saved message keeps its composition: the server has published it already
			if (snapshot && !isApplied) {
				this.#applyComposition(messageId, snapshot);
			}
			this.#showEditError(error);
			return {
				saved: false,
				isApplied,
				isEditTargetGone: EDIT_TARGET_GONE_CODES.has(code)
			};
		}
		#emptiesMessage(composition) {
			return composition.files.length === 0 && composition.text === '';
		}

		/**
		 * An emptied composition travels as a list spelled out, not as an empty array. A form carries no empty list:
		 * the request is built by walking the keys of a value, and an empty array has none, so the field itself
		 * would not reach the server - and a request without the field means "the composition was not touched".
		 * The empty string is not the form to use: the server refuses it on purpose, because that is what a broken
		 * client sends by accident, and read as an emptied composition it would delete a message left without text.
		 */
		#serializeComposition(fileIds) {
			return fileIds.length > 0 ? fileIds : EMPTY_COMPOSITION;
		}
		#applyComposition(messageId, composition) {
			im_v2_application_core.Core.getStore().dispatch('messages/update', {
				id: messageId,
				fields: composition
			});
		}

		// the attempts of one message share a single snapshot: a later attempt starts on top of the
		// optimistic text of an earlier one, so its own view of "the text before the edit" is a value
		// the server never held. The shared snapshot lives while at least one attempt is in flight
		#startAttempt(messageId, message) {
			const chain = this.#chainByMessageId.get(messageId);
			if (chain) {
				chain.attemptsInFlight += 1;
				return chain.snapshot;
			}
			const snapshot = {
				textBeforeEdit: message.text,
				isEditedBeforeEdit: message.isEdited
			};
			this.#chainByMessageId.set(messageId, {
				snapshot,
				attemptsInFlight: 1
			});
			return snapshot;
		}
		#getSnapshot(messageId) {
			return this.#chainByMessageId.get(messageId)?.snapshot ?? {
				textBeforeEdit: '',
				isEditedBeforeEdit: false
			};
		}
		#finishAttempt(messageId, confirmed = null) {
			const chain = this.#chainByMessageId.get(messageId);
			if (!chain) {
				return;
			}
			chain.attemptsInFlight -= 1;
			if (chain.attemptsInFlight <= 0) {
				this.#chainByMessageId.delete(messageId);
				return;
			}
			if (confirmed) {
				chain.snapshot = confirmed;
			}
		}
		#registerAttempt(messageId) {
			const attemptNumber = (this.#attemptCountByMessageId.get(messageId) ?? 0) + 1;
			this.#attemptCountByMessageId.set(messageId, attemptNumber);
			return {
				messageId,
				attemptNumber,
				attemptId: `${messageId}:${attemptNumber}`
			};
		}
		#buildResult(attempt, result) {
			const {
				messageId,
				attemptNumber
			} = attempt;
			return {
				success: result.success,
				textBeforeEdit: result.textBeforeEdit,
				isEditedBeforeEdit: result.isEditedBeforeEdit,
				reason: result.reason ?? null,
				isLatestAttempt: this.#attemptCountByMessageId.get(messageId) === attemptNumber
			};
		}

		// every refusal carries its own phrase, and it names the file to remove. The content of a notification is
		// rendered as html, and nothing on the way promises the text from the server is free of markup
		#showEditError(error = null) {
			if (error?.message) {
				im_v2_lib_notifier.Notifier.file.showValidationError(main_core.Text.encode(error.message));
				return;
			}
			im_v2_lib_notifier.Notifier.onDefaultError();
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
			return isEdited;
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

	// How long a voice message waits for a transcription result before the wait is called off (Q-3 of
	// the feature). The result is delivered by a fire-once pull event from a queue the messenger does
	// not control, so a lost or endlessly delayed one would leave the spinner running forever.
	const TRANSCRIPTION_WATCHDOG_TIMEOUT = 5 * 60 * 1000;
	const TRANSCRIPTION_TIMEOUT_ERROR_CODE = 'TRANSCRIPTION_TIMEOUT';

	// the timers stand beside the service and not inside a player: a watchdog kept by the component
	// showing the wait measures how long that component stayed mounted, and a message scrolled out of
	// the list would start its five minutes over on every return to the screen
	const watchdogTimers = new Map();
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
			this.#armWatchdog(fileId);
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
		#armWatchdog(fileId) {
			clearTimeout(watchdogTimers.get(fileId));
			const timerId = setTimeout(() => this.#giveUpWaiting(fileId, timerId), TRANSCRIPTION_WATCHDOG_TIMEOUT);
			watchdogTimers.set(fileId, timerId);
		}

		// a result reaches the model from this request, from a pull event or from another chat the record
		// was forwarded to, so the timer asks the model on its own instead of being called off from each
		// of those places
		#giveUpWaiting(fileId, timerId) {
			if (watchdogTimers.get(fileId) !== timerId) {
				return;
			}
			watchdogTimers.delete(fileId);
			if (this.#store.getters['files/getTranscription'](fileId)?.status !== im_v2_const.TranscriptionStatus.PENDING) {
				return;
			}

			// playback is untouched: only the transcription state turns into an explicit error
			void this.#store.dispatch('files/setTranscription', {
				fileId,
				status: im_v2_const.TranscriptionStatus.ERROR,
				transcriptText: null,
				errorCode: TRANSCRIPTION_TIMEOUT_ERROR_CODE
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
		loadContext(messageId, options = {}) {
			return this.#loadService.loadContext(messageId, options);
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
			return this.#editService.editMessageText(messageId, text);
		}
		rollbackMessage(messageId, text, isEdited) {
			this.#editService.rollbackMessage(messageId, text, isEdited);
		}
		editMessageFiles(messageId, params) {
			return this.#editService.editMessageFiles(messageId, params);
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

})(this.BX.Messenger.v2.Service = this.BX.Messenger.v2.Service || {}, BX.Messenger.v2.Application, BX.Messenger.v2.Lib, BX.Messenger.v2.Lib, BX.Messenger.v2.Lib, BX.Messenger.v2.Const, BX.Messenger.v2.Lib, BX.Messenger.v2.Lib, BX.Messenger.v2.Lib, BX, BX.Event, BX.Messenger.v2.Lib, BX.Messenger.v2.Lib);
//# sourceMappingURL=message.bundle.js.map
