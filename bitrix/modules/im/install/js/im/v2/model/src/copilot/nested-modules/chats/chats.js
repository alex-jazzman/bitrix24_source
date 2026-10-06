import { Type, type JsonObject } from 'main.core';
import { BuilderModel, type GetterTree, type ActionTree, type MutationTree, type Store } from 'ui.vue3.vuex';

import { Core } from 'im.v2.application.core';
import { Utils } from 'im.v2.lib.utils';
import { ChatType } from 'im.v2.const';

import { type ImModelCopilotAIModel, type ImModelCopilotRole, type ImModelCopilotMcpAuth } from '../../../registry';
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
			/** @function copilot/chats/getMcpAuth */
			getMcpAuth: (state: ChatsState) => (dialogId: string): ?ImModelCopilotMcpAuth => {
				const chat = state.collection[dialogId];
				if (!chat)
				{
					return null;
				}

				return chat.mcpAuth;
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
					const existingItem = store.state.collection[chat.dialogId];
					if (existingItem)
					{
						store.commit('update', {
							dialogId: chat.dialogId,
							fields: chat,
						});

						return;
					}

					store.commit('add', {
						dialogId: chat.dialogId,
						fields: { ...this.getElementState(), ...chat },
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
			/** @function copilot/chats/setMcpAuth */
			setMcpAuth: (store: Store, payload: { dialogId: string, mcpAuth: ImModelCopilotMcpAuth }) => {
				if (!store.state.collection[payload.dialogId])
				{
					return;
				}

				store.commit('setMcpAuth', payload);
			},
			/** @function copilot/chats/clearMcpAuth */
			clearMcpAuth: (store: Store, dialogId: string) => {
				if (!store.state.collection[dialogId])
				{
					return;
				}

				store.commit('clearMcpAuth', dialogId);
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
			setMcpAuth: (state: ChatsState, payload: { dialogId: string, mcpAuth: ImModelCopilotMcpAuth }) => {
				state.collection[payload.dialogId].mcpAuth = payload.mcpAuth;
			},
			clearMcpAuth: (state: ChatsState, dialogId: string) => {
				state.collection[dialogId].mcpAuth = null;
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
}
