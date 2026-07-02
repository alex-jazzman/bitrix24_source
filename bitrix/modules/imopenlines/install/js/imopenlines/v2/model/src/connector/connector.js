import { BuilderModel, type ActionTree, type GetterTree, type MutationTree } from 'ui.vue3.vuex';

import { type ImolModelConnector } from 'imopenlines.v2.model';

type ConnectorState = {
	collection: { [dialogId: string]: ImolModelConnector }
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

	getElementState(): ImolModelConnector
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
			/** @function openLines/connector/getByDialogId */
			getByDialogId: (state: ConnectorState) => (dialogId: string): ?ImolModelConnector => {
				return state.collection[dialogId] || null;
			},
		};
	}

	getActions(): ActionTree<ConnectorState>
	{
		return {
			/** @function openLines/connector/set */
			set: (store, payload: { dialogId: string, data: ImolModelConnector }) => {
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
			set: (state: ConnectorState, payload: { dialogId: string, data: ImolModelConnector }) => {
				const { dialogId, data } = payload;
				const currentElement = state.collection[dialogId] ?? this.getElementState();
				state.collection[dialogId] = { ...currentElement, ...data };
			},
		};
	}
}
