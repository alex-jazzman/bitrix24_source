import { BuilderModel } from 'ui.vue3.vuex';

import type { ActionTree, GetterTree, MutationTree } from 'ui.vue3.vuex';
import type { RawCurrentSession } from 'imopenlines.v2.provider.service';

type CurrentSessionState = {
	collection: { [dialogId: string]: RawCurrentSession }
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

	getElementState(): RawCurrentSession
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
			/** @function openlines/currentSession/getByDialogId */
			getByDialogId: (state: CurrentSessionState) => (dialogId: string): ?RawCurrentSession => {
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
			/** @function openlines/currentSession/set */
			set: (store, payload: { dialogId: string, data: RawCurrentSession }) => {
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
			set: (state: CurrentSessionState, payload: { dialogId: string, data: RawCurrentSession }) => {
				const { dialogId, data } = payload;
				const currentElement = state.collection[dialogId] ?? this.getElementState();
				state.collection[dialogId] = { ...currentElement, ...data };
			},
		};
	}
}
