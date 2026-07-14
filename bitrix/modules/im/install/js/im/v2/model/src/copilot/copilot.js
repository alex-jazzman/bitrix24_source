import { Type, type JsonObject } from 'main.core';
import { BuilderModel, type GetterTree, type ActionTree, type MutationTree, type NestedModuleTree, type Store } from 'ui.vue3.vuex';

import { copilotFieldsConfig } from './format/field-config';
import { ChatsModel } from './nested-modules/chats/chats';
import { MessagesModel } from './nested-modules/messages/messages';
import { RolesModel } from './nested-modules/roles/roles';
import { VotesModel } from './nested-modules/votes/votes';
import { formatFieldsWithConfig, type ImModelCopilotAIModel } from '../registry';

type CopilotModelState = {
	recommendedRoles: string[],
	aiProvider: string,
	availableAIModels: {
		[code: string]: ImModelCopilotAIModel
	},
	name: string,
	agentName: string,
	widgetDialogId: string,
};

/* eslint-disable no-param-reassign */
export class CopilotModel extends BuilderModel
{
	getNestedModules(): NestedModuleTree
	{
		return {
			roles: RolesModel,
			messages: MessagesModel,
			chats: ChatsModel,
			votes: VotesModel,
		};
	}

	getName(): string
	{
		return 'copilot';
	}

	getState(): CopilotModelState
	{
		return {
			aiProvider: '',
			availableAIModels: {},
			name: '',
			agentName: '',
			widgetDialogId: '',
		};
	}

	getGetters(): GetterTree
	{
		return {
			/** @function copilot/getProvider */
			getProvider: (state: CopilotModelState): string => {
				return state.aiProvider;
			},
			/** @function copilot/getAIModels */
			getAIModels: (state: CopilotModelState): ImModelCopilotAIModel[] => {
				return Object.values(state.availableAIModels);
			},
			/** @function copilot/getDefaultModelName */
			getDefaultModelName: (state: CopilotModelState): string => {
				const allModels = Object.values(state.availableAIModels);
				if (allModels.length === 0)
				{
					return '';
				}

				const defaultModel: ?ImModelCopilotAIModel = allModels.find((model) => model.default === true);
				if (!defaultModel)
				{
					return '';
				}

				return defaultModel.name;
			},
			/** @function copilot/isReasoningAvailableInModel */
			isReasoningAvailableInModel: (state: CopilotModelState) => (code: string): boolean => {
				return Boolean(state.availableAIModels[code]?.supportsReasoning);
			},
			/** @function copilot/getName */
			getName: (state: CopilotModelState): string => {
				return state.name;
			},
			/** @function copilot/getAgentName */
			getAgentName: (state: CopilotModelState): string => {
				return state.agentName;
			},
			/** @function copilot/isChatOpenedInWidget */
			isChatOpenedInWidget: (state: CopilotModelState) => (dialogId: string): boolean => {
				return state.widgetDialogId !== '' && state.widgetDialogId === dialogId;
			},
		};
	}

	getActions(): ActionTree
	{
		return {
			/** @function copilot/setProvider */
			setProvider: (store: Store, payload: string) => {
				if (!Type.isStringFilled(payload))
				{
					return;
				}

				store.commit('setProvider', payload);
			},
			/** @function copilot/setAvailableAIModels */
			setAvailableAIModels: (store: Store, payload: ImModelCopilotAIModel[]) => {
				if (!Type.isArrayFilled(payload))
				{
					return;
				}

				payload.forEach((model) => {
					store.commit('setAvailableAIModel', this.formatFields(model));
				});
			},
			/** @function copilot/setName */
			setName: (store: Store, payload: string) => {
				if (!Type.isStringFilled(payload))
				{
					return;
				}

				store.commit('setName', payload);
			},
			/** @function copilot/setAgentName */
			setAgentName: (store: Store, payload: string) => {
				if (!Type.isStringFilled(payload))
				{
					return;
				}

				store.commit('setAgentName', payload);
			},
			/** @function copilot/setWidgetDialogId */
			setWidgetDialogId: (store: Store, payload: string) => {
				store.commit('setWidgetDialogId', payload ?? '');
			},
		};
	}

	getMutations(): MutationTree
	{
		return {
			setProvider: (state: CopilotModelState, payload) => {
				state.aiProvider = payload;
			},
			setAvailableAIModel: (state: CopilotModelState, payload: ImModelCopilotAIModel) => {
				state.availableAIModels[payload.code] = payload;
			},
			setName: (state: CopilotModelState, payload: string) => {
				state.name = payload;
			},
			setAgentName: (state: CopilotModelState, payload: string) => {
				state.agentName = payload;
			},
			setWidgetDialogId: (state: CopilotModelState, payload: string) => {
				state.widgetDialogId = payload;
			},
		};
	}

	formatFields(fields: JsonObject): JsonObject
	{
		return formatFieldsWithConfig(fields, copilotFieldsConfig);
	}
}
