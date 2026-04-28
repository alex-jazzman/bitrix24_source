import { Type, type JsonObject } from 'main.core';
import { BuilderModel, type Store, type GetterTree, type ActionTree, type MutationTree } from 'ui.vue3.vuex';

import { Core } from 'im.v2.application.core';
import { FakeDraftMessagePrefix, RecentType, type RecentTypeItem } from 'im.v2.const';
import { RecentManager } from 'im.v2.lib.recent';
import { MessageManager } from 'im.v2.lib.message';

import { formatFieldsWithConfig } from '../utils/validate';
import { type ImModelMessage } from '../registry';

import { type RecentItem as ImModelRecentItem } from '../type/recent-item';
import { recentFieldsConfig } from './format/field-config';
import { CallsModel } from './nested-modules/calls';
import {
	type RawSetPayload,
	type SetPayload,
	type RawClearPayload,
	type ClearPayload,
	type GetPayload,
	type UpdatePayload,
	type RawRecentItemsPayload,
	type SetDraftPayload,
} from './types/payload-types.js';

type RecentStore = Store<RecentState>;

type RecentState = {
	collection: { [dialogId: string]: ImModelRecentItem },
	recentIndex: IndexByParentAndType,
	unreadIndex: IndexByParentAndType,
};

type IndexByParentAndType = {
	[parentChatId: string]: {
		[type: RecentTypeItem]: Set<string>,
	}
}

export class RecentModel extends BuilderModel
{
	static ROOT_PARENT_ID = 0;

	getName(): string
	{
		return 'recent';
	}

	getNestedModules(): { [moduleName: string]: BuilderModel }
	{
		return {
			calls: CallsModel,
		};
	}

	getState(): RecentState
	{
		return {
			collection: {},
			recentIndex: {},
			unreadIndex: {},
		};
	}

	getElementState(): ImModelRecentItem
	{
		return {
			dialogId: '0',
			messageId: 0,
			draft: {
				text: '',
				date: null,
			},
			pinned: false,
			liked: false,
			invitation: {
				isActive: false,
				originator: 0,
				canResend: false,
			},
			isFakeElement: false,
			isBirthdayPlaceholder: false,
			lastActivityDate: null,
		};
	}

	// eslint-disable-next-line max-lines-per-function
	getGetters(): GetterTree
	{
		return {
			/** @function recent/getCollection */
			getCollection: (state: RecentState) => (payload: GetPayload & { unread?: boolean }): ImModelRecentItem[] => {
				const { type, unread = false, parentChatId = RecentModel.ROOT_PARENT_ID } = payload;
				const index = unread ? state.unreadIndex : state.recentIndex;

				const parentGroup = index[parentChatId];
				if (!parentGroup)
				{
					return [];
				}

				const typeGroup = parentGroup[type];
				if (!typeGroup)
				{
					return [];
				}

				return [...typeGroup]
					.filter((dialogId) => this.store.getters['chats/get'](dialogId) && state.collection[dialogId])
					.map((dialogId) => state.collection[dialogId]);
			},
			/** @function recent/getUnreadCollection */
			getUnreadCollection: () => (payload: GetPayload): ImModelRecentItem[] => {
				return this.store.getters['recent/getCollection']({ ...payload, unread: true });
			},
			/** @function recent/getSortedCollection */
			getSortedCollection: () => (payload: GetPayload & { unread?: boolean }): ImModelRecentItem[] => {
				const collection: ImModelRecentItem[] = this.store.getters['recent/getCollection'](payload);

				return [...collection].sort((a, b) => {
					const dateA = RecentManager.getSortDate(a.dialogId);
					const dateB = RecentManager.getSortDate(b.dialogId);

					if (dateA?.getTime() === dateB?.getTime())
					{
						return a.dialogId > b.dialogId ? 1 : -1;
					}

					return dateB - dateA;
				});
			},
			/** @function recent/getSortedUnreadCollection */
			getSortedUnreadCollection: () => (payload: GetPayload): ImModelRecentItem[] => {
				return this.store.getters['recent/getSortedCollection']({ ...payload, unread: true });
			},
			/** @function recent/get */
			get: (state: RecentState) => (dialogId: string): ?ImModelRecentItem => {
				if (!state.collection[dialogId])
				{
					return null;
				}

				return state.collection[dialogId];
			},
			/** @function recent/getMessage */
			getMessage: (state: RecentState) => (dialogId: string): ?ImModelMessage => {
				const element = state.collection[dialogId];
				if (!element)
				{
					return null;
				}

				return this.#getMessage(element.messageId);
			},
			/** @function recent/hasInCollection */
			hasInCollection: (state: RecentState) => (payload: GetPayload & { dialogId: string }): boolean => {
				const { dialogId, type, parentChatId = RecentModel.ROOT_PARENT_ID } = payload;

				const parentGroup = state.recentIndex[parentChatId];
				if (!parentGroup)
				{
					return false;
				}

				const typeGroup = parentGroup[type];
				if (!typeGroup)
				{
					return false;
				}

				return typeGroup.has(dialogId);
			},
		};
	}

	/* eslint-disable no-param-reassign */
	/* eslint-disable-next-line max-lines-per-function */
	getActions(): ActionTree
	{
		return {
			/** @function recent/setCollection */
			setCollection: async (store: RecentStore, payload: RawSetPayload & { unread?: boolean }) => {
				const { type, items, unread = false, parentChatId = RecentModel.ROOT_PARENT_ID } = payload;

				const itemIds = await Core.getStore().dispatch('recent/set', items);

				store.commit('setIndex', { parentChatId, type, itemIds, unread });
			},
			/** @function recent/setUnreadCollection */
			setUnreadCollection: async (store: RecentStore, payload: RawSetPayload) => {
				void Core.getStore().dispatch('recent/setCollection', { ...payload, unread: true });
			},
			/** @function recent/clearCollection */
			clearCollection: async (store: RecentStore, payload: RawClearPayload & { unread?: boolean }) => {
				const { type, unread = false, parentChatId = RecentModel.ROOT_PARENT_ID } = payload;

				store.commit('clearCollection', { parentChatId, type, unread });
			},
			/** @function recent/clearUnreadCollection */
			clearUnreadCollection: async (store: RecentStore, payload: RawClearPayload) => {
				void Core.getStore().dispatch('recent/clearCollection', { ...payload, unread: true });
			},
			/** @function recent/set */
			set: (store: RecentStore, payload: RawRecentItemsPayload): string[] => {
				if (!Type.isArray(payload) && Type.isPlainObject(payload))
				{
					payload = [payload];
				}

				const itemsToUpdate = [];
				const itemsToAdd = [];

				for (const rawElement of payload)
				{
					const element = this.#formatFields(rawElement);

					const existingItem = store.state.collection[element.dialogId];
					if (existingItem)
					{
						itemsToUpdate.push({ dialogId: existingItem.dialogId, fields: element });

						continue;
					}

					itemsToAdd.push({ ...this.getElementState(), ...element });
				}

				store.commit('add', itemsToAdd);
				store.commit('update', itemsToUpdate);

				return [...itemsToAdd, ...itemsToUpdate].map((item) => item.dialogId);
			},
			/** @function recent/update */
			update: (store: RecentStore, payload: UpdatePayload) => {
				const { dialogId, fields } = payload;
				const existingItem: ImModelRecentItem = store.state.collection[dialogId];
				if (!existingItem)
				{
					return;
				}

				store.commit('update', {
					dialogId,
					fields: this.#formatFields(fields),
				});
			},
			/** @function recent/pin */
			pin: (store: RecentStore, payload: { dialogId: string | number, action: boolean }) => {
				const { dialogId, action } = payload;
				const existingItem = store.state.collection[dialogId];
				if (!existingItem)
				{
					return;
				}

				store.commit('update', {
					dialogId,
					fields: { pinned: action },
				});
			},
			/** @function recent/like */
			like: (store: RecentStore, payload: { dialogId: string | number, messageId: number, liked: boolean }) => {
				const { dialogId, messageId, liked } = payload;
				const existingItem: ImModelRecentItem = store.state.collection[dialogId];
				if (!existingItem)
				{
					return;
				}

				const isLastMessage = existingItem.messageId === Number.parseInt(messageId, 10);
				const isExactMessageLiked = !Type.isUndefined(messageId) && liked === true;
				if (isExactMessageLiked && !isLastMessage)
				{
					return;
				}

				store.commit('update', {
					dialogId,
					fields: { liked: liked === true },
				});
			},
			/** @function recent/setDraft */
			setDraft: (store: RecentStore, payload: SetDraftPayload) => {
				const { dialogId, text, addFakeItems = true } = payload;
				const isRemovingDraft = !Type.isStringFilled(text);
				if (isRemovingDraft && this.#shouldDeleteItemWithDraft(payload))
				{
					void Core.getStore().dispatch('recent/hide', { dialogId });

					return;
				}

				const hasRecentItem = Core.getStore().getters['recent/hasInCollection']({
					dialogId,
					type: RecentType.default,
				});

				const needsFakeItem = !hasRecentItem && !isRemovingDraft;
				if (needsFakeItem && addFakeItems)
				{
					this.#handleFakeItemWithDraft(payload, store);
				}

				const existingItem = store.state.collection[dialogId];
				if (!existingItem)
				{
					return;
				}

				void Core.getStore().dispatch('recent/update', {
					dialogId,
					fields: {
						draft: { text: text.toString() },
					},
				});
			},
			/** @function recent/hide */
			hide: (store: RecentStore, payload: { dialogId: string | number }) => {
				const { dialogId } = payload;
				const existingItem = store.state.collection[dialogId];
				if (!existingItem)
				{
					return;
				}

				store.commit('removeFromCollections', { dialogId });
			},
			/** @function recent/delete */
			delete: (store: RecentStore, payload: { dialogId: string | number }) => {
				const { dialogId } = payload;
				const existingItem = store.state.collection[dialogId];
				if (!existingItem)
				{
					return;
				}

				store.commit('delete', { dialogId });
			},
		};
	}

	getMutations(): MutationTree
	{
		return {
			setIndex: (state: RecentState, payload: SetPayload) => {
				const { parentChatId, type, itemIds, unread } = payload;
				const index = unread ? state.unreadIndex : state.recentIndex;

				if (!index[parentChatId])
				{
					index[parentChatId] = {};
				}

				const parentGroup = index[parentChatId];
				if (!parentGroup[type])
				{
					parentGroup[type] = new Set();
				}

				const typeGroup = parentGroup[type];
				itemIds.forEach((dialogId) => {
					typeGroup.add(dialogId);
				});
			},
			clearCollection: (state: RecentState, payload: ClearPayload) => {
				const { parentChatId, type, unread } = payload;
				const index = unread ? state.unreadIndex : state.recentIndex;

				delete index[parentChatId]?.[type];
			},
			add: (state: RecentState, payload: ImModelRecentItem[] | ImModelRecentItem) => {
				if (!Type.isArray(payload) && Type.isPlainObject(payload))
				{
					payload = [payload];
				}

				payload.forEach((item) => {
					state.collection[item.dialogId] = item;
				});
			},
			update: (state: RecentState, payload: UpdatePayload | UpdatePayload[]) => {
				if (!Type.isArray(payload) && Type.isPlainObject(payload))
				{
					payload = [payload];
				}

				payload.forEach(({ dialogId, fields }) => {
					if (!this.#shouldApplyUpdate(dialogId, fields))
					{
						return;
					}

					const currentElement = state.collection[dialogId];
					state.collection[dialogId] = { ...currentElement, ...fields };
				});
			},
			removeFromCollections: (state: RecentState, payload: { dialogId: string }) => {
				const { dialogId } = payload;

				const collections = this.#getAllCollections(state, [RecentType.openChannel]);

				collections.forEach((idSet) => idSet.delete(dialogId));
			},
			delete: (state: RecentState, payload: { dialogId: string }) => {
				const { dialogId } = payload;

				delete state.collection[dialogId];
			},
		};
	}

	#formatFields(rawFields: JsonObject): Partial<ImModelRecentItem>
	{
		const options = Type.isPlainObject(rawFields.options) ? rawFields.options : {};
		const fields = { ...rawFields, ...options };

		return formatFieldsWithConfig(fields, recentFieldsConfig);
	}

	#shouldApplyUpdate(dialogId: string, fields: Partial<ImModelRecentItem>): boolean
	{
		// if we already got chat - we should not update it with fake user chat
		// (unless it's an accepted invitation or fake user with real message)
		const hasRecentItem = Core.getStore().getters['recent/hasInCollection']({
			dialogId,
			type: RecentType.default,
		});

		if (!hasRecentItem)
		{
			return true;
		}

		const isFakeElement = fields.isFakeElement && MessageManager.isTempMessage(fields.messageId);
		if (!isFakeElement)
		{
			return true;
		}

		return Boolean(fields.invitation);
	}

	#getAllCollections(state: RecentState, excludeTypes: RecentTypeItem[] = []): Set<string>[]
	{
		const result = [];
		const trees = [state.recentIndex, state.unreadIndex];

		trees.forEach((indexTree) => {
			Object.values(indexTree).forEach((parentGroup) => {
				Object.entries(parentGroup).forEach(([recentType, idSet]) => {
					if (excludeTypes.includes(recentType))
					{
						return;
					}

					result.push(idSet);
				});
			});
		});

		return result;
	}

	#getMessage(messageId: number | string): ImModelMessage
	{
		return Core.getStore().getters['messages/getById'](messageId);
	}

	#handleFakeItemWithDraft(payload: SetDraftPayload): void
	{
		const recentItem = { ...this.getElementState(), ...this.#prepareFakeItemWithDraft(payload) };

		void Core.getStore().dispatch('recent/setCollection', {
			type: RecentType.default,
			items: [recentItem],
		});
	}

	#prepareFakeItemWithDraft(payload: SetDraftPayload): Partial<ImModelRecentItem>
	{
		const messageId = this.#createFakeMessageForDraft(payload.dialogId);

		return this.#formatFields({
			dialogId: payload.dialogId.toString(),
			draft: { text: payload.text.toString() },
			messageId,
		});
	}

	#createFakeMessageForDraft(dialogId: string): string
	{
		const messageId = `${FakeDraftMessagePrefix}-${dialogId}`;
		void Core.getStore().dispatch('messages/store', { id: messageId, date: new Date() });

		return messageId;
	}

	#shouldDeleteItemWithDraft(payload: SetDraftPayload): boolean
	{
		const existingItem = Core.getStore().getters['recent/get'](payload.dialogId);

		return existingItem
			&& !Type.isStringFilled(payload.text)
			&& existingItem.messageId.toString().startsWith(FakeDraftMessagePrefix)
		;
	}
}
