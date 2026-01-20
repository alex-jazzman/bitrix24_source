import { Type } from 'main.core';
import { markRaw } from 'ui.vue3';
import { BuilderModel } from 'ui.vue3.vuex';
import type { MutationTree, ActionTree, GetterTree } from 'ui.vue3.vuex';

import { Model, SkuResourcesEditorTab } from 'booking.const';
import type { ResourceModel, Skus } from 'booking.model.resources';

import { getSkusResourcesMap } from './lib/get-skus-resources-map';
import type {
	SkuResourcesEditorState,
	SkuInfo,
	AddSkus,
	AddSkuToResourcePayload,
	AddSkusToResourcesPayload,
	DeleteSkuFromResourcePayload,
	DeleteSkuFromResourcesPayload,
	DeleteSkusFromResourcesPayload,
	UpdateInvalidPayload, SkuResourcesEditorOptions,
} from './types';

export class SkuResourcesEditorModel extends BuilderModel
{
	getName(): string
	{
		return Model.SkuResourcesEditor;
	}

	getState(): SkuResourcesEditorState
	{
		return {
			fetching: false,
			tab: SkuResourcesEditorTab.Skus,
			resources: new Map(),
			skus: new Map(),
			resourcesSkusMap: new Map(),
			invalidSku: false,
			invalidResource: false,
			options: markRaw({
				canAdd: false,
				canRemove: false,
				catalogSkuEntityOptions: null,
			}),
		};
	}

	getGetters(): GetterTree<SkuResourcesEditorState, any>
	{
		return {
			resources: (state): ResourceModel[] => {
				return [...state.resources.values()];
			},
			/** @function sku-resources-editor/skusResourcesMap */
			skusResourcesMap: (state): Map<number, Set<number>> => {
				return getSkusResourcesMap(state.resourcesSkusMap, state.skus.keys());
			},
			/** @function sku-resources-editor/getSkuById */
			getSkuById: (state) => (skuId: number): SkuInfo | null => {
				return state.skus.get(skuId) || null;
			},
			/** @function sku-resources-editor/getSkusByIds */
			getSkusByIds: (state) => (skusIds: number[]): SkuInfo | null => {
				return skusIds
					.map((skuId) => state.skus.get(skuId))
					.filter((sku) => !Type.isNil(sku))
					.reverse();
			},
			/** @function sku-resources-editor/getResourcesByIds */
			getResourcesByIds: (state) => (resourcesIds: number[]): ResourceModel[] => {
				return resourcesIds
					.map((id) => state.resources.get(id))
					.filter((resource) => !Type.isNil(resource))
					.reverse();
			},
		};
	}

	getActions(): ActionTree<SkuResourcesEditorState, any>
	{
		return {
			/** @function sku-resources-editor/setResources */
			setResources({ commit }, resources: ResourceModel[])
			{
				const resourcesSkusMap: Map<number, Set<number>> = new Map();
				const skusMap: Map<number, Skus> = new Map();

				for (const resource of resources)
				{
					if (resource.skus.length === 0)
					{
						continue;
					}

					resourcesSkusMap.set(resource.id, new Set(resource.skus.map(({ id }) => id)));

					resource.skus.forEach((sku) => {
						skusMap.set(sku.id, sku);
					});
				}

				commit('setResourcesSkusMap', resourcesSkusMap);
				commit('setResources', resources);
				commit('setSkus', skusMap);
			},
			/** @function sku-resources-editor/addSkus */
			addSkus({ commit }, skus: Skus[])
			{
				commit('addSkus', skus);
			},
			/** @function sku-resources-editor/addResources */
			addResources({ commit }, resources: ResourceModel[]): void
			{
				commit('addResources', resources);
			},
			/** @function sku-resources-editor/addSkusToResource */
			addSkusToResource({ commit }, { resourceId, skusIds }: AddSkus)
			{
				commit('addSkusToResource', { resourceId, skusIds });
			},
			/** @function sku-resources-editor/addSkuToResource */
			addSkuToResource({ commit }, { resourceId, sku }: AddSkuToResourcePayload)
			{
				commit('addSkus', [sku]);
				commit('addSkuToResource', { resourceId, sku });
			},
			/** @function sku-resources-editor/addSkusToResource */
			addSkusToResources({ commit }, payload: AddSkusToResourcesPayload)
			{
				commit('addSkus', payload.skus);
				commit('addSkusToResources', payload);
			},
			/** @function sku-resources-editor/deleteSku */
			deleteSku({ commit }, skuId: number)
			{
				commit('deleteSku', skuId);
			},
			/** @function sku-resources-editor/deleteSkuFromResource */
			deleteSkuFromResource({ commit }, { resourceId, skuId }: DeleteSkuFromResourcePayload)
			{
				commit('deleteSkuFromResource', { resourceId, skuId });
			},
			/** @function sku-resources-editor/deleteSkuFromResources */
			deleteSkuFromResources({ commit }, payload: DeleteSkuFromResourcesPayload)
			{
				commit('deleteSkuFromResources', payload);
			},
			/** @function sku-resources-editor/deleteSkusFromResources */
			deleteSkusFromResources({ commit }, payload: DeleteSkusFromResourcesPayload)
			{
				commit('deleteSkusFromResources', payload);
			},
			/** @function sku-resources-editor/deleteResource */
			deleteResource({ commit }, resourceId: number)
			{
				commit('deleteResource', resourceId);
			},
			/** @function sku-resources-editor/updateTab */
			updateTab({ commit }, tab: $Values<typeof SkuResourcesEditorTab>)
			{
				if (Object.values(SkuResourcesEditorTab).includes(tab))
				{
					commit('updateTab', tab);
				}
			},
			updateInvalid({ commit, state }, { invalidSku, invalidResource }: UpdateInvalidPayload): void
			{
				commit('updateInvalid', {
					invalidSku: invalidSku ?? state.invalidSku,
					invalidResource: invalidResource ?? state.invalidResource,
				});
			},
		};
	}

	getMutations(): MutationTree<SkuResourcesEditorState>
	{
		return {
			setOptions(state, options: SkuResourcesEditorOptions): void
			{
				state.options = markRaw(options);
			},
			updateTab(state, tab: $Values<typeof SkuResourcesEditorTab>): void
			{
				state.tab = tab;
			},
			setResourcesSkusMap(state, resourcesSkusMap: Map<number, Set<number>>): void
			{
				state.resourcesSkusMap = new Map(resourcesSkusMap);
			},
			setResources(state: SkuResourcesEditorState, resources: ResourceModel[]): void
			{
				state.resources = new Map(resources.map((resource) => [resource.id, resource]));
			},
			setSkus(state, skus: Map<number, Skus[]>): void
			{
				state.skus = skus;
			},
			setFetching(state, fetching: boolean = false): void
			{
				state.fetching = fetching;
			},
			addSkus(state, skus: Skus[]): void
			{
				if (!(state.skus instanceof Map))
				{
					state.skus = new Map();
				}

				for (const sku of skus)
				{
					if (!state.skus.has(sku.id))
					{
						state.skus.set(sku.id, sku);
					}
				}
			},
			addResources(state, resources: ResourceModel[]): void
			{
				resources.forEach((resource) => {
					state.resources.set(resource.id, resource);
				});
			},
			addResourceSkus(state, { resourceId, skus = [] }: { resourceId: number, skus: number[] }): void
			{
				if (state.resourcesSkusMap.has(resourceId))
				{
					const skusSet = state.resourcesSkusMap.get(resourceId);
					skus.filter((skuId) => !skusSet.has(skuId)).forEach((skuId) => skusSet.add(skuId));
				}
				else
				{
					state.resourcesSkusMap.set(resourceId, new Set(skus));
				}
			},
			addSkuToResource(state, { resourceId, sku }: AddSkuToResourcePayload): void
			{
				const resourceSkus: ?Set<number> = state.resourcesSkusMap.get(resourceId);

				if (resourceSkus instanceof Set)
				{
					resourceSkus.add(sku.id);
					state.resourcesSkusMap.set(resourceId, resourceSkus);
				}
				else
				{
					state.resourcesSkusMap.set(resourceId, new Set([sku.id]));
				}
			},
			addSkusToResource(state, { resourceId, skus }: AddSkus): void
			{
				const resourceSkus: Set<number> = state.resourcesSkusMap.get(resourceId) || new Set();

				for (const sku of skus)
				{
					resourceSkus.add(sku.id);
				}

				state.resourcesSkusMap.set(resourceId, resourceSkus);
			},
			addSkusToResources(state, { resourcesIds, skus }: AddSkusToResourcesPayload): void
			{
				for (const resourceId of resourcesIds)
				{
					const resourceSkus: Set<number> = state.resourcesSkusMap.get(resourceId) || new Set();

					for (const sku of skus)
					{
						resourceSkus.add(sku.id);
					}

					state.resourcesSkusMap.set(resourceId, resourceSkus);
				}
			},
			deleteSku(state, skuId: number): void
			{
				state.skus.delete(skuId);
			},
			deleteSkuFromResource(state, { resourceId, skuId }: DeleteSkuFromResourcePayload): void
			{
				const resourcesSkus: ?Set<number> = state.resourcesSkusMap.get(resourceId);
				if (!resourcesSkus)
				{
					return;
				}

				resourcesSkus.delete(skuId);
			},
			deleteSkuFromResources(state, { resourceIds, skuId }: DeleteSkuFromResourcesPayload): void
			{
				for (const resourceId of resourceIds)
				{
					const resourcesSkus: ?Set<number> = state.resourcesSkusMap.get(resourceId);

					if (!resourcesSkus)
					{
						continue;
					}

					resourcesSkus.delete(skuId);
				}
			},
			deleteSkusFromResources(state, { resourcesIds, skuIds }: DeleteSkusFromResourcesPayload): void
			{
				for (const resourceId of resourcesIds)
				{
					const resourcesSkus: ?Set<number> = state.resourcesSkusMap.get(resourceId);
					if (!resourcesSkus)
					{
						return;
					}

					for (const skuId of skuIds)
					{
						resourcesSkus.delete(skuId);
					}
				}
			},
			deleteResource(state, resourceId: number): void
			{
				state.resourcesSkusMap.delete(resourceId);
			},
			updateInvalid(state, { invalidSku, invalidResource }: UpdateInvalidPayload): void
			{
				state.invalidSku = invalidSku;
				state.invalidResource = invalidResource;
			},
		};
	}
}
