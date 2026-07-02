import { BuilderModel, type ActionTree, type GetterTree, type MutationTree } from 'ui.vue3.vuex';

import { type ImolModelCurrentSession } from 'imopenlines.v2.model';

type CurrentSessionState = {
	collection: { [dialogId: string]: ImolModelCurrentSession }
}

/* eslint-disable no-param-reassign */
export class CurrentSessionModel extends BuilderModel
{
	getName(): string
	{
		return 'currentSession';
	}

	getState(): CurrentSessionState
	{
		return {
			collection: {},
		};
	}

	getElementState(): ImolModelCurrentSession
	{
		return {
			sessionId: 0,
			pause: false,
			waitAction: false,
			blockDate: '',
			blockReason: '',
			silentMode: false,
			dateCreate: '',
			multidialog: false,
		};
	}

	getGetters(): GetterTree<CurrentSessionState>
	{
		return {
			/** @function openLines/currentSession/getByDialogId */
			getByDialogId: (state: CurrentSessionState) => (dialogId: string): ?ImolModelCurrentSession => {
				return state.collection[dialogId] || null;
			},
			/** @function openlines/currentSession/getSilentModeByDialogId */
			getSilentModeByDialogId: (state: CurrentSessionState) => (dialogId: string): boolean => {
				return state.collection[dialogId]?.silentMode || false;
			},
		};
	}

	getActions(): ActionTree<CurrentSessionState>
	{
		return {
			/** @function openLines/currentSession/set */
			set: (store, payload: { dialogId: string, data: ImolModelCurrentSession }) => {
				if (!payload.data)
				{
					return;
				}
				store.commit('set', payload);
			},
		};
	}

	getMutations(): MutationTree<CurrentSessionState>
	{
		return {
			set: (state: CurrentSessionState, payload: { dialogId: string, data: ImolModelCurrentSession }) => {
				const { dialogId, data } = payload;
				const currentElement = state.collection[dialogId] ?? this.getElementState();
				state.collection[dialogId] = { ...currentElement, ...data };
			},
		};
	}
}
