/* eslint-disable */
this.BX = this.BX || {};
this.BX.Booking = this.BX.Booking || {};
this.BX.Booking.Provider = this.BX.Booking.Provider || {};
(function (exports,booking_const,booking_core,booking_lib_apiClient,booking_model_yandexIntegrationWizard,booking_provider_service_resourcesService) {
	'use strict';

	class YandexCabinetIdExtractor {
	  static extractFromCabinetLink(cabinetLink) {
	    const match = cabinetLink.match(this.cabinetLinkPattern);
	    return match ? match[2] : '';
	  }
	}
	YandexCabinetIdExtractor.cabinetLinkPattern = /^(https:\/\/)?yandex\.[^/]+\/sprav\/(\d+)\/p\/edit\/.*/;

	function mapDtoToModel(dto) {
	  const resources = dto.resources.map(resourceDto => booking_provider_service_resourcesService.ResourceMappers.mapDtoToModel(resourceDto));
	  return {
	    status: dto.status,
	    catalogPermissions: dto.catalogPermissions,
	    isResourceSkuRelationsSaved: dto.isResourceSkuRelationsSaved,
	    resources,
	    cabinetLink: dto.cabinetLink,
	    timezone: dto.timezone,
	    settings: dto.settings
	  };
	}
	async function mapModelToDto(model) {
	  const resources = [];
	  for await (const resourceModel of model.resources) {
	    resources.push(await booking_provider_service_resourcesService.ResourceMappers.mapModelToDto(resourceModel));
	  }
	  return {
	    resources,
	    cabinetLink: model.cabinetLink,
	    cabinetId: YandexCabinetIdExtractor.extractFromCabinetLink(model.cabinetLink),
	    timezone: model.timezone
	  };
	}

	class YandexIntegrationWizardService {
	  async loadData() {
	    try {
	      const dto = await booking_lib_apiClient.apiClient.post('YandexIntegration.getConfiguration', {});
	      const model = mapDtoToModel(dto);
	      const wizardModel = booking_const.Model.YandexIntegrationWizard;
	      const actions = [this.$store.dispatch(`${wizardModel}/setIntegration`, model), this.$store.dispatch(`${wizardModel}/setLoaded`, true), this.$store.dispatch(`${wizardModel}/setResources`, {
	        resources: model.resources,
	        skipCalculateChanges: true
	      })];

	      // only if were saved before
	      if (model.isResourceSkuRelationsSaved) {
	        actions.push(this.$store.dispatch(`${wizardModel}/setCabinetLink`, {
	          link: model.cabinetLink,
	          skipCalculateChanges: true
	        }), this.$store.dispatch(`${wizardModel}/setTimezone`, {
	          timezone: model.timezone,
	          skipCalculateChanges: true
	        }));
	      }
	      const results = await Promise.allSettled(actions);
	      const resultsRejected = results.filter(result => result.status === 'rejected');
	      const errorMessages = resultsRejected.map(result => result.reason.message);
	      if (errorMessages.length > 0) {
	        console.error('YandexIntegrationWizardService loadData store errorMessages:', errorMessages);
	        return {
	          success: false,
	          model,
	          errorMessages
	        };
	      }
	      return {
	        success: true,
	        model
	      };
	    } catch (apiError) {
	      console.error('YandexIntegrationWizardService loadData API apiError:', apiError);
	      const errorMessage = `API call failed: ${apiError.message}`;
	      return {
	        success: false,
	        errorMessages: [errorMessage]
	      };
	    }
	  }
	  async updateIntegration(model) {
	    try {
	      const configuration = await mapModelToDto(model);
	      const updatedModel = await booking_lib_apiClient.apiClient.post('YandexIntegration.saveConfiguration', {
	        configuration
	      });
	      const yiwModel = booking_const.Model.YandexIntegrationWizard;
	      await Promise.all([this.$store.dispatch(`${yiwModel}/setIntegration`, updatedModel), this.$store.dispatch(`${yiwModel}/setStatus`, updatedModel.status), this.$store.dispatch(`${booking_const.Model.SaleChannels}/setIntegrationStatus`, {
	        code: booking_const.IntegrationMapItemCode.YANDEX,
	        status: updatedModel.status
	      }), this.$store.dispatch(`${yiwModel}/setResourceSkuRelationsSaved`, true), this.$store.dispatch(`${yiwModel}/resetFormDataChanges`)]);
	      return {
	        success: true
	      };
	    } catch (error) {
	      console.error('YandexIntegrationWizardService updateIntegration API error:', error);
	      return {
	        success: false,
	        errors: error.errors
	      };
	    }
	  }
	  async deactivateIntegration() {
	    try {
	      const updatedModel = await booking_lib_apiClient.apiClient.post('YandexIntegration.deactivate', {});
	      await Promise.all([this.$store.dispatch(`${booking_const.Model.YandexIntegrationWizard}/setStatus`, updatedModel.status), this.$store.dispatch(`${booking_const.Model.SaleChannels}/setIntegrationStatus`, {
	        code: booking_const.IntegrationMapItemCode.YANDEX,
	        status: updatedModel.status
	      })]);
	    } catch (error) {
	      console.error('YandexIntegrationWizardService deactivateIntegration API error:', error);
	    }
	  }
	  async dropCounterIntegration() {
	    try {
	      const responseDropCounter = await booking_lib_apiClient.apiClient.post('YandexIntegration.dropCounter', {});
	      return {
	        success: true,
	        responseDropCounter
	      };
	    } catch (apiError) {
	      console.error('YandexIntegrationWizardService dropCounterIntegration API apiError:', apiError);
	      const errorMessage = `API call failed: ${apiError.message}`;
	      return {
	        success: false,
	        errorMessages: [errorMessage]
	      };
	    }
	  }
	  get $store() {
	    return booking_core.Core.getStore();
	  }
	}
	const yandexIntegrationWizardService = new YandexIntegrationWizardService();

	exports.yandexIntegrationWizardService = yandexIntegrationWizardService;
	exports.YandexCabinetIdExtractor = YandexCabinetIdExtractor;

}((this.BX.Booking.Provider.Service = this.BX.Booking.Provider.Service || {}),BX.Booking.Const,BX.Booking,BX.Booking.Lib,BX.Booking.Model,BX.Booking.Provider.Service));
//# sourceMappingURL=yandex-integration-wizard-service.bundle.js.map
