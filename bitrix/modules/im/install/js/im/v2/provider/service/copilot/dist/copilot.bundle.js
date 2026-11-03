/* eslint-disable */
this.BX = this.BX || {};
this.BX.Messenger = this.BX.Messenger || {};
this.BX.Messenger.v2 = this.BX.Messenger.v2 || {};
(function (exports, im_v2_const, im_v2_lib_logger, im_v2_provider_service_chat, im_v2_application_core, im_v2_provider_service_recent, im_v2_lib_rest, im_v2_lib_utils) {
	'use strict';

	class CopilotChatService {
		async createChat({
			roleCode,
			parentChatId
		}) {
			const chatService = new im_v2_provider_service_chat.ChatService();
			try {
				const config = {
					type: im_v2_const.ChatType.copilot,
					copilotMainRole: roleCode
				};
				if (parentChatId) {
					config.parentChatId = parentChatId;
				}
				const {
					newDialogId
				} = await chatService.createChat(config);
				await chatService.loadChatWithMessages(newDialogId);
				return newDialogId;
			} catch (error) {
				console.error('CopilotChatService: create chat error', error);
				throw error;
			}
		}
		createDefaultChat(parentChatId) {
			return this.createChat({
				roleCode: im_v2_const.CopilotRole.universalCode,
				parentChatId
			});
		}
		async fetchDraftChat() {
			try {
				return await new im_v2_provider_service_chat.ChatService().loadCopilotDraftChat();
			} catch (error) {
				im_v2_lib_logger.Logger.warn('CopilotChatService: fetchDraftChat failed', error);
				throw error;
			}
		}
	}

	class CopilotRecentService extends im_v2_provider_service_recent.LegacyRecentService {
		getQueryParams(firstPage) {
			return {
				ONLY_COPILOT: 'Y',
				LIMIT: this.itemsPerPage,
				LAST_MESSAGE_DATE: firstPage ? null : this.lastMessageDate,
				GET_ORIGINAL_TEXT: 'Y',
				PARSE_TEXT: 'Y'
			};
		}
		saveRecentItems(recentItems) {
			return im_v2_application_core.Core.getStore().dispatch('recent/setCollection', {
				type: im_v2_const.RecentType.copilot,
				items: recentItems
			});
		}
		getExtractorOptions() {
			return {
				withBirthdays: false
			};
		}
	}

	// a save or a clear that started later supersedes the one still in flight; the counter is shared by
	// all instances, because every caller works through its own McpSelection
	const selectionGenerations = new Map();
	class McpSelection {
		#store;
		constructor() {
			this.#store = im_v2_application_core.Core.getStore();
		}
		async save({
			dialogId,
			mcpAuth
		}) {
			const generation = this.#startGeneration(dialogId);
			if (im_v2_lib_utils.Utils.dialog.isTempAiAssistantDialogId(dialogId)) {
				// a draft chat lives on the client only: it is saved once transferred onto the created chat
				this.#applySelection({
					dialogId,
					mcpAuth,
					status: im_v2_const.CopilotMcpSelectionStatus.ready,
					confirmed: true
				});
				return;
			}
			const chatId = this.#getChatId(dialogId);
			if (!chatId) {
				this.#applySelection({
					dialogId,
					mcpAuth,
					status: im_v2_const.CopilotMcpSelectionStatus.error,
					confirmed: false
				});
				return;
			}
			const {
				auth: previousAuth,
				confirmed: wasPreviousConfirmed
			} = this.#getStoredSelection(dialogId);
			this.#applySelection({
				dialogId,
				mcpAuth,
				status: im_v2_const.CopilotMcpSelectionStatus.restoring,
				confirmed: false
			});
			try {
				const response = await im_v2_lib_rest.runAction(im_v2_const.RestMethod.imV2McpSelectionSave, {
					data: {
						chatId,
						authIds: [mcpAuth.id]
					}
				});
				if (this.#isSuperseded(dialogId, generation)) {
					return;
				}
				const confirmedAuth = this.#extractConfirmedAuth(response);
				if (!confirmedAuth) {
					this.#applySelection({
						dialogId,
						mcpAuth: previousAuth,
						status: im_v2_const.CopilotMcpSelectionStatus.unavailable,
						confirmed: wasPreviousConfirmed
					});
					return;
				}
				this.#applySelection({
					dialogId,
					mcpAuth: confirmedAuth,
					status: im_v2_const.CopilotMcpSelectionStatus.ready,
					confirmed: true
				});
			} catch (error) {
				im_v2_lib_logger.Logger.warn('McpSelection: save failed', error);
				if (this.#isSuperseded(dialogId, generation)) {
					return;
				}
				this.#applySelection({
					dialogId,
					mcpAuth: previousAuth,
					status: im_v2_const.CopilotMcpSelectionStatus.error,
					confirmed: wasPreviousConfirmed
				});
			}
		}
		async clear(dialogId) {
			const generation = this.#startGeneration(dialogId);
			if (im_v2_lib_utils.Utils.dialog.isTempAiAssistantDialogId(dialogId)) {
				this.#applySelection({
					dialogId,
					mcpAuth: null,
					status: im_v2_const.CopilotMcpSelectionStatus.ready,
					confirmed: false
				});
				return;
			}
			const chatId = this.#getChatId(dialogId);
			if (!chatId) {
				this.#applySelection({
					dialogId,
					mcpAuth: null,
					status: im_v2_const.CopilotMcpSelectionStatus.error,
					confirmed: false
				});
				return;
			}
			const {
				auth: previousAuth,
				confirmed: wasPreviousConfirmed
			} = this.#getStoredSelection(dialogId);
			this.#applySelection({
				dialogId,
				mcpAuth: null,
				status: im_v2_const.CopilotMcpSelectionStatus.restoring,
				confirmed: false
			});
			try {
				await im_v2_lib_rest.runAction(im_v2_const.RestMethod.imV2McpSelectionClear, {
					data: {
						chatId
					}
				});
				if (this.#isSuperseded(dialogId, generation)) {
					return;
				}
				this.#applySelection({
					dialogId,
					mcpAuth: null,
					status: im_v2_const.CopilotMcpSelectionStatus.ready,
					confirmed: false
				});
			} catch (error) {
				im_v2_lib_logger.Logger.warn('McpSelection: clear failed', error);
				if (this.#isSuperseded(dialogId, generation)) {
					return;
				}
				this.#applySelection({
					dialogId,
					mcpAuth: previousAuth,
					status: im_v2_const.CopilotMcpSelectionStatus.error,
					confirmed: wasPreviousConfirmed
				});
			}
		}
		#startGeneration(dialogId) {
			const generation = (selectionGenerations.get(dialogId) ?? 0) + 1;
			selectionGenerations.set(dialogId, generation);
			return generation;
		}
		#isSuperseded(dialogId, generation) {
			return selectionGenerations.get(dialogId) !== generation;
		}
		#applySelection({
			dialogId,
			mcpAuth,
			status,
			confirmed
		}) {
			if (mcpAuth) {
				void this.#store.dispatch('copilot/chats/setMcpAuth', {
					dialogId,
					mcpAuth,
					confirmed
				});
			} else {
				void this.#store.dispatch('copilot/chats/clearMcpAuth', dialogId);
			}
			void this.#store.dispatch('copilot/chats/setMcpSelectionStatus', {
				dialogId,
				status
			});
		}

		// an empty selection carries no confirmation, so the pair stays consistent for a rollback
		#getStoredSelection(dialogId) {
			const auth = this.#store.getters['copilot/chats/getMcpAuth'](dialogId);
			return {
				auth,
				confirmed: Boolean(auth) && this.#store.getters['copilot/chats/isMcpAuthConfirmed'](dialogId) === true
			};
		}
		#extractConfirmedAuth(response) {
			const auth = response?.auths?.[0];
			if (!auth?.id) {
				return null;
			}
			return {
				id: auth.id,
				name: auth.name,
				icon: auth.icon ?? null
			};
		}
		#getChatId(dialogId) {
			return this.#store.getters['chats/get'](dialogId)?.chatId ?? null;
		}
	}

	exports.CopilotChatService = CopilotChatService;
	exports.CopilotRecentService = CopilotRecentService;
	exports.McpSelection = McpSelection;

})(this.BX.Messenger.v2.Service = this.BX.Messenger.v2.Service || {}, BX.Messenger.v2.Const, BX.Messenger.v2.Lib, BX.Messenger.v2.Service, BX.Messenger.v2.Application, BX.Messenger.v2.Service, BX.Messenger.v2.Lib, BX.Messenger.v2.Lib);
//# sourceMappingURL=copilot.bundle.js.map
