/* eslint-disable no-param-reassign,max-lines-per-function */
import type { ActionTree, GetterTree, MutationTree } from 'ui.vue3.vuex';
import { BuilderModel } from 'ui.vue3.vuex';

import { Model } from 'booking.const';
import type { SkuModelState, CatalogSkuEntityOptions } from './types';

export class SkuModel extends BuilderModel
{
	getName(): string
	{
		return Model.Sku;
	}

	getState(): SkuModelState
	{
		return {
			catalogSkuEntityOptions: {},
			isReloadRelations: false,
		};
	}

	getGetters(): GetterTree<SkuModelState, any>
	{
		return {
			/** @function sku/catalogSkuEntityOptions */
			catalogSkuEntityOptions: (state): SkuModelState => state.catalogSkuEntityOptions,
			/** @function sku/isReloadRelations */
			isReloadRelations: (state): boolean => state.isReloadRelations,
		};
	}

	getActions(): ActionTree<SkuModelState, any>
	{
		return {
			/** @function sku/setCatalogSkuEntityOptions */
			setCatalogSkuEntityOptions({ commit }, options: CatalogSkuEntityOptions): void
			{
				commit('setCatalogSkuEntityOptions', options);
			},
			/** @function sku/setReloadRelations */
			setReloadRelations: (store, isReloadRelations: boolean) => {
				store.commit('setReloadRelations', isReloadRelations);
			},
		};
	}

	getMutations(): MutationTree<SkuModelState>
	{
		return {
			setCatalogSkuEntityOptions(state, options: CatalogSkuEntityOptions): void
			{
				state.catalogSkuEntityOptions = options;
			},
			setReloadRelations: (state, isReloadRelations: boolean) => {
				state.isReloadRelations = isReloadRelations;
			},
		};
	}
}
