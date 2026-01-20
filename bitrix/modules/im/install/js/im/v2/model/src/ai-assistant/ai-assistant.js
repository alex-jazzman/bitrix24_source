import { BuilderModel } from 'ui.vue3.vuex';

import type { GetterTree, ActionTree, MutationTree } from 'ui.vue3.vuex';

type McpAuthId = number | null;

type AiAssistantState = {
	mcpAuthId: McpAuthId
};

/* eslint-disable no-param-reassign */
export class AiAssistantModel extends BuilderModel
{
	getName(): string
	{
		return 'aiAssistant';
	}

	getState(): AiAssistantState
	{
		return {
			mcpAuthId: null,
		};
	}

	getGetters(): GetterTree
	{
		return {
			/** @function aiAssistant/getMcpAuthId */
			getMcpAuthId: (state: AiAssistantState): McpAuthId => {
				return state.mcpAuthId;
			},
		};
	}

	getActions(): ActionTree
	{
		return {
			/** @function aiAssistant/setMcpAuthId */
			setMcpAuthId: (store, mcpAuthId: McpAuthId) => {
				store.commit('setMcpAuthId', mcpAuthId);
			},
		};
	}

	getMutations(): MutationTree
	{
		return {
			setMcpAuthId: (state: AiAssistantState, mcpAuthId: McpAuthId) => {
				state.mcpAuthId = mcpAuthId;
			},
		};
	}
}
