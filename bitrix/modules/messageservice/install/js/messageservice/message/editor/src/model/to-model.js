import { Type } from 'main.core';
import { BuilderModel, type ActionTree, type GetterTree, type MutationTree } from 'ui.vue3.vuex';

import { type To } from '../editor';
import { type Logger } from '../service/logger';
import { makeFrozenClone } from './helpers';

type ToState = {
	collection: Readonly<To[]>,
	selected: {
		toId: ?string,
	},
};

export class ToModel extends BuilderModel
{
	#logger: Logger;

	getName(): string
	{
		return 'to';
	}

	setLogger(logger: Logger): this
	{
		this.#logger = logger;

		return this;
	}

	getState(): ToState
	{
		const collection: To[] = makeFrozenClone(this.getVariable('collection', []));

		return {
			collection,
			selected: {
				toId: this.getVariable('selected.toId', collection[0]?.id),
			},
		};
	}

	getGetters(): GetterTree<ToState>
	{
		return {
			/** @function to/current */
			current: (state): ?To => {
				const selected = state.collection.find((to) => to.id === state.selected.toId);
				if (selected)
				{
					return selected;
				}

				return state.collection[0];
			},
		};
	}

	getActions(): ActionTree<ToState>
	{
		return {
			/** @function to/actualizeState */
			actualizeState: (store, payload: ToState) => {
				store.commit('actualizeState', makeFrozenClone(payload));
			},
			/** @function to/setTo */
			setTo: (store, payload: {toId: string}) => {
				const { toId } = payload;
				if (!Type.isStringFilled(toId))
				{
					this.#logger.warn('setTo: toId should be a string', { payload });

					return;
				}

				const to: ?To = store.state.collection.find((candidate) => candidate.id === toId);
				if (!to)
				{
					this.#logger.warn('setTo: to not found', { payload });

					return;
				}

				store.commit('updateSelected', {
					selected: {
						toId,
					},
				});
			},
		};
	}

	/* eslint-disable no-param-reassign */
	getMutations(): MutationTree<ToState>
	{
		return {
			actualizeState: (state, payload) => {
				for (const [key, value] of Object.entries(payload))
				{
					if (key in state)
					{
						state[key] = value;
					}
				}
			},
			updateSelected: (state, payload) => {
				state.selected = { ...state.selected, ...payload.selected };
			},
		};
	}
}
