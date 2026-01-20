/* eslint-disable */
this.BX = this.BX || {};
this.BX.Booking = this.BX.Booking || {};
this.BX.Booking.Provider = this.BX.Booking.Provider || {};
(function (exports,booking_core,booking_lib_apiClient) {
	'use strict';

	class CatalogServiceSkuService {
	  async create(iblockId, serviceName) {
	    try {
	      return await booking_lib_apiClient.apiClient.post('CatalogServiceSku.create', {
	        iblockId,
	        serviceName
	      });
	    } catch (error) {
	      console.error('CatalogServiceSkuService. Create error', error);
	      return null;
	    }
	  }
	  get $store() {
	    return booking_core.Core.getStore();
	  }
	}
	const catalogServiceSkuService = new CatalogServiceSkuService();

	exports.catalogServiceSkuService = catalogServiceSkuService;
	exports.CatalogServiceSkuService = CatalogServiceSkuService;

}((this.BX.Booking.Provider.Service = this.BX.Booking.Provider.Service || {}),BX.Booking,BX.Booking.Lib));
//# sourceMappingURL=catalog-service-sku-service.bundle.js.map
