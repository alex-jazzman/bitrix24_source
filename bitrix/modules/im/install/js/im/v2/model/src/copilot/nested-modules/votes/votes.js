import { Type } from 'main.core';
import type { JsonObject } from 'main.core';
import { BuilderModel, type GetterTree, type ActionTree, type MutationTree, type Store } from 'ui.vue3.vuex';

import { formatFieldsWithConfig } from 'im.v2.model';

import { votesFieldsConfig } from './field-config';

export type CopilotVoteValue = 'like' | 'dislike';

type CopilotVote = {
	messageId: number,
	value: CopilotVoteValue,
};

type VotesState = {
	collection: { [messageId: number]: CopilotVote },
};

/* eslint-disable no-param-reassign */
export class VotesModel extends BuilderModel
{
	getState(): VotesState
	{
		return {
			collection: {},
		};
	}

	getElementState(): CopilotVote
	{
		return {
			messageId: 0,
			value: 'like',
		};
	}

	getGetters(): GetterTree<VotesState>
	{
		return {
			/** @function copilot/votes/getValue */
			getValue: (state: VotesState) => (messageId: number): ?CopilotVoteValue => {
				return state.collection[messageId]?.value ?? null;
			},
		};
	}

	getActions(): ActionTree<VotesState>
	{
		return {
			/** @function copilot/votes/set */
			set: (store: Store, payload: JsonObject) => {
				const preparedVote = this.formatFields(payload);
				if (Type.isUndefined(preparedVote.messageId) || Type.isUndefined(preparedVote.value))
				{
					return;
				}

				store.commit('set', preparedVote);
			},
			/** @function copilot/votes/delete */
			delete: (store: Store, messageId: number) => {
				if (!Type.isNumber(messageId) || !store.state.collection[messageId])
				{
					return;
				}

				store.commit('delete', messageId);
			},
		};
	}

	getMutations(): MutationTree<VotesState>
	{
		return {
			set: (state: VotesState, payload: CopilotVote) => {
				state.collection[payload.messageId] = payload;
			},
			delete: (state: VotesState, messageId: number) => {
				delete state.collection[messageId];
			},
		};
	}

	formatFields(fields: JsonObject): JsonObject
	{
		return formatFieldsWithConfig(fields, votesFieldsConfig);
	}
}
