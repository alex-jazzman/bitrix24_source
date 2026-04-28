import { BuilderModel } from 'ui.vue3.vuex';

import type { ActionTree, GetterTree, MutationTree } from 'ui.vue3.vuex';
import type { RawConnector } from 'imopenlines.v2.provider.service';

type ConnectorState = {
	collection: { [dialogId: string]: RawConnector }
}

/* eslint-disable no-param-reassign */
export class ConnectorModel extends BuilderModel
{
	getName(): string
	{
		return 'connector';
	}

	getState(): ConnectorState
	{
		return {
			collection: {},
		};
	}

	getElementState(): RawConnector
	{
		return {
			connectorId: '',
			lineId: 0,
			connectorChatId: 0,
			connectorUserId: 0,
		};
	}

	getGetters(): GetterTree<ConnectorState>
	{
		return {
			/** @function openlines/connector/getByDialogId */
			getByDialogId: (state: ConnectorState) => (dialogId: string): ?RawConnector => {
				return state.collection[dialogId] || null;
			},
		};
	}

	getActions(): ActionTree<ConnectorState>
	{
		return {
			/** @function openlines/connector/set */
			set: (store, payload: { dialogId: string, data: RawConnector }) => {
				if (!payload.data)
				{
					return;
				}
				store.commit('set', payload);
			},
		};
	}

	getMutations(): MutationTree<ConnectorState>
	{
		return {
			set: (state: ConnectorState, payload: { dialogId: string, data: RawConnector }) => {
				const { dialogId, data } = payload;
				const currentElement = state.collection[dialogId] ?? this.getElementState();
				state.collection[dialogId] = { ...currentElement, ...data };
			},
		};
	}
}
