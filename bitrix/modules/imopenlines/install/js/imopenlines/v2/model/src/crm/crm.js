import { BuilderModel, type ActionTree, type GetterTree, type MutationTree } from 'ui.vue3.vuex';

import { type ImolModelCrm } from 'imopenlines.v2.model';

type CrmState = {
	collection: { [dialogId: string]: ImolModelCrm }
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

	getElementState(): ImolModelCrm
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
			/** @function openLines/crm/getByDialogId */
			getByDialogId: (state: CrmState) => (dialogId: string): ?ImolModelCrm => {
				return state.collection[dialogId] || null;
			},
		};
	}

	getActions(): ActionTree<CrmState>
	{
		return {
			/** @function openLines/crm/set */
			set: (store, payload: { dialogId: string, data: ImolModelCrm }) => {
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
			set: (state: CrmState, payload: { dialogId: string, data: ImolModelCrm }) => {
				const { dialogId, data } = payload;
				const currentElement = state.collection[dialogId] ?? this.getElementState();
				state.collection[dialogId] = { ...currentElement, ...data };
			},
		};
	}
}
