/* eslint-disable */
this.BX = this.BX || {};
this.BX.Booking = this.BX.Booking || {};
(function (exports,main_core,ui_vue3,ui_vue3_vuex,booking_const) {
	'use strict';

	function getSkusResourcesMap(resourcesSkusMap, skusIds) {
	  const skusResourcesMap = new Map();
	  for (const skuId of skusIds) {
	    skusResourcesMap.set(skuId, new Set());
	  }
	  for (const [resourceId, resourceSkusIds] of resourcesSkusMap) {
	    for (const skuId of resourceSkusIds) {
	      if (skusResourcesMap.has(skuId)) {
	        const skusSet = skusResourcesMap.get(skuId);
	        skusSet.add(resourceId);
	        skusResourcesMap.set(skuId, skusSet);
	      } else {
	        skusResourcesMap.set(skuId, new Set([resourceId]));
	      }
	    }
	  }
	  return skusResourcesMap;
	}

	class SkuResourcesEditorModel extends ui_vue3_vuex.BuilderModel {
	  getName() {
	    return booking_const.Model.SkuResourcesEditor;
	  }
	  getState() {
	    return {
	      fetching: false,
	      tab: booking_const.SkuResourcesEditorTab.Skus,
	      resources: new Map(),
	      skus: new Map(),
	      resourcesSkusMap: new Map(),
	      invalidSku: false,
	      invalidResource: false,
	      options: ui_vue3.markRaw({
	        canBeEmpty: false,
	        editMode: false
	      })
	    };
	  }
	  getGetters() {
	    return {
	      resources: state => {
	        return [...state.resources.values()];
	      },
	      /** @function sku-resources-editor/skusResourcesMap */
	      skusResourcesMap: state => {
	        return getSkusResourcesMap(state.resourcesSkusMap, state.skus.keys());
	      },
	      /** @function sku-resources-editor/getSkuById */
	      getSkuById: state => skuId => {
	        return state.skus.get(skuId) || null;
	      },
	      /** @function sku-resources-editor/getSkusByIds */
	      getSkusByIds: state => skusIds => {
	        return skusIds.map(skuId => state.skus.get(skuId)).filter(sku => !main_core.Type.isNil(sku)).reverse();
	      },
	      /** @function sku-resources-editor/getResourcesByIds */
	      getResourcesByIds: state => resourcesIds => {
	        return resourcesIds.map(id => state.resources.get(id)).filter(resource => !main_core.Type.isNil(resource)).reverse();
	      }
	    };
	  }
	  getActions() {
	    return {
	      /** @function sku-resources-editor/setResources */
	      setResources({
	        commit,
	        state
	      }, resources) {
	        const canBeEmpty = state.options.canBeEmpty;
	        const resourcesSkusMap = new Map();
	        const skusMap = new Map();
	        for (const resource of resources) {
	          if (resource.skus.length === 0 && !canBeEmpty) {
	            continue;
	          }
	          resourcesSkusMap.set(resource.id, new Set(resource.skus.map(({
	            id
	          }) => id)));
	          resource.skus.forEach(sku => {
	            skusMap.set(sku.id, sku);
	          });
	        }
	        commit('setResourcesSkusMap', resourcesSkusMap);
	        commit('setResources', resources);
	        commit('setSkus', skusMap);
	      },
	      /** @function sku-resources-editor/addSkus */
	      addSkus({
	        commit
	      }, skus) {
	        commit('addSkus', skus);
	      },
	      /** @function sku-resources-editor/addResources */
	      addResources({
	        commit
	      }, resources) {
	        commit('addResources', resources);
	      },
	      /** @function sku-resources-editor/addSkusToResource */
	      addSkusToResource({
	        commit
	      }, {
	        resourceId,
	        skusIds
	      }) {
	        commit('addSkusToResource', {
	          resourceId,
	          skusIds
	        });
	      },
	      /** @function sku-resources-editor/addSkuToResource */
	      addSkuToResource({
	        commit
	      }, {
	        resourceId,
	        sku
	      }) {
	        commit('addSkus', [sku]);
	        commit('addSkuToResource', {
	          resourceId,
	          sku
	        });
	      },
	      /** @function sku-resources-editor/addSkusToResource */
	      addSkusToResources({
	        commit
	      }, payload) {
	        commit('addSkus', payload.skus);
	        commit('addSkusToResources', payload);
	      },
	      /** @function sku-resources-editor/deleteSku */
	      deleteSku({
	        commit
	      }, skuId) {
	        commit('deleteSku', skuId);
	      },
	      /** @function sku-resources-editor/deleteSkuFromResource */
	      deleteSkuFromResource({
	        commit
	      }, {
	        resourceId,
	        skuId
	      }) {
	        commit('deleteSkuFromResource', {
	          resourceId,
	          skuId
	        });
	      },
	      /** @function sku-resources-editor/deleteSkuFromResources */
	      deleteSkuFromResources({
	        commit
	      }, payload) {
	        commit('deleteSkuFromResources', payload);
	      },
	      /** @function sku-resources-editor/deleteSkusFromResources */
	      deleteSkusFromResources({
	        commit
	      }, payload) {
	        commit('deleteSkusFromResources', payload);
	      },
	      /** @function sku-resources-editor/deleteResource */
	      deleteResource({
	        commit
	      }, resourceId) {
	        commit('deleteResource', resourceId);
	      },
	      /** @function sku-resources-editor/updateTab */
	      updateTab({
	        commit
	      }, tab) {
	        if (Object.values(booking_const.SkuResourcesEditorTab).includes(tab)) {
	          commit('updateTab', tab);
	        }
	      },
	      updateInvalid({
	        commit,
	        state
	      }, {
	        invalidSku,
	        invalidResource
	      }) {
	        commit('updateInvalid', {
	          invalidSku: invalidSku != null ? invalidSku : state.invalidSku,
	          invalidResource: invalidResource != null ? invalidResource : state.invalidResource
	        });
	      }
	    };
	  }
	  getMutations() {
	    return {
	      setOptions(state, options) {
	        state.options = ui_vue3.markRaw(options);
	      },
	      updateTab(state, tab) {
	        state.tab = tab;
	      },
	      setResourcesSkusMap(state, resourcesSkusMap) {
	        state.resourcesSkusMap = new Map(resourcesSkusMap);
	      },
	      setResources(state, resources) {
	        state.resources = new Map(resources.map(resource => [resource.id, resource]));
	      },
	      setSkus(state, skus) {
	        state.skus = skus;
	      },
	      setFetching(state, fetching = false) {
	        state.fetching = fetching;
	      },
	      addSkus(state, skus) {
	        if (!(state.skus instanceof Map)) {
	          state.skus = new Map();
	        }
	        for (const sku of skus) {
	          if (!state.skus.has(sku.id)) {
	            state.skus.set(sku.id, sku);
	          }
	        }
	      },
	      addResources(state, resources) {
	        resources.forEach(resource => {
	          state.resources.set(resource.id, resource);
	        });
	      },
	      addResourceSkus(state, {
	        resourceId,
	        skus = []
	      }) {
	        if (state.resourcesSkusMap.has(resourceId)) {
	          const skusSet = state.resourcesSkusMap.get(resourceId);
	          skus.filter(skuId => !skusSet.has(skuId)).forEach(skuId => skusSet.add(skuId));
	        } else {
	          state.resourcesSkusMap.set(resourceId, new Set(skus));
	        }
	      },
	      addSkuToResource(state, {
	        resourceId,
	        sku
	      }) {
	        const resourceSkus = state.resourcesSkusMap.get(resourceId);
	        if (resourceSkus instanceof Set) {
	          resourceSkus.add(sku.id);
	          state.resourcesSkusMap.set(resourceId, resourceSkus);
	        } else {
	          state.resourcesSkusMap.set(resourceId, new Set([sku.id]));
	        }
	      },
	      addSkusToResource(state, {
	        resourceId,
	        skus
	      }) {
	        const resourceSkus = state.resourcesSkusMap.get(resourceId) || new Set();
	        for (const sku of skus) {
	          resourceSkus.add(sku.id);
	        }
	        state.resourcesSkusMap.set(resourceId, resourceSkus);
	      },
	      addSkusToResources(state, {
	        resourcesIds,
	        skus
	      }) {
	        for (const resourceId of resourcesIds) {
	          const resourceSkus = state.resourcesSkusMap.get(resourceId) || new Set();
	          for (const sku of skus) {
	            resourceSkus.add(sku.id);
	          }
	          state.resourcesSkusMap.set(resourceId, resourceSkus);
	        }
	      },
	      deleteSku(state, skuId) {
	        state.skus.delete(skuId);
	      },
	      deleteSkuFromResource(state, {
	        resourceId,
	        skuId
	      }) {
	        const resourcesSkus = state.resourcesSkusMap.get(resourceId);
	        if (!resourcesSkus) {
	          return;
	        }
	        resourcesSkus.delete(skuId);
	      },
	      deleteSkuFromResources(state, {
	        resourceIds,
	        skuId
	      }) {
	        for (const resourceId of resourceIds) {
	          const resourcesSkus = state.resourcesSkusMap.get(resourceId);
	          if (!resourcesSkus) {
	            continue;
	          }
	          resourcesSkus.delete(skuId);
	        }
	      },
	      deleteSkusFromResources(state, {
	        resourcesIds,
	        skuIds
	      }) {
	        for (const resourceId of resourcesIds) {
	          const resourcesSkus = state.resourcesSkusMap.get(resourceId);
	          if (!resourcesSkus) {
	            return;
	          }
	          for (const skuId of skuIds) {
	            resourcesSkus.delete(skuId);
	          }
	        }
	      },
	      deleteResource(state, resourceId) {
	        state.resourcesSkusMap.delete(resourceId);
	      },
	      updateInvalid(state, {
	        invalidSku,
	        invalidResource
	      }) {
	        state.invalidSku = invalidSku;
	        state.invalidResource = invalidResource;
	      }
	    };
	  }
	}

	exports.SkuResourcesEditorModel = SkuResourcesEditorModel;

}((this.BX.Booking.Model = this.BX.Booking.Model || {}),BX,BX.Vue3,BX.Vue3.Vuex,BX.Booking.Const));
//# sourceMappingURL=sku-resources-editor.bundle.js.map
