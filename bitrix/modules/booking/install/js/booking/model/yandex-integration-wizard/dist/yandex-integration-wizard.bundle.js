/* eslint-disable */
this.BX = this.BX || {};
this.BX.Booking = this.BX.Booking || {};
(function (exports,ui_vue3_vuex,booking_provider_service_yandexIntegrationWizardService,booking_const,booking_model_resources) {
	'use strict';

	function getEmptyIntegration() {
	  return {
	    status: null,
	    catalogPermissions: null,
	    isResourceSkuRelationsSaved: false,
	    resources: [],
	    cabinetLink: '',
	    timezone: '',
	    settings: {
	      businessLink: '',
	      cabinetLinkPlaceholder: ''
	    }
	  };
	}

	/* eslint-disable no-param-reassign */
	class YandexIntegrationWizardModel extends ui_vue3_vuex.BuilderModel {
	  getName() {
	    return booking_const.Model.YandexIntegrationWizard;
	  }
	  getState() {
	    return {
	      integration: getEmptyIntegration(),
	      resources: [],
	      cabinetLink: '',
	      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
	      hasInvalidCabinetLink: false,
	      hasInvalidResources: false,
	      wasTimezoneChanged: false,
	      wasResourcesChanged: false,
	      wasCabinetLinkChanged: false,
	      isFetching: false,
	      isLoaded: false
	    };
	  }
	  getGetters() {
	    return {
	      /** @function yandex-integration-wizard/getUpdatedIntegration */
	      getUpdatedIntegration: state => {
	        const resources = state.resources.filter(({
	          skusYandex
	        }) => skusYandex.length > 0);
	        return {
	          ...state.integration,
	          resources,
	          cabinetLink: state.cabinetLink,
	          timezone: state.timezone
	        };
	      },
	      /** @function yandex-integration-wizard/getIntegrationSettings */
	      getIntegrationSettings: state => {
	        return state.integration.settings;
	      },
	      /** @function yandex-integration-wizard/isConnected */
	      isConnected: state => {
	        return [booking_const.IntegrationMapItemStatus.CONNECTED, booking_const.IntegrationMapItemStatus.IN_PROGRESS].includes(state.integration.status);
	      },
	      /** @function yandex-integration-wizard/getResources */
	      getResources: state => state.resources,
	      /** @function yandex-integration-wizard/getCabinetLink */
	      getCabinetLink: state => state.cabinetLink,
	      /** @function yandex-integration-wizard/getTimezone */
	      getTimezone: state => state.timezone,
	      /** @function yandex-integration-wizard/hasInvalidCabinetLink */
	      hasInvalidCabinetLink: state => state.hasInvalidCabinetLink,
	      /** @function yandex-integration-wizard/hasInvalidResources */
	      hasInvalidResources: state => state.hasInvalidResources,
	      /** @function yandex-integration-wizard/wasChanged */
	      hasFormDataChanges: state => {
	        return state.wasTimezoneChanged || state.wasResourcesChanged || state.wasCabinetLinkChanged;
	      },
	      /** @function yandex-integration-wizard/isFetching */
	      isFetching: state => state.isFetching,
	      /** @function yandex-integration-wizard/isLoaded */
	      isLoaded: state => state.isLoaded,
	      /** @function yandex-integration-wizard/hasInvalidFormData */
	      isFormDataValid: (state, getters) => {
	        return getters.isCabinetLinkValid && getters.isResourcesValid && getters.isTimezoneValid;
	      },
	      /** @function yandex-integration-wizard/isTimezoneValid */
	      isTimezoneValid: state => {
	        return state.timezone !== '';
	      },
	      /** @function yandex-integration-wizard/isCabinetLinkValid */
	      isCabinetLinkValid: state => {
	        const pattern = booking_provider_service_yandexIntegrationWizardService.YandexCabinetIdExtractor.cabinetLinkPattern;
	        return pattern.test(state.cabinetLink);
	      },
	      /** @function yandex-integration-wizard/isResourcesValid */
	      isResourcesValid: state => {
	        const hasInvalidResource = state.resources.every(({
	          skusYandex
	        }) => skusYandex.length === 0);
	        return state.resources.length > 0 && !hasInvalidResource;
	      }
	    };
	  }
	  getActions() {
	    return {
	      /** @function yandex-integration-wizard/setIntegration */
	      setIntegration({
	        commit
	      }, integration) {
	        commit('setIntegration', integration);
	      },
	      /** @function yandex-integration-wizard/setTimezone */
	      setTimezone({
	        commit,
	        state
	      }, {
	        timezone,
	        skipCalculateChanges = false
	      }) {
	        if (!skipCalculateChanges) {
	          commit('wasTimezoneChanged', timezone !== state.integration.timezone);
	        }
	        commit('setTimezone', timezone);
	      },
	      /** @function yandex-integration-wizard/setResources */
	      setResources({
	        commit,
	        state
	      }, {
	        resources,
	        skipCalculateChanges = false
	      }) {
	        if (!skipCalculateChanges) {
	          // For optimization, consider any changes to be different from the current value
	          commit('wasResourcesChanged', true);
	        }
	        commit('setResources', resources);
	      },
	      /** @function yandex-integration-wizard/setCabinetLink */
	      setCabinetLink({
	        commit,
	        state
	      }, {
	        link,
	        skipCalculateChanges = false
	      }) {
	        if (!skipCalculateChanges) {
	          commit('wasCabinetLinkChanged', link !== state.integration.cabinetLink);
	        }
	        commit('setCabinetLink', link);
	      },
	      /** @function yandex-integration-wizard/setStatus */
	      setStatus({
	        commit
	      }, status) {
	        commit('setStatus', status);
	      },
	      /** @function yandex-integration-wizard/setResourceSkuRelationsSaved */
	      setResourceSkuRelationsSaved({
	        commit
	      }, isSaved) {
	        commit('setResourceSkuRelationsSaved', isSaved);
	      },
	      /** @function yandex-integration-wizard/setInvalidCabinetLink */
	      setInvalidCabinetLink({
	        commit
	      }, isInvalid) {
	        commit('setInvalidCabinetLink', isInvalid);
	      },
	      /** @function yandex-integration-wizard/setInvalidResources */
	      setInvalidResources({
	        commit
	      }, isInvalid) {
	        commit('setInvalidResources', isInvalid);
	      },
	      /** @function yandex-integration-wizard/setFetching */
	      setFetching({
	        commit
	      }, isFetching) {
	        commit('setFetching', isFetching);
	      },
	      /** @function yandex-integration-wizard/setLoaded */
	      setLoaded({
	        commit
	      }, isLoaded) {
	        commit('setLoaded', isLoaded);
	      },
	      /** @function yandex-integration-wizard/updateResourcesSkusYandex */
	      updateResourcesSkusYandex({
	        commit
	      }, resources) {
	        // For optimization, consider any changes to be different from the current value
	        commit('wasResourcesChanged', true);
	        commit('updateResourcesSkusYandex', resources);
	      },
	      /** @function yandex-integration-wizard/validateFormData */
	      validateFormData({
	        dispatch
	      }) {
	        dispatch('validateCabinetLink');
	        dispatch('validateResources');
	      },
	      /** @function yandex-integration-wizard/validateCabinetLink */
	      validateCabinetLink({
	        commit,
	        getters
	      }) {
	        commit('setInvalidCabinetLink', !getters.isCabinetLinkValid);
	      },
	      /** @function yandex-integration-wizard/validateResources */
	      validateResources({
	        commit,
	        getters
	      }) {
	        commit('setInvalidCabinetLink', !getters.isResourcesValid);
	      },
	      resetFormDataChanges({
	        commit
	      }) {
	        commit('resetFormDataChanges');
	      }
	    };
	  }
	  getMutations() {
	    return {
	      setIntegration(state, integration) {
	        state.integration = integration;
	      },
	      setResources(state, resources) {
	        state.resources = resources;
	      },
	      setCabinetLink(state, link) {
	        state.cabinetLink = link;
	      },
	      setTimezone(state, timezone) {
	        state.timezone = timezone;
	      },
	      setStatus(state, status) {
	        state.integration.status = status;
	      },
	      setResourceSkuRelationsSaved(state, isSaved) {
	        state.integration.isResourceSkuRelationsSaved = isSaved;
	      },
	      setInvalidCabinetLink(state, isInvalid) {
	        state.hasInvalidCabinetLink = isInvalid;
	      },
	      setInvalidResources(state, isInvalid) {
	        state.hasInvalidResources = isInvalid;
	      },
	      wasTimezoneChanged(state, wasChanged) {
	        state.wasTimezoneChanged = wasChanged;
	      },
	      wasResourcesChanged(state, wasChanged) {
	        state.wasResourcesChanged = wasChanged;
	      },
	      wasCabinetLinkChanged(state, wasChanged) {
	        state.wasCabinetLinkChanged = wasChanged;
	      },
	      setFetching(state, isFetching) {
	        state.isFetching = isFetching;
	      },
	      setLoaded(state, isLoaded) {
	        state.isLoaded = isLoaded;
	      },
	      updateResourcesSkusYandex(state, resources) {
	        const newResourcesIds = new Set(resources.map(({
	          id
	        }) => id));
	        const stateResources = state.resources.filter(({
	          id
	        }) => newResourcesIds.has(id));
	        for (const resource of resources) {
	          const stateResource = stateResources.find(({
	            id
	          }) => id === resource.id);
	          if (stateResource) {
	            stateResource.skusYandex = resource.skusYandex;
	          } else {
	            stateResources.push(resource);
	          }
	        }
	        state.resources = stateResources;
	      },
	      resetFormDataChanges(state) {
	        state.wasTimezoneChanged = false;
	        state.wasResourcesChanged = false;
	        state.wasCabinetLinkChanged = false;
	      }
	    };
	  }
	}

	exports.YandexIntegrationWizardModel = YandexIntegrationWizardModel;

}((this.BX.Booking.Model = this.BX.Booking.Model || {}),BX.Vue3.Vuex,BX.Booking.Provider.Service,BX.Booking.Const,BX.Booking.Model));
//# sourceMappingURL=yandex-integration-wizard.bundle.js.map
