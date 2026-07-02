import { Type } from 'main.core';
import { BuilderModel, type GetterTree, type ActionTree, type MutationTree } from 'ui.vue3.vuex';

import { RecentType, type RecentTypeItem } from 'im.v2.const';
import { formatFieldsWithConfig } from 'im.v2.model';

import { type CounterItem as ImModelCounter } from '../type/counter';
import { counterFieldsConfig } from './format/field-config';

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
					if (!this.#matchesRecentType(collection, counterItem, recentType))
					{
						continue;
					}

					if (this.#isMuted(counterItem) || this.#isParentMuted(state.collection, counterItem))
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

					if (this.#isMuted(counterItem) || this.#isParentMuted(state.collection, counterItem))
					{
						continue;
					}

					totalCount += this.#resolveCounter(counterItem);
				}

				return totalCount;
			},
			/** @function counters/getChildrenTotalCounter */
			getChildrenTotalCounter: (state: CountersState) => (
				parentChatId: number,
				recentType?: RecentTypeItem,
			): number => {
				if (parentChatId === 0)
				{
					return 0;
				}

				let totalCount = 0;
				for (const counterItem of Object.values(state.collection))
				{
					if (recentType && !this.#hasRecentType(counterItem, recentType))
					{
						continue;
					}

					const hasRequiredParent = counterItem.parentChatId === parentChatId;
					if (!hasRequiredParent)
					{
						continue;
					}

					if (this.#isMuted(counterItem))
					{
						continue;
					}

					totalCount += this.#resolveCounter(counterItem);
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
					const existingItem = store.state.collection[counterItem.chatId];

					if (existingItem)
					{
						return { ...existingItem, ...preparedItem };
					}

					return { ...this.getElementState(), ...preparedItem };
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
				const { recentType } = payload;
				const collection = store.state.collection;

				const idsToDelete = [];
				for (const counterItem of Object.values(collection))
				{
					if (!this.#matchesRecentType(collection, counterItem, recentType))
					{
						continue;
					}

					idsToDelete.push(counterItem.chatId);
				}

				for (const chatId of idsToDelete)
				{
					store.commit('delete', chatId);
				}
			},
			/** @function counters/clearById */
			clearById: (store, payload: { chatId: number }) => {
				const { chatId } = payload;
				const collection = store.state.collection;

				store.commit('delete', chatId);

				for (const counterItem of Object.values(collection))
				{
					const hasRequiredParent = counterItem.parentChatId === chatId;
					if (!hasRequiredParent)
					{
						continue;
					}

					store.commit('delete', counterItem.chatId);
				}
			},
			/** @function counters/clearByParentId */
			clearByParentId: (store, payload: { parentChatId: number }) => {
				const { parentChatId } = payload;
				const collection = store.state.collection;

				for (const counterItem of Object.values(collection))
				{
					const hasRequiredParent = counterItem.parentChatId === parentChatId;
					if (!hasRequiredParent)
					{
						continue;
					}

					store.commit('delete', counterItem.chatId);
				}
			},
			/** @function counters/clear */
			clear: (store) => {
				store.commit('clearCollection');
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
			delete: (state: CountersState, chatId: number) => {
				delete state.collection[chatId];
			},
			clearCollection: (state: CountersState) => {
				state.collection = {};
			},
		};
	}

	#matchesRecentType(
		collection: CountersCollection,
		counterItem: ImModelCounter,
		recentType: RecentTypeItem,
	): boolean
	{
		return this.#hasRecentType(counterItem, recentType)
			|| this.#hasParentRecentType(collection, counterItem, recentType);
	}

	#hasRecentType(counterItem: ImModelCounter, recentType: RecentTypeItem): boolean
	{
		return counterItem.recentSections.includes(recentType);
	}

	#hasParentRecentType(
		collection: CountersCollection,
		counterItem: ImModelCounter,
		recentType: RecentTypeItem,
	): boolean
	{
		const parentChatId = counterItem.parentChatId;
		const parentChat = collection[parentChatId];
		if (parentChatId === 0 || !parentChat)
		{
			return false;
		}

		return parentChat.recentSections.includes(recentType);
	}

	#isMuted(counterItem: ImModelCounter): boolean
	{
		return counterItem.isMuted;
	}

	#isParentMuted(collection: CountersCollection, counterItem: ImModelCounter): boolean
	{
		const parent = collection[counterItem.parentChatId];
		if (!parent)
		{
			return false;
		}

		return parent.isMuted;
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
