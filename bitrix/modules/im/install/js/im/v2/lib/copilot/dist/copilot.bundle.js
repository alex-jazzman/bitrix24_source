/* eslint-disable */
this.BX = this.BX || {};
this.BX.Messenger = this.BX.Messenger || {};
this.BX.Messenger.v2 = this.BX.Messenger.v2 || {};
(function (exports, im_v2_application_core, im_v2_const, im_v2_lib_feature, im_v2_lib_utils, im_v2_provider_service_copilot) {
	'use strict';

	class CopilotManager {
		#draftChatId = null;
		#draftRealDialogId = null;
		#draftFetchPromise = null;
		constructor() {
			this.store = im_v2_application_core.Core.getStore();
		}
		draftChatCreate() {
			if (!im_v2_lib_feature.FeatureManager.isFeatureAvailable(im_v2_lib_feature.Feature.isCopilotDraftChatAvailable)) {
				return '';
			}
			if (this.#draftChatId) {
				return this.#draftChatId;
			}
			const draftChatId = im_v2_lib_utils.Utils.dialog.buildTempAiAssistantDialogId();
			this.#draftChatId = draftChatId;
			void this.store.dispatch('chats/add', {
				dialogId: draftChatId,
				type: im_v2_const.ChatType.copilot,
				role: im_v2_const.UserRole.member,
				isTextareaEnabled: true
			});
			void this.store.dispatch('copilot/chats/set', {
				dialogId: draftChatId,
				role: im_v2_const.CopilotRole.universalCode,
				aiModel: 'none',
				reasoningEnabled: false,
				forceSearchEnabled: false,
				agentModeEnabled: false,
				mcpAuth: null
			});
			this.#draftFetchPromise = this.#fetchDraftInBackground();
			return draftChatId;
		}
		draftChatGetRealPromise() {
			return this.#draftFetchPromise;
		}
		draftChatDispose() {
			if (!this.#draftChatId) {
				return;
			}
			const draftChatId = this.#draftChatId;
			this.#draftChatId = null;
			this.#draftRealDialogId = null;
			this.#draftFetchPromise = null;
			void this.store.dispatch('copilot/chats/delete', draftChatId);
			void this.store.dispatch('chats/delete', {
				dialogId: draftChatId
			});
		}
		async #fetchDraftInBackground() {
			try {
				// Response goes through the shared LoadService pipeline (chats, messages, copilot/*, etc.)
				// and marks the chat as inited, so ChatOpener skips the redundant Chat.load on setLayout.
				const result = await new im_v2_provider_service_copilot.CopilotChatService().fetchDraftChat();
				const realDialogId = result?.dialogId ?? null;
				if (realDialogId) {
					this.#draftRealDialogId = realDialogId;
				}
				return realDialogId;
			} catch {
				return null;
			}
		}
		async handleRecentListResponse(copilotData) {
			if (!copilotData) {
				return Promise.resolve();
			}
			const {
				roles,
				chats,
				messages
			} = copilotData;
			if (!roles) {
				return Promise.resolve();
			}
			return Promise.all([this.store.dispatch('copilot/chats/set', chats), this.store.dispatch('copilot/roles/add', roles), this.store.dispatch('copilot/messages/add', messages)]);
		}
		async handleChatLoadResponse(copilotData) {
			if (!copilotData) {
				return Promise.resolve();
			}
			const {
				aiProvider,
				chats,
				roles,
				messages
			} = copilotData;
			if (!roles) {
				return Promise.resolve();
			}
			return Promise.all([this.store.dispatch('copilot/setProvider', aiProvider), this.store.dispatch('copilot/roles/add', roles), this.store.dispatch('copilot/chats/set', chats), this.store.dispatch('copilot/messages/add', messages)]);
		}
		async handleRoleUpdate(copilotData) {
			const {
				chats,
				roles
			} = copilotData;
			if (!roles) {
				return Promise.resolve();
			}
			return Promise.all([this.store.dispatch('copilot/roles/add', roles), this.store.dispatch('copilot/chats/set', chats)]);
		}
		async handleMessageAdd(copilotData) {
			const {
				chats,
				roles,
				messages
			} = copilotData;
			if (!roles) {
				return Promise.resolve();
			}
			return Promise.all([this.store.dispatch('copilot/roles/add', roles), this.store.dispatch('copilot/chats/set', chats), this.store.dispatch('copilot/messages/add', messages)]);
		}
		getRoleAvatarUrl(payload) {
			const {
				avatarDialogId,
				contextDialogId
			} = payload;
			if (!this.isCopilotChatOrBot(avatarDialogId)) {
				return '';
			}
			return this.store.getters['copilot/chats/getRoleAvatar'](contextDialogId);
		}
		getDefaultAvatarUrl() {
			return this.store.getters['copilot/roles/getDefaultAvatar']();
		}
		isCopilotBot(userId) {
			return this.store.getters['users/bots/isCopilot'](userId);
		}
		isCopilotChat(dialogId) {
			return this.store.getters['chats/get'](dialogId)?.type === im_v2_const.ChatType.copilot;
		}
		isCopilotChatOrBot(dialogId) {
			return this.isCopilotChat(dialogId) || this.isCopilotBot(dialogId);
		}
		isGroupCopilotChat(dialogId) {
			const {
				userCounter
			} = this.store.getters['chats/get'](dialogId);
			return this.isCopilotChat(dialogId) && userCounter > 2;
		}
		isCopilotMessage(messageId) {
			const message = this.store.getters['messages/getById'](messageId);
			if (!message) {
				return false;
			}
			if (this.isCopilotBot(message.authorId)) {
				return true;
			}
			return message.componentId === im_v2_const.MessageComponent.copilotCreation;
		}
		getMessageRoleAvatar(messageId) {
			return this.store.getters['copilot/messages/getRole'](messageId)?.avatar?.medium;
		}
		getNameWithRole(messageId) {
			const copilotName = this.getName();
			const {
				default: isDefaultRole,
				name: roleName
			} = this.store.getters['copilot/messages/getRole'](messageId);
			if (isDefaultRole) {
				return copilotName;
			}
			return `${copilotName} (${roleName})`;
		}
		getName() {
			return this.store.getters['copilot/getName'];
		}
		getAIModelName(dialogId) {
			const currentAIModel = im_v2_application_core.Core.getStore().getters['copilot/chats/getAIModel'](dialogId);
			return currentAIModel.name;
		}
	}

	exports.CopilotManager = CopilotManager;

})(this.BX.Messenger.v2.Lib = this.BX.Messenger.v2.Lib || {}, BX.Messenger.v2.Application, BX.Messenger.v2.Const, BX.Messenger.v2.Lib, BX.Messenger.v2.Lib, BX.Messenger.v2.Service);
//# sourceMappingURL=copilot.bundle.js.map
