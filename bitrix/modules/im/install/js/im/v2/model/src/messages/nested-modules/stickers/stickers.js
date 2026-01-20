import { Type } from 'main.core';
import { BuilderModel } from 'ui.vue3.vuex';

import { formatFieldsWithConfig } from 'im.v2.model';

import { messageFieldsConfig, stickerFieldsConfig, packFieldsConfig } from './format/field-config';

import type { RawSticker, RawStickerPack, RawMessage } from 'im.v2.provider.service.types';
import type { JsonObject } from 'main.core';
import type { ActionTree, GetterTree, MutationTree } from 'ui.vue3.vuex';
import type { ImModelSticker, ImModelStickerPack } from 'im.v2.model';

type StickersState = {
	stickers: Map<string, ImModelSticker>,
	packs: Map<string, ImModelStickerPack>,
	recent: string[],
	stickerToMessageMap: { [messageId: number | string]: string },
};

const RECENT_LIMIT = 12;

export class StickersModel extends BuilderModel
{
	getState(): StickersState
	{
		return {
			stickers: new Map(),
			packs: new Map(),
			recent: [],
			stickerToMessageMap: {},
		};
	}

	// eslint-disable-next-line max-lines-per-function
	getGetters(): GetterTree
	{
		return {
			/** @function messages/stickers/getPackKeys */
			getPackKeys: (state: StickersState): string[] => {
				return [...state.packs.keys()];
			},
			/** @function messages/stickers/getRecent */
			getRecent: (state: StickersState): string[] => {
				return state.recent;
			},
			/** @function messages/stickers/isStickerMessage */
			isStickerMessage: (state: StickersState) => (messageId: number | string): boolean => {
				return !Type.isUndefined(state.stickerToMessageMap[messageId]);
			},
			/** @function messages/stickers/getStickerKeyByMessageId */
			getStickerKeyByMessageId: (state: StickersState) => (messageId: number | string): ?string => {
				return state.stickerToMessageMap[messageId] || null;
			},
			/** @function messages/stickers/getStickerByMessageId */
			getStickerByMessageId: (state: StickersState) => (messageId: number | string): ?ImModelSticker => {
				const stickerKey = state.stickerToMessageMap[messageId];
				if (!stickerKey)
				{
					return null;
				}

				return state.stickers.get(stickerKey) || null;
			},
			/** @function messages/stickers/getStickerByKey */
			getStickerByKey: (state: StickersState) => (stickerKey: string): ?ImModelSticker => {
				return state.stickers.get(stickerKey) || null;
			},
			/** @function messages/stickers/getPackByKey */
			getPackByKey: (state: StickersState) => (packKey: string): ?ImModelStickerPack => {
				return state.packs.get(packKey) || null;
			},
			/** @function messages/stickers/getPackCover */
			getPackCover: (state: StickersState) => (packKey: string): string => {
				const pack = state.packs.get(packKey);
				if (!pack || !Type.isArrayFilled(pack.stickers))
				{
					return '';
				}
				const stickerKey = pack.stickers[0];
				const sticker = state.stickers.get(stickerKey) || null;

				return sticker ? sticker.uri : '';
			},
		};
	}

	getActions(): ActionTree
	{
		return {
			/** @function messages/stickers/setPacks */
			setPacks: (store, payload: RawStickerPack[]) => {
				payload.forEach((pack) => {
					const { key: packKey, name, stickers } = this.#formatPackFields(pack);
					store.commit('addPack', { key: packKey, pack: { name, stickers } });

					pack.stickers.forEach((sticker) => {
						const { id: packId, type: packType } = pack;
						const stickerFields = { packId, packType, ...sticker };
						const { key, uri, type } = this.#formatStickerFields(stickerFields);
						store.commit('addSticker', { key, stickerData: { uri, type } });
					});
				});
			},
			/** @function messages/stickers/setRecentStickers */
			setRecentStickers: (store, payload: ?RawSticker[]) => {
				if (Type.isUndefined(payload))
				{
					return;
				}

				const recent = [];
				payload.forEach((sticker) => {
					const { key, uri, type } = this.#formatStickerFields(sticker);
					recent.push(key);
					store.commit('addSticker', { key, stickerData: { uri, type } });
				});
				store.commit('setRecent', recent);
			},
			/** @function messages/stickers/updateRecentStickers */
			updateRecentStickers: (store, key: string) => {
				store.commit('updateRecent', key);
			},
			/** @function messages/stickers/setStickersFromMessages */
			setStickersFromMessages: (store, messages: RawMessage[]) => {
				messages.forEach((message) => {
					const { key, uri, type, messageId } = this.#formatMessageFields(message);
					const isSticker = Type.isString(key);
					if (!isSticker)
					{
						return;
					}

					const isCompleteSticker = uri && type;
					if (isCompleteSticker)
					{
						store.commit('addSticker', { key, stickerData: { uri, type } });
					}

					store.commit('setStickersToMessages', { key, messageId });
				});
			},
			/** @function messages/stickers/updateStickerToMessageMap */
			updateStickerToMessageMap: (store, payload: { oldId: number | string, newId: number | string }) => {
				store.commit('updateStickerToMessageMap', payload);
			},
		};
	}

	/* eslint-disable no-param-reassign */
	getMutations(): MutationTree
	{
		return {
			addSticker: (state: StickersState, payload: { key: string, stickerData: ImModelSticker }) => {
				const { key, stickerData } = payload;
				state.stickers.set(key, stickerData);
			},
			addPack: (state: StickersState, payload: { key: string, pack: ImModelStickerPack }) => {
				const { key, pack } = payload;
				state.packs.set(key, pack);
			},
			setRecent: (state: StickersState, payload: string[]) => {
				state.recent = payload;
			},
			updateRecent: (state: StickersState, key: string) => {
				const filteredRecent = state.recent.filter((item) => item !== key);
				filteredRecent.unshift(key);
				state.recent = filteredRecent.slice(0, RECENT_LIMIT);
			},
			setStickersToMessages: (state: StickersState, payload: { messageId: number | string, key: string }) => {
				const { messageId, key } = payload;
				state.stickerToMessageMap[messageId] = key;
			},
			updateStickerToMessageMap: (
				state: StickersState,
				payload: { oldId: number | string, newId: number | string },
			) => {
				state.stickerToMessageMap[payload.newId] = state.stickerToMessageMap[payload.oldId];
			},
		};
	}

	#formatMessageFields(message: RawMessage): JsonObject
	{
		const options = Type.isPlainObject(message.params) ? { ...message.params } : {};
		const fields = { ...message, ...options };

		return formatFieldsWithConfig(fields, messageFieldsConfig);
	}

	#formatPackFields(pack: RawStickerPack): ImModelStickerPack
	{
		return formatFieldsWithConfig(pack, packFieldsConfig);
	}

	#formatStickerFields(sticker: RawSticker): ImModelSticker
	{
		return formatFieldsWithConfig(sticker, stickerFieldsConfig);
	}
}
