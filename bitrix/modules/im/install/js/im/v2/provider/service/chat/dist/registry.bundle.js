/* eslint-disable */
this.BX = this.BX || {};
this.BX.Messenger = this.BX.Messenger || {};
this.BX.Messenger.v2 = this.BX.Messenger.v2 || {};
(function (exports, im_v2_lib_logger, im_v2_const, im_v2_lib_rest, im_v2_lib_notifier, im_v2_application_core, main_core, call_lib_callTokenManager, im_public, im_v2_lib_copilot, im_v2_lib_feature, im_v2_lib_layout, im_v2_lib_user, im_v2_lib_utils, im_v2_provider_service_message, im_v2_lib_analytics, im_v2_lib_roleManager, ui_uploader_core, im_v2_lib_uuid, im_v2_lib_counter) {
	'use strict';

	class DeleteService {
		#store;
		constructor() {
			this.#store = im_v2_application_core.Core.getStore();
		}
		async deleteChat(dialogId) {
			im_v2_lib_logger.Logger.warn(`ChatService: deleteChat, dialogId: ${dialogId}`);
			const deleteResult = await im_v2_lib_rest.runAction(im_v2_const.RestMethod.imV2ChatDelete, {
				data: {
					dialogId
				}
			}).catch(([error]) => {
				console.error('ChatService: deleteChat error:', error);
				im_v2_lib_notifier.Notifier.chat.onDeleteError();
			});
			await this.#updateModels(dialogId);
			return deleteResult;
		}
		async deleteCollab(dialogId) {
			im_v2_lib_logger.Logger.warn(`ChatService: deleteCollab, dialogId: ${dialogId}`);
			try {
				await im_v2_lib_rest.runAction(im_v2_const.RestMethod.socialnetworkCollabDelete, {
					data: {
						dialogId
					}
				});
				await this.#updateModels(dialogId);
				return Promise.resolve();
			} catch (errors) {
				const [firstError] = errors;
				console.error('ChatService: deleteCollab error:', firstError);
				im_v2_lib_notifier.Notifier.collab.handleDeleteError(firstError);
				return Promise.resolve();
			}
		}
		#updateModels(dialogId) {
			void this.#store.dispatch('chats/update', {
				dialogId,
				fields: {
					inited: false
				}
			});
			void this.#store.dispatch('recent/delete', {
				dialogId
			});
			const chat = this.#store.getters['chats/get'](dialogId, true);
			void this.#store.dispatch('messages/clearChatCollection', {
				chatId: chat.chatId
			});
		}
	}

	class ChatDataExtractor {
		#restResult;
		constructor(restResult) {
			this.#restResult = restResult;
		}
		getChatId() {
			return this.#restResult.chat.id;
		}
		getDialogId() {
			return this.#restResult.chat.dialogId;
		}
		isOpenlinesChat() {
			return this.#restResult.chat.type === im_v2_const.ChatType.lines;
		}
		isCopilotChat() {
			return this.#restResult.chat.type === im_v2_const.ChatType.copilot;
		}
		isCollabChat() {
			return this.#restResult.chat.type === im_v2_const.ChatType.collab;
		}
		getParentChat() {
			return this.#restResult.parentChat;
		}
		getChats() {
			const mainChat = {
				...this.#restResult.chat,
				hasPrevPage: this.#restResult.hasPrevPage,
				hasNextPage: this.#restResult.hasNextPage,
				tariffRestrictions: this.#restResult.tariffRestrictions
			};
			const chats = {
				[this.#restResult.chat.dialogId]: mainChat
			};
			this.#restResult.users.forEach(user => {
				if (chats[user.id]) {
					chats[user.id] = {
						...chats[user.id],
						...im_v2_lib_user.UserManager.getDialogForUser(user)
					};
				} else {
					chats[user.id] = im_v2_lib_user.UserManager.getDialogForUser(user);
				}
			});
			const parentChat = this.getParentChat();
			if (parentChat) {
				chats[parentChat.dialogId] = parentChat;
			}
			return Object.values(chats);
		}
		getFiles() {
			return this.#restResult.files ?? [];
		}
		getUsers() {
			return this.#restResult.users ?? [];
		}
		getAdditionalUsers() {
			return this.#restResult.usersShort ?? [];
		}
		getMessages() {
			return this.#restResult.messages ?? [];
		}
		getCommentInfo() {
			return this.#restResult.commentInfo ?? [];
		}
		getStickerMessages() {
			const stickerMessages = [];
			if (!this.#restResult.messages) {
				return stickerMessages;
			}
			this.#restResult.messages.forEach(message => {
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
		getStickers() {
			return this.#restResult.stickers ?? [];
		}
		getCollabInfo() {
			return this.#restResult.collabInfo ?? null;
		}
		getMessagesToStore() {
			return this.#restResult.additionalMessages ?? [];
		}
		getPinnedMessageIds() {
			const pinnedMessageIds = [];
			const pins = this.#restResult.pins ?? [];
			pins.forEach(pin => {
				pinnedMessageIds.push(pin.messageId);
			});
			return pinnedMessageIds;
		}
		getReactions() {
			return this.#restResult.reactions ?? [];
		}
		getCopilot() {
			return this.#restResult.copilot;
		}
		getAutoDeleteConfig() {
			return this.#restResult.messagesAutoDeleteConfigs;
		}
	}

	const {
		callInstalled
	} = main_core.Extension.getSettings('im.v2.lib.call');
	class LoadService {
		#store;
		constructor() {
			this.#store = im_v2_application_core.Core.getStore();
		}
		loadChat(dialogId) {
			const params = {
				dialogId
			};
			return this.#requestChat(im_v2_const.RestMethod.imV2ChatShallowLoad, params);
		}
		loadChatByChatId(chatId) {
			const params = {
				chatId,
				messageLimit: im_v2_provider_service_message.MessageService.getMessageRequestLimit()
			};
			return this.#requestChat(im_v2_const.RestMethod.imV2ChatLoad, params);
		}
		loadChatWithMessages(dialogId) {
			const params = {
				dialogId,
				messageLimit: im_v2_provider_service_message.MessageService.getMessageRequestLimit()
			};
			const method = this.getLoadRestMethodName();
			return this.#requestChat(method, params);
		}
		loadCopilotDraftChat() {
			return this.#requestChat(im_v2_const.RestMethod.imV2CopilotDraftChatGet, {
				messageLimit: im_v2_provider_service_message.MessageService.getMessageRequestLimit()
			});
		}
		loadChatWithContext(dialogId, messageId) {
			const params = {
				dialogId,
				messageId,
				messageLimit: im_v2_provider_service_message.MessageService.getMessageRequestLimit()
			};
			return this.#requestChat(im_v2_const.RestMethod.imV2ChatLoadInContext, params);
		}
		prepareDialogId(dialogId) {
			if (!im_v2_lib_utils.Utils.dialog.isExternalId(dialogId)) {
				return Promise.resolve(dialogId);
			}
			return im_v2_lib_rest.runAction(im_v2_const.RestMethod.imV2ChatGetDialogId, {
				data: {
					externalId: dialogId
				}
			}).then(result => {
				return result.dialogId;
			}).catch(error => {
				console.error('ChatService: Load: error preparing external id', error);
			});
		}
		async loadComments(postId) {
			const params = {
				postId,
				messageLimit: im_v2_provider_service_message.MessageService.getMessageRequestLimit(),
				autoJoin: true,
				createIfNotExists: true
			};
			const {
				chatId
			} = await this.#requestChat(im_v2_const.RestMethod.imV2ChatLoad, params);
			return this.#store.dispatch('messages/comments/set', {
				messageId: postId,
				chatId
			});
		}
		async loadCommentInfo(channelDialogId) {
			const dialog = this.#store.getters['chats/get'](channelDialogId, true);
			const messages = this.#store.getters['messages/getByChatId'](dialog.chatId);
			const messageIds = messages.map(message => message.id);
			const {
				commentInfo,
				usersShort
			} = await im_v2_lib_rest.runAction(im_v2_const.RestMethod.imV2ChatMessageCommentInfoList, {
				data: {
					messageIds
				}
			}).catch(error => {
				console.error('ChatService: Load: error loading comment info', error);
			});
			const userManager = new im_v2_lib_user.UserManager();
			void this.#store.dispatch('messages/comments/set', commentInfo);
			void userManager.addUsersToModel(usersShort);
		}
		clearChat(dialogId) {
			const dialog = this.#store.getters['chats/get'](dialogId, true);
			this.#store.dispatch('messages/clearChatCollection', {
				chatId: dialog.chatId
			});
			this.#store.dispatch('chats/update', {
				dialogId,
				fields: {
					inited: false
				}
			});
		}
		getLoadRestMethodName() {
			return im_v2_const.RestMethod.imV2ChatLoad;
		}
		updateChatCustomModels(restResult) {
			return [];
		}
		async #requestChat(actionName, params) {
			const {
				dialogId,
				messageId
			} = params;
			if (this.#affectsDialogLoadingState(actionName)) {
				this.#markDialogAsLoading(dialogId);
			}
			const actionResult = await im_v2_lib_rest.runAction(actionName, {
				data: params
			}).catch(([error]) => {
				console.error('ChatService: Load: error loading chat', error);
				if (this.#isTariffError(error)) {
					return error;
				}
				this.#markDialogAsNotLoaded(dialogId);
				im_v2_lib_notifier.Notifier.chat.handleLoadError(error);
				throw error;
			});
			if (this.#checkFeatureDisabled(actionResult)) {
				await this.#markDialogAsNotLoaded(dialogId);
				await im_public.Messenger.openChat();
				return this.#openFeatureSlider(actionResult);
			}
			if (this.#needLayoutRedirect(actionResult)) {
				return this.#redirectToLayout(actionResult, messageId);
			}
			const {
				dialogId: loadedDialogId,
				chatId
			} = await this.#updateModels(actionResult);
			const {
				callInfo
			} = actionResult;
			if (callInstalled) {
				call_lib_callTokenManager.CallTokenManager.setToken(callInfo.chatId, callInfo.token);
			}
			if (this.#affectsDialogLoadingState(actionName)) {
				await this.#markDialogAsLoaded(loadedDialogId);
			}
			return {
				dialogId: loadedDialogId,
				chatId
			};
		}
		#markDialogAsLoading(dialogId) {
			void this.#store.dispatch('chats/update', {
				dialogId,
				fields: {
					loading: true
				}
			});
		}
		#markDialogAsLoaded(dialogId) {
			return this.#store.dispatch('chats/update', {
				dialogId,
				fields: {
					inited: true,
					loading: false
				}
			});
		}
		#markDialogAsNotLoaded(dialogId) {
			return this.#store.dispatch('chats/update', {
				dialogId,
				fields: {
					loading: false
				}
			});
		}
		#affectsDialogLoadingState(actionName) {
			return actionName !== im_v2_const.RestMethod.imV2ChatShallowLoad;
		}
		async #updateModels(restResult) {
			const extractor = new ChatDataExtractor(restResult);
			const chatsPromise = this.#store.dispatch('chats/set', extractor.getChats());
			const filesPromise = this.#store.dispatch('files/set', extractor.getFiles());
			const autoDeletePromise = this.#store.dispatch('chats/autoDelete/set', extractor.getAutoDeleteConfig());
			const userManager = new im_v2_lib_user.UserManager();
			const usersPromise = Promise.all([this.#store.dispatch('users/set', extractor.getUsers()), userManager.addUsersToModel(extractor.getAdditionalUsers())]);
			const messagesPromise = Promise.all([this.#store.dispatch('messages/setChatCollection', {
				messages: extractor.getMessages(),
				clearCollection: true
			}), this.#store.dispatch('messages/store', extractor.getMessagesToStore()), this.#store.dispatch('messages/pin/setPinned', {
				chatId: extractor.getChatId(),
				pinnedMessages: extractor.getPinnedMessageIds()
			}), this.#store.dispatch('messages/reactions/set', extractor.getReactions()), this.#store.dispatch('messages/comments/set', extractor.getCommentInfo())]);
			const copilotManager = new im_v2_lib_copilot.CopilotManager();
			const copilotPromise = copilotManager.handleChatLoadResponse(extractor.getCopilot());
			const collabPromise = this.#store.dispatch('chats/collabs/set', {
				chatId: extractor.getChatId(),
				collabInfo: extractor.getCollabInfo()
			});
			const stickersPromise = Promise.all([this.#store.dispatch('stickers/messages/set', extractor.getStickerMessages()), this.#store.dispatch('stickers/set', extractor.getStickers())]);
			const builderPromise = this.#store.dispatch('messages/builder/set', extractor.getMessages());
			const customPromises = this.updateChatCustomModels(restResult);
			await Promise.all([chatsPromise, filesPromise, usersPromise, messagesPromise, copilotPromise, collabPromise, autoDeletePromise, stickersPromise, builderPromise, ...customPromises]);
			return {
				dialogId: extractor.getDialogId(),
				chatId: extractor.getChatId()
			};
		}
		#needLayoutRedirect(actionResult) {
			return this.#needRedirectToOpenLinesLayout(actionResult);
		}
		#redirectToLayout(actionResult) {
			const extractor = new ChatDataExtractor(actionResult);
			im_v2_lib_layout.LayoutManager.getInstance().setLastOpenedElement(im_v2_const.Layout.chat, '');
			if (this.#needRedirectToOpenLinesLayout(actionResult)) {
				return im_public.Messenger.openLines(extractor.getDialogId());
			}
			return Promise.resolve();
		}
		#needRedirectToOpenLinesLayout(actionResult) {
			const optionOpenLinesV2Activated = im_v2_lib_feature.FeatureManager.isFeatureAvailable(im_v2_lib_feature.Feature.openLinesV2);
			if (optionOpenLinesV2Activated) {
				return false;
			}
			const extractor = new ChatDataExtractor(actionResult);
			return extractor.isOpenlinesChat() && main_core.Type.isStringFilled(extractor.getDialogId());
		}
		#isTariffError(actionResult) {
			const errors = new Set([im_v2_const.ErrorCode.collabV2.tariffRestricted]);
			return errors.has(actionResult.code);
		}
		#checkCollabFeatureDisabled(actionResult) {
			const extractor = new ChatDataExtractor(actionResult);
			return extractor.isCollabChat() && !im_v2_lib_feature.TariffManager.collab.isAvailable();
		}
		#checkFeatureDisabled(actionResult) {
			return this.#isTariffError(actionResult) || this.#checkCollabFeatureDisabled(actionResult);
		}
		#openFeatureSlider(actionResult) {
			if (actionResult.code === im_v2_const.ErrorCode.collabV2.tariffRestricted) {
				im_v2_lib_feature.TariffManager.collabV2.openFeatureSlider();
				return;
			}
			im_v2_lib_feature.TariffManager.collab.openFeatureSlider();
		}
	}

	class CreateService {
		async createChat(chatConfig) {
			im_v2_lib_logger.Logger.warn('ChatService: createChat', chatConfig);
			const preparedFields = await this.#prepareFields(chatConfig);
			const payload = {
				data: {
					fields: preparedFields
				}
			};
			const createResult = await im_v2_lib_rest.runAction(im_v2_const.RestMethod.imV2ChatAdd, payload).catch(([error]) => {
				console.error('ChatService: createChat error:', error);
				im_v2_lib_notifier.Notifier.chat.handleCreateError(error.error());
				throw error;
			});
			const {
				chatId: newChatId
			} = createResult;
			im_v2_lib_logger.Logger.warn('ChatService: createChat result', newChatId);
			const newDialogId = im_v2_lib_utils.Utils.dialog.buildChatDialogId(newChatId);
			this.#addChatToModel(newDialogId, chatConfig);
			im_v2_lib_analytics.Analytics.getInstance().ignoreNextChatOpen(newDialogId);
			return {
				newDialogId,
				newChatId
			};
		}
		async createCollab(collabConfig) {
			im_v2_lib_logger.Logger.warn('ChatService: createCollab', collabConfig);
			const preparedFields = await this.#prepareFields(collabConfig);
			const params = {
				ownerId: preparedFields.ownerId,
				name: preparedFields.title,
				description: preparedFields.description,
				avatarId: preparedFields.avatar,
				moderatorMembers: im_v2_lib_utils.Utils.user.prepareSelectorIds(collabConfig.moderatorMembers),
				permissions: collabConfig.permissions,
				options: {
					...collabConfig.options,
					messagesAutoDeleteDelay: preparedFields.messagesAutoDeleteDelay
				}
			};
			const createResult = await im_v2_lib_rest.runAction(im_v2_const.RestMethod.socialnetworkCollabCreate, {
				data: params
			}).catch(([error]) => {
				console.error('ChatService: createCollab error:', error);
				im_v2_lib_notifier.Notifier.collab.handleCreateError(error);
				throw error;
			});
			const {
				chatId: newChatId
			} = createResult;
			im_v2_lib_logger.Logger.warn('ChatService: createCollab result', newChatId);
			const newDialogId = im_v2_lib_utils.Utils.dialog.buildChatDialogId(newChatId);
			this.#addCollabToModel(newDialogId, preparedFields);
			im_v2_lib_analytics.Analytics.getInstance().ignoreNextChatOpen(newDialogId);
			return {
				newDialogId,
				newChatId
			};
		}
		async #prepareFields(chatConfig) {
			const preparedConfig = {
				...chatConfig
			};
			if (preparedConfig.type) {
				preparedConfig.type = this.#prepareType(preparedConfig.type);
			}
			if (preparedConfig.entityType) {
				preparedConfig.entityType = this.#prepareType(preparedConfig.entityType);
			}
			if (preparedConfig.avatar) {
				preparedConfig.avatar = await im_v2_lib_utils.Utils.file.getBase64(chatConfig.avatar);
			}
			return preparedConfig;
		}
		#addCollabToModel(newDialogId, collabConfig) {
			void im_v2_application_core.Core.getStore().dispatch('chats/set', {
				dialogId: newDialogId,
				type: im_v2_const.ChatType.collab,
				name: collabConfig.title
			});
		}
		#addChatToModel(newDialogId, chatConfig) {
			let chatType = chatConfig.searchable ? im_v2_const.ChatType.open : im_v2_const.ChatType.chat;
			if (main_core.Type.isStringFilled(chatConfig.entityType)) {
				chatType = chatConfig.entityType;
			}
			if (main_core.Type.isStringFilled(chatConfig.type)) {
				chatType = chatConfig.type;
			}
			void im_v2_application_core.Core.getStore().dispatch('chats/set', {
				dialogId: newDialogId,
				type: chatType,
				name: chatConfig.title,
				role: im_v2_lib_roleManager.getChatRoleForUser(chatConfig),
				parentChatId: chatConfig.parentChatId ?? 0,
				permissions: {
					manageUi: chatConfig.manageUi,
					manageSettings: chatConfig.manageSettings,
					manageUsersAdd: chatConfig.manageUsersAdd,
					manageUsersDelete: chatConfig.manageUsersDelete,
					manageMessages: chatConfig.manageMessages,
					manageGuestInvites: chatConfig.manageGuestInvites
				}
			});
		}
		#prepareType(type) {
			return im_v2_lib_utils.Utils.text.convertCamelToSnakeCase(type).toUpperCase();
		}
	}

	class UpdateService {
		async prepareAvatar(avatarFile) {
			if (!ui_uploader_core.isResizableImage(avatarFile)) {
				return Promise.reject(new Error('UpdateService: prepareAvatar: incorrect image'));
			}
			const MAX_AVATAR_SIZE = 180;
			const {
				preview: resizedAvatar
			} = await ui_uploader_core.resizeImage(avatarFile, {
				width: MAX_AVATAR_SIZE,
				height: MAX_AVATAR_SIZE
			});
			return resizedAvatar;
		}
		async changeAvatar(chatId, avatarFile) {
			im_v2_lib_logger.Logger.warn('ChatService: changeAvatar', chatId, avatarFile);
			const avatarInBase64 = await im_v2_lib_utils.Utils.file.getBase64(avatarFile);
			return im_v2_lib_rest.runAction(im_v2_const.RestMethod.imV2ChatUpdateAvatar, {
				data: {
					id: chatId,
					avatar: avatarInBase64
				}
			}).catch(([error]) => {
				console.error('ChatService: changeAvatar error:', error);
			});
		}
		async updateChat(chatId, chatConfig) {
			im_v2_lib_logger.Logger.warn(`ChatService: updateChat, chatId: ${chatId}`, chatConfig);
			const preparedFields = await this.#prepareFields(chatConfig);
			const payload = {
				id: chatId,
				fields: preparedFields
			};
			const updateResult = await im_v2_lib_rest.runAction(im_v2_const.RestMethod.imV2ChatUpdate, {
				data: payload
			}).catch(([error]) => {
				console.error('ChatService: updateChat error:', error);
				im_v2_lib_notifier.Notifier.chat.onUpdateError();
				throw error;
			});
			im_v2_lib_logger.Logger.warn('ChatService: updateChat result', updateResult);
			const dialogId = im_v2_lib_utils.Utils.dialog.buildChatDialogId(chatId);
			await this.#updateChatInModel(dialogId, chatConfig);
			return updateResult;
		}
		async updateCollab(dialogId, collabConfig) {
			im_v2_lib_logger.Logger.warn(`ChatService: updateCollab, dialogId: ${dialogId}`, collabConfig);
			const preparedFields = await this.#prepareFields(collabConfig);
			let payload = {
				dialogId,
				name: preparedFields.title,
				description: preparedFields.description,
				avatarId: preparedFields.avatar
			};
			if (collabConfig.groupSettings) {
				const groupSettings = collabConfig.groupSettings;
				payload = {
					...payload,
					ownerId: groupSettings.ownerId,
					addModeratorMembers: im_v2_lib_utils.Utils.user.prepareSelectorIds(groupSettings.addModeratorMembers),
					deleteModeratorMembers: im_v2_lib_utils.Utils.user.prepareSelectorIds(groupSettings.deleteModeratorMembers),
					permissions: groupSettings.permissions,
					options: groupSettings.options
				};
			}
			const updateResult = await im_v2_lib_rest.runAction(im_v2_const.RestMethod.socialnetworkCollabUpdate, {
				data: payload
			}).catch(([error]) => {
				console.error('ChatService: updateCollab error:', error);
				im_v2_lib_notifier.Notifier.collab.handleUpdateError(error);
				throw error;
			});
			im_v2_lib_logger.Logger.warn('ChatService: updateCollab result', updateResult);
			return updateResult;
		}
		async getMemberEntities(chatId) {
			return im_v2_lib_rest.runAction(im_v2_const.RestMethod.imV2ChatMemberEntitiesList, {
				data: {
					chatId
				}
			}).catch(([error]) => {
				console.error('ChatService: getMemberEntities error:', error);
			});
		}
		async #prepareFields(chatConfig) {
			const preparedConfig = {
				...chatConfig
			};
			if (preparedConfig.avatar) {
				preparedConfig.avatar = await im_v2_lib_utils.Utils.file.getBase64(chatConfig.avatar);
			}
			return preparedConfig;
		}
		#updateChatInModel(dialogId, chatConfig) {
			const permissions = {
				manageUi: chatConfig.manageUi,
				manageSettings: chatConfig.manageSettings,
				manageUsersAdd: chatConfig.manageUsersAdd,
				manageUsersDelete: chatConfig.manageUsersDelete,
				manageMessages: chatConfig.manageMessages,
				manageGuestInvites: chatConfig.manageGuestInvites
			};
			// do not pass keys the form did not set: during the deep merge in the model
			// undefined would overwrite previously stored values (manageGuestInvites/manageSettings)
			Object.keys(permissions).forEach(key => {
				if (permissions[key] === undefined) {
					delete permissions[key];
				}
			});
			return im_v2_application_core.Core.getStore().dispatch('chats/update', {
				dialogId,
				fields: {
					name: chatConfig.title,
					description: chatConfig.description,
					ownerId: chatConfig.ownerId,
					role: im_v2_lib_roleManager.getChatRoleForUser(chatConfig),
					permissions
				}
			});
		}
	}

	class RenameService {
		#store;
		#restClient;
		constructor() {
			this.#store = im_v2_application_core.Core.getStore();
			this.#restClient = im_v2_application_core.Core.getRestClient();
		}
		renameChat(dialogId, newName) {
			im_v2_lib_logger.Logger.warn('ChatService: renameChat', dialogId, newName);
			if (newName === '') {
				return Promise.resolve();
			}
			const dialog = this.#store.getters['chats/get'](dialogId);
			const oldName = dialog.name;
			this.#updateChatTitleInModel(dialogId, newName);
			return this.#restClient.callMethod(im_v2_const.RestMethod.imChatUpdateTitle, {
				dialog_id: dialogId,
				title: newName
			}).catch(result => {
				this.#updateChatTitleInModel(dialogId, oldName);
				console.error('ChatService: renameChat error', result.error());
				im_v2_lib_notifier.Notifier.chat.onRenameError();
			});
		}
		#updateChatTitleInModel(dialogId, title) {
			this.#store.dispatch('chats/update', {
				dialogId,
				fields: {
					name: title
				}
			});
		}
	}

	class MuteService {
		#store;
		#restClient;
		#sendMuteRequestDebounced;
		constructor() {
			this.#store = im_v2_application_core.Core.getStore();
			this.#restClient = im_v2_application_core.Core.getRestClient();
			const DEBOUNCE_TIME = 500;
			this.#sendMuteRequestDebounced = main_core.Runtime.debounce(this.#sendMuteRequest, DEBOUNCE_TIME);
		}
		muteChat(dialogId) {
			im_v2_lib_logger.Logger.warn('ChatService: muteChat', dialogId);
			void this.#store.dispatch('chats/mute', {
				dialogId
			});
			const queryParams = {
				dialog_id: dialogId,
				action: 'Y'
			};
			this.#sendMuteRequestDebounced(queryParams);
		}
		unmuteChat(dialogId) {
			im_v2_lib_logger.Logger.warn('ChatService: unmuteChat', dialogId);
			void this.#store.dispatch('chats/unmute', {
				dialogId
			});
			const queryParams = {
				dialog_id: dialogId,
				action: 'N'
			};
			this.#sendMuteRequestDebounced(queryParams);
		}
		#sendMuteRequest(queryParams) {
			const {
				dialog_id: dialogId,
				action
			} = queryParams;
			return this.#restClient.callMethod(im_v2_const.RestMethod.imChatMute, queryParams).catch(result => {
				const actionText = action === 'Y' ? 'muting' : 'unmuting';
				console.error(`Im.RecentList: error ${actionText} chat`, result.error());
				const actionType = action === 'Y' ? 'chats/unmute' : 'chats/mute';
				void this.#store.dispatch(actionType, {
					dialogId
				});
			});
		}
	}

	class PinService {
		#store;
		constructor() {
			this.#store = im_v2_application_core.Core.getStore();
		}
		pinChat(dialogId) {
			im_v2_lib_logger.Logger.warn('PinService: pinChat', dialogId);
			void this.#store.dispatch('recent/pin', {
				dialogId,
				action: true
			});
			im_v2_lib_rest.runAction(im_v2_const.RestMethod.imV2RecentPin, {
				data: {
					dialogId
				}
			}).catch(([error]) => {
				console.error('PinService: error pinning chat', error);
				im_v2_lib_notifier.Notifier.recent.handlePinError(error);
				void this.#store.dispatch('recent/pin', {
					dialogId,
					action: false
				});
			});
		}
		unpinChat(dialogId) {
			im_v2_lib_logger.Logger.warn('PinService: unpinChat', dialogId);
			void this.#store.dispatch('recent/pin', {
				dialogId,
				action: false
			});
			im_v2_lib_rest.runAction(im_v2_const.RestMethod.imV2RecentUnpin, {
				data: {
					dialogId
				}
			}).catch(([error]) => {
				console.error('PinService: error unpinning chat', error);
				im_v2_lib_notifier.Notifier.recent.onUnpinError();
				void this.#store.dispatch('recent/pin', {
					dialogId,
					action: true
				});
			});
		}
	}

	const READ_TIMEOUT = 300;
	class ReadService {
		#store;
		#restClient;
		#messagesToRead = {};
		constructor() {
			this.#store = im_v2_application_core.Core.getStore();
			this.#restClient = im_v2_application_core.Core.getRestClient();
		}
		readAllByType(type) {
			const counterClearHandlers = im_v2_lib_counter.CounterClearHandlersByChatType[type];
			if (counterClearHandlers) {
				counterClearHandlers.forEach(handler => {
					handler(type);
				});
			}
			im_v2_lib_rest.runAction(im_v2_const.RestMethod.imV2ChatReadAllByType, {
				data: {
					type
				}
			}).catch(([error]) => {
				console.error('ReadService: readAllByType error', error);
			});
		}
		readAll() {
			im_v2_lib_logger.Logger.warn('ReadService: readAll');
			im_v2_lib_counter.CounterClearActions.forEach(actionHandler => {
				void actionHandler();
			});
			im_v2_lib_rest.runAction(im_v2_const.RestMethod.imV2ChatReadAll).catch(([error]) => {
				console.error('ReadService: readAll error', error);
			});
		}
		readDialog(dialogId) {
			im_v2_lib_logger.Logger.warn('ReadService: readDialog', dialogId);
			const {
				chatId
			} = this.#store.getters['chats/get'](dialogId);
			void this.#store.dispatch('counters/clearById', {
				chatId
			});
			this.#restClient.callMethod(im_v2_const.RestMethod.imV2ChatRead, {
				dialogId
			}).catch(result => {
				console.error('ReadService: error reading chat', result.error());
			});
		}
		unreadDialog(dialogId) {
			im_v2_lib_logger.Logger.warn('ReadService: unreadDialog', dialogId);
			this.#restClient.callMethod(im_v2_const.RestMethod.imV2ChatUnread, {
				dialogId
			}).catch(result => {
				console.error('ReadService: error setting chat as unread', result.error());
			});
		}
		readMessage(chatId, messageId) {
			if (!this.#messagesToRead[chatId]) {
				this.#messagesToRead[chatId] = new Set();
			}
			this.#messagesToRead[chatId].add(messageId);
			clearTimeout(this.readTimeout);
			this.readTimeout = setTimeout(() => {
				Object.entries(this.#messagesToRead).forEach(([rawChatId, messageIds]) => {
					void this.#readMessagesForChat(rawChatId, messageIds);
				});
			}, READ_TIMEOUT);
		}
		async readChatQueuedMessages(chatId) {
			if (!this.#messagesToRead[chatId]) {
				return;
			}
			clearTimeout(this.readTimeout);
			void this.#readMessagesForChat(chatId, this.#messagesToRead[chatId]);
		}
		clearDialogMark(dialogId) {
			im_v2_lib_logger.Logger.warn('ReadService: clear dialog mark', dialogId);
			const {
				markedId,
				chatId
			} = this.#store.getters['chats/get'](dialogId);
			const unreadStatus = this.#store.getters['counters/getUnreadStatus'](chatId);
			if (markedId === 0 && !unreadStatus) {
				return;
			}
			void this.#store.dispatch('counters/setUnreadStatus', {
				chatId,
				status: false
			});
			void this.#store.dispatch('chats/update', {
				dialogId,
				fields: {
					markedId: 0
				}
			});
			this.#restClient.callMethod(im_v2_const.RestMethod.imV2ChatRead, {
				dialogId,
				onlyRecent: 'Y'
			}).catch(result => {
				console.error('ReadService: error clearing dialog mark', result.error());
			});
		}
		async #readMessagesForChat(rawChatId, messageIds) {
			const queueChatId = Number.parseInt(rawChatId, 10);
			im_v2_lib_logger.Logger.warn('ReadService: readMessages', messageIds);
			if (messageIds.size === 0) {
				return true;
			}
			const copiedMessageIds = [...messageIds];
			delete this.#messagesToRead[queueChatId];
			const readMessagesCount = await this.#readMessageOnClient(queueChatId, copiedMessageIds);
			im_v2_lib_logger.Logger.warn('ReadService: readMessage, need to reduce counter by', readMessagesCount);
			await this.#decreaseChatCounter(queueChatId, readMessagesCount);
			const readResult = await this.#readMessageOnServer(queueChatId, copiedMessageIds).catch(([error]) => {
				console.error('ReadService: error reading message', error);
			});
			this.#checkChatCounter(readResult);
			return true;
		}
		#readMessageOnClient(chatId, messageIds) {
			const maxMessageId = Math.max(...messageIds);
			const dialog = this.#getDialogByChatId(chatId);
			if (maxMessageId > dialog.lastReadId) {
				void this.#store.dispatch('chats/update', {
					dialogId: this.#getDialogIdByChatId(chatId),
					fields: {
						lastId: maxMessageId
					}
				});
			}
			return this.#store.dispatch('messages/readMessages', {
				chatId,
				messageIds
			});
		}
		#decreaseChatCounter(chatId, readMessagesCount) {
			const currentCounter = this.#store.getters['counters/getCounterByChatId'](chatId);
			const shouldSkipLocalUpdate = currentCounter >= im_v2_lib_counter.CounterManager.getCounterDisplayLimit();
			if (shouldSkipLocalUpdate) {
				return Promise.resolve();
			}
			let newCounter = currentCounter - readMessagesCount;
			if (newCounter < 0) {
				newCounter = 0;
			}
			return this.#store.dispatch('counters/setCounter', {
				chatId,
				counter: newCounter
			});
		}
		#readMessageOnServer(chatId, messageIds) {
			im_v2_lib_logger.Logger.warn('ReadService: readMessages on server', messageIds);
			return im_v2_lib_rest.runAction(im_v2_const.RestMethod.imV2ChatMessageRead, {
				data: {
					chatId,
					ids: messageIds,
					actionUuid: im_v2_lib_uuid.UuidManager.getInstance().getActionUuid()
				}
			});
		}
		#checkChatCounter(readResult) {
			if (!readResult) {
				return;
			}
			const {
				chatId,
				counter
			} = readResult;
			const currentCounter = this.#store.getters['counters/getCounterByChatId'](chatId);
			if (currentCounter > counter) {
				im_v2_lib_logger.Logger.warn('ReadService: counter from server is lower than local one', currentCounter, counter);
				void this.#store.dispatch('counters/setCounter', {
					chatId,
					counter
				});
			}
		}
		#getDialogIdByChatId(chatId) {
			const dialog = this.#store.getters['chats/getByChatId'](chatId);
			if (!dialog) {
				return 0;
			}
			return dialog.dialogId;
		}
		#getDialogByChatId(chatId) {
			return this.#store.getters['chats/getByChatId'](chatId);
		}
	}

	class UserService {
		#store;
		#restClient;
		constructor() {
			this.#store = im_v2_application_core.Core.getStore();
			this.#restClient = im_v2_application_core.Core.getRestClient();
		}
		async leaveChat(dialogId) {
			const queryParams = {
				dialogId,
				userId: im_v2_application_core.Core.getUserId()
			};
			try {
				await this.#restClient.callMethod(im_v2_const.RestMethod.imV2ChatDeleteUser, queryParams);
				this.#onChatLeave(dialogId);
			} catch (result) {
				console.error('UserService: leave chat error', result.error());
				im_v2_lib_notifier.Notifier.chat.handleLeaveError(result.error());
			}
		}
		async leaveCollab(dialogId) {
			const payload = {
				data: {
					dialogId
				}
			};
			try {
				await im_v2_lib_rest.runAction(im_v2_const.RestMethod.socialnetworkMemberLeave, payload);
				this.#onChatLeave(dialogId);
			} catch (errors) {
				console.error('UserService: leave collab error', errors[0]);
				im_v2_lib_notifier.Notifier.collab.onLeaveError();
			}
		}
		async kickUserFromChat(dialogId, userId) {
			const queryParams = {
				dialogId,
				userId
			};
			await this.#restClient.callMethod(im_v2_const.RestMethod.imV2ChatDeleteUser, queryParams).catch(result => {
				console.error('UserService: error kicking from chat', result.error());
				im_v2_lib_notifier.Notifier.chat.handleUserKickError(result.error());
			});
		}
		async kickUserFromCollab(dialogId, userId) {
			const members = im_v2_lib_utils.Utils.user.prepareSelectorIds(userId);
			const payload = {
				data: {
					dialogId,
					members
				}
			};
			await im_v2_lib_rest.runAction(im_v2_const.RestMethod.socialnetworkMemberDelete, payload).catch(([error]) => {
				console.error('UserService: error kicking from collab', error);
				im_v2_lib_notifier.Notifier.collab.onKickUserError();
			});
		}
		addToChat(addConfig) {
			const queryParams = {
				chat_id: addConfig.chatId,
				users: addConfig.members,
				hide_history: !addConfig.showHistory
			};
			return this.#restClient.callMethod(im_v2_const.RestMethod.imChatUserAdd, queryParams).catch(result => {
				console.error('UserService: error adding to chat', result.error());
				throw result.error();
			});
		}
		joinChat(dialogId) {
			im_v2_lib_logger.Logger.warn(`UserService: join chat ${dialogId}`);
			void this.#store.dispatch('chats/update', {
				dialogId,
				fields: {
					role: im_v2_const.UserRole.member
				}
			});
			this.#restClient.callMethod(im_v2_const.RestMethod.imV2ChatJoin, {
				dialogId
			}).catch(result => {
				console.error('UserService: error joining chat', result.error());
			});
		}
		addManager(dialogId, userId) {
			im_v2_lib_logger.Logger.warn(`UserService: add manager ${userId} to ${dialogId}`);
			const {
				managerList
			} = this.#store.getters['chats/get'](dialogId);
			if (managerList.includes(userId)) {
				return;
			}
			const newManagerList = [...managerList, userId];
			void this.#store.dispatch('chats/update', {
				dialogId,
				fields: {
					managerList: newManagerList
				}
			});
			const payload = {
				data: {
					dialogId,
					userIds: [userId]
				}
			};
			im_v2_lib_rest.runAction(im_v2_const.RestMethod.imV2ChatAddManagers, payload).catch(([error]) => {
				console.error('UserService: add manager error', error);
			});
		}
		removeManager(dialogId, userId) {
			im_v2_lib_logger.Logger.warn(`UserService: remove manager ${userId} from ${dialogId}`);
			const {
				managerList
			} = this.#store.getters['chats/get'](dialogId);
			if (!managerList.includes(userId)) {
				return;
			}
			const newManagerList = managerList.filter(managerId => managerId !== userId);
			void this.#store.dispatch('chats/update', {
				dialogId,
				fields: {
					managerList: newManagerList
				}
			});
			const payload = {
				data: {
					dialogId,
					userIds: [userId]
				}
			};
			im_v2_lib_rest.runAction(im_v2_const.RestMethod.imV2ChatDeleteManagers, payload).catch(([error]) => {
				console.error('UserService: remove manager error', error);
			});
		}
		#onChatLeave(dialogId) {
			void this.#store.dispatch('chats/update', {
				dialogId,
				fields: {
					inited: false,
					role: im_v2_const.UserRole.guest
				}
			});
			void this.#store.dispatch('recent/pin', {
				dialogId,
				action: false
			});
			void this.#store.dispatch('recent/hide', {
				dialogId
			});
			const chatIsOpened = this.#store.getters['application/isChatOpen'](dialogId);
			if (chatIsOpened) {
				im_v2_lib_layout.LayoutManager.getInstance().clearCurrentLayoutEntityId();
				void im_v2_lib_layout.LayoutManager.getInstance().deleteLastOpenedElementById(dialogId);
			}
		}
	}

	class MessagesAutoDeleteService {
		#store;
		#sendRequestDebounced;
		constructor() {
			this.#store = im_v2_application_core.Core.getStore();
			const DEBOUNCE_TIME = 500;
			this.#sendRequestDebounced = main_core.Runtime.debounce(this.#sendRequest, DEBOUNCE_TIME);
		}
		setDelay(dialogId, delay) {
			im_v2_lib_logger.Logger.warn('MessagesAutoDeleteService: setDelay', dialogId, delay);
			const chatId = this.#getChatId(dialogId);
			const previousDelay = this.#store.getters['chats/autoDelete/getDelay'](chatId);
			if (previousDelay === delay) {
				return;
			}
			void this.#store.dispatch('chats/autoDelete/set', {
				chatId,
				delay
			});
			this.#sendRequestDebounced({
				dialogId,
				delay,
				previousDelay
			});
		}
		async #sendRequest(queryParams) {
			const {
				dialogId,
				delay,
				previousDelay
			} = queryParams;
			try {
				const response = await im_v2_lib_rest.runAction(im_v2_const.RestMethod.imV2ChatSetMessagesAutoDeleteDelay, {
					data: {
						dialogId,
						hours: delay
					}
				});
				this.#handleResponse(delay, response);
			} catch (error) {
				console.error('MessagesAutoDeleteService: Error setting auto delete delay', error);
				void this.#store.dispatch('chats/autoDelete/set', {
					chatId: this.#getChatId(dialogId),
					delay: previousDelay
				});
			}
		}
		#handleResponse(delay, response) {
			const [config] = response.messagesAutoDeleteConfigs;
			// if we set some delay and server returns 0 delay, then auto delete is disabled by admin
			if (delay !== config.delay && config.delay === im_v2_const.AutoDeleteDelay.Off) {
				im_v2_lib_feature.TariffManager.messagesAutoDelete.openFeatureSlider();
			}
			void this.#store.dispatch('chats/autoDelete/set', {
				chatId: config.chatId,
				delay: config.delay
			});
		}
		#getChatId(dialogId) {
			return this.#store.getters['chats/get'](dialogId).chatId;
		}
	}

	class ChatService {
		#loadService;
		#createService;
		#updateService;
		#renameService;
		#muteService;
		#pinService;
		#readService;
		#userService;
		#deleteService;
		#messagesAutoDeleteService;
		constructor() {
			this.#initServices();
		}
		createLoadService() {
			return new LoadService();
		}

		// region 'load'
		loadChat(dialogId) {
			return this.#loadService.loadChat(dialogId);
		}
		loadChatByChatId(chatId) {
			return this.#loadService.loadChatByChatId(chatId);
		}
		loadChatWithMessages(dialogId) {
			return this.#loadService.loadChatWithMessages(dialogId);
		}
		loadChatWithContext(dialogId, messageId) {
			return this.#loadService.loadChatWithContext(dialogId, messageId);
		}
		loadCopilotDraftChat() {
			return this.#loadService.loadCopilotDraftChat();
		}
		loadComments(postId) {
			return this.#loadService.loadComments(postId);
		}
		loadCommentInfo(channelDialogId) {
			return this.#loadService.loadCommentInfo(channelDialogId);
		}
		prepareDialogId(dialogId) {
			return this.#loadService.prepareDialogId(dialogId);
		}
		clearChat(dialogId) {
			return this.#loadService.clearChat(dialogId);
		}
		// endregion 'load'

		// region 'create'
		createChat(chatConfig) {
			return this.#createService.createChat(chatConfig);
		}
		createCollab(collabConfig) {
			return this.#createService.createCollab(collabConfig);
		}
		extendToGroupChat(chatConfig) {
			const config = {
				title: null,
				description: null,
				...chatConfig
			};
			return this.#createService.createChat(config);
		}
		// endregion 'create'

		// region 'update'
		prepareAvatar(avatarFile) {
			return this.#updateService.prepareAvatar(avatarFile);
		}
		changeAvatar(chatId, avatarFile) {
			return this.#updateService.changeAvatar(chatId, avatarFile);
		}
		updateCollab(dialogId, collabConfig) {
			return this.#updateService.updateCollab(dialogId, collabConfig);
		}
		updateChat(chatId, chatConfig) {
			return this.#updateService.updateChat(chatId, chatConfig);
		}
		getMemberEntities(chatId) {
			return this.#updateService.getMemberEntities(chatId);
		}
		// endregion 'update'

		// region 'delete'
		deleteChat(dialogId) {
			return this.#deleteService.deleteChat(dialogId);
		}
		deleteCollab(dialogId) {
			return this.#deleteService.deleteCollab(dialogId);
		}
		// endregion 'delete'

		// region 'rename'
		renameChat(dialogId, newName) {
			return this.#renameService.renameChat(dialogId, newName);
		}
		// endregion 'rename'

		// region 'mute'
		muteChat(dialogId) {
			this.#muteService.muteChat(dialogId);
		}
		unmuteChat(dialogId) {
			this.#muteService.unmuteChat(dialogId);
		}
		// endregion 'mute'

		// region 'pin'
		pinChat(dialogId) {
			this.#pinService.pinChat(dialogId);
		}
		unpinChat(dialogId) {
			this.#pinService.unpinChat(dialogId);
		}
		// endregion 'pin'

		// region 'read'
		readAll() {
			this.#readService.readAll();
		}
		readAllByType(type) {
			this.#readService.readAllByType(type);
		}
		readDialog(dialogId) {
			this.#readService.readDialog(dialogId);
		}
		unreadDialog(dialogId) {
			this.#readService.unreadDialog(dialogId);
		}
		readMessage(chatId, messageId) {
			this.#readService.readMessage(chatId, messageId);
		}
		readChatQueuedMessages(chatId) {
			this.#readService.readChatQueuedMessages(chatId);
		}
		clearDialogMark(dialogId) {
			this.#readService.clearDialogMark(dialogId);
		}
		// endregion 'read'

		// region 'user'
		leaveChat(dialogId) {
			this.#userService.leaveChat(dialogId);
		}
		leaveCollab(dialogId) {
			this.#userService.leaveCollab(dialogId);
		}
		kickUserFromChat(dialogId, userId) {
			this.#userService.kickUserFromChat(dialogId, userId);
		}
		kickUserFromCollab(dialogId, userId) {
			this.#userService.kickUserFromCollab(dialogId, userId);
		}
		addToChat(addConfig) {
			return this.#userService.addToChat(addConfig);
		}
		joinChat(dialogId) {
			this.#userService.joinChat(dialogId);
		}
		addManager(dialogId, userId) {
			this.#userService.addManager(dialogId, userId);
		}
		removeManager(dialogId, userId) {
			this.#userService.removeManager(dialogId, userId);
		}
		// endregion 'user

		// region 'messages auto delete'
		setMessagesAutoDeleteDelay(dialogId, delay) {
			this.#messagesAutoDeleteService.setDelay(dialogId, delay);
		}
		// endregion 'messages auto delete'

		#initServices() {
			this.#loadService = this.createLoadService();
			this.#createService = new CreateService();
			this.#updateService = new UpdateService();
			this.#renameService = new RenameService();
			this.#muteService = new MuteService();
			this.#pinService = new PinService();
			this.#readService = new ReadService();
			this.#userService = new UserService();
			this.#deleteService = new DeleteService();
			this.#messagesAutoDeleteService = new MessagesAutoDeleteService();
		}
	}

	exports.ChatDataExtractor = ChatDataExtractor;
	exports.ChatService = ChatService;
	exports.LoadService = LoadService;

})(this.BX.Messenger.v2.Service = this.BX.Messenger.v2.Service || {}, BX?.Messenger?.v2?.Lib??{}, BX?.Messenger?.v2?.Const??{}, BX?.Messenger?.v2?.Lib??{}, BX?.Messenger?.v2?.Lib??{}, BX?.Messenger?.v2?.Application??{}, BX??{}, BX?.Call?.Lib??{}, BX?.Messenger?.v2?.Lib??{}, BX?.Messenger?.v2?.Lib??{}, BX?.Messenger?.v2?.Lib??{}, BX?.Messenger?.v2?.Lib??{}, BX?.Messenger?.v2?.Lib??{}, BX?.Messenger?.v2?.Lib??{}, BX?.Messenger?.v2?.Service??{}, BX?.Messenger?.v2?.Lib??{}, BX?.Messenger?.v2?.Lib??{}, BX?.UI?.Uploader??{}, BX?.Messenger?.v2?.Lib??{}, BX?.Messenger?.v2?.Lib??{});
//# sourceMappingURL=registry.bundle.js.map
