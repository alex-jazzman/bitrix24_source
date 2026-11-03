import { Type, type JsonObject } from 'main.core';
import { BuilderModel, type GetterTree, type ActionTree, type MutationTree, type NestedModuleTree, type Store } from 'ui.vue3.vuex';

import { copilotFieldsConfig } from './format/field-config';
import { ChatsModel } from './nested-modules/chats/chats';
import { MessagesModel } from './nested-modules/messages/messages';
import { RolesModel } from './nested-modules/roles/roles';
import { VotesModel } from './nested-modules/votes/votes';
import { formatFieldsWithConfig, type ImModelCopilotAIModel, type ImModelCopilotGreeting } from '../registry';

type CopilotModelState = {
	recommendedRoles: string[],
	aiProvider: string,
	availableAIModels: {
		[code: string]: ImModelCopilotAIModel
	},
	name: string,
	agentName: string,
	widgetDialogId: string,
	sentChatDialogId: string,
	activatedChatDialogId: string,
	suggests: string[],
	greetings: ImModelCopilotGreeting[],
	greetingWeekHolidays: number[],
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
			sentChatDialogId: '',
			activatedChatDialogId: '',
			suggests: [],
			greetings: [],
			greetingWeekHolidays: [],
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
			// the chat just opened by sending from the widget start screen; only that swap cross-fades
			/** @function copilot/isWidgetChatOpenedBySend */
			isWidgetChatOpenedBySend: (state: CopilotModelState) => (dialogId: string): boolean => {
				return state.sentChatDialogId !== '' && state.sentChatDialogId === dialogId;
			},
			// the central BitrixGPT chat just opened by activating the draft with a send; only that swap cross-fades
			/** @function copilot/isChatOpenedBySend */
			isChatOpenedBySend: (state: CopilotModelState) => (dialogId: string): boolean => {
				return state.activatedChatDialogId !== '' && state.activatedChatDialogId === dialogId;
			},
			/** @function copilot/getSuggests */
			getSuggests: (state: CopilotModelState): string[] => {
				return state.suggests;
			},
			/** @function copilot/getGreetings */
			getGreetings: (state: CopilotModelState): ImModelCopilotGreeting[] => {
				return state.greetings;
			},
			/** @function copilot/getGreetingWeekHolidays */
			getGreetingWeekHolidays: (state: CopilotModelState): number[] => {
				return state.greetingWeekHolidays;
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
			/** @function copilot/setSentChatDialogId */
			setSentChatDialogId: (store: Store, payload: string) => {
				store.commit('setSentChatDialogId', payload ?? '');
			},
			/** @function copilot/setActivatedChatDialogId */
			setActivatedChatDialogId: (store: Store, payload: string) => {
				store.commit('setActivatedChatDialogId', payload ?? '');
			},
			/** @function copilot/setSuggests */
			setSuggests: (store: Store, payload: string[]) => {
				if (!Type.isArray(payload))
				{
					return;
				}

				store.commit('setSuggests', payload);
			},
			/** @function copilot/setGreetings */
			setGreetings: (store: Store, payload: ImModelCopilotGreeting[]) => {
				if (!Type.isArray(payload))
				{
					return;
				}

				store.commit('setGreetings', payload);
			},
			/** @function copilot/setGreetingWeekHolidays */
			setGreetingWeekHolidays: (store: Store, payload: number[]) => {
				if (!Type.isArray(payload))
				{
					return;
				}

				store.commit('setGreetingWeekHolidays', payload);
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
			setSentChatDialogId: (state: CopilotModelState, payload: string) => {
				state.sentChatDialogId = payload;
			},
			setActivatedChatDialogId: (state: CopilotModelState, payload: string) => {
				state.activatedChatDialogId = payload;
			},
			setSuggests: (state: CopilotModelState, payload: string[]) => {
				state.suggests = payload;
			},
			setGreetings: (state: CopilotModelState, payload: ImModelCopilotGreeting[]) => {
				state.greetings = payload;
			},
			setGreetingWeekHolidays: (state: CopilotModelState, payload: number[]) => {
				state.greetingWeekHolidays = payload;
			},
		};
	}

	formatFields(fields: JsonObject): JsonObject
	{
		return formatFieldsWithConfig(fields, copilotFieldsConfig);
	}
}
