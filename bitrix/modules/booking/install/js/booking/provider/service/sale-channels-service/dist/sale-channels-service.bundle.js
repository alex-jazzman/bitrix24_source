/* eslint-disable */
this.BX = this.BX || {};
this.BX.Booking = this.BX.Booking || {};
this.BX.Booking.Provider = this.BX.Booking.Provider || {};
(function (exports,booking_core,booking_const,booking_lib_apiClient) {
	'use strict';

	class SaleChannelsService {
	  async loadData() {
	    try {
	      const dto = await booking_lib_apiClient.apiClient.post('MainPage.getSaleChannels', {});
	      const saleChannelsModel = booking_const.Model.SaleChannels;
	      await Promise.all([this.$store.dispatch(`${saleChannelsModel}/setFormsMenu`, dto.formsMenu), this.$store.dispatch(`${saleChannelsModel}/setIntegrations`, dto.integrations), this.$store.dispatch(`${saleChannelsModel}/setLoaded`, true)]);
	    } catch (error) {
	      console.error('SaleChannelsService load data error', error);
	    }
	  }
	  get $store() {
	    return booking_core.Core.getStore();
	  }
	}
	const saleChannelsService = new SaleChannelsService();

	exports.saleChannelsService = saleChannelsService;

}((this.BX.Booking.Provider.Service = this.BX.Booking.Provider.Service || {}),BX.Booking,BX.Booking.Const,BX.Booking.Lib));
//# sourceMappingURL=sale-channels-service.bundle.js.map
