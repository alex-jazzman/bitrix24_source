import { Type, type JsonObject } from 'main.core';
import { BuilderModel, type GetterTree, type ActionTree, type MutationTree, type Store } from 'ui.vue3.vuex';

import { Core } from 'im.v2.application.core';
import { Utils } from 'im.v2.lib.utils';
import { ChatType, CopilotGenerationStatus, CopilotMcpSelectionStatus } from 'im.v2.const';

import {
	type ImModelCopilotAIModel,
	type ImModelCopilotRole,
	type ImModelCopilotMcpAuth,
	type ImModelCopilotGenerationState,
} from '../../../registry';
import { formatFieldsWithConfig } from '../../../utils/validate';
import { chatFieldsConfig } from './field-config';

type ChatsState = {
	collection: {[dialogId: string]: CopilotChat},
	aiContentDialogs: {[dialogId: string]: boolean},
}

type CopilotChat = {
	dialogId: string,
	role: string,
	aiModel: string,
	titleIsCustom: boolean,
	reasoningEnabled: boolean,
	forceSearchEnabled: boolean,
	agentModeEnabled: boolean,
	mcpAuth: ?ImModelCopilotMcpAuth,
	mcpAuthConfirmed: boolean,
	mcpSelectionStatus: string,
	mcpSelectionLoaded: boolean,
	generationState: ?ImModelCopilotGenerationState,
}

type SetMcpAuthPayload = {
	dialogId: string,
	mcpAuth: ImModelCopilotMcpAuth,
	confirmed: boolean,
}

const AI_MODEL_DEFAULT_NAME = 'none';

/* eslint-disable no-param-reassign */
export class ChatsModel extends BuilderModel
{
	getState(): ChatsState
	{
		return {
			collection: {},
			aiContentDialogs: {},
		};
	}

	getElementState(): CopilotChat
	{
		return {
			dialogId: '',
			role: '',
			aiModel: '',
			titleIsCustom: false,
			reasoningEnabled: false,
			forceSearchEnabled: false,
			agentModeEnabled: false,
			mcpAuth: null,
			mcpAuthConfirmed: false,
			mcpSelectionStatus: CopilotMcpSelectionStatus.ready,
			mcpSelectionLoaded: false,
			generationState: null,
		};
	}

	getGetters(): GetterTree<ChatsState>
	{
		return {
			/** @function copilot/chats/getRole */
			getRole: (state: ChatsState) => (dialogId: string): ?ImModelCopilotRole => {
				const chat = state.collection[dialogId];
				if (!chat)
				{
					return null;
				}

				return Core.getStore().getters['copilot/roles/getByCode'](chat.role);
			},
			/** @function copilot/chats/getRoleAvatar */
			getRoleAvatar: (state: ChatsState, getters) => (dialogId: string): string => {
				const role = getters.getRole(dialogId);
				if (!role)
				{
					return '';
				}

				return Core.getStore().getters['copilot/roles/getAvatar'](role.code);
			},
			/** @function copilot/chats/getAIModel */
			getAIModel: (state: ChatsState) => (dialogId: string): ?ImModelCopilotAIModel => {
				const chat = state.collection[dialogId];
				if (!chat)
				{
					return null;
				}

				const aiModelList = Core.getStore().getters['copilot/getAIModels'];

				const currentAiModel = aiModelList.find((aiModel) => aiModel.code === chat.aiModel);

				return currentAiModel ?? AI_MODEL_DEFAULT_NAME;
			},
			/** @function copilot/chats/titleIsCustom */
			titleIsCustom: (state: ChatsState) => (dialogId: string): boolean => {
				const chat = state.collection[dialogId];
				if (!chat)
				{
					return false;
				}

				return state.collection[dialogId].titleIsCustom;
			},
			/** @function copilot/chats/isReasoningEnabled */
			isReasoningEnabled: (state: ChatsState) => (dialogId: string): boolean => {
				const chat = state.collection[dialogId];
				if (!chat)
				{
					return false;
				}

				return state.collection[dialogId].reasoningEnabled;
			},
			/** @function copilot/chats/isForceSearchEnabled */
			isForceSearchEnabled: (state: ChatsState) => (dialogId: string): boolean => {
				const chat = state.collection[dialogId];
				if (!chat)
				{
					return false;
				}

				return state.collection[dialogId].forceSearchEnabled;
			},
			/** @function copilot/chats/isAgentModeEnabled */
			isAgentModeEnabled: (state: ChatsState) => (dialogId: string): boolean => {
				const chat = state.collection[dialogId];
				if (!chat)
				{
					return false;
				}

				return state.collection[dialogId].agentModeEnabled;
			},
			/** @function copilot/chats/getGenerationState */
			getGenerationState: (state: ChatsState) => (dialogId: string): ?ImModelCopilotGenerationState => {
				return state.collection[dialogId]?.generationState ?? null;
			},
			/** @function copilot/chats/getMcpAuth */
			getMcpAuth: (state: ChatsState) => (dialogId: string): ?ImModelCopilotMcpAuth => {
				const chat = state.collection[dialogId];
				if (!chat)
				{
					return null;
				}

				return chat.mcpAuth;
			},
			/** @function copilot/chats/isMcpAuthConfirmed */
			isMcpAuthConfirmed: (state: ChatsState) => (dialogId: string): boolean => {
				return state.collection[dialogId]?.mcpAuthConfirmed === true;
			},
			/** @function copilot/chats/getMcpSelectionStatus */
			getMcpSelectionStatus: (state: ChatsState) => (dialogId: string): string => {
				const chat = state.collection[dialogId];
				if (!chat?.mcpSelectionLoaded)
				{
					return CopilotMcpSelectionStatus.restoring;
				}

				return chat.mcpSelectionStatus;
			},
			/** @function copilot/chats/isMcpSelectionLoaded */
			isMcpSelectionLoaded: (state: ChatsState) => (dialogId: string): boolean => {
				return state.collection[dialogId]?.mcpSelectionLoaded === true;
			},
			/** @function copilot/chats/isTempChat */
			isTempChat: () => (dialogId: string): boolean => {
				return Utils.dialog.isTempAiAssistantDialogId(dialogId);
			},
			/** @function copilot/chats/hasAiGeneratedContent */
			hasAiGeneratedContent: (state: ChatsState) => (dialogId: string): boolean => {
				if (state.aiContentDialogs[dialogId])
				{
					return true;
				}

				const dialog = Core.getStore().getters['chats/get'](dialogId);

				return dialog?.type === ChatType.copilot;
			},
		};
	}

	// eslint-disable-next-line max-lines-per-function
	getActions(): ActionTree<ChatsState>
	{
		return {
			/** @function copilot/chats/set */
			set: (store: Store, payload) => {
				if (!payload)
				{
					return;
				}

				const chatsToAdd = Type.isArrayFilled(payload) ? payload : [payload];

				const preparedChats = chatsToAdd.map((chat) => {
					return this.formatFields(chat);
				});

				preparedChats.forEach((chat) => {
					const loadedChat = this.#withServerSelectionState(chat);
					const existingItem = store.state.collection[chat.dialogId];
					if (existingItem)
					{
						store.commit('update', {
							dialogId: chat.dialogId,
							fields: loadedChat,
						});

						return;
					}

					store.commit('add', {
						dialogId: chat.dialogId,
						fields: { ...this.getElementState(), ...loadedChat },
					});
				});
			},
			/** @function copilot/chats/updateModel */
			updateModel: (store: Store, payload: { dialogId: string, aiModel: string }) => {
				if (!payload || !store.state.collection[payload.dialogId])
				{
					return;
				}

				store.commit('updateModel', payload);
			},
			/** @function copilot/chats/setTitleIsCustom */
			setTitleIsCustom: (store: Store, payload: { dialogId: string, titleIsCustom: boolean }) => {
				if (!payload || !store.state.collection[payload.dialogId])
				{
					return;
				}

				store.commit('setTitleIsCustom', payload);
			},
			/** @function copilot/chats/toggleReasoning */
			toggleReasoning: (store: Store, dialogId: string) => {
				if (!store.state.collection[dialogId])
				{
					return;
				}

				store.commit('toggleReasoning', dialogId);
			},
			/** @function copilot/chats/toggleForceSearch */
			toggleForceSearch: (store: Store, dialogId: string) => {
				if (!store.state.collection[dialogId])
				{
					return;
				}

				store.commit('toggleForceSearch', dialogId);
			},
			/** @function copilot/chats/toggleAgentMode */
			toggleAgentMode: (store: Store, dialogId: string) => {
				if (!store.state.collection[dialogId])
				{
					return;
				}

				store.commit('toggleAgentMode', dialogId);
			},
			/** @function copilot/chats/setGenerationState */
			setGenerationState: (store: Store, payload: { dialogId: string, generationState: ?ImModelCopilotGenerationState }) => {
				const { dialogId, generationState } = payload ?? {};
				if (!Type.isStringFilled(dialogId))
				{
					return;
				}

				// only the active generation is kept; any terminal status clears the state
				if (generationState?.status !== CopilotGenerationStatus.generating)
				{
					if (store.state.collection[dialogId])
					{
						store.commit('setGenerationState', { dialogId, generationState: null });
					}

					return;
				}

				const preparedState = {
					status: CopilotGenerationStatus.generating,
					initiatorId: Number(generationState.initiatorId) || 0,
				};

				if (store.state.collection[dialogId])
				{
					store.commit('setGenerationState', { dialogId, generationState: preparedState });

					return;
				}

				store.commit('add', {
					dialogId,
					fields: { ...this.getElementState(), dialogId, generationState: preparedState },
				});
			},
			/** @function copilot/chats/clearGenerationState */
			clearGenerationState: (store: Store, dialogId: string) => {
				if (!store.state.collection[dialogId])
				{
					return;
				}

				store.commit('setGenerationState', { dialogId, generationState: null });
			},
			/** @function copilot/chats/setMcpAuth */
			setMcpAuth: (store: Store, payload: SetMcpAuthPayload) => {
				const { dialogId } = payload ?? {};
				if (!Type.isStringFilled(dialogId))
				{
					return;
				}

				this.#addChatIfMissing(store, dialogId);
				store.commit('setMcpAuth', payload);
			},
			/** @function copilot/chats/clearMcpAuth */
			clearMcpAuth: (store: Store, dialogId: string) => {
				if (!Type.isStringFilled(dialogId))
				{
					return;
				}

				this.#addChatIfMissing(store, dialogId);
				store.commit('clearMcpAuth', dialogId);
			},
			/** @function copilot/chats/setMcpSelectionStatus */
			setMcpSelectionStatus: (store: Store, payload: { dialogId: string, status: string }) => {
				const { dialogId } = payload ?? {};
				if (!Type.isStringFilled(dialogId))
				{
					return;
				}

				this.#addChatIfMissing(store, dialogId);
				store.commit('setMcpSelectionStatus', payload);
			},
			/** @function copilot/chats/delete */
			delete: (store: Store, dialogId: string) => {
				if (!store.state.collection[dialogId])
				{
					return;
				}

				store.commit('delete', dialogId);
			},
			/** @function copilot/chats/migrate */
			migrate: (store: Store, payload: { fromDialogId: string, toDialogId: string }) => {
				const { fromDialogId, toDialogId } = payload;
				const source = store.state.collection[fromDialogId];
				if (!source || fromDialogId === toDialogId)
				{
					return;
				}

				const userFields = {
					forceSearchEnabled: source.forceSearchEnabled,
					agentModeEnabled: source.agentModeEnabled,
					mcpAuth: source.mcpAuth,
					mcpAuthConfirmed: source.mcpAuthConfirmed,
					// the migrated selection is all there is to restore for the created chat
					mcpSelectionLoaded: true,
				};

				const target = store.state.collection[toDialogId];
				if (target)
				{
					store.commit('update', { dialogId: toDialogId, fields: userFields });
				}
				else
				{
					store.commit('add', {
						dialogId: toDialogId,
						fields: { ...this.getElementState(), ...userFields, dialogId: toDialogId, role: source.role },
					});
				}

				store.commit('delete', fromDialogId);
			},
			/** @function copilot/chats/checkMessagesForAiContent */
			checkMessagesForAiContent: (store: Store, payload: {messages: Array}) => {
				const { messages } = payload;
				if (!Array.isArray(messages) || messages.length === 0)
				{
					return;
				}

				const rootStore = Core.getStore();
				if (!rootStore.getters['users/bots/getCopilotBotDialogId'])
				{
					return;
				}

				const isCopilot = rootStore.getters['users/bots/isCopilot'];
				const dialogByChatId = new Map();
				const resolveDialog = (chatId) => {
					if (!dialogByChatId.has(chatId))
					{
						dialogByChatId.set(chatId, rootStore.getters['chats/getByChatId'](chatId));
					}

					return dialogByChatId.get(chatId);
				};

				const processedChatIds = new Set();
				const dialogIdsToMark = [];
				for (const message of messages)
				{
					const chatId = message?.chatId;
					if (!chatId || processedChatIds.has(chatId))
					{
						continue;
					}

					const dialog = resolveDialog(chatId);
					if (!dialog || store.state.aiContentDialogs[dialog.dialogId])
					{
						processedChatIds.add(chatId);
						continue;
					}

					if (!isCopilot(message.authorId))
					{
						continue;
					}

					dialogIdsToMark.push(dialog.dialogId);
					processedChatIds.add(chatId);
				}

				if (dialogIdsToMark.length > 0)
				{
					store.commit('markHasAiContent', { dialogIds: dialogIdsToMark });
				}
			},
		};
	}

	getMutations(): MutationTree<ChatsState>
	{
		return {
			add: (state: ChatsState, payload) => {
				const { dialogId, fields } = payload;
				state.collection[dialogId] = fields;
			},
			update: (state: ChatsState, payload) => {
				const { dialogId, fields } = payload;
				state.collection[dialogId] = { ...state.collection[dialogId], ...fields };
			},
			updateModel: (state: ChatsState, payload) => {
				const { dialogId, aiModel } = payload;
				state.collection[dialogId].aiModel = aiModel;
			},
			setTitleIsCustom: (state: ChatsState, payload: { dialogId: string, titleIsCustom: boolean }) => {
				state.collection[payload.dialogId].titleIsCustom = payload.titleIsCustom;
			},
			toggleReasoning: (state: ChatsState, dialogId: string) => {
				state.collection[dialogId].reasoningEnabled = !state.collection[dialogId].reasoningEnabled;
			},
			toggleForceSearch: (state: ChatsState, dialogId: string) => {
				state.collection[dialogId].forceSearchEnabled = !state.collection[dialogId].forceSearchEnabled;
			},
			toggleAgentMode: (state: ChatsState, dialogId: string) => {
				state.collection[dialogId].agentModeEnabled = !state.collection[dialogId].agentModeEnabled;
			},
			setGenerationState: (state: ChatsState, payload: { dialogId: string, generationState: ?ImModelCopilotGenerationState }) => {
				state.collection[payload.dialogId].generationState = payload.generationState;
			},
			setMcpAuth: (state: ChatsState, payload: SetMcpAuthPayload) => {
				state.collection[payload.dialogId].mcpAuth = payload.mcpAuth;
				state.collection[payload.dialogId].mcpAuthConfirmed = payload.confirmed === true;
			},
			clearMcpAuth: (state: ChatsState, dialogId: string) => {
				state.collection[dialogId].mcpAuth = null;
				state.collection[dialogId].mcpAuthConfirmed = false;
			},
			setMcpSelectionStatus: (state: ChatsState, payload: { dialogId: string, status: string }) => {
				state.collection[payload.dialogId].mcpSelectionStatus = payload.status;
				// a status written by the client is a known one, restoring included
				state.collection[payload.dialogId].mcpSelectionLoaded = true;
			},
			delete: (state: ChatsState, dialogId: string) => {
				delete state.collection[dialogId];
			},
			markHasAiContent: (state: ChatsState, payload: {dialogIds: string[]}) => {
				for (const dialogId of payload.dialogIds)
				{
					state.aiContentDialogs[dialogId] = true;
				}
			},
		};
	}

	formatFields(fields: JsonObject): JsonObject
	{
		return formatFieldsWithConfig(fields, chatFieldsConfig);
	}

	// a selection dropped for a chat whose data has not arrived would stay restoring forever
	#addChatIfMissing(store: Store, dialogId: string): void
	{
		if (store.state.collection[dialogId])
		{
			return;
		}

		store.commit('add', {
			dialogId,
			fields: { ...this.getElementState(), dialogId },
		});
	}

	// a payload without the mcpAuth field says nothing about the selection saved on the server
	#withServerSelectionState(chat: JsonObject): JsonObject
	{
		if (Type.isUndefined(chat.mcpAuth))
		{
			return { ...chat };
		}

		return {
			...chat,
			mcpSelectionLoaded: true,
			mcpAuthConfirmed: Boolean(chat.mcpAuth)
				&& chat.mcpSelectionStatus === CopilotMcpSelectionStatus.ready,
		};
	}
}
