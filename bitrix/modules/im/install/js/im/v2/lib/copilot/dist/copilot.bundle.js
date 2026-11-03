/* eslint-disable */
this.BX = this.BX || {};
this.BX.Messenger = this.BX.Messenger || {};
this.BX.Messenger.v2 = this.BX.Messenger.v2 || {};
(function (exports, im_v2_application_core, im_v2_const, im_v2_lib_feature, im_v2_lib_inputAction, im_v2_lib_logger, im_v2_lib_permission, im_v2_lib_rest, im_v2_lib_utils, im_v2_provider_service_copilot) {
	'use strict';

	function isCopilotGenerationActive(message, store) {
		if (message.componentParams?.copilotGenerationActive === true) {
			return true;
		}

		// transitional fallback: older pending messages come without the flag
		const blocks = store.getters['messages/builder/getBlocks'](message.id);
		return blocks.some(block => block.type === im_v2_const.AiAssistantSearchBlockName);
	}
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
		draftChatRetryGetReal() {
			if (!this.#draftChatId) {
				return null;
			}
			this.#draftFetchPromise = this.#fetchDraftInBackground();
			return this.#draftFetchPromise;
		}
		getEmptyStateDraftKey() {
			return `bgpt-empty-state-${im_v2_application_core.Core.getSiteId()}-${im_v2_application_core.Core.getUserId()}`;
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
			const draftDialogId = this.#draftChatId;
			try {
				// Response goes through the shared LoadService pipeline (chats, messages, copilot/*, etc.)
				// and marks the chat as inited, so ChatOpener skips the redundant Chat.load on setLayout.
				const result = await new im_v2_provider_service_copilot.CopilotChatService().fetchDraftChat();
				const realDialogId = result?.dialogId ?? null;
				if (realDialogId) {
					this.#draftRealDialogId = realDialogId;
					// not awaited: the real dialog id must not wait for the save round-trip
					void this.#transferDraftMcpSelection(draftDialogId, realDialogId);
				}
				return realDialogId;
			} catch {
				return null;
			}
		}
		async #transferDraftMcpSelection(fromDialogId, toDialogId) {
			if (!im_v2_lib_feature.FeatureManager.isFeatureAvailable(im_v2_lib_feature.Feature.isAiAssistantMcpSelectionRestoreAvailable) || !fromDialogId) {
				return;
			}
			const mcpAuth = this.store.getters['copilot/chats/getMcpAuth'](fromDialogId);
			await this.store.dispatch('copilot/chats/migrate', {
				fromDialogId,
				toDialogId
			});
			if (!mcpAuth?.id) {
				return;
			}

			// saving a chat missing from the store would fail and drop the confirmation just migrated
			if (!this.store.getters['chats/get'](toDialogId)?.chatId) {
				im_v2_lib_logger.Logger.warn('CopilotManager: created chat is not in the store, mcp selection is kept locally');
				return;
			}
			void new im_v2_provider_service_copilot.McpSelection().save({
				dialogId: toDialogId,
				mcpAuth
			});
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
				// the chat payload carries the saved mcp selection, so chats are stored even without roles
				return this.store.dispatch('copilot/chats/set', chats);
			}
			return Promise.all([this.store.dispatch('copilot/setProvider', aiProvider), this.store.dispatch('copilot/roles/add', roles), this.store.dispatch('copilot/chats/set', chats), this.store.dispatch('copilot/messages/add', messages), this.store.dispatch('copilot/votes/add', this.#extractVotesFromMessages(messages))]);
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
			return Promise.all([this.store.dispatch('copilot/roles/add', roles), this.store.dispatch('copilot/chats/set', chats), this.store.dispatch('copilot/messages/add', messages), this.store.dispatch('copilot/votes/add', this.#extractVotesFromMessages(messages))]);
		}
		#extractVotesFromMessages(messages) {
			if (!Array.isArray(messages)) {
				return [];
			}
			const votes = [];
			for (const message of messages) {
				const vote = message?.vote;
				let value = null;
				if (vote?.like === true) {
					value = 'like';
				} else if (vote?.dislike === true) {
					value = 'dislike';
				}
				if (value === null) {
					continue;
				}
				votes.push({
					messageId: message.id,
					value
				});
			}
			return votes;
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
		isCopilotUniversalRole(dialogId) {
			const role = this.store.getters['copilot/chats/getRole'](dialogId);
			return role?.code === im_v2_const.CopilotRole.universalCode;
		}
		isMentionByClickAvailable(dialogId, authorId) {
			if (!this.isCopilotBot(authorId)) {
				return false;
			}
			const dialog = this.store.getters['chats/get'](dialogId, true);
			const allowedChatTypes = [im_v2_const.ChatType.chat, im_v2_const.ChatType.open, im_v2_const.ChatType.collab];
			if (!allowedChatTypes.includes(dialog.type)) {
				return false;
			}
			if (!im_v2_lib_feature.FeatureManager.isFeatureAvailable(im_v2_lib_feature.Feature.isCopilotMentionAvailable)) {
				return false;
			}
			if (!dialog.isTextareaEnabled) {
				return false;
			}

			// in bulk actions mode the panel of the mode replaces the textarea, so the insert event
			// has no consumer: a clickable name would answer the click with nothing
			if (this.store.getters['messages/select/isBulkActionsModeActive'](dialogId)) {
				return false;
			}
			return im_v2_lib_permission.PermissionManager.getInstance().canPerformActionByRole(im_v2_const.ActionByRole.send, dialogId);
		}
		isStopGenerationAvailable(dialogId) {
			if (!im_v2_lib_feature.FeatureManager.isFeatureAvailable(im_v2_lib_feature.Feature.isBitrixGptStopGenerationAvailable)) {
				return false;
			}
			if (!this.isCopilotChat(dialogId) || this.isGroupCopilotChat(dialogId)) {
				return false;
			}
			const generationState = this.store.getters['copilot/chats/getGenerationState'](dialogId);
			return generationState?.status === im_v2_const.CopilotGenerationStatus.generating;
		}
		async stopGeneration(dialogId) {
			// optimistic reset before the request: the button leaves the stop state,
			// so a rapid second click cannot fire another request
			void this.store.dispatch('copilot/chats/clearGenerationState', dialogId);
			try {
				const {
					status,
					initiatorId
				} = await im_v2_lib_rest.runAction(im_v2_const.RestMethod.imV2CopilotGenerationStop, {
					data: {
						dialogId
					}
				});
				void this.store.dispatch('copilot/chats/setGenerationState', {
					dialogId,
					generationState: {
						status,
						initiatorId
					}
				});
				if (status !== im_v2_const.CopilotGenerationStatus.generating) {
					this.stopCopilotTyping(dialogId);
				}
			} catch (error) {
				// the server rejected the stop request: the optimistic state is already
				// cleared, chat-load and pull will restore the truth
				im_v2_lib_logger.Logger.error('CopilotManager: stopGeneration failed', error);
			}
		}
		stopCopilotTyping(dialogId, expectedInputActions = null) {
			const inputActions = this.store.getters['chats/inputActions/getByDialogId'](dialogId);
			if (!inputActions) {
				return;
			}
			inputActions.forEach(inputAction => {
				if (expectedInputActions !== null && !expectedInputActions.includes(inputAction)) {
					return;
				}
				const {
					type,
					userId
				} = inputAction;
				if (type !== im_v2_lib_inputAction.InputAction.writing || !this.isCopilotBot(userId)) {
					return;
				}
				im_v2_lib_inputAction.InputActionListener.getInstance().stopAction({
					dialogId,
					userId
				});
			});
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
		isProcessingMessage(messageId) {
			const message = this.store.getters['messages/getById'](messageId);
			return message?.componentParams?.copilotProcess === true;
		}
		isErrorMessage(messageId) {
			const message = this.store.getters['messages/getById'](messageId);
			return message?.componentParams?.copilotError === true;
		}
		isMessageFooterAvailable(messageId) {
			return !this.isProcessingMessage(messageId) && !this.isErrorMessage(messageId);
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
	exports.isCopilotGenerationActive = isCopilotGenerationActive;

})(this.BX.Messenger.v2.Lib = this.BX.Messenger.v2.Lib || {}, BX.Messenger.v2.Application, BX.Messenger.v2.Const, BX.Messenger.v2.Lib, BX.Messenger.v2.Lib, BX.Messenger.v2.Lib, BX.Messenger.v2.Lib, BX.Messenger.v2.Lib, BX.Messenger.v2.Lib, BX.Messenger.v2.Service);
//# sourceMappingURL=copilot.bundle.js.map
