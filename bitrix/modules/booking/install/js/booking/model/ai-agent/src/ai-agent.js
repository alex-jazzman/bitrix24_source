/* eslint-disable no-param-reassign */
import { BuilderModel } from 'ui.vue3.vuex';
import type { GetterTree, ActionTree, MutationTree } from 'ui.vue3.vuex';

import { Model } from 'booking.const';

import type { AiAgentData, AiAgentState } from './types';

export class AiAgentModel extends BuilderModel
{
	getName(): string
	{
		return Model.AiAgent;
	}

	getState(): AiAgentState
	{
		return {
			aiAgent: null,
		};
	}

	getGetters(): GetterTree<AiAgentState, any>
	{
		return {
			/** @function ai-agent/aiAgent */
			aiAgent: (state): AiAgentData | null => state.aiAgent,
		};
	}

	getActions(): ActionTree<AiAgentState, any>
	{
		return {
			/** @function ai-agent/setAiAgent */
			setAiAgent({ commit }, aiAgent: AiAgentData | null): void
			{
				commit('setAiAgent', aiAgent);
			},
		};
	}

	getMutations(): MutationTree<AiAgentState>
	{
		return {
			setAiAgent(state: AiAgentState, aiAgent: AiAgentData | null): void
			{
				state.aiAgent = aiAgent;
			},
		};
	}
}
