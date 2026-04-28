import { BuilderModel } from 'ui.vue3.vuex';

import type { ActionTree, GetterTree, MutationTree } from 'ui.vue3.vuex';
import type { RawCrm } from 'imopenlines.v2.provider.service';

type CrmState = {
	collection: { [dialogId: string]: RawCrm }
}

/* eslint-disable no-param-reassign */
export class CrmModel extends BuilderModel
{
	getName(): string
	{
		return 'crm';
	}

	getState(): CrmState
	{
		return {
			collection: {},
		};
	}

	getElementState(): RawCrm
	{
		return {
			crmEnabled: false,
			crmEntityType: '',
			crmEntityId: 0,
			leadId: null,
			companyId: null,
			contactId: null,
			dealId: null,
		};
	}

	getGetters(): GetterTree<CrmState>
	{
		return {
			/** @function openlines/crm/getByDialogId */
			getByDialogId: (state: CrmState) => (dialogId: string): ?RawCrm => {
				return state.collection[dialogId] || null;
			},
		};
	}

	getActions(): ActionTree<CrmState>
	{
		return {
			/** @function openlines/crm/set */
			set: (store, payload: { dialogId: string, data: RawCrm }) => {
				if (!payload.data)
				{
					return;
				}
				store.commit('set', payload);
			},
		};
	}

	getMutations(): MutationTree<CrmState>
	{
		return {
			set: (state: CrmState, payload: { dialogId: string, data: RawCrm }) => {
				const { dialogId, data } = payload;
				const currentElement = state.collection[dialogId] ?? this.getElementState();
				state.collection[dialogId] = { ...currentElement, ...data };
			},
		};
	}
}
