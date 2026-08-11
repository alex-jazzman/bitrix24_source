/* eslint-disable */
this.BX = this.BX || {};
this.BX.Messenger = this.BX.Messenger || {};
this.BX.Messenger.v2 = this.BX.Messenger.v2 || {};
this.BX.Messenger.v2.Provider = this.BX.Messenger.v2.Provider || {};
(function (exports, im_v2_application_core, im_v2_lib_user, im_v2_lib_logger, main_core, main_core_events, im_v2_const, im_v2_lib_copilot, im_v2_lib_inputAction, im_v2_provider_service_message, im_v2_lib_analytics, im_v2_lib_notifier, im_v2_lib_channel, im_public, im_v2_lib_call, im_v2_lib_roleManager, im_v2_lib_utils, im_v2_lib_desktop, im_v2_lib_counter, main_sidepanel, im_v2_lib_slider, im_v2_lib_layout, im_v2_lib_unreadMode, im_v2_lib_messageNotifier, im_v2_lib_localStorage, im_v2_lib_uuid, im_v2_lib_promo) {
	'use strict';

	class BotPullHandler {
		#store;
		constructor() {
			this.#store = im_v2_application_core.Core.getStore();
		}
		handleBotAdd(params) {
			im_v2_lib_logger.Logger.warn('BotPullHandler: handleBotAdd', params);
			const {
				user
			} = params;
			void new im_v2_lib_user.UserManager().addUsersToModel(user);
		}
		handleBotUpdate(params) {
			const {
				user
			} = params;
			this.#store.dispatch('users/update', {
				id: user.id,
				fields: user
			});
		}
	}

	class MessageDeleteManager {
		#store;
		constructor() {
			this.#store = im_v2_application_core.Core.getStore();
		}
		deleteMessage(params) {
			this.#stopWriting(params.dialogId, params.senderId);
			void this.#store.dispatch('messages/update', {
				id: params.id,
				fields: {
					text: '',
					isDeleted: true,
					files: [],
					attach: [],
					replyId: 0
				}
			});
		}
		deleteMessageComplete(params) {
			this.#stopWriting(params.dialogId, params.senderId);
			const areChannelCommentsOpened = this.#store.getters['messages/comments/areOpenedForChannelPost'](params.id);
			if (areChannelCommentsOpened) {
				this.#closeChannelComments(params);
			}
			void this.#store.dispatch('messages/delete', {
				id: params.id
			});
			const dialogUpdateFields = this.#prepareDialogUpdateFields(params);
			void this.#store.dispatch('chats/update', {
				dialogId: params.dialogId,
				fields: dialogUpdateFields
			});
		}
		#stopWriting(dialogId, userId) {
			im_v2_lib_inputAction.InputActionListener.getInstance().stopAction({
				dialogId,
				userId
			});
		}
		#closeChannelComments(params) {
			main_core_events.EventEmitter.emit(im_v2_const.EventType.dialog.closeComments);
			im_v2_lib_analytics.Analytics.getInstance().messageDelete.onDeletedPostNotification({
				dialogId: params.dialogId
			});
			im_v2_lib_notifier.Notifier.message.onNotFoundError();
		}
		#prepareDialogUpdateFields(params) {
			const dialogUpdateFields = {};
			const lastMessageWasDeleted = Boolean(params.newLastMessage);
			if (lastMessageWasDeleted) {
				dialogUpdateFields.lastMessageId = params.newLastMessage.id;
				dialogUpdateFields.lastMessageViews = params.lastMessageViews;
				void this.#store.dispatch('messages/store', params.newLastMessage);
			}
			return dialogUpdateFields;
		}
	}

	class NewMessageManager {
		#params;
		#extra;
		constructor(params, extra = {}) {
			this.#params = params;
			this.#extra = extra;
		}
		getChatId() {
			return this.#params.chatId;
		}
		getParentChatId() {
			const chat = this.getChat();
			if (!chat) {
				return 0;
			}
			return chat.parent_chat_id;
		}
		getChat() {
			const chatId = this.getChatId();
			return this.#params.chat?.[chatId];
		}
		getChatType() {
			const chat = this.getChat();
			return chat?.type ?? '';
		}
		isUserChat() {
			return Boolean(this.getChat()) === false;
		}
		isCommentChat() {
			return this.getChatType() === im_v2_const.ChatType.comment;
		}
		isChannelChat() {
			return im_v2_lib_channel.ChannelManager.channelTypes.has(this.getChatType());
		}
		isUserInChat() {
			const chatUsers = this.#params.userInChat[this.getChatId()];
			if (!chatUsers || this.isChannelListEvent()) {
				return true;
			}
			return chatUsers.includes(im_v2_application_core.Core.getUserId());
		}
		isChannelListEvent() {
			return this.isChannelChat() && this.#extra.is_shared_event;
		}
	}

	class MessagePullHandler {
		#store;
		#messageViews = {};
		#messageDeleteManager;
		constructor() {
			this.#store = im_v2_application_core.Core.getStore();
			this.#messageDeleteManager = new MessageDeleteManager();
		}
		handleMessageAdd(params) {
			im_v2_lib_logger.Logger.warn('MessagePullHandler: handleMessageAdd', params);
			this.#setMessageChat(params);
			this.#setUsers(params.users);
			this.#setFiles(params);
			this.#setAdditionalEntities(params);
			this.#setCommentInfo(params);
			this.#setCopilotData(params);
			this.#setMessagesAutoDeleteConfig(params);
			this.#setStickers(params);
			this.#setBuilder(params.message);
			const messageWithTemplateId = this.#store.getters['messages/isInChatCollection']({
				messageId: params.message.templateId
			});
			const messageWithRealId = this.#store.getters['messages/isInChatCollection']({
				messageId: params.message.id
			});

			// update message with parsed link info
			if (messageWithRealId) {
				im_v2_lib_logger.Logger.warn('New message pull handler: we already have this message', params.message);
				void this.#store.dispatch('messages/update', {
					id: params.message.id,
					fields: {
						...params.message,
						error: false
					}
				});
				this.#sendScrollEvent(params.chatId);
			} else if (!messageWithRealId && messageWithTemplateId) {
				im_v2_lib_logger.Logger.warn('New message pull handler: we already have the TEMPORARY message', params.message);
				void this.#store.dispatch('messages/updateWithId', {
					id: params.message.templateId,
					fields: {
						...params.message,
						error: false
					}
				});
			}
			// it's an opponent message or our own message from somewhere else
			else if (!messageWithRealId && !messageWithTemplateId) {
				const hasLoadingMessage = this.#store.getters['messages/hasLoadingMessageByMessageId'](params.message.templateId);
				if (hasLoadingMessage) {
					void this.#store.dispatch('messages/delete', {
						id: params.message.templateId
					});
				}
				im_v2_lib_logger.Logger.warn('New message pull handler: we dont have this message', params.message);
				this.#handleAddingMessageToModel(params);
			}
			im_v2_lib_inputAction.InputActionListener.getInstance().stopAction({
				userId: params.message.senderId,
				dialogId: params.dialogId
			});
			this.#updateDialog(params);
		}
		handleMessageUpdate(params) {
			im_v2_lib_logger.Logger.warn('MessagePullHandler: handleMessageUpdate', params);
			im_v2_lib_inputAction.InputActionListener.getInstance().stopAction({
				userId: params.senderId,
				dialogId: params.dialogId
			});
			this.#store.dispatch('messages/update', {
				id: params.id,
				fields: {
					text: params.text,
					params: params.params
				}
			});
			this.#setBuilder(params);
			this.#sendScrollEvent(params.chatId);
		}
		handleMessageDeleteV2(params) {
			im_v2_lib_logger.Logger.warn('MessageDeletePullHandler: handleMultipleMessageDelete', params);
			const messages = params.messages;
			messages.forEach(message => {
				if (message.completelyDeleted) {
					const preparedParams = this.#prepareDeleteMessageParams(params, true, message);
					this.#messageDeleteManager.deleteMessageComplete(preparedParams);
					return;
				}
				const preparedParams = this.#prepareDeleteMessageParams(params, false, message);
				this.#messageDeleteManager.deleteMessage(preparedParams);
			});
		}
		handleMessageDelete(params) {
			im_v2_lib_logger.Logger.warn('MessageDeletePullHandler: handleMessageDelete', params);
			const preparedParams = this.#prepareDeleteMessageParams(params);
			this.#messageDeleteManager.deleteMessage(preparedParams);
		}
		handleMessageDeleteComplete(params) {
			im_v2_lib_logger.Logger.warn('MessageDeletePullHandler: handleMessageDeleteComplete', params);
			const preparedParams = this.#prepareDeleteMessageParams(params, true);
			this.#messageDeleteManager.deleteMessageComplete(preparedParams);
		}
		handleAddReaction(params) {
			im_v2_lib_logger.Logger.warn('MessagePullHandler: handleAddReaction', params);
			const {
				actualReactions: {
					reaction: actualReactionsState,
					usersShort
				},
				userId,
				reaction
			} = params;
			if (im_v2_application_core.Core.getUserId() === userId) {
				actualReactionsState.ownReactions = [reaction];
			}
			const userManager = new im_v2_lib_user.UserManager();
			void userManager.addUsersToModel(usersShort);
			void this.#store.dispatch('messages/reactions/set', [actualReactionsState]);
		}
		handleDeleteReaction(params) {
			im_v2_lib_logger.Logger.warn('MessagePullHandler: handleDeleteReaction', params);
			const {
				actualReactions: {
					reaction: rawReaction
				},
				reaction: reactionType,
				userId
			} = params;
			const newReactionItem = {
				...rawReaction
			};
			if (im_v2_application_core.Core.getUserId() === userId) {
				newReactionItem.ownReactionsToRemove = [reactionType];
			}
			void this.#store.dispatch('messages/reactions/set', [newReactionItem]);
		}
		handleMessageParamsUpdate(params) {
			im_v2_lib_logger.Logger.warn('MessagePullHandler: handleMessageParamsUpdate', params);
			this.#store.dispatch('messages/update', {
				id: params.id,
				chatId: params.chatId,
				fields: {
					params: params.params
				}
			});
		}
		handleReadMessage(params) {
			im_v2_lib_logger.Logger.warn('MessagePullHandler: handleReadMessage', params);
			const {
				chatId,
				dialogId,
				viewedMessages,
				lastId
			} = params;
			void this.#store.dispatch('messages/readMessages', {
				chatId,
				messageIds: viewedMessages
			});
			void this.#store.dispatch('chats/update', {
				dialogId,
				fields: {
					lastId
				}
			});
		}
		handleReadMessageOpponent(params) {
			if (params.userId === im_v2_application_core.Core.getUserId()) {
				return;
			}
			im_v2_lib_logger.Logger.warn('MessagePullHandler: handleReadMessageOpponent', params);
			this.#updateMessageViewedByOthers(params);
			this.#updateChatLastMessageViews(params);
		}
		handlePinAdd(params) {
			im_v2_lib_logger.Logger.warn('MessagePullHandler: handlePinAdd', params);
			this.#setFiles(params);
			this.#setUsers(params.users);
			this.#store.dispatch('messages/store', params.additionalMessages);
			this.#store.dispatch('messages/pin/add', {
				chatId: params.pin.chatId,
				messageId: params.pin.messageId
			});
			if (im_v2_application_core.Core.getUserId() !== params.pin.authorId) ;
		}
		handlePinDelete(params) {
			im_v2_lib_logger.Logger.warn('MessagePullHandler: handlePinDelete', params);
			this.#store.dispatch('messages/pin/delete', {
				chatId: params.chatId,
				messageId: params.messageId
			});
		}
		handleMessageBlockElementAppend(params) {
			im_v2_lib_logger.Logger.warn('MessagePullHandler: handleMessageBlockElementAppend', params);
			const {
				element,
				messageId,
				text,
				chatId,
				files
			} = params;
			void this.#store.dispatch('messages/builder/appendBlock', {
				messageId,
				block: element
			});
			void this.#store.dispatch('messages/update', {
				id: messageId,
				fields: {
					text
				}
			});
			void this.#store.dispatch('files/set', files);
			this.#sendScrollEvent(chatId, im_v2_const.DialogScrollThreshold.halfScreenUp);
		}
		handleMessageBlockElementUpdate(params) {
			im_v2_lib_logger.Logger.warn('MessagePullHandler: handleMessageBlockElementUpdate', params);
			const {
				element,
				elementId,
				messageId,
				text,
				files
			} = params;
			void this.#store.dispatch('messages/builder/updateBlock', {
				messageId,
				blockId: elementId,
				block: element
			});
			void this.#store.dispatch('messages/update', {
				id: messageId,
				fields: {
					text
				}
			});
			void this.#store.dispatch('files/set', files);
		}
		handleMessageBlockElementDelete(params) {
			im_v2_lib_logger.Logger.warn('MessagePullHandler: handleMessageBlockElementDelete', params);
			const {
				elementId,
				messageId,
				text
			} = params;
			void this.#store.dispatch('messages/builder/deleteBlock', {
				messageId,
				blockId: elementId
			});
			void this.#store.dispatch('messages/update', {
				id: messageId,
				fields: {
					text
				}
			});
		}

		// helpers
		#setMessageChat(params) {
			const manager = new NewMessageManager(params);
			const chat = manager.getChat();
			if (!chat) {
				return;
			}
			const chatToAdd = {
				...chat,
				dialogId: params.dialogId
			};
			const dialogExists = Boolean(this.#getDialog(params.dialogId));
			const messageWithoutNotification = !params.notify || params.message?.params?.NOTIFY === 'N';
			if (!dialogExists && !messageWithoutNotification && !chatToAdd.role) {
				chatToAdd.role = im_v2_const.UserRole.member;
			}
			void this.#store.dispatch('chats/set', chatToAdd);
		}
		#setUsers(users) {
			if (!users) {
				return;
			}
			const userManager = new im_v2_lib_user.UserManager();
			userManager.setUsersToModel(Object.values(users));
		}
		#setFiles(params) {
			if (!params.files) {
				return;
			}
			const files = Object.values(params.files);
			files.forEach(file => {
				void this.#store.dispatch('files/set', file);
			});
		}
		#setAdditionalEntities(params) {
			if (!params.message.additionalEntities) {
				return;
			}
			const {
				additionalMessages,
				messages,
				files,
				users,
				stickers
			} = params.message.additionalEntities;
			const newMessages = [...messages, ...additionalMessages];
			void this.#store.dispatch('messages/store', newMessages);
			void this.#store.dispatch('files/set', files);
			void this.#store.dispatch('users/set', users);
			void this.#store.dispatch('stickers/set', stickers);
			this.#setBuilder(newMessages);
		}
		#setCommentInfo(params) {
			const manager = new NewMessageManager(params);
			const chat = manager.getChat();
			if (!chat || !manager.isCommentChat()) {
				return;
			}
			this.#store.dispatch('messages/comments/set', {
				messageId: chat.parent_message_id,
				chatId: params.chatId,
				messageCount: chat.message_count
			});
			this.#store.dispatch('messages/comments/setLastUser', {
				messageId: chat.parent_message_id,
				newUserId: params.message.senderId
			});
		}
		#handleAddingMessageToModel(params) {
			const dialog = this.#getDialog(params.dialogId, true);
			if (dialog.hasNextPage) {
				this.#store.dispatch('messages/store', params.message);
				return;
			}
			const chatIsOpened = this.#store.getters['application/isChatOpen'](params.dialogId);
			const unreadMessages = this.#store.getters['messages/getChatUnreadMessages'](params.chatId);
			const RELOAD_LIMIT = im_v2_provider_service_message.MessageService.getMessageRequestLimit() * 5;
			if (dialog.inited && !chatIsOpened && unreadMessages.length > RELOAD_LIMIT) {
				void this.#store.dispatch('messages/store', params.message);
				const messageService = new im_v2_provider_service_message.MessageService({
					chatId: params.chatId
				});
				messageService.reloadMessageList();
				return;
			}
			this.#addMessageToModel(params.message);
			this.#sendScrollEvent(params.chatId);
		}
		#addMessageToModel(message) {
			const newMessage = {
				...message
			};
			if (message.senderId === im_v2_application_core.Core.getUserId()) {
				newMessage.unread = false;
			} else {
				newMessage.unread = true;
				newMessage.viewed = false;
			}
			this.#store.dispatch('messages/setChatCollection', {
				messages: [newMessage]
			});
		}
		#updateDialog(params) {
			const manager = new NewMessageManager(params);
			const {
				dialogId,
				chatId,
				message
			} = params;
			const dialog = this.#getDialog(dialogId, true);
			const dialogFieldsToUpdate = {};
			if (message.id > dialog.lastMessageId) {
				dialogFieldsToUpdate.lastMessageId = message.id;
			}
			if (message.senderId === im_v2_application_core.Core.getUserId() && message.id > dialog.lastReadId) {
				dialogFieldsToUpdate.lastId = message.id;
			}
			if (manager.isUserChat() && !dialog.chatId) {
				dialogFieldsToUpdate.chatId = chatId;
			}
			void this.#store.dispatch('chats/update', {
				dialogId,
				fields: dialogFieldsToUpdate
			});
			void this.#store.dispatch('chats/clearLastMessageViews', {
				dialogId
			});
		}
		#updateMessageViewedByOthers(params) {
			this.#store.dispatch('messages/setViewedByOthers', {
				ids: params.viewedMessages
			});
		}
		#updateChatLastMessageViews(params) {
			const dialog = this.#getDialog(params.dialogId);
			if (!dialog) {
				return;
			}
			const isLastMessage = params.viewedMessages.includes(dialog.lastMessageId);
			if (!isLastMessage) {
				return;
			}
			if (this.#checkMessageViewsRegistry(params.userId, dialog.lastMessageId)) {
				return;
			}
			const hasFirstViewer = Boolean(dialog.lastMessageViews.firstViewer);
			if (hasFirstViewer) {
				this.#store.dispatch('chats/incrementLastMessageViews', {
					dialogId: params.dialogId
				});
				this.#updateMessageViewsRegistry(params.userId, dialog.lastMessageId);
				return;
			}
			this.#store.dispatch('chats/setLastMessageViews', {
				dialogId: params.dialogId,
				fields: {
					userId: params.userId,
					userName: params.userName,
					date: params.date,
					messageId: dialog.lastMessageId
				}
			});
			this.#updateMessageViewsRegistry(params.userId, dialog.lastMessageId);
		}
		#checkMessageViewsRegistry(userId, messageId) {
			return Boolean(this.#messageViews[messageId]?.has(userId));
		}
		#updateMessageViewsRegistry(userId, messageId) {
			if (!this.#messageViews[messageId]) {
				this.#messageViews[messageId] = new Set();
			}
			this.#messageViews[messageId].add(userId);
		}
		#sendScrollEvent(chatId, threshold = im_v2_const.DialogScrollThreshold.nearTheBottom) {
			main_core_events.EventEmitter.emit(im_v2_const.EventType.dialog.scrollToBottom, {
				chatId,
				threshold
			});
		}
		#getDialog(dialogId, temporary = false) {
			return this.#store.getters['chats/get'](dialogId, temporary);
		}
		#setCopilotData(params) {
			if (!params.copilot) {
				return;
			}
			const copilotManager = new im_v2_lib_copilot.CopilotManager();
			void copilotManager.handleMessageAdd(params.copilot);
		}
		#setMessagesAutoDeleteConfig(params) {
			const {
				messagesAutoDeleteConfigs
			} = params;
			void this.#store.dispatch('chats/autoDelete/set', messagesAutoDeleteConfigs);
		}
		#setStickers(params) {
			const hasMessageSticker = main_core.Type.isPlainObject(params.message.params.STICKER_PARAMS);
			if (hasMessageSticker) {
				void this.#store.dispatch('stickers/messages/set', [{
					messageId: params.message.id,
					...params.message.params.STICKER_PARAMS
				}]);
				void this.#store.dispatch('stickers/set', params.stickers);
			}
		}
		#setBuilder(payload) {
			const messages = main_core.Type.isArray(payload) ? payload : [payload];
			void this.#store.dispatch('messages/builder/set', messages);
		}
		#prepareDeleteMessageParams(params, isComplete = false, message = null) {
			const baseParams = {
				id: message ? message.id : params.id,
				senderId: message ? message.senderId : params.senderId,
				dialogId: params.dialogId
			};
			if (isComplete) {
				return {
					...baseParams,
					newLastMessage: params.newLastMessage,
					lastMessageViews: params.lastMessageViews
				};
			}
			return baseParams;
		}
	}

	class ChatPullHandler {
		#store;
		constructor() {
			this.#store = im_v2_application_core.Core.getStore();
		}
		handleChatOwner(params) {
			im_v2_lib_logger.Logger.warn('ChatPullHandler: handleChatOwner', params);
			this.#store.dispatch('chats/update', {
				dialogId: params.dialogId,
				fields: {
					ownerId: params.userId
				}
			});
		}
		handleChatManagers(params) {
			im_v2_lib_logger.Logger.warn('ChatPullHandler: handleChatManagers', params);
			this.#store.dispatch('chats/update', {
				dialogId: params.dialogId,
				fields: {
					managerList: params.list
				}
			});
			const chat = this.#store.getters['chats/get'](params.dialogId);
			if (!chat) {
				return;
			}
			const userInManagerList = params.list.includes(im_v2_application_core.Core.getUserId());
			if (chat.role === im_v2_const.UserRole.member && userInManagerList) {
				this.#store.dispatch('chats/update', {
					dialogId: params.dialogId,
					fields: {
						role: im_v2_const.UserRole.manager
					}
				});
			}
			if (chat.role === im_v2_const.UserRole.manager && !userInManagerList) {
				this.#store.dispatch('chats/update', {
					dialogId: params.dialogId,
					fields: {
						role: im_v2_const.UserRole.member
					}
				});
			}
		}
		handleChatUserAdd(params) {
			im_v2_lib_logger.Logger.warn('ChatPullHandler: handleChatUserAdd', params);
			this.#updateChatUsers(params);
			const {
				newUsers,
				dialogId,
				relations
			} = params;
			const currentUserId = im_v2_application_core.Core.getUserId();
			if (newUsers.includes(currentUserId)) {
				const currentUserRelation = relations.find(relation => relation.userId === im_v2_application_core.Core.getUserId());
				void this.#store.dispatch('chats/update', {
					dialogId,
					fields: {
						role: currentUserRelation.role
					}
				});
			}
		}
		handleChatUserLeave(params) {
			im_v2_lib_logger.Logger.warn('ChatPullHandler: handleChatUserLeave', params);
			this.#updateChatUsers(params);

			// chatUserLeave is single user event, so we can safely use first (and only) relation from array
			const {
				userId,
				dialogId,
				chatId,
				relations: [relation]
			} = params;
			const currentUserIsKicked = userId === im_v2_application_core.Core.getUserId();
			if (relation?.isHidden || !currentUserIsKicked) {
				return;
			}
			void this.#store.dispatch('chats/update', {
				dialogId,
				fields: {
					inited: false
				}
			});
			void this.#store.dispatch('messages/clearChatCollection', {
				chatId
			});
			void this.#store.dispatch('counters/clearByParentId', {
				parentChatId: chatId
			});
			this.#onChatAccessLost(dialogId);
		}
		handleInputActionNotify(params) {
			im_v2_lib_logger.Logger.warn('ChatPullHandler: handleInputActionNotify', params);
			im_v2_lib_inputAction.InputActionListener.getInstance().startAction(params);
			this.#store.dispatch('users/update', {
				id: params.userId,
				fields: {
					lastActivityDate: new Date()
				}
			});
		}
		handleChatUnread(params) {
			im_v2_lib_logger.Logger.warn('ChatPullHandler: handleChatUnread', params);
			let markedId = 0;
			if (params.active === true) {
				markedId = params.markedId;
			}
			this.#store.dispatch('chats/update', {
				dialogId: params.dialogId,
				fields: {
					markedId
				}
			});
		}
		handleChatMuteNotify(params) {
			if (params.muted) {
				this.#store.dispatch('chats/mute', {
					dialogId: params.dialogId
				});
				return;
			}
			this.#store.dispatch('chats/unmute', {
				dialogId: params.dialogId
			});
		}
		handleChatRename(params) {
			const dialog = this.#store.getters['chats/getByChatId'](params.chatId);
			if (!dialog) {
				return;
			}
			this.#store.dispatch('chats/update', {
				dialogId: dialog.dialogId,
				fields: {
					name: params.name
				}
			});
		}
		handleChatAvatar(params) {
			const dialog = this.#store.getters['chats/getByChatId'](params.chatId);
			if (!dialog) {
				return;
			}
			this.#store.dispatch('chats/update', {
				dialogId: dialog.dialogId,
				fields: {
					avatar: params.avatar
				}
			});
		}
		handleChatConvert(params) {
			im_v2_lib_logger.Logger.warn('ChatPullHandler: handleChatConvert', params);
			const {
				dialogId,
				oldType,
				newType,
				newPermissions,
				newTypeParams
			} = params;
			const fields = {
				type: newType,
				permissions: newPermissions
			};
			if ([newType, oldType].includes(im_v2_const.ChatType.collab)) {
				fields.diskFolderId = 0;
			}
			this.#store.dispatch('chats/update', {
				dialogId,
				fields
			});
			const dialog = this.#store.getters['chats/get'](dialogId);
			if (newType === im_v2_const.ChatType.collab && dialog?.chatId > 0) {
				this.#store.dispatch('chats/collabs/set', {
					chatId: dialog.chatId,
					collabInfo: newTypeParams.collabInfo
				});
			}
		}
		handleChatUpdate(params) {
			void this.#store.dispatch('chats/update', {
				dialogId: params.chat.dialogId,
				fields: {
					role: im_v2_lib_roleManager.getChatRoleForUser(params.chat),
					...params.chat
				}
			});
		}
		handleChatFieldsUpdate(params) {
			void this.#store.dispatch('chats/update', {
				dialogId: params.dialogId,
				fields: {
					...params
				}
			});
		}
		handleChatDelete(params) {
			im_v2_lib_logger.Logger.warn('ChatPullHandler: handleChatDelete', params);
			const {
				userId,
				chatId,
				dialogId
			} = params;
			const currentUserId = im_v2_application_core.Core.getUserId();
			if (userId === currentUserId) {
				return;
			}
			void this.#store.dispatch('chats/update', {
				dialogId,
				fields: {
					inited: false
				}
			});
			void this.#store.dispatch('recent/delete', {
				dialogId
			});
			void this.#store.dispatch('messages/clearChatCollection', {
				chatId
			});
			if (this.#isChatOpen(dialogId)) {
				im_v2_lib_analytics.Analytics.getInstance().chatDelete.onChatDeletedNotification(dialogId);
				im_v2_lib_notifier.Notifier.chat.onNotFoundError();
			}
			this.#onChatAccessLost(dialogId);
		}
		handleMessagesAutoDeleteDelayChanged(params) {
			im_v2_lib_logger.Logger.warn('ChatPullHandler: handleMessagesAutoDeleteDelayChanged', params);
			const {
				chatId,
				delay
			} = params;
			void this.#store.dispatch('chats/autoDelete/set', {
				chatId,
				delay
			});
		}
		#isChatOpen(dialogId) {
			return this.#store.getters['application/isChatOpen'](dialogId);
		}
		#onChatAccessLost(dialogId) {
			if (this.#isChatOpen(dialogId)) {
				void im_public.Messenger.openChat();
			}
			main_core_events.EventEmitter.emit(im_v2_const.EventType.recent.closeNestedList, {
				dialogId
			});
			im_v2_lib_call.CallManager.getInstance().deleteRecentCall(dialogId);
			const chatHasCall = im_v2_lib_call.CallManager.getInstance().getCurrentCallDialogId() === dialogId;
			if (chatHasCall) {
				im_v2_lib_call.CallManager.getInstance().leaveCurrentCall();
			}
		}
		#updateChatUsers(params) {
			if (params.users) {
				const userManager = new im_v2_lib_user.UserManager();
				void userManager.setUsersToModel(Object.values(params.users));
			}
			void this.#store.dispatch('chats/update', {
				dialogId: params.dialogId,
				fields: {
					userCounter: params.userCount,
					guestCount: params.guestCount,
					extranet: params.chatExtranet,
					containsCollaber: params.containsCollaber
				}
			});
		}
	}

	class TariffPullHandler {
		handleChangeTariff(params) {
			im_v2_lib_logger.Logger.warn('TariffPullHandler: handleChangeTariff', params);
			const {
				tariffRestrictions
			} = params;
			if (!tariffRestrictions) {
				return;
			}
			void im_v2_application_core.Core.getStore().dispatch('application/tariffRestrictions/set', tariffRestrictions);
		}
	}

	const GUEST_INVITE_CODE_COOKIE = 'BITRIX_IM_GUEST_INVITE_CODE';
	class UserPullHandler {
		#store;
		constructor() {
			this.#store = im_v2_application_core.Core.getStore();
		}
		handleUserInvite(params) {
			if (params.invited) {
				const userManager = new im_v2_lib_user.UserManager();
				userManager.setUsersToModel([params.user]);
				return;
			}
			this.#store.dispatch('users/update', {
				id: params.userId,
				fields: params.user
			});
		}
		handleUserShowInRecent(params) {
			const usersToStore = params.items.map(item => item.user);
			const userManager = new im_v2_lib_user.UserManager();
			userManager.setUsersToModel(usersToStore);
		}
		handleUserLogout(params) {
			const {
				deactivatedCodes
			} = params;
			const inviteCode = main_core.Http.Cookie.get(GUEST_INVITE_CODE_COOKIE);
			if (!main_core.Type.isArrayFilled(deactivatedCodes) || deactivatedCodes.includes(inviteCode)) {
				im_v2_lib_utils.Utils.browser.redirectTo('/');
			}
		}
	}

	class DesktopPullHandler {
		handleDesktopOnline(params) {
			im_v2_lib_logger.Logger.warn('DesktopPullHandler: handleDesktopOnline', params);
			const desktopManager = im_v2_lib_desktop.DesktopManager.getInstance();
			desktopManager.setDesktopActive(true);
			desktopManager.setDesktopVersion(params.version);
			im_v2_lib_counter.CounterManager.getInstance().removeBrowserTitleCounter();
		}
		handleDesktopOffline() {
			im_v2_lib_logger.Logger.warn('DesktopPullHandler: handleDesktopOffline');
			im_v2_lib_desktop.DesktopManager.getInstance().setDesktopActive(false);
			im_v2_lib_desktop.DesktopManager.getInstance().setDesktopVersion(0);
		}
	}

	class SettingsPullHandler {
		handleSettingsUpdate(params) {
			im_v2_lib_logger.Logger.warn('SettingsPullHandler: handleSettingsUpdate', params);
			Object.entries(params).forEach(([optionName, optionValue]) => {
				im_v2_application_core.Core.getStore().dispatch('application/settings/set', {
					[optionName]: optionValue
				});
			});
		}
	}

	class CommentsPullHandler {
		handleCommentSubscribe(params) {
			const {
				messageId,
				subscribe
			} = params;
			im_v2_lib_logger.Logger.warn('CommentsPullHandler: handleCommentSubscribe', params);
			if (subscribe) {
				im_v2_application_core.Core.getStore().dispatch('messages/comments/subscribe', messageId);
				return;
			}
			im_v2_application_core.Core.getStore().dispatch('messages/comments/unsubscribe', messageId);
		}
	}

	class ApplicationPullHandler {
		handleApplicationOpenChat(params) {
			im_v2_lib_logger.Logger.warn('ApplicationPullHandler: handleOpenChat', params);
			if (!this.#isChatFocused()) {
				return;
			}
			if (im_v2_lib_desktop.DesktopManager.isDesktop()) {
				if (!im_v2_lib_desktop.DesktopManager.isChatWindow()) {
					return;
				}
				void im_public.Messenger.openChat(params.dialogId);
				return;
			}
			void im_public.Messenger.openChat(params.dialogId);
		}
		#isChatFocused() {
			if (!document.hasFocus()) {
				return false;
			}
			const sidePanelManager = main_sidepanel.SidePanel.Instance;
			const hasOpenSliders = sidePanelManager.getOpenSlidersCount() > 0;
			const isEmbeddedMode = im_v2_lib_layout.LayoutManager.getInstance().isEmbeddedMode();
			if (isEmbeddedMode && hasOpenSliders) {
				return false;
			}
			const isChatSliderFocused = im_v2_lib_slider.MessengerSlider.getInstance().isFocused();
			if (!isEmbeddedMode && !isChatSliderFocused) {
				return false;
			}
			return true;
		}
	}

	class CollabPullHandler {
		handleUpdateCollabEntityCounter(params) {
			im_v2_lib_logger.Logger.warn('CollabPullHandler: handleUpdateCollabEntityCounter', params);
			const {
				chatId,
				counter,
				entity
			} = params;
			void im_v2_application_core.Core.getStore().dispatch('chats/collabs/setCounter', {
				chatId,
				entity,
				counter
			});
		}
		handleUpdateCollabGuestCount(params) {
			im_v2_lib_logger.Logger.warn('CollabPullHandler: handleUpdateCollabGuestCount', params);
			const {
				chatId,
				guestCount
			} = params;
			void im_v2_application_core.Core.getStore().dispatch('chats/collabs/setGuestCount', {
				chatId,
				guestCount
			});
		}
	}

	class AiPullHandler {
		#store;
		constructor() {
			this.#store = im_v2_application_core.Core.getStore();
		}
		handleChangeEngine(params) {
			im_v2_lib_logger.Logger.warn('AiPullHandler: handleChangeEngine', params);
			const {
				chatId,
				engineCode
			} = params;
			const dialog = this.#store.getters['chats/getByChatId'](chatId);
			if (!dialog) {
				return;
			}
			this.#store.dispatch('copilot/chats/updateModel', {
				dialogId: dialog.dialogId,
				aiModel: engineCode
			});
		}
		handleFileTranscription(params) {
			im_v2_lib_logger.Logger.warn('AiPullHandler: handleFileTranscription', params);
			this.#store.dispatch('files/setTranscription', params);
		}
		handleSetCopilotTitle(params) {
			im_v2_lib_logger.Logger.warn('AiPullHandler: handleSetCopilotTitle', params);
			const {
				dialogId
			} = params;
			if (!dialogId) {
				return;
			}
			void this.#store.dispatch('copilot/chats/setTitleIsCustom', {
				dialogId,
				titleIsCustom: true
			});
		}
		handleChatCopilotRoleUpdate(params) {
			if (!params.copilotRole) {
				return;
			}
			const copilotManager = new im_v2_lib_copilot.CopilotManager();
			void copilotManager.handleRoleUpdate(params.copilotRole);
		}
	}

	class BasePullHandler {
		#messageHandler;
		#chatHandler;
		#userHandler;
		#desktopHandler;
		#settingsHandler;
		#commentsHandler;
		#tariffPullHandler;
		#applicationPullHandler;
		#collabPullHandler;
		#botPullHandler;
		#aiPullHandler;
		constructor() {
			this.#messageHandler = new MessagePullHandler();
			this.#chatHandler = new ChatPullHandler();
			this.#userHandler = new UserPullHandler();
			this.#desktopHandler = new DesktopPullHandler();
			this.#settingsHandler = new SettingsPullHandler();
			this.#commentsHandler = new CommentsPullHandler();
			this.#tariffPullHandler = new TariffPullHandler();
			this.#applicationPullHandler = new ApplicationPullHandler();
			this.#collabPullHandler = new CollabPullHandler();
			this.#botPullHandler = new BotPullHandler();
			this.#aiPullHandler = new AiPullHandler();
		}
		getModuleId() {
			return 'im';
		}

		// region 'message'
		handleMessage(params) {
			this.#messageHandler.handleMessageAdd(params);
		}
		handleMessageChat(params) {
			this.#messageHandler.handleMessageAdd(params);
		}
		handleMessageUpdate(params) {
			this.#messageHandler.handleMessageUpdate(params);
		}
		handleMessageDeleteV2(params) {
			this.#messageHandler.handleMessageDeleteV2(params);
		}
		handleMessageDelete(params) {
			this.#messageHandler.handleMessageDelete(params);
		}
		handleMessageDeleteComplete(params) {
			this.#messageHandler.handleMessageDeleteComplete(params);
		}
		handleAddReaction(params) {
			this.#messageHandler.handleAddReaction(params);
		}
		handleDeleteReaction(params) {
			this.#messageHandler.handleDeleteReaction(params);
		}
		handleMessageParamsUpdate(params) {
			this.#messageHandler.handleMessageParamsUpdate(params);
		}
		handleReadMessage(params, extra) {
			this.#messageHandler.handleReadMessage(params, extra);
		}
		handleReadMessageChat(params, extra) {
			this.#messageHandler.handleReadMessage(params, extra);
		}
		handleReadMessageOpponent(params) {
			this.#messageHandler.handleReadMessageOpponent(params);
		}
		handleReadMessageChatOpponent(params) {
			this.#messageHandler.handleReadMessageOpponent(params);
		}
		handlePinAdd(params) {
			this.#messageHandler.handlePinAdd(params);
		}
		handlePinDelete(params) {
			this.#messageHandler.handlePinDelete(params);
		}
		handleMessageBlockElementAppend(params) {
			this.#messageHandler.handleMessageBlockElementAppend(params);
		}
		handleMessageBlockElementUpdate(params) {
			this.#messageHandler.handleMessageBlockElementUpdate(params);
		}
		handleMessageBlockElementDelete(params) {
			this.#messageHandler.handleMessageBlockElementDelete(params);
		}
		// endregion 'message'

		// region 'chat'
		handleChatOwner(params) {
			this.#chatHandler.handleChatOwner(params);
		}
		handleChatManagers(params) {
			this.#chatHandler.handleChatManagers(params);
		}
		handleChatUserAdd(params) {
			this.#chatHandler.handleChatUserAdd(params);
		}
		handleChatUserLeave(params) {
			this.#chatHandler.handleChatUserLeave(params);
		}
		handleInputActionNotify(params) {
			this.#chatHandler.handleInputActionNotify(params);
		}
		handleChatUnread(params) {
			this.#chatHandler.handleChatUnread(params);
		}
		handleChatMuteNotify(params) {
			this.#chatHandler.handleChatMuteNotify(params);
		}
		handleChatRename(params) {
			this.#chatHandler.handleChatRename(params);
		}
		handleChatAvatar(params) {
			this.#chatHandler.handleChatAvatar(params);
		}
		handleChatUpdate(params) {
			this.#chatHandler.handleChatUpdate(params);
		}
		handleChatFieldsUpdate(params) {
			this.#chatHandler.handleChatFieldsUpdate(params);
		}
		handleChatDelete(params) {
			this.#chatHandler.handleChatDelete(params);
		}
		handleChatConvert(params) {
			this.#chatHandler.handleChatConvert(params);
		}
		handleMessagesAutoDeleteDelayChanged(params) {
			this.#chatHandler.handleMessagesAutoDeleteDelayChanged(params);
		}
		// endregion 'chat'

		// region 'user'
		handleUserInvite(params) {
			this.#userHandler.handleUserInvite(params);
		}
		handleUserShowInRecent(params) {
			this.#userHandler.handleUserShowInRecent(params);
		}
		handleUserLogout(params) {
			this.#userHandler.handleUserLogout(params);
		}
		// endregion 'user'

		// region 'desktop'
		handleDesktopOnline(params) {
			this.#desktopHandler.handleDesktopOnline(params);
		}
		handleDesktopOffline() {
			this.#desktopHandler.handleDesktopOffline();
		}
		// endregion 'desktop'

		// region 'settings'
		handleSettingsUpdate(params) {
			this.#settingsHandler.handleSettingsUpdate(params);
		}
		// endregion 'settings'

		// region 'comments'
		handleCommentSubscribe(params) {
			this.#commentsHandler.handleCommentSubscribe(params);
		}
		// endregion 'comments'

		// region 'tariff'
		handleChangeTariff(params) {
			this.#tariffPullHandler.handleChangeTariff(params);
		}
		// endregion 'tariff'

		// region 'collab'
		handleUpdateCollabEntityCounter(params) {
			this.#collabPullHandler.handleUpdateCollabEntityCounter(params);
		}
		handleUpdateCollabGuestCount(params) {
			this.#collabPullHandler.handleUpdateCollabGuestCount(params);
		}
		// endregion 'collab'

		// region 'application'
		handleApplicationOpenChat(params) {
			this.#applicationPullHandler.handleApplicationOpenChat(params);
		}
		// endregion 'application'

		// region 'bot'
		handleBotAdd(params) {
			this.#botPullHandler.handleBotAdd(params);
		}
		handleBotUpdate(params) {
			this.#botPullHandler.handleBotUpdate(params);
		}
		// endregion 'bot'

		// region 'ai'
		handleChangeEngine(params) {
			this.#aiPullHandler.handleChangeEngine(params);
		}
		handleFileTranscription(params) {
			this.#aiPullHandler.handleFileTranscription(params);
		}
		handleChatCopilotRoleUpdate(params) {
			this.#aiPullHandler.handleChatCopilotRoleUpdate(params);
		}
		handleSetCopilotTitle(params) {
			this.#aiPullHandler.handleSetCopilotTitle(params);
		}
		// endregion 'ai'
	}

	class RecentUpdateManager {
		#params;
		#tempMessageId = null;
		constructor(params) {
			this.#params = params;
		}
		addToRecentCollection() {
			this.#setLastMessageInfo();
			const newRecentItem = {
				id: this.#getDialogId(),
				messageId: this.#getLastMessageId(),
				lastActivityDate: this.#params.lastActivityDate
			};
			const sections = this.#params.recentConfig?.sections || [im_v2_const.RecentType.default];
			this.addItemToCollection(sections, newRecentItem, this.#getParentChatId());
		}
		addItemToCollection(sections, recentItem, parentChatId) {
			sections.forEach(recentSection => {
				void im_v2_application_core.Core.getStore().dispatch('recent/setCollection', {
					type: recentSection,
					items: [recentItem],
					parentChatId
				});
			});
		}
		#getParentChatId() {
			return this.#params.chat.parent_chat_id;
		}
		#setLastMessageInfo() {
			this.#setMessageChat();
			this.#setUsers();
			this.#setFiles();
			this.#setMessage();
		}
		#getDialogId() {
			return this.#params.chat.dialogId;
		}
		#getChatId() {
			return this.#params.chat.id;
		}
		#getLastMessageId() {
			const chat = im_v2_application_core.Core.getStore().getters['chats/get'](this.#getDialogId());
			const lastMessageId = im_v2_application_core.Core.getStore().getters['messages/getLastId'](chat.chatId);
			return lastMessageId || this.#tempMessageId;
		}
		#setUsers() {
			const userManager = new im_v2_lib_user.UserManager();
			void userManager.setUsersToModel(this.#params.users);
		}
		#setFiles() {
			void im_v2_application_core.Core.getStore().dispatch('files/set', this.#params.files);
		}
		#setMessageChat() {
			const chat = {
				...this.#params.chat,
				dialogId: this.#getDialogId()
			};
			void im_v2_application_core.Core.getStore().dispatch('chats/set', chat);
		}
		#setMessage() {
			if (this.#params.message) {
				void im_v2_application_core.Core.getStore().dispatch('messages/setChatCollection', {
					messages: this.#params.message
				});
				return;
			}
			this.#tempMessageId = im_v2_lib_utils.Utils.text.getUuidV4();
			void im_v2_application_core.Core.getStore().dispatch('messages/setChatCollection', {
				messages: {
					id: this.#tempMessageId,
					date: new Date(),
					chatId: this.#getChatId()
				}
			});
		}
	}

	function buildRecentItem(params) {
		const newRecentItem = {
			id: params.dialogId,
			chatId: params.chatId,
			messageId: params.message.id
		};
		const recentItem = im_v2_application_core.Core.getStore().getters['recent/get'](params.dialogId);
		if (recentItem) {
			newRecentItem.isFakeElement = false;
			newRecentItem.isBirthdayPlaceholder = false;
			newRecentItem.liked = false;
		}
		return newRecentItem;
	}

	// noinspection JSUnusedGlobalSymbols
	class RecentPullHandler {
		getModuleId() {
			return 'im';
		}
		handleMessage(params, extra) {
			this.handleMessageAdd(params, extra);
		}
		handleMessageChat(params, extra) {
			this.handleMessageAdd(params, extra);
		}
		handleMessageAdd(params, extra) {
			const {
				recentConfig
			} = params;
			const manager = new NewMessageManager(params, extra);
			if (!manager.isUserInChat()) {
				return;
			}
			im_v2_lib_logger.Logger.warn('RecentPullHandler: handleMessageAdd', params);
			const newRecentItem = buildRecentItem(params);
			recentConfig.sections.forEach(section => {
				void im_v2_application_core.Core.getStore().dispatch('recent/setCollection', {
					type: section,
					items: [newRecentItem],
					parentChatId: manager.getParentChatId()
				});
			});
		}
		handleMessageDeleteV2(params) {
			this.#deleteLastMessage(params.dialogId, params.newLastMessage);
		}
		handleMessageDeleteComplete(params) {
			this.#deleteLastMessage(params.dialogId, params.newLastMessage);
		}
		handleAddReaction(params) {
			const {
				dialogId,
				userId,
				actualReactions
			} = params;
			im_v2_lib_logger.Logger.warn('RecentPullHandler: handleAddReaction', params);
			const recentItem = im_v2_application_core.Core.getStore().getters['recent/get'](dialogId);
			if (!recentItem) {
				return;
			}
			const chatIsOpened = im_v2_application_core.Core.getStore().getters['application/isChatOpen'](dialogId);
			if (chatIsOpened) {
				return;
			}
			const message = im_v2_application_core.Core.getStore().getters['recent/getMessage'](dialogId);
			const isOwnLike = im_v2_application_core.Core.getUserId() === userId;
			const isOwnLastMessage = im_v2_application_core.Core.getUserId() === message.authorId;
			if (isOwnLike || !isOwnLastMessage) {
				return;
			}
			im_v2_application_core.Core.getStore().dispatch('recent/like', {
				dialogId,
				messageId: actualReactions.reaction.messageId,
				liked: true
			});
		}
		handleChatPin(params) {
			const {
				dialogId,
				active
			} = params;
			im_v2_lib_logger.Logger.warn('RecentPullHandler: handleChatPin', params);
			const manager = new RecentUpdateManager(params);
			manager.addToRecentCollection();
			im_v2_application_core.Core.getStore().dispatch('recent/pin', {
				dialogId,
				action: active
			});
		}
		handleChatHide(params) {
			const {
				dialogId
			} = params;
			im_v2_lib_logger.Logger.warn('RecentPullHandler: handleChatHide', params);
			const recentItem = im_v2_application_core.Core.getStore().getters['recent/get'](dialogId);
			if (!recentItem) {
				return;
			}
			void im_v2_application_core.Core.getStore().dispatch('recent/hide', {
				dialogId
			});
			main_core_events.EventEmitter.emit(im_v2_const.EventType.recent.closeNestedList, {
				dialogId
			});
		}
		handleChatUserLeave(params) {
			const {
				dialogId,
				userId
			} = params;
			im_v2_lib_logger.Logger.warn('RecentPullHandler: handleChatUserLeave', params);
			const recentItem = im_v2_application_core.Core.getStore().getters['recent/get'](dialogId);
			if (!recentItem || userId !== im_v2_application_core.Core.getUserId()) {
				return;
			}
			void im_v2_application_core.Core.getStore().dispatch('recent/hide', {
				dialogId
			});
		}
		handleUserInvite(params) {
			im_v2_lib_logger.Logger.warn('RecentPullHandler: handleUserInvite', params);
			const messageId = im_v2_lib_utils.Utils.text.getUuidV4();
			void im_v2_application_core.Core.getStore().dispatch('messages/store', {
				id: messageId,
				date: params.date
			});
			const recentItem = {
				id: params.user.id,
				invited: params.invited ?? false,
				isFakeElement: true,
				messageId
			};
			void im_v2_application_core.Core.getStore().dispatch('recent/setCollection', {
				type: im_v2_const.RecentType.default,
				items: [recentItem]
			});
		}
		handleUserShowInRecent(params) {
			im_v2_lib_logger.Logger.warn('RecentPullHandler: handleUserShowInRecent', params);
			const {
				items
			} = params;
			items.forEach(item => {
				const messageId = im_v2_lib_utils.Utils.text.getUuidV4();
				void im_v2_application_core.Core.getStore().dispatch('messages/store', {
					id: messageId,
					date: item.date
				});
				const recentItem = {
					id: item.user.id,
					messageId
				};
				void im_v2_application_core.Core.getStore().dispatch('recent/setCollection', {
					type: im_v2_const.RecentType.default,
					items: [recentItem]
				});
			});
		}
		handleRecentUpdate(params) {
			im_v2_lib_logger.Logger.warn('RecentPullHandler: handleRecentUpdate', params);
			const manager = new RecentUpdateManager(params);
			manager.addToRecentCollection();
		}
		#deleteLastMessage(dialogId, newLastMessage) {
			const lastMessageWasDeleted = Boolean(newLastMessage);
			if (lastMessageWasDeleted) {
				this.#updateRecentForMessageDelete(dialogId, newLastMessage.id);
			}
		}
		#updateRecentForMessageDelete(dialogId, newLastMessageId) {
			if (!newLastMessageId) {
				void im_v2_application_core.Core.getStore().dispatch('recent/hide', {
					dialogId
				});
				return;
			}
			void im_v2_application_core.Core.getStore().dispatch('recent/update', {
				dialogId,
				fields: {
					messageId: newLastMessageId
				}
			});
		}
	}

	class RecentUnreadUpdateManager extends RecentUpdateManager {
		addItemToCollection(sections, recentItem, parentChatId) {
			sections.forEach(recentSection => {
				void im_v2_application_core.Core.getStore().dispatch('recent/setUnreadCollection', {
					type: recentSection,
					items: [recentItem],
					parentChatId
				});
			});
		}
	}

	class RecentUnreadPullHandler {
		getModuleId() {
			return 'im';
		}
		handleMessage(params, extra) {
			this.handleMessageAdd(params, extra);
		}
		handleMessageChat(params, extra) {
			this.handleMessageAdd(params, extra);
		}
		handleReadAllChats() {
			const recentSections = [im_v2_const.RecentType.default, im_v2_const.RecentType.taskComments];
			recentSections.forEach(section => {
				im_v2_lib_unreadMode.UnreadModeManager.removeClosedChats(section);
			});
		}
		handleReadAllChatsByType(params) {
			im_v2_lib_unreadMode.UnreadModeManager.removeClosedChats(params.type);
		}
		handleReadMessageChat(params) {
			const {
				dialogId,
				chatId,
				unread,
				counter,
				recentConfig,
				parentChatId
			} = params;
			const shouldRemoveParentChat = !this.#isParentChatOpen(parentChatId) && !this.#hasParentChatCounters(parentChatId);
			if (shouldRemoveParentChat) {
				this.#removeParentChat(parentChatId);
			}
			const shouldRemoveChat = !this.#isChatOpen(dialogId) && !this.#hasChatCounters(chatId, counter, unread);
			if (shouldRemoveChat) {
				this.#removeChat(recentConfig.sections, dialogId, parentChatId);
			}
		}
		handleChatUnread(params) {
			im_v2_lib_logger.Logger.warn('RecentUnreadPullHandler: handleChatUnread', params);
			const {
				muted,
				active,
				dialogId,
				recentConfig,
				parentChatId
			} = params;
			const shouldRemoveParentChat = !this.#hasParentChatCounters(parentChatId) && !this.#isParentChatOpen(parentChatId);
			if (shouldRemoveParentChat) {
				this.#removeParentChat(parentChatId);
			}
			const shouldAddChat = active && !muted;
			if (shouldAddChat) {
				const manager = new RecentUnreadUpdateManager(params);
				manager.addToRecentCollection();
				this.#addParentToRecentCollection(parentChatId, params);
				return;
			}
			const shouldRemoveChat = !this.#isChatOpen(dialogId);
			if (shouldRemoveChat) {
				this.#removeChat(recentConfig.sections, dialogId, parentChatId);
			}
		}
		handleChatMuteNotify(params) {
			const {
				muted,
				unread,
				recentConfig,
				dialogId,
				counter,
				chatId,
				parentChatId
			} = params;
			const shouldRemoveParentChat = muted && !this.#isParentChatOpen(parentChatId);
			if (shouldRemoveParentChat) {
				this.#removeParentChat(parentChatId);
			}
			const shouldAddChat = !muted && this.#hasChatCounters(chatId, counter, unread);
			if (shouldAddChat) {
				const manager = new RecentUnreadUpdateManager(params);
				manager.addToRecentCollection();
				this.#addParentToRecentCollection(parentChatId, params);
				return;
			}
			const shouldRemoveChat = muted && !this.#isChatOpen(dialogId);
			if (shouldRemoveChat) {
				this.#removeChat(recentConfig.sections, dialogId, parentChatId);
			}
		}
		handleMessageAdd(params, extra) {
			const {
				recentConfig,
				counter,
				chatId,
				userBlockChat
			} = params;
			const chatMuteMap = userBlockChat[chatId];
			const isMuted = chatMuteMap[im_v2_application_core.Core.getUserId()] === true;
			im_v2_lib_logger.Logger.warn('UnreadRecentPullHandler: handleMessageAdd', params);
			const manager = new NewMessageManager(params, extra);
			const parentChatId = manager.getParentChatId();
			const recentManager = new RecentUnreadUpdateManager(params);
			const hasCounter = counter > 0 && !main_core.Type.isUndefined(counter);
			const shouldAddChat = hasCounter && !isMuted && manager.isUserInChat();
			if (shouldAddChat) {
				const newRecentItem = buildRecentItem(params);
				recentManager.addItemToCollection(recentConfig.sections, newRecentItem, parentChatId);
			}
			const shouldAddParentChat = parentChatId > 0 && shouldAddChat;
			if (shouldAddParentChat) {
				this.#addParentToRecentCollection(parentChatId, params);
			}
		}
		#getParentRecentItem(parentChatId) {
			const parentDialogId = this.#getParentDialogId(parentChatId);
			return im_v2_application_core.Core.getStore().getters['recent/get'](parentDialogId);
		}
		#isChatOpen(dialogId) {
			return im_v2_application_core.Core.getStore().getters['application/isChatOpen'](dialogId);
		}
		#isParentChatOpen(parentChatId) {
			const parentDialogId = this.#getParentDialogId(parentChatId);
			return this.#isChatOpen(parentDialogId);
		}
		#hasChatCounters(chatId, counter, unread) {
			const childrenCounter = im_v2_application_core.Core.getStore().getters['counters/getChildrenTotalCounter'](chatId);
			const totalCounter = counter + childrenCounter;
			return totalCounter > 0 || unread;
		}
		#hasParentChatCounters(parentChatId) {
			const parentChildrenCounter = im_v2_application_core.Core.getStore().getters['counters/getChildrenTotalCounter'](parentChatId);
			const parentCounter = im_v2_application_core.Core.getStore().getters['counters/getTotalCounterByIds']([parentChatId]);
			const parentTotalCounter = parentChildrenCounter + parentCounter;
			return parentTotalCounter > 0;
		}
		#addParentToRecentCollection(chatId, params) {
			const parentRecentSections = this.#getParentSections(chatId);
			const parentRecentItem = this.#getParentRecentItem(chatId);
			const parentChatId = this.#getParentChatId(chatId);
			const manager = new RecentUnreadUpdateManager(params);
			manager.addItemToCollection(parentRecentSections, parentRecentItem, parentChatId);
		}
		#removeParentChat(parentChatId) {
			const parentRecentSections = this.#getParentSections(parentChatId);
			const parentDialogId = this.#getParentDialogId(parentChatId);
			im_v2_lib_unreadMode.UnreadModeManager.removeDialogIdBySections({
				recentSections: parentRecentSections,
				dialogId: parentDialogId
			});
		}
		#removeChat(recentSections, dialogId, parentChatId) {
			im_v2_lib_unreadMode.UnreadModeManager.removeDialogIdBySections({
				recentSections,
				dialogId,
				parentChatId
			});
		}
		#getParentDialogId(parentChatId) {
			const {
				dialogId
			} = im_v2_application_core.Core.getStore().getters['chats/getByChatId'](parentChatId, true);
			return dialogId;
		}
		#getParentSections(parentChatId) {
			return im_v2_application_core.Core.getStore().getters['counters/getRecentSectionsByChatId'](parentChatId);
		}
		#getParentChatId(chatId) {
			const {
				parentChatId
			} = im_v2_application_core.Core.getStore().getters['chats/getByChatId'](chatId);
			return parentChatId;
		}
	}

	class NotificationPullHandler {
		constructor() {
			this.store = im_v2_application_core.Core.getStore();
			this.userManager = new im_v2_lib_user.UserManager();
			this.updateCounterDebounced = main_core.Runtime.debounce(this.updateCounter, 1500, this);
		}
		getModuleId() {
			return 'im';
		}
		getSubscriptionType() {
			return 'server';
		}
		handleNotifyAdd(params) {
			if (params.onlyFlash === true) {
				return;
			}
			this.userManager.setUsersToModel(params.users);
			this.store.dispatch('notifications/set', params);
			this.updateCounterDebounced(params.counter);
		}
		handleNotifyConfirm(params) {
			this.store.dispatch('notifications/delete', {
				id: params.id
			});
			this.updateCounterDebounced(params.counter);
		}
		handleNotifyRead(params) {
			params.list.forEach(id => {
				this.store.dispatch('notifications/read', {
					ids: [id],
					read: true
				});
			});
			if (params.counter < this.store.getters['notifications/getCounter']) {
				this.updateCounterDebounced(params.counter);
			}
		}
		handleNotifyUnread(params) {
			params.list.forEach(id => {
				this.store.dispatch('notifications/read', {
					ids: [id],
					read: false
				});
			});
			if (params.counter > this.store.getters['notifications/getCounter']) {
				this.updateCounterDebounced(params.counter);
			}
		}
		handleNotifyReadAll(params) {
			const excludeIds = params.excludeIds || [];
			void this.store.dispatch('notifications/readAllSimple', {
				excludeIds
			});
			this.updateCounterDebounced(params.newCounter);
		}
		handleNotifyDelete(params) {
			const idsToDelete = Object.keys(params.id).map(id => Number.parseInt(id, 10));
			idsToDelete.forEach(id => {
				this.store.dispatch('notifications/delete', {
					id
				});
			});
			this.updateCounterDebounced(params.counter);
		}
		updateCounter(counter) {
			this.store.dispatch('notifications/setCounter', counter);
		}
	}

	class SidebarPullHandler {
		constructor() {
			this.store = im_v2_application_core.Core.getStore();
			this.userManager = new im_v2_lib_user.UserManager();
		}
		getModuleId() {
			return 'im';
		}

		// region members
		handleChatUserAdd(params) {
			if (this.getMembersCountFromStore(params.chatId) === 0) {
				return;
			}
			const {
				chatId,
				users,
				newUsers,
				relations
			} = params;
			void this.userManager.setUsersToModel(Object.values(users));
			const usersToAdd = newUsers.filter(userId => {
				const {
					isHidden
				} = relations.find(relation => relation.userId === userId);
				return !isHidden;
			});
			void this.store.dispatch('sidebar/members/set', {
				chatId,
				users: usersToAdd
			});
		}
		handleChatUserLeave(params) {
			if (this.getMembersCountFromStore(params.chatId) === 0) {
				return;
			}
			void this.store.dispatch('sidebar/members/delete', {
				chatId: params.chatId,
				userId: params.userId
			});
		}
		// endregion

		// region task
		handleTaskAdd(params) {
			if (!this.isSidebarInited(params.link.chatId)) {
				return;
			}
			void this.userManager.setUsersToModel(params.users);
			void this.store.dispatch('sidebar/tasks/set', {
				chatId: params.link.chatId,
				tasks: [params.link]
			});
		}
		handleTaskUpdate(params, extra) {
			this.handleTaskAdd(params, extra);
		}
		handleTaskDelete(params) {
			if (!this.isSidebarInited(params.chatId)) {
				return;
			}
			void this.store.dispatch('sidebar/tasks/delete', {
				chatId: params.chatId,
				id: params.linkId
			});
		}
		// endregion

		// region meetings
		handleCalendarAdd(params) {
			if (!this.isSidebarInited(params.link.chatId)) {
				return;
			}
			void this.userManager.setUsersToModel(params.users);
			void this.store.dispatch('sidebar/meetings/set', {
				chatId: params.link.chatId,
				meetings: [params.link]
			});
		}
		handleCalendarUpdate(params, extra) {
			this.handleCalendarAdd(params, extra);
		}
		handleCalendarDelete(params) {
			if (!this.isSidebarInited(params.chatId)) {
				return;
			}
			void this.store.dispatch('sidebar/meetings/delete', {
				chatId: params.chatId,
				id: params.linkId
			});
		}
		// endregion

		// region links
		handleUrlAdd(params) {
			if (!this.isSidebarInited(params.link.chatId)) {
				return;
			}
			void this.userManager.setUsersToModel(params.users);
			void this.store.dispatch('sidebar/links/set', {
				chatId: params.link.chatId,
				links: [params.link]
			});
			const counter = this.store.getters['sidebar/links/getCounter'](params.link.chatId);
			void this.store.dispatch('sidebar/links/setCounter', {
				chatId: params.link.chatId,
				counter: counter + 1
			});
		}
		handleUrlDelete(params) {
			if (!this.isSidebarInited(params.chatId)) {
				return;
			}
			void this.store.dispatch('sidebar/links/delete', {
				chatId: params.chatId,
				id: params.linkId
			});
		}
		// endregion

		// region favorite
		handleMessageFavoriteAdd(params) {
			if (!this.isSidebarInited(params.link.chatId)) {
				return;
			}
			void this.userManager.setUsersToModel(params.users);
			void this.store.dispatch('files/set', params.files);
			void this.store.dispatch('messages/store', [params.link.message]);
			void this.store.dispatch('sidebar/favorites/set', {
				chatId: params.link.chatId,
				favorites: [params.link]
			});
			const counter = this.store.getters['sidebar/favorites/getCounter'](params.link.chatId);
			void this.store.dispatch('sidebar/favorites/setCounter', {
				chatId: params.link.chatId,
				counter: counter + 1
			});
		}
		handleMessageFavoriteDelete(params) {
			if (!this.isSidebarInited(params.chatId)) {
				return;
			}
			void this.store.dispatch('sidebar/favorites/delete', {
				chatId: params.chatId,
				id: params.linkId
			});
		}
		// endregion

		// region files
		handleFileAdd(params) {
			if (!this.isSidebarInited(params.link.chatId)) {
				return;
			}
			void this.userManager.setUsersToModel(params.users);
			void this.store.dispatch('files/set', params.files);
			const group = params.link.group ?? im_v2_const.SidebarDetailBlock.fileUnsorted;
			void this.store.dispatch('sidebar/files/set', {
				chatId: params.link.chatId,
				files: [params.link],
				group
			});
		}
		handleFileDelete(params) {
			const chatId = main_core.Type.isNumber(params.chatId) ? params.chatId : Number.parseInt(params.chatId, 10);
			if (!this.isSidebarInited(chatId)) {
				return;
			}
			const sidebarFileId = params.linkId ?? params.fileId;
			void this.store.dispatch('sidebar/files/delete', {
				chatId,
				id: sidebarFileId
			});
		}
		// endregion

		// region support24

		handleChangeMultidialogSessionsLimit(params) {
			void this.store.dispatch('sidebar/multidialog/setOpenSessionsLimit', params.limit);
		}
		handleAddMultidialog(params) {
			const {
				multidialog,
				count
			} = params;
			const isSupport = multidialog.isSupport;
			if (!isSupport) {
				return;
			}
			void this.store.dispatch('sidebar/multidialog/setChatsCount', count);
			void this.store.dispatch('sidebar/multidialog/addMultidialogs', [multidialog]);
		}
		handleReadMessageChat(params) {
			this.deleteUnreadSupportChats(params);
		}
		handleReadMessage(params) {
			this.deleteUnreadSupportChats(params);
		}
		handleChangeMultidialogStatus(params) {
			const {
				bot,
				chat,
				multidialog
			} = params;
			const isSupport = multidialog.isSupport;
			if (!isSupport) {
				return;
			}
			if (chat) {
				void this.store.dispatch('chats/set', chat);
			}
			if (bot) {
				void this.userManager.setUsersToModel(bot);
			}
			void this.store.dispatch('sidebar/multidialog/addMultidialogs', [multidialog]);
		}
		handleMessage(params) {
			this.setUnreadSupportTickets(params.multidialog);
		}
		handleChatUnread(params) {
			const {
				chatId,
				dialogId
			} = params;
			const isSupport = this.store.getters['sidebar/multidialog/isSupport'](dialogId);
			const isInited = this.store.getters['sidebar/multidialog/isInited'];
			if (isSupport && isInited) {
				void this.store.dispatch('sidebar/multidialog/setUnreadChats', [chatId]);
			}
		}
		// endregion

		// region files unsorted and support24
		handleMessageChat(params) {
			// handle new files while migration is not finished.
			this.setFiles(params);

			// handle new unread chats.
			this.setUnreadSupportTickets(params.multidialog);
		}
		// endregion

		deleteUnreadSupportChats(params) {
			const notCounter = params.counter === 0;
			if (notCounter) {
				void this.store.dispatch('sidebar/multidialog/deleteUnreadChats', params.chatId);
			}
		}
		setUnreadSupportTickets(multidialog) {
			if (!multidialog) {
				return;
			}
			const oldMultidialog = this.store.getters['sidebar/multidialog/get'](multidialog.chatId);
			const status = oldMultidialog?.status || multidialog.status;
			void this.store.dispatch('sidebar/multidialog/addMultidialogs', [{
				...multidialog,
				status
			}]);
			void this.store.dispatch('sidebar/multidialog/setUnreadChats', [multidialog.chatId]);
		}
		setFiles(params) {
			const {
				chatId,
				users,
				files
			} = params;
			if (!this.isSidebarInited(chatId) || this.areFilesMigrated()) {
				return;
			}
			void this.userManager.setUsersToModel(Object.values(users));
			void this.store.dispatch('files/set', Object.values(files));
			Object.values(files).forEach(file => {
				const group = file.group ?? im_v2_const.SidebarDetailBlock.fileUnsorted;
				void this.store.dispatch('sidebar/files/set', {
					chatId: file.chatId,
					files: [file],
					group
				});
			});
		}
		isSidebarInited(chatId) {
			return this.store.getters['sidebar/isInited'](chatId);
		}
		areFilesMigrated() {
			return this.store.state.sidebar.isFilesMigrated;
		}
		getMembersCountFromStore(chatId) {
			return this.store.getters['sidebar/members/getSize'](chatId);
		}
	}

	class NotifierPullHandler {
		lastNotificationId = 0;
		constructor() {
			this.store = im_v2_application_core.Core.getStore();
			this.#setCurrentUserStatus();
			this.#restoreLastNotificationId();
		}
		getModuleId() {
			return 'im';
		}
		handleMessage(params, extraData) {
			this.handleMessageAdd(params, extraData);
		}
		handleMessageChat(params, extraData) {
			this.handleMessageAdd(params, extraData);
		}
		handleMessageAdd(params, extraData) {
			if (!this.#shouldHandleMessageNotification(params, extraData)) {
				return;
			}
			void im_v2_lib_messageNotifier.MessageNotifierManager.getInstance().handleIncomingMessage({
				dialogId: params.dialogId.toString(),
				isImportant: this.#isImportantMessage(params),
				messageId: params.message.id,
				isLines: Boolean(params.lines)
			});
			this.#updateLastNotificationId(params.message.id);
		}
		handleNotifyAdd(params, extraData) {
			if (!this.#shouldHandleNotification(params, extraData)) {
				return;
			}
			im_v2_lib_messageNotifier.MessageNotifierManager.getInstance().handleIncomingNotification({
				notificationId: params.id,
				userId: params.userId,
				isSilent: params.silent === 'Y'
			});
			this.#updateLastNotificationId(params.id);
		}
		#shouldHandleMessageNotification(params, extraData) {
			if (this.#isExpired(extraData)) {
				return false;
			}
			if (!this.#checkLastNotificationId(params.message.id)) {
				return false;
			}
			if (this.#isCurrentUserSender(params)) {
				return false;
			}
			if (params.lines && !this.#shouldShowLinesNotification(params)) {
				return false;
			}
			if (!this.#shouldShowToUser(params) || this.#desktopWillShowNotification()) {
				return false;
			}
			const callIsActive = im_v2_lib_call.CallManager.getInstance().hasCurrentCall();
			if (callIsActive && im_v2_lib_call.CallManager.getInstance().getCurrentCallDialogId() !== params.dialogId.toString()) {
				return false;
			}
			const screenSharingIsActive = im_v2_lib_call.CallManager.getInstance().hasCurrentScreenSharing();
			return !screenSharingIsActive;
		}
		#shouldHandleNotification(params, extraData) {
			if (this.#isExpired(extraData) || !this.#checkLastNotificationId(params.id)) {
				return false;
			}
			if (params.onlyFlash === true || this.#isUserDnd() || this.#desktopWillShowNotification() || im_v2_lib_call.CallManager.getInstance().hasCurrentCall()) {
				return false;
			}
			if (document.hasFocus()) {
				const areNotificationsOpen = this.store.getters['application/areNotificationsOpen'];
				if (areNotificationsOpen) {
					return false;
				}
			}
			return true;
		}
		#shouldShowLinesNotification(params) {
			if (this.#isLinesChatOpened(params.dialogId)) {
				return false;
			}
			const authorId = params.message.senderId;
			if (authorId > 0 && params.users[authorId].type !== im_v2_const.UserType.extranet) {
				return true;
			}
			const counter = this.store.getters['counters/getCounterByChatId'](params.chatId);
			return counter === 0;
		}
		#isLinesChatOpened(dialogId) {
			const isLinesChatOpen = this.store.getters['application/isLinesChatOpen'](dialogId);
			return Boolean(document.hasFocus() && isLinesChatOpen);
		}
		#isImportantMessage(params) {
			const {
				message
			} = params;
			return message.isImportant || message.importantFor.includes(im_v2_application_core.Core.getUserId());
		}
		#shouldShowToUser(params) {
			if (this.#isImportantMessage(params)) {
				return true;
			}
			const {
				notify,
				message,
				dialogId
			} = params;
			const messageParams = message?.params;
			const isNotificationDisabled = !notify || messageParams?.NOTIFY === 'N';
			if (isNotificationDisabled) {
				return false;
			}
			const {
				isMuted
			} = this.store.getters['chats/get'](dialogId, true);
			return !this.#isUserDnd() && !isMuted;
		}
		#isUserDnd() {
			const status = this.store.getters['application/settings/get'](im_v2_const.Settings.user.status);
			return status === im_v2_const.UserStatus.dnd;
		}
		#desktopWillShowNotification() {
			const isDesktopChatWindow = im_v2_lib_desktop.DesktopManager.isChatWindow();
			return !isDesktopChatWindow && im_v2_lib_desktop.DesktopManager.getInstance().isDesktopActive();
		}
		#restoreLastNotificationId() {
			const rawLastNotificationId = im_v2_lib_localStorage.LocalStorageManager.getInstance().get(im_v2_const.LocalStorageKey.lastNotificationId, 0);
			this.lastNotificationId = Number.parseInt(rawLastNotificationId, 10);
		}
		#updateLastNotificationId(notificationId) {
			const WRITE_TO_STORAGE_TIMEOUT = 2000;
			this.lastNotificationId = notificationId;
			clearTimeout(this.writeToStorageTimeout);
			this.writeToStorageTimeout = setTimeout(() => {
				im_v2_lib_localStorage.LocalStorageManager.getInstance().set(im_v2_const.LocalStorageKey.lastNotificationId, notificationId);
			}, WRITE_TO_STORAGE_TIMEOUT);
		}
		#setCurrentUserStatus() {
			const applicationData = im_v2_application_core.Core.getApplicationData();
			if (!applicationData.settings?.status) {
				return;
			}
			im_v2_application_core.Core.getStore().dispatch('application/settings/set', {
				[im_v2_const.Settings.user.status]: applicationData.settings.status
			});
		}
		#isExpired(extraData) {
			if (extraData.server_time_ago > 10) {
				im_v2_lib_logger.Logger.warn('NotifierPullHandler: received notification 10 seconds after it was actually sent, ignore');
				return true;
			}
			return false;
		}
		#checkLastNotificationId(id) {
			if (id <= this.lastNotificationId) {
				im_v2_lib_logger.Logger.warn('NotifierPullHandler: new message id is smaller than lastNotificationId');
				return false;
			}
			return true;
		}
		#isCurrentUserSender(params) {
			return im_v2_application_core.Core.getUserId() === params.message.senderId;
		}
	}

	class OnlinePullHandler {
		constructor() {
			this.store = im_v2_application_core.Core.getStore();
		}
		getModuleId() {
			return 'online';
		}
		getSubscriptionType() {
			return 'online';
		}
		handleUserStatus(params) {
			const currentUserId = im_v2_application_core.Core.getUserId();
			if (main_core.Type.isPlainObject(params.users[currentUserId])) {
				const {
					status
				} = params.users[currentUserId];
				this.store.dispatch('application/settings/set', {
					status
				});
			}
			Object.values(params.users).forEach(userInfo => {
				this.store.dispatch('users/update', {
					id: userInfo.id,
					fields: {
						lastActivityDate: userInfo.last_activity_date
					}
				});
			});
		}
	}

	class CounterPullHandler {
		getModuleId() {
			return 'im';
		}
		handleMessage(params, extra) {
			this.handleMessageChat(params, extra);
		}
		handleMessageChat(params, extra) {
			const manager = new NewMessageManager(params, extra);
			if (!manager.isUserInChat()) {
				return;
			}
			const {
				chatId,
				counter,
				userBlockChat,
				recentConfig
			} = params;
			const chatMuteMap = userBlockChat[chatId];
			const isMuted = chatMuteMap[im_v2_application_core.Core.getUserId()] === true;
			const isMarkedAsUnread = im_v2_application_core.Core.getStore().getters['counters/getUnreadStatus'](chatId);
			const counterItem = {
				chatId,
				counter,
				isMarkedAsUnread,
				isMuted,
				parentChatId: manager.getParentChatId(),
				recentSections: recentConfig.sections
			};
			void im_v2_application_core.Core.getStore().dispatch('counters/setCounters', [counterItem]);
		}
		handleReadMessage(params, extra) {
			this.handleReadMessageChat(params, extra);
		}
		handleReadMessageChat(params, extra) {
			const {
				chatId,
				counter: newCounter,
				unread,
				muted,
				parentChatId,
				recentConfig
			} = params;
			const uuidManager = im_v2_lib_uuid.UuidManager.getInstance();
			if (uuidManager.hasActionUuid(extra.action_uuid)) {
				im_v2_lib_logger.Logger.warn('CounterPullHandler: handleReadMessage: we have this uuid, skip');
				uuidManager.removeActionUuid(extra.action_uuid);
				return;
			}
			const counterItem = {
				chatId,
				counter: newCounter,
				isMarkedAsUnread: unread,
				isMuted: muted,
				parentChatId,
				recentSections: recentConfig.sections
			};
			void im_v2_application_core.Core.getStore().dispatch('counters/setCounters', [counterItem]);
		}
		handleMessageDeleteV2(params) {
			const {
				chatId,
				counter,
				unread,
				muted,
				parentChatId,
				recentConfig
			} = params;
			const counterItem = {
				chatId,
				counter,
				isMarkedAsUnread: unread,
				isMuted: muted,
				parentChatId,
				recentSections: recentConfig.sections
			};
			void im_v2_application_core.Core.getStore().dispatch('counters/setCounters', [counterItem]);
		}
		handleChatUnread(params) {
			const {
				chatId,
				counter,
				active,
				muted,
				parentChatId,
				recentConfig
			} = params;
			const counterItem = {
				chatId,
				counter,
				isMarkedAsUnread: active,
				isMuted: muted,
				parentChatId,
				recentSections: recentConfig.sections
			};
			void im_v2_application_core.Core.getStore().dispatch('counters/setCounters', [counterItem]);
		}
		handleRecentUpdate(params) {
			const {
				chat,
				recentConfig
			} = params;
			const {
				id: chatId,
				parent_chat_id: parentChatId,
				mute_list: muteList
			} = chat;
			const isMuted = muteList[im_v2_application_core.Core.getUserId()] === true;

			// recentUpdate is emitted for parent chat, we add parent item for children counters to work properly
			const counterItem = {
				chatId,
				parentChatId,
				recentSections: recentConfig.sections,
				isMuted
			};
			void im_v2_application_core.Core.getStore().dispatch('counters/setCounters', [counterItem]);
		}
		handleChatDelete(params) {
			const {
				chatId
			} = params;
			void im_v2_application_core.Core.getStore().dispatch('counters/clearById', {
				chatId
			});
		}
		handleReadAllChats() {
			im_v2_lib_counter.CounterClearActions.forEach(actionHandler => {
				void actionHandler();
			});
		}
		handleReadAllChatsByType(params) {
			const {
				type
			} = params;
			const counterClearHandlers = im_v2_lib_counter.CounterClearHandlersByChatType[type];
			if (!counterClearHandlers) {
				return;
			}
			counterClearHandlers.forEach(handler => {
				handler(type);
			});
		}
		handleReadChildren(params) {
			const {
				chatId
			} = params;
			void im_v2_application_core.Core.getStore().dispatch('counters/clearByParentId', {
				parentChatId: chatId
			});
		}
	}

	class PromotionPullHandler {
		getModuleId() {
			return 'im';
		}
		handlePromotionUpdated(params) {
			im_v2_lib_promo.PromoManager.getInstance().onPromotionUpdated(params);
		}
	}

	class AnchorPullHandler {
		constructor() {
			this.store = im_v2_application_core.Core.getStore();
		}
		getModuleId() {
			return 'im';
		}
		handleAddAnchor(anchor) {
			this.store.dispatch('messages/anchors/addAnchor', {
				anchor
			});
		}
		handleDeleteAnchor(anchor) {
			this.store.dispatch('messages/anchors/removeAnchor', {
				anchor
			});
		}
		handleDeleteAnchors(payload) {
			const {
				chatIds
			} = payload;
			chatIds.forEach(chatId => {
				void this.store.dispatch('messages/anchors/removeChatAnchors', chatId);
			});
		}
		handleDeleteChatAnchors(payload) {
			this.store.dispatch('messages/anchors/removeChatAnchors', payload.chatId);
		}
	}

	class StickersPullHandler {
		constructor() {
			this.store = im_v2_application_core.Core.getStore();
		}
		getModuleId() {
			return 'im';
		}
		handleStickerRecentDelete(params) {
			const {
				id,
				packType,
				packId
			} = params;
			void im_v2_application_core.Core.getStore().dispatch('stickers/recent/delete', {
				id,
				packType,
				packId
			});
		}
		handleStickerRecentDeleteAll() {
			void im_v2_application_core.Core.getStore().dispatch('stickers/recent/clear');
		}
		handleStickerPackAdd(params) {
			const {
				pack,
				stickers
			} = params;
			void im_v2_application_core.Core.getStore().dispatch('stickers/packs/set', [pack]);
			void im_v2_application_core.Core.getStore().dispatch('stickers/set', stickers);
		}
		handleStickerPackLink(params) {
			this.handleStickerPackAdd(params);
		}
		handleStickerPackDelete(params) {
			void im_v2_application_core.Core.getStore().dispatch('stickers/packs/delete', params);
			void im_v2_application_core.Core.getStore().dispatch('stickers/deleteByPack', params);
		}
		handleStickerPackUnlink(params) {
			void im_v2_application_core.Core.getStore().dispatch('stickers/packs/unlink', params);
		}
		handleStickerPackRename(params) {
			void im_v2_application_core.Core.getStore().dispatch('stickers/packs/rename', params);
		}
		handleStickerAdd(params) {
			this.handleStickerPackAdd(params);
		}
		handleStickerDelete(params) {
			void im_v2_application_core.Core.getStore().dispatch('stickers/delete', params);
		}
	}

	exports.AnchorPullHandler = AnchorPullHandler;
	exports.BasePullHandler = BasePullHandler;
	exports.CounterPullHandler = CounterPullHandler;
	exports.NotificationPullHandler = NotificationPullHandler;
	exports.NotifierPullHandler = NotifierPullHandler;
	exports.OnlinePullHandler = OnlinePullHandler;
	exports.PromotionPullHandler = PromotionPullHandler;
	exports.RecentPullHandler = RecentPullHandler;
	exports.RecentUnreadPullHandler = RecentUnreadPullHandler;
	exports.SidebarPullHandler = SidebarPullHandler;
	exports.StickersPullHandler = StickersPullHandler;

})(this.BX.Messenger.v2.Provider.Pull = this.BX.Messenger.v2.Provider.Pull || {}, BX.Messenger.v2.Application, BX.Messenger.v2.Lib, BX.Messenger.v2.Lib, BX, BX.Event, BX.Messenger.v2.Const, BX.Messenger.v2.Lib, BX.Messenger.v2.Lib, BX.Messenger.v2.Service, BX.Messenger.v2.Lib, BX.Messenger.v2.Lib, BX.Messenger.v2.Lib, BX.Messenger.v2.Lib, BX.Messenger.v2.Lib, BX.Messenger.v2.Lib, BX.Messenger.v2.Lib, BX.Messenger.v2.Lib, BX.Messenger.v2.Lib, BX.SidePanel, BX.Messenger.v2.Lib, BX.Messenger.v2.Lib, BX.Messenger.v2.Lib, BX.Messenger.v2.Lib, BX.Messenger.v2.Lib, BX.Messenger.v2.Lib, BX.Messenger.v2.Lib);
//# sourceMappingURL=registry.bundle.js.map
