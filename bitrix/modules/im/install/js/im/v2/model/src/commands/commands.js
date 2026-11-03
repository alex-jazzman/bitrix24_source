import { Type } from 'main.core';
import { BuilderModel } from 'ui.vue3.vuex';

import type { ActionTree, GetterTree, MutationTree } from 'ui.vue3.vuex';
import type { Command, CommandLoadStatus } from '../type/command';

const LoadStatus = Object.freeze({
	idle: 'idle',
	loading: 'loading',
	success: 'success',
	error: 'error',
});

type ChatCommandsState = {
	items: Command[],
	status: CommandLoadStatus,
};

type CommandsState = {
	collection: { [dialogId: string]: ChatCommandsState },
};

type SetPayload = {
	dialogId: string,
	items: Command[],
};

type DialogPayload = {
	dialogId: string,
};

/* eslint-disable no-param-reassign */
export class CommandsModel extends BuilderModel
{
	getName(): string
	{
		return 'commands';
	}

	getState(): CommandsState
	{
		return {
			collection: {},
		};
	}

	getElementState(): ChatCommandsState
	{
		return {
			items: [],
			status: LoadStatus.idle,
		};
	}

	getGetters(): GetterTree
	{
		return {
			/** @function commands/getByDialogId */
			getByDialogId: (state: CommandsState) => (dialogId: string): Command[] => {
				return state.collection[dialogId]?.items ?? [];
			},
			/** @function commands/getStatus */
			getStatus: (state: CommandsState) => (dialogId: string): CommandLoadStatus => {
				return state.collection[dialogId]?.status ?? LoadStatus.idle;
			},
			/** @function commands/isCached */
			isCached: (state: CommandsState) => (dialogId: string): boolean => {
				const chatState = state.collection[dialogId];

				return Boolean(chatState) && chatState.status !== LoadStatus.idle;
			},
		};
	}

	getActions(): ActionTree
	{
		return {
			/** @function commands/set */
			set: (store, payload: SetPayload) => {
				store.commit('set', payload);
			},
			/** @function commands/startLoading */
			startLoading: (store, payload: DialogPayload) => {
				store.commit('startLoading', payload);
			},
			/** @function commands/setError */
			setError: (store, payload: DialogPayload) => {
				store.commit('setError', payload);
			},
		};
	}

	getMutations(): MutationTree
	{
		return {
			set: (state: CommandsState, payload: SetPayload) => {
				const { dialogId, items } = payload;
				this.#ensureChatState(state, dialogId);

				state.collection[dialogId].items = items;
				state.collection[dialogId].status = LoadStatus.success;
			},
			startLoading: (state: CommandsState, payload: DialogPayload) => {
				const { dialogId } = payload;
				this.#ensureChatState(state, dialogId);

				state.collection[dialogId].status = LoadStatus.loading;
			},
			setError: (state: CommandsState, payload: DialogPayload) => {
				const { dialogId } = payload;
				this.#ensureChatState(state, dialogId);

				state.collection[dialogId].status = LoadStatus.error;
			},
		};
	}

	#ensureChatState(state: CommandsState, dialogId: string): void
	{
		if (Type.isNil(state.collection[dialogId]))
		{
			state.collection[dialogId] = this.getElementState();
		}
	}
}
