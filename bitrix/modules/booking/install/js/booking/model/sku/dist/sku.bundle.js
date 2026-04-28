/* eslint-disable */
this.BX = this.BX || {};
this.BX.Booking = this.BX.Booking || {};
(function (exports,ui_vue3_vuex,booking_const) {
	'use strict';

	/* eslint-disable no-param-reassign,max-lines-per-function */
	class SkuModel extends ui_vue3_vuex.BuilderModel {
	  getName() {
	    return booking_const.Model.Sku;
	  }
	  getState() {
	    return {
	      catalogSkuEntityOptions: {},
	      isReloadRelations: false
	    };
	  }
	  getGetters() {
	    return {
	      /** @function sku/catalogSkuEntityOptions */
	      catalogSkuEntityOptions: state => state.catalogSkuEntityOptions,
	      /** @function sku/isReloadRelations */
	      isReloadRelations: state => state.isReloadRelations
	    };
	  }
	  getActions() {
	    return {
	      /** @function sku/setCatalogSkuEntityOptions */
	      setCatalogSkuEntityOptions({
	        commit
	      }, options) {
	        commit('setCatalogSkuEntityOptions', options);
	      },
	      /** @function sku/setReloadRelations */
	      setReloadRelations: (store, isReloadRelations) => {
	        store.commit('setReloadRelations', isReloadRelations);
	      }
	    };
	  }
	  getMutations() {
	    return {
	      setCatalogSkuEntityOptions(state, options) {
	        state.catalogSkuEntityOptions = options;
	      },
	      setReloadRelations: (state, isReloadRelations) => {
	        state.isReloadRelations = isReloadRelations;
	      }
	    };
	  }
	}

	exports.SkuModel = SkuModel;

}((this.BX.Booking.Model = this.BX.Booking.Model || {}),BX.Vue3.Vuex,BX.Booking.Const));
//# sourceMappingURL=sku.bundle.js.map
