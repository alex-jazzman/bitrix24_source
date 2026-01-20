/* eslint-disable */
this.BX = this.BX || {};
this.BX.Booking = this.BX.Booking || {};
(function (exports,ui_vue3_vuex,booking_const) {
	'use strict';

	/* eslint-disable no-param-reassign */
	class SaleChannels extends ui_vue3_vuex.BuilderModel {
	  getName() {
	    return booking_const.Model.SaleChannels;
	  }
	  getState() {
	    return {
	      formsMenu: {
	        canEdit: false,
	        createFormLink: '',
	        formsListLink: '',
	        formList: []
	      },
	      integrations: [],
	      isFetching: false,
	      isLoaded: false
	    };
	  }
	  getGetters() {
	    return {
	      /** @function sale-channels/getFormsMenu */
	      getFormsMenu: state => state.formsMenu,
	      /** @function sale-channels/getIntegrations */
	      getIntegrations: state => state.integrations,
	      /** @function sale-channels/isFetching */
	      isFetching: state => state.isFetching,
	      /** @function sale-channels/isLoaded */
	      isLoaded: state => state.isLoaded
	    };
	  }
	  getActions() {
	    return {
	      /** @function sale-channels/setFormsMenu */
	      setFormsMenu({
	        commit
	      }, formsMenu) {
	        commit('setFormsMenu', formsMenu);
	      },
	      /** @function sale-channels/setIntegrations */
	      setIntegrations({
	        commit
	      }, integrations) {
	        commit('setIntegrations', integrations);
	      },
	      /** @function sale-channels/setIntegrationStatus */
	      setIntegrationStatus({
	        commit
	      }, payload) {
	        commit('setIntegrationStatus', payload);
	      },
	      /** @function sale-channels/setFetching */
	      setFetching({
	        commit
	      }, isFetching) {
	        commit('setFetching', isFetching);
	      },
	      /** @function sale-channels/setLoaded */
	      setLoaded({
	        commit
	      }, isLoaded) {
	        commit('setLoaded', isLoaded);
	      }
	    };
	  }
	  getMutations() {
	    return {
	      setFormsMenu(state, formsMenu) {
	        state.formsMenu = formsMenu;
	      },
	      setIntegrations(state, integrations) {
	        state.integrations = integrations;
	      },
	      setIntegrationStatus(state, {
	        code,
	        status
	      }) {
	        const integrationItem = state.integrations.find(integration => integration.code === code);
	        if (integrationItem) {
	          integrationItem.status = status;
	        }
	      },
	      setFetching(state, isFetching) {
	        state.isFetching = isFetching;
	      },
	      setLoaded(state, isLoaded) {
	        state.isLoaded = isLoaded;
	      }
	    };
	  }
	}

	exports.SaleChannels = SaleChannels;

}((this.BX.Booking.Model = this.BX.Booking.Model || {}),BX.Vue3.Vuex,BX.Booking.Const));
//# sourceMappingURL=sale-channels.bundle.js.map
