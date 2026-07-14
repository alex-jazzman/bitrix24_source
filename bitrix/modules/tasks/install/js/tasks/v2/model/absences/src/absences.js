import { ActionTree, MutationTree, BuilderEntityModel, Store, type GetterTree } from 'ui.vue3.vuex';

import { Model } from 'tasks.v2.const';

import type { AbsencesModelState, UserAbsence } from './types';

export class Absences extends BuilderEntityModel<AbsencesModelState, UserAbsence>
{
	getName(): string
	{
		return Model.Absences;
	}

	getState(): AbsencesModelState
	{
		return {
			collection: {},
			fetching: false,
		};
	}

	getGetters(): GetterTree<S, R>
	{
		return {
			...super.getGetters(),
			getByUserId: (state: AbsencesModelState) => (userId: number): ?UserAbsence[] => {
				return Object.values(state.collection).filter((a) => !a.viewed && a.userId === userId);
			},
			getByUserIds: (state: AbsencesModelState) => (userIds: number[]): ?UserAbsence[] => {
				return Object.values(state.collection).filter((a) => !a.viewed && userIds.includes(a.userId));
			},
		};
	}

	getActions(): ActionTree<AbsencesModelState, R>
	{
		return {
			...super.getActions(),
			/** @function absences/setFetching */
			setFetching: (store: Store, fetching: boolean): void => {
				store.commit('setFetching', fetching);
			},
		};
	}

	getMutations(): MutationTree<AbsencesModelState>
	{
		return {
			...super.getMutations(),
			setFetching: (state: AbsencesModelState, fetching: boolean): void => {
				state.fetching = fetching;
			},
		};
	}
}
