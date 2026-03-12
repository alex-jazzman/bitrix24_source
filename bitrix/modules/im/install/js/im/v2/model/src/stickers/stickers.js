import { BuilderModel } from 'ui.vue3.vuex';

import { StickerType } from 'im.v2.const';

import { stickerFieldsConfig } from './format/field-config';
import { RecentStickersModel } from './nested-modules/recent/recent';
import { StickerMessagesModel } from './nested-modules/messages/messages';
import { PacksModel } from './nested-modules/packs/packs';
import { formatFieldsWithConfig } from '../utils/validate';

import type { Store, ActionTree, GetterTree, MutationTree, NestedModuleTree } from 'ui.vue3.vuex';
import type { JsonObject } from 'main.core';
import type { Sticker, StickerIdentifier, PackIdentifier, RawSticker } from '../type/stickers';

type StickersState = {
	collection: Map<string, Sticker>,
};

/* eslint-disable no-param-reassign */
export class StickersModel extends BuilderModel
{
	getName(): string
	{
		return 'stickers';
	}

	getNestedModules(): NestedModuleTree
	{
		return {
			packs: PacksModel,
			recent: RecentStickersModel,
			messages: StickerMessagesModel,
		};
	}

	getState(): StickersState
	{
		return {
			collection: new Map(),
		};
	}

	getElementState(): Sticker
	{
		return {
			id: 0,
			packId: 0,
			packType: '',
			type: StickerType.image,
			uri: '',
			width: 0,
			height: 0,
			sort: 0,
		};
	}

	getGetters(): GetterTree
	{
		return {
			/** @function stickers/get */
			get: (state: StickersState) => ({ id, packId, packType }: StickerIdentifier): ?Sticker => {
				const stickerKey = this.#getStickerKey({ id, packId, packType });

				return state.collection.get(stickerKey);
			},
			/** @function stickers/getByPack */
			getByPack: (state: StickersState) => ({ id, type }: PackIdentifier): Sticker[] => {
				return [...state.collection.values()].filter((sticker) => {
					return sticker.packId === id && sticker.packType === type;
				}).sort((sticker1, sticker2) => sticker1.sort - sticker2.sort);
			},
			/** @function stickers/getPackCover */
			getPackCover: (state: StickersState, getters) => ({ id, type }: PackIdentifier): string => {
				const packsStickers	 = getters.getByPack({ id, type });
				if (packsStickers.length > 0)
				{
					return packsStickers[0].uri;
				}

				return '';
			},
		};
	}

	getActions(): ActionTree
	{
		return {
			/** @function stickers/set */
			set: (store: Store, payload: RawSticker[]) => {
				payload.forEach((sticker) => {
					const preparedSticker = this.#formatFields(sticker);
					const stickerKey = this.#getStickerKey(preparedSticker);

					store.commit('add', {
						key: stickerKey,
						sticker: { ...this.getElementState(), ...preparedSticker },
					});
				});
			},
			/** @function stickers/delete */
			delete: (store: Store, payload: { ids: number[], packId: number, packType: string }) => {
				const { ids, packId, packType } = payload;
				ids.forEach((id) => {
					const stickerKey = this.#getStickerKey({ id, packId, packType });
					store.commit('delete', stickerKey);
				});
			},
			/** @function stickers/deleteByPack */
			deleteByPack: (store: Store, payload: PackIdentifier) => {
				const { id: packId, type: packType } = payload;
				[...store.state.collection.values()].forEach((sticker) => {
					if (sticker.packId !== packId || sticker.packType !== packType)
					{
						return;
					}

					const { id } = sticker;
					const stickerKey = this.#getStickerKey({ id, packId, packType });
					store.commit('delete', stickerKey);
				});
			},
		};
	}

	getMutations(): MutationTree
	{
		return {
			add: (state: StickersState, payload: { key: string, sticker: Sticker }) => {
				const { key, sticker } = payload;
				state.collection.set(key, sticker);
			},
			delete: (state: StickersState, key) => {
				state.collection.delete(key);
			},
		};
	}

	#formatFields(rawSticker: JsonObject): Sticker
	{
		return formatFieldsWithConfig(rawSticker, stickerFieldsConfig);
	}

	#getStickerKey({ id, packId, packType }: StickerIdentifier): string
	{
		return `${packId}:${packType}:${id}`;
	}
}
