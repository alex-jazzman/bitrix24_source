import { Type, type JsonObject } from 'main.core';
import { BuilderModel, type Store, type ActionTree, type GetterTree, type MutationTree } from 'ui.vue3.vuex';

import { formatFieldsWithConfig } from 'im.v2.model';

import { type Pack, type RawPack, type PackIdentifier } from '../../../type/stickers';
import { packFieldsConfig } from './field-config';

type PacksState = {
	collection: Map<string, Pack>,
	sortedKeys: string[],
};

/* eslint-disable no-param-reassign */
export class PacksModel extends BuilderModel
{
	getState(): PacksState
	{
		return {
			collection: new Map(),
			sortedKeys: [],
		};
	}

	getElementState(): Pack
	{
		return {
			id: 0,
			key: '',
			type: '',
			name: '',
			authorId: null,
			isAdded: false,
		};
	}

	getGetters(): GetterTree
	{
		return {
			/** @function stickers/packs/get */
			get: (state: PacksState): Pack[] => {
				const orderMap = new Map(state.sortedKeys.map((key, index) => [key, index]));

				return [...state.collection.values()]
					.filter((pack) => pack.isAdded)
					.sort((first, second) => {
						const firstPackOrder = orderMap.get(first.key) ?? Infinity;
						const secondPackOrder = orderMap.get(second.key) ?? Infinity;

						return firstPackOrder - secondPackOrder;
					});
			},
			/** @function stickers/packs/getByIdentifier */
			getByIdentifier: (state: PacksState) => ({ id, type }: PackIdentifier): ?Pack => {
				const packKey = this.#getPackKey({ id, type });

				return state.collection.get(packKey);
			},
			/** @function stickers/packs/hasPack */
			hasPack: (state: PacksState) => ({ id, type }: PackIdentifier): boolean => {
				const packKey = this.#getPackKey({ id, type });

				return state.collection.has(packKey);
			},
		};
	}

	getActions(): ActionTree
	{
		return {
			/** @function stickers/packs/set */
			set: (store: Store, payload: RawPack[]) => {
				payload.forEach((pack) => {
					const preparedPack = this.#formatFields(pack);
					const packKey = this.#getPackKey(preparedPack);
					store.commit('add', {
						key: packKey,
						pack: {
							...this.getElementState(),
							...preparedPack,
							key: packKey,
						},
					});
				});
			},
			/** @function stickers/packs/link */
			link: (store: Store, payload: PackIdentifier) => {
				const packKey = this.#getPackKey(payload);
				store.commit('update', {
					key: packKey,
					fields: { isAdded: true },
				});
			},
			/** @function stickers/packs/rename */
			rename: (store: Store, payload: PackIdentifier & {name: string}) => {
				if (!Type.isStringFilled(payload.name))
				{
					return;
				}

				const packKey = this.#getPackKey(payload);
				store.commit('update', {
					key: packKey,
					fields: { name: payload.name },
				});
			},
			/** @function stickers/packs/unlink */
			unlink: (store: Store, payload: PackIdentifier) => {
				const packKey = this.#getPackKey(payload);
				store.commit('update', {
					key: packKey,
					fields: { isAdded: false },
				});
			},
			/** @function stickers/packs/addSortOrder */
			addSortOrder: (store: Store, payload: PackIdentifier[]) => {
				const keys = payload.map((item) => this.#getPackKey(item));
				store.commit('addSortOrder', keys);
			},
			/** @function stickers/packs/delete */
			delete: (store: Store, payload: PackIdentifier) => {
				const packKey = this.#getPackKey(payload);
				store.commit('delete', { key: packKey });
			},
		};
	}

	getMutations(): MutationTree
	{
		return {
			add: (state: PacksState, payload: { key: string, pack: Pack }) => {
				const { key, pack } = payload;
				state.collection.set(key, pack);
			},
			delete: (state: PacksState, payload: { key: string }) => {
				state.collection.delete(payload.key);
				state.sortedKeys = state.sortedKeys.filter((key) => key !== payload.key);
			},
			addSortOrder: (state: PacksState, keys: string[]) => {
				const existingKeys = new Set(state.sortedKeys);
				const newKeys = keys.filter((key) => !existingKeys.has(key));
				state.sortedKeys = [...state.sortedKeys, ...newKeys];
			},
			update: (state: PacksState, payload: {key: string, fields: Partial<Pack>}) => {
				const pack = state.collection.get(payload.key);
				if (!pack)
				{
					return;
				}

				state.collection.set(payload.key, { ...pack, ...payload.fields });
			},
		};
	}

	#formatFields(pack: JsonObject): JsonObject
	{
		return formatFieldsWithConfig(pack, packFieldsConfig);
	}

	#getPackKey({ id, type }: PackIdentifier): string
	{
		return `${id}:${type}`;
	}
}
