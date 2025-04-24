import { BuilderModel, GetterTree, ActionTree, MutationTree } from 'ui.vue3.vuex';

import type { InputActionType } from 'im.v2.lib.input-action';

export type InputActionState = {
	collection: {
		[dialogId: string]: ChatInputActions,
	},
};

export type ChatInputActions = InputActionUserRecord[];

type InputActionUserRecord = {
	type: InputActionType,
	userId: number,
	userName: string
};

type InputActionPayload = {
	type: InputActionType,
	dialogId: string,
	userId: number,
	userName?: string
};

/* eslint-disable no-param-reassign */
export class InputActionsModel extends BuilderModel
{
	getState(): InputActionState
	{
		return {
			collection: {},
		};
	}

	getGetters(): GetterTree
	{
		return {
			/** @function chats/inputActions/getByDialogId */
			getByDialogId: (state: InputActionState) => (dialogId: string): ?ChatInputActions => {
				const chatActionList = state.collection[dialogId];
				if (!chatActionList || chatActionList.length === 0)
				{
					return null;
				}

				return chatActionList;
			},
			/** @function chats/inputActions/isChatActive */
			isChatActive: (state: InputActionState) => (dialogId: string): boolean => {
				const chatActionList = state.collection[dialogId];
				if (!chatActionList)
				{
					return false;
				}

				return chatActionList.length > 0;
			},
			/** @function chats/inputActions/isActionActive */
			isActionActive: (state: InputActionState) => (payload: InputActionPayload): boolean => {
				const { dialogId, type, userId } = payload;
				if (!state.collection[dialogId])
				{
					return false;
				}

				const chatActionList = state.collection[dialogId];

				return this.isAlreadyActive(chatActionList, type, userId);
			},
		};
	}

	getActions(): ActionTree
	{
		return {
			/** @function chats/inputActions/start */
			start: (store, payload: InputActionPayload) => {
				const { dialogId, type, userId } = payload;
				if (!store.state.collection[dialogId])
				{
					store.commit('initCollection', dialogId);
				}

				const chatActionList = store.state.collection[dialogId];
				const isAlreadyActive = this.isAlreadyActive(chatActionList, type, userId);
				if (isAlreadyActive)
				{
					return;
				}

				store.commit('start', payload);
			},
			/** @function chats/inputActions/stop */
			stop: (store, payload: InputActionPayload) => {
				const { dialogId, type, userId } = payload;
				const chatActionList = store.state.collection[dialogId];
				if (!chatActionList)
				{
					return;
				}

				const isAlreadyActive = this.isAlreadyActive(chatActionList, type, userId);
				if (!isAlreadyActive)
				{
					return;
				}

				store.commit('stop', payload);
			},
			/** @function chats/inputActions/stopUserActionsInChat */
			stopUserActionsInChat: (store, payload: { userId: number, dialogId: string }) => {
				const { dialogId } = payload;
				const chatActionList = store.state.collection[dialogId];
				if (!chatActionList)
				{
					return;
				}

				store.commit('stopUserActionsInChat', payload);
			},
		};
	}

	getMutations(): MutationTree
	{
		return {
			start: (state: InputActionState, payload: InputActionPayload) => {
				const { dialogId, type, userId, userName } = payload;

				const chatActionList = state.collection[dialogId];
				chatActionList.push({
					type,
					userId,
					userName,
				});
			},
			stop: (state: InputActionState, payload: InputActionPayload) => {
				const { dialogId, type, userId } = payload;

				const chatActionList = state.collection[dialogId];
				state.collection[dialogId] = chatActionList.filter((userRecord) => {
					return userRecord.userId !== userId || userRecord.type !== type;
				});
			},
			stopUserActionsInChat: (state: InputActionState, payload: { userId: number, dialogId: string }) => {
				const { dialogId, userId } = payload;

				const chatActionList = state.collection[dialogId];
				state.collection[dialogId] = chatActionList.filter((userRecord) => {
					return userRecord.userId !== userId;
				});
			},
			initCollection: (state: InputActionState, dialogId: string) => {
				state.collection[dialogId] = [];
			},
		};
	}

	isAlreadyActive(list: InputActionUserRecord[], type: InputActionType, userId: number): boolean
	{
		return list.some((userRecord) => {
			return userRecord.userId === userId && userRecord.type === type;
		});
	}
}
