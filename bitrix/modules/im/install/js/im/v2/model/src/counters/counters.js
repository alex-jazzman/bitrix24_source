import { Type } from 'main.core';
import { BuilderModel } from 'ui.vue3.vuex';

import { RecentType } from 'im.v2.const';
import { formatFieldsWithConfig } from 'im.v2.model';

import { counterFieldsConfig } from './format/field-config';

import type { GetterTree, ActionTree, MutationTree } from 'ui.vue3.vuex';
import type { RecentTypeItem } from 'im.v2.const';
import type { CounterItem as ImModelCounter } from '../type/counter';

type CountersState = { collection: CountersCollection };
type CountersCollection = { [chatId: string]: ImModelCounter };

/* eslint-disable sonarjs/prefer-immediate-return */
// noinspection UnnecessaryLocalVariableJS
export class CountersModel extends BuilderModel
{
	getName(): string
	{
		return 'counters';
	}

	getState(): CountersState
	{
		return {
			collection: {},
		};
	}

	getElementState(): ImModelCounter
	{
		return {
			chatId: 0,
			parentChatId: 0,
			counter: 0,
			isMarkedAsUnread: false,
			isMuted: false,
			recentSections: [],
		};
	}

	// eslint-disable-next-line max-lines-per-function
	getGetters(): GetterTree
	{
		return {
			/** @function counters/getTotalChatCounter */
			getTotalChatCounter: (state: CountersState, getters: GetterTree): number => {
				return getters.getCounterByRecentType(RecentType.default);
			},
			/** @function counters/getTotalCopilotCounter */
			getTotalCopilotCounter: (state: CountersState, getters: GetterTree): number => {
				return getters.getCounterByRecentType(RecentType.copilot);
			},
			/** @function counters/getTotalCollabCounter */
			getTotalCollabCounter: (state: CountersState, getters: GetterTree): number => {
				return getters.getCounterByRecentType(RecentType.collab);
			},
			/** @function counters/getTotalTaskCounter */
			getTotalTaskCounter: (state: CountersState, getters: GetterTree): number => {
				return getters.getCounterByRecentType(RecentType.taskComments);
			},
			/** @function counters/getTotalLinesCounter */
			getTotalLinesCounter: (state: CountersState, getters: GetterTree): number => {
				return getters.getCounterByRecentType(RecentType.openlines);
			},
			/** @function counters/getCounterByRecentType */
			getCounterByRecentType: (state: CountersState) => (recentType: RecentTypeItem): number => {
				let totalCount = 0;
				const collection = state.collection;

				for (const counterItem of Object.values(collection))
				{
					if (!this.#hasRecentType(collection, counterItem, recentType))
					{
						continue;
					}

					if (this.#isMuted(collection, counterItem))
					{
						continue;
					}

					totalCount += this.#resolveCounter(counterItem);
				}

				return totalCount;
			},
			/** @function counters/getTotalCounterByIds */
			getTotalCounterByIds: (state: CountersState) => (chatIds: number[]): number => {
				let totalCount = 0;
				for (const chatId of chatIds)
				{
					const counterItem = state.collection[chatId];
					if (!counterItem)
					{
						continue;
					}

					if (this.#isMuted(state.collection, counterItem))
					{
						continue;
					}

					totalCount += this.#resolveCounter(counterItem);
				}

				return totalCount;
			},
			/** @function counters/getChildrenTotalCounter */
			getChildrenTotalCounter: (state: CountersState) => (parentChatId: number): number => {
				if (parentChatId === 0)
				{
					return 0;
				}

				let totalCount = 0;
				for (const counterItem of Object.values(state.collection))
				{
					const hasRequiredParent = counterItem.parentChatId === parentChatId;
					if (!hasRequiredParent)
					{
						continue;
					}

					totalCount += counterItem.counter;
				}

				return totalCount;
			},
			/** @function counters/getChildrenIdsWithCounter */
			getChildrenIdsWithCounter: (state: CountersState) => (parentChatId: number): number[] => {
				if (parentChatId === 0)
				{
					return [];
				}

				const childrenIdsWithCounter = [];
				for (const counterItem of Object.values(state.collection))
				{
					const hasRequiredParent = counterItem.parentChatId === parentChatId;
					if (!hasRequiredParent || counterItem.counter === 0)
					{
						continue;
					}

					childrenIdsWithCounter.push(counterItem.chatId);
				}

				return childrenIdsWithCounter;
			},
			/** @function counters/getCounterByChatId */
			getCounterByChatId: (state: CountersState) => (chatId: number): number => {
				const counterItem = state.collection[chatId];

				if (!counterItem)
				{
					return 0;
				}

				return counterItem.counter;
			},
			/** @function counters/getUnreadStatus */
			getUnreadStatus: (state: CountersState) => (chatId: number): boolean => {
				const counterItem = state.collection[chatId];

				if (!counterItem)
				{
					return false;
				}

				return counterItem.isMarkedAsUnread;
			},
		};
	}

	/* eslint-disable no-param-reassign */
	/* eslint-disable-next-line max-lines-per-function */
	getActions(): ActionTree
	{
		return {
			/** @function counters/setCounters */
			setCounters: (store, payload: ImModelCounter[]) => {
				if (!Type.isArray(payload))
				{
					return;
				}

				const preparedItems = payload.map((counterItem) => {
					const preparedItem = this.#formatFields(counterItem);

					return {
						...this.getElementState(),
						...preparedItem,
					};
				});

				store.commit('setCounters', preparedItems);
			},
			/** @function counters/setCounter */
			setCounter: (store, payload: { chatId: number, counter: number }) => {
				const { chatId } = payload;

				const existingItem = store.state.collection[chatId];
				if (!existingItem)
				{
					return;
				}

				store.commit('setCounter', payload);
			},
			/** @function counters/setUnreadStatus */
			setUnreadStatus: (store, payload: { chatId: number, status: boolean }) => {
				const { chatId } = payload;

				const existingItem = store.state.collection[chatId];
				if (!existingItem)
				{
					return;
				}

				store.commit('setUnreadStatus', payload);
			},
			/** @function counters/setMuteStatus */
			setMuteStatus: (store, payload: { chatId: number, status: boolean }) => {
				const { chatId } = payload;

				const existingItem = store.state.collection[chatId];
				if (!existingItem)
				{
					return;
				}

				store.commit('setMuteStatus', payload);
			},
			/** @function counters/clearByRecentType */
			clearByRecentType: (store, payload: { recentType: RecentTypeItem }) => {
				store.commit('clearByRecentType', payload);
			},
			/** @function counters/clearById */
			clearById: (store, payload: { chatId: number }) => {
				store.commit('clearById', payload);
			},
			/** @function counters/clearByParentId */
			clearByParentId: (store, payload: { parentChatId: number }) => {
				store.commit('clearByParentId', payload);
			},
			/** @function counters/clear */
			clear: (store) => {
				store.commit('clear');
			},
		};
	}

	getMutations(): MutationTree
	{
		return {
			setCounters: (state: CountersState, payload: ImModelCounter[]) => {
				payload.forEach((counterItem) => {
					state.collection[counterItem.chatId] = counterItem;
				});
			},
			setCounter: (state: CountersState, payload: { chatId: number, counter: number }) => {
				const { chatId, counter } = payload;

				const existingItem = state.collection[chatId];
				existingItem.counter = counter;
			},
			setUnreadStatus: (state: CountersState, payload: { chatId: number, status: boolean }) => {
				const { chatId, status } = payload;

				const existingItem = state.collection[chatId];
				existingItem.isMarkedAsUnread = status;
			},
			setMuteStatus: (state: CountersState, payload: { chatId: number, status: boolean }) => {
				const { chatId, status } = payload;

				const existingItem = state.collection[chatId];
				existingItem.isMuted = status;
			},
			clearByRecentType: (state: CountersState, payload: { recentType: RecentTypeItem }) => {
				const { recentType } = payload;
				const collection = state.collection;

				const idsToDelete = [];
				for (const counterItem of Object.values(collection))
				{
					if (!this.#hasRecentType(collection, counterItem, recentType))
					{
						continue;
					}

					idsToDelete.push(counterItem.chatId);
				}

				for (const chatId of idsToDelete)
				{
					delete collection[chatId];
				}
			},
			clearById: (state: CountersState, payload: { chatId: number }) => {
				const { chatId } = payload;
				const collection = state.collection;

				delete collection[chatId];

				for (const counterItem of Object.values(collection))
				{
					const hasRequiredParent = counterItem.parentChatId === chatId;
					if (!hasRequiredParent)
					{
						continue;
					}

					delete collection[counterItem.chatId];
				}
			},
			clearByParentId: (state: CountersState, payload: { parentChatId: number }) => {
				const { parentChatId } = payload;
				const collection = state.collection;

				for (const counterItem of Object.values(collection))
				{
					if (counterItem.parentChatId !== parentChatId)
					{
						continue;
					}

					delete collection[counterItem.chatId];
				}
			},
			clear: (state: CountersState) => {
				state.collection = {};
			},
		};
	}

	#hasRecentType(
		collection: CountersCollection,
		counterItem: ImModelCounter,
		recentType: RecentTypeItem,
	): boolean
	{
		const hasRequiredType = counterItem.recentSections.includes(recentType);
		if (hasRequiredType)
		{
			return true;
		}

		const parentChatId = counterItem.parentChatId;
		const parentChat = collection[parentChatId];
		const hasParentChat = parentChatId > 0 && parentChat;
		if (!hasParentChat)
		{
			return false;
		}

		const parentHasRequiredType = parentChat.recentSections.includes(recentType);

		return parentHasRequiredType;
	}

	#isMuted(collection: CountersCollection, counterItem: ImModelCounter): boolean
	{
		const parent = collection[counterItem.parentChatId];

		return counterItem.isMuted || parent?.isMuted;
	}

	#resolveCounter(counterItem: ImModelCounter): number
	{
		if (counterItem.counter > 0)
		{
			return counterItem.counter;
		}

		if (counterItem.isMarkedAsUnread)
		{
			return 1;
		}

		return 0;
	}

	#formatFields(counterItem: Partial<ImModelCounter>): ImModelCounter
	{
		return formatFieldsWithConfig(counterItem, counterFieldsConfig);
	}
}
