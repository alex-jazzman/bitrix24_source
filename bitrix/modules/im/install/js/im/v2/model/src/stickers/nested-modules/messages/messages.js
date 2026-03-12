import { BuilderModel } from 'ui.vue3.vuex';

import { formatFieldsWithConfig } from 'im.v2.model';

import { stickerMessagesConfig } from './field-config';

import type { JsonObject } from 'main.core';
import type { Store, ActionTree, GetterTree, MutationTree } from 'ui.vue3.vuex';
import type { StickerIdentifier, RawStickerMessage } from '../../../type/stickers';

type MessagesState = {
	collection: Map<string, StickerIdentifier>,
};

/* eslint-disable no-param-reassign */
export class StickerMessagesModel extends BuilderModel
{
	getState(): MessagesState
	{
		return {
			collection: new Map(),
		};
	}

	getElementState(): StickerIdentifier
	{
		return {
			id: 0,
			packId: 0,
			packType: '',
		};
	}

	getGetters(): GetterTree
	{
		return {
			/** @function stickers/messages/isSticker */
			isSticker: (state: MessagesState) => (messageId: number | string): boolean => {
				return state.collection.has(messageId);
			},
			/** @function stickers/messages/getStickerByMessageId */
			getStickerByMessageId: (state: MessagesState) => (messageId: number | string): ?StickerIdentifier => {
				return state.collection.get(messageId);
			},
		};
	}

	getActions(): ActionTree
	{
		return {
			/** @function stickers/messages/set */
			set: (store: Store, payload: RawStickerMessage[]) => {
				payload.forEach((message) => {
					const preparedStickerMessage = this.#formatFields(message);
					store.commit('add', {
						...this.getElementState(),
						...preparedStickerMessage,
					});
				});
			},
			/** @function stickers/messages/updateWithId */
			updateWithId: (store: Store, payload: { oldId: string, newId: number }) => {
				const { oldId, newId } = payload;
				const tempMessageStickerIdentifier = store.state.collection.get(oldId);
				tempMessageStickerIdentifier.messageId = newId;
				store.commit('delete', oldId);
				store.commit('add', tempMessageStickerIdentifier);
			},
		};
	}

	getMutations(): MutationTree
	{
		return {
			add: (state: MessagesState, payload: RawStickerMessage) => {
				const messageId = payload.messageId;
				delete payload.messageId;
				state.collection.set(messageId, payload);
			},
			delete: (state: MessagesState, payload: string | number) => {
				state.collection.delete(payload);
			},
		};
	}

	#formatFields(stickerMessage: RawStickerMessage): JsonObject
	{
		return formatFieldsWithConfig(stickerMessage, stickerMessagesConfig);
	}
}
