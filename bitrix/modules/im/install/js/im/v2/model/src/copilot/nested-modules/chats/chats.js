import { Type } from 'main.core';
import { BuilderModel } from 'ui.vue3.vuex';

import { Core } from 'im.v2.application.core';

import { chatFieldsConfig } from './field-config';
import { formatFieldsWithConfig } from '../../../utils/validate';

import type { JsonObject } from 'main.core';
import type { GetterTree, ActionTree, MutationTree, Store } from 'ui.vue3.vuex';
import type { ImModelCopilotAIModel, ImModelCopilotRole, ImModelCopilotMcpAuth } from '../../../registry';

type ChatsState = {
	collection: {[dialogId: string]: CopilotChat},
}

type CopilotChat = {
	dialogId: string,
	role: string,
	aiModel: string,
	reasoningEnabled: boolean,
	forceSearchEnabled: boolean,
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
		};
	}

	getElementState(): CopilotChat
	{
		return {
			dialogId: '',
			role: '',
			aiModel: '',
			reasoningEnabled: false,
			forceSearchEnabled: false,
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
			/** @function copilot/chats/getMcpAuth */
			getMcpAuth: (state: ChatsState) => (dialogId: string): ?ImModelCopilotMcpAuth => {
				const chat = state.collection[dialogId];
				if (!chat)
				{
					return null;
				}

				return chat.mcpAuth;
			},
		};
	}

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
			toggleReasoning: (state: ChatsState, dialogId: string) => {
				state.collection[dialogId].reasoningEnabled = !state.collection[dialogId].reasoningEnabled;
			},
			toggleForceSearch: (state: ChatsState, dialogId: string) => {
				state.collection[dialogId].forceSearchEnabled = !state.collection[dialogId].forceSearchEnabled;
			},
			setMcpAuth: (state: ChatsState, payload: { dialogId: string, mcpAuth: ImModelCopilotMcpAuth }) => {
				state.collection[payload.dialogId].mcpAuth = payload.mcpAuth;
			},
			clearMcpAuth: (state: ChatsState, dialogId: string) => {
				state.collection[dialogId].mcpAuth = null;
			},
		};
	}

	formatFields(fields: JsonObject): JsonObject
	{
		return formatFieldsWithConfig(fields, chatFieldsConfig);
	}
}
