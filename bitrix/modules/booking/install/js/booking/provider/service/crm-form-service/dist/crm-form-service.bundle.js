/* eslint-disable */
this.BX = this.BX || {};
this.BX.Booking = this.BX.Booking || {};
this.BX.Booking.Provider = this.BX.Booking.Provider || {};
(function (exports, main_core, booking_core, booking_const, booking_lib_apiClient, booking_provider_service_resourcesTypeService, booking_provider_service_resourcesService) {
	'use strict';

	function mapDtoToModel(resourceDto) {
		return {
			...resourceDto
		};
	}

	class CrmFormService {
		#getResourcesRequest;
		#getResourcesTypesRequest;
		#getCatalogSkuEntityOptionsRequest;
		#getDefaultResourceSkuRelations;
		async getResources(ids) {
			try {
				this.#getResourcesRequest ??= this.#fetchGetResources;
				const {
					data
				} = await this.#getResourcesRequest(ids);
				return data.map(resourceDto => mapDtoToModel(resourceDto));
			} catch (error) {
				console.error('CrmFormService: get resources error', error);
				return [];
			}
		}
		#fetchGetResources(ids) {
			const action = new booking_lib_apiClient.ApiClient().buildUrl('CrmForm.PublicForm.getResources');
			return main_core.ajax.runAction(action, {
				data: {
					ids
				}
			});
		}
		async getCatalogSkuEntityOptions() {
			try {
				this.#getCatalogSkuEntityOptionsRequest ??= this.#requestCatalogSkuEntityOptions;
				const response = await this.#getCatalogSkuEntityOptionsRequest();
				return response.data;
			} catch (error) {
				console.error('CrmFormService: get CatalogSkuEntityOptions error', error);
				return null;
			}
		}
		#requestCatalogSkuEntityOptions() {
			return main_core.ajax.runAction(new booking_lib_apiClient.ApiClient().buildUrl('CrmForm.SettingsForm.getCatalogSkuEntityOptions'), {
				json: {}
			});
		}
		async getResourceTypeList() {
			try {
				this.#getResourcesTypesRequest ??= this.#requestResourcesTypeList;
				const response = await this.#getResourcesTypesRequest();
				const resourceTypes = response.data.map(dto => booking_provider_service_resourcesTypeService.ResourceTypeMappers.mapDtoToModel(dto));
				await booking_core.Core.getStore().dispatch(`${booking_const.Model.ResourceTypes}/upsertMany`, resourceTypes);
			} catch (e) {
				console.error('CrmFormService: get resource types error', e);
			}
		}
		#requestResourcesTypeList() {
			return main_core.ajax.runAction(new booking_lib_apiClient.ApiClient().buildUrl('ResourceType.list'), {
				json: {}
			});
		}
		getResourceSkuRelations(resources = []) {
			if (resources.length === 0) {
				return this.getDefaultResourceSkuRelations();
			}
			return this.getFormSpecificResourceSkuRelations(resources);
		}
		async getDefaultResourceSkuRelations() {
			try {
				this.#getDefaultResourceSkuRelations ??= this.#requestDefaultResourceSkuRelations;
				const response = await this.#getDefaultResourceSkuRelations();
				return response.resources.map(dto => booking_provider_service_resourcesService.ResourceMappers.mapResourceSkuRelationsDtoToModel(dto));
			} catch (error) {
				console.error('CrmFormService: get default resource skus relations error', error);
				return [];
			}
		}
		async #requestDefaultResourceSkuRelations() {
			const action = new booking_lib_apiClient.ApiClient().buildUrl('CrmForm.SettingsForm.getDefaultResourceSkuRelations');
			const {
				data
			} = await main_core.ajax.runAction(action, {
				json: {}
			});
			return data;
		}
		async getFormSpecificResourceSkuRelations(resources) {
			try {
				const action = new booking_lib_apiClient.ApiClient().buildUrl('CrmForm.SettingsForm.getFormSpecificResourceSkuRelations');
				const {
					data
				} = await main_core.ajax.runAction(action, {
					json: {
						resources
					}
				});
				return data.resources.map(dto => booking_provider_service_resourcesService.ResourceMappers.mapResourceSkuRelationsDtoToModel(dto));
			} catch (error) {
				console.log('CrmFormService: get default resource skus relations error', error);
				return [];
			}
		}
	}
	const crmFormService = new CrmFormService();

	exports.crmFormService = crmFormService;

})(this.BX.Booking.Provider.Service = this.BX.Booking.Provider.Service || {}, BX, BX.Booking, BX.Booking.Const, BX.Booking.Lib, BX.Booking.Provider.Service, BX.Booking.Provider.Service);
//# sourceMappingURL=crm-form-service.bundle.js.map
