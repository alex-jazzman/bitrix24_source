import { Type, type JsonObject } from 'main.core';
import { BuilderModel, type ActionTree, type MutationTree, type GetterTree } from 'ui.vue3.vuex';

import { formatFieldsWithConfig } from 'im.v2.model';

import { type ImolModelQueue } from 'imopenlines.v2.model';
import { type RawQueue } from 'imopenlines.v2.provider.service';

import { queueFieldsConfig } from './format/field-config';

type QueueState = {
	collection: {
		[id: number]: ImolModelQueue
	},
	isLinesOperator: boolean,
}

/* eslint-disable no-param-reassign */
export class QueueModel extends BuilderModel
{
	getName(): string
	{
		return 'queue';
	}

	getState(): QueueState
	{
		return {
			collection: {},
			isLinesOperator: false,
		};
	}

	getElementState(): ImolModelQueue
	{
		return {
			id: 0,
			lineName: '',
			type: '',
			isActive: true,
			color: '',
		};
	}

	getGetters(): GetterTree<QueueState>
	{
		return {
			/** @function openLines/queue/getList */
			getList: (state: QueueState) => (): ImolModelQueue[] => {
				return Object.values(state.collection);
			},
			/** @function openLines/queue/getListOfActive */
			getListOfActive: (state: QueueState) => (): ImolModelQueue[] => {
				return Object.values(state.collection).filter((queue) => queue.isActive);
			},
			/** @function openLines/queue/getById */
			getById: (state: QueueState) => (id: number): ?ImolModelQueue => {
				return state.collection[id] ?? null;
			},
			/** @function openLines/queue/isLinesOperator */
			isLinesOperator: (state: QueueState): boolean => {
				return state.isLinesOperator;
			},
		};
	}

	getActions(): ActionTree<QueueState>
	{
		return {
			/** @function openLines/queue/set */
			set: (store, payload: RawQueue | RawQueue[]) => {
				let queues = payload;

				if (!Array.isArray(queues) && Type.isPlainObject(queues))
				{
					queues = [queues];
				}

				const itemsToAdd = [];

				queues.map((element) => {
					return this.#formatFields(element);
				}).forEach((element) => {
					const existingItem = store.state.collection[element.id];

					if (existingItem)
					{
						store.commit('update', { id: existingItem.id, fields: { ...element } });
					}
					else
					{
						itemsToAdd.push({ ...this.getElementState(), ...element });
					}
				});

				if (itemsToAdd.length > 0)
				{
					store.commit('add', itemsToAdd);
				}
			},
			/** @function openLines/queue/setIsLinesOperator */
			setIsLinesOperator: (store, payload: boolean) => {
				store.commit('setIsLinesOperator', payload === true);
			},
			/** @function openLines/queue/delete */
			delete: (store, payload: { id: number }) => {
				const existingItem = store.state.collection[payload.id];
				if (!existingItem)
				{
					return;
				}

				store.commit('delete', {
					id: existingItem.dialogId,
				});
			},
		};
	}

	getMutations(): MutationTree<QueueState>
	{
		return {
			add: (state: QueueState, payload: QueueState | QueueState[]) => {
				const queues = payload;
				const queueState = state;

				queues.forEach((item) => {
					queueState.collection[item.id] = item;
				});
			},
			update: (state: QueueState, payload: { id: number, fields: RawQueue}) => {
				const queueState = state;

				const currentElement = state.collection[payload.id];

				queueState.collection[payload.id] = { ...currentElement, ...payload.fields };
			},
			delete: (state: QueueState, payload: { id: number }) => {
				delete state.collection[payload.id];
			},
			setIsLinesOperator: (state: QueueState, payload: boolean) => {
				state.isLinesOperator = payload;
			},
		};
	}

	#formatFields(rawFields: JsonObject): Partial<ImolModelQueue>
	{
		return formatFieldsWithConfig(rawFields, queueFieldsConfig);
	}
}
