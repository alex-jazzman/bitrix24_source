import { BuilderModel } from 'ui.vue3.vuex';

import type { ActionTree, GetterTree, MutationTree } from 'ui.vue3.vuex';
import type { ImolModelCrmForm } from 'imopenlines.v2.model';

type CrmFormState = {
	collection: { [id: number]: ImolModelCrmForm },
}

/* eslint-disable no-param-reassign */
export class CrmFormModel extends BuilderModel
{
	getName(): string
	{
		return 'crmForm';
	}

	getState(): CrmFormState
	{
		return {
			collection: {},
		};
	}

	getElementState(): ImolModelCrmForm
	{
		return {
			id: 0,
			name: '',
			code: '',
			sec: '',
		};
	}

	getGetters(): GetterTree<CrmFormState>
	{
		return {
			/** @function openLines/crmForm/getList */
			getList: (state: CrmFormState) => (): ImolModelCrmForm[] => {
				return Object.values(state.collection);
			},
		};
	}

	getActions(): ActionTree<CrmFormState>
	{
		return {
			/** @function openLines/crmForm/set */
			set: (store, payload: ImolModelCrmForm[]) => {
				store.commit('set', payload);
			},
		};
	}

	getMutations(): MutationTree<CrmFormState>
	{
		return {
			set: (state: CrmFormState, payload: ImolModelCrmForm[]) => {
				const collection = {};
				payload.forEach((item: ImolModelCrmForm) => {
					collection[item.id] = { ...this.getElementState(), ...item };
				});
				state.collection = collection;
			},
		};
	}
}
