/* eslint-disable */
this.BX = this.BX || {};
this.BX.Booking = this.BX.Booking || {};
(function (exports, main_core, main_sidepanel, booking_const, booking_core, booking_provider_service_bookingService, booking_provider_service_mainPageService, booking_provider_service_waitListService) {
	'use strict';

	const SidePanel = main_sidepanel.SidePanel || BX.SidePanel;
	class DealHelper {
		openDealSidePanel({
			deal,
			onClose
		}) {
			SidePanel.Instance.open(`/crm/deal/details/${deal.value}/`, {
				events: {
					onClose: () => onClose(deal)
				}
			});
		}
		createCrmDeal({
			itemId,
			itemIdQueryParamName,
			queryParams = {},
			clients,
			onLoad,
			onClose
		}) {
			const createDealUrl = new main_core.Uri('/crm/deal/details/0/');
			createDealUrl.setQueryParam(itemIdQueryParamName, itemId);
			Object.keys(queryParams).forEach(queryParamsKey => {
				createDealUrl.setQueryParam(queryParamsKey, queryParams[queryParamsKey]);
			});
			clients.forEach(client => {
				const paramName = {
					[booking_const.CrmEntity.Contact]: 'contact_id',
					[booking_const.CrmEntity.Company]: 'company_id'
				}[client.type.code];
				createDealUrl.setQueryParam(paramName, client.id);
			});
			SidePanel.Instance.open(createDealUrl.toString(), {
				events: {
					onLoad: ({
						slider
					}) => {
						slider.getWindow().BX.Event.EventEmitter.subscribe('onCrmEntityCreate', event => {
							const [data] = event.getData();
							onLoad({
								isDeal: data.entityTypeName === booking_const.CrmEntity.Deal,
								isCanceled: data.isCanceled,
								itemIdFromQuery: parseInt(new main_core.Uri(data.sliderUrl).getQueryParam(itemIdQueryParamName), 10),
								dealData: this.mapEntityInfoToDeal(data.entityInfo)
							});
						});
					},
					onClose: () => onClose()
				}
			});
		}
		mapEntityInfoToDeal(info) {
			return {
				moduleId: booking_const.Module.Crm,
				entityTypeId: info.typeName,
				value: info.id,
				data: []
			};
		}
	}

	class BookingDealHelper extends DealHelper {
		#bookingId;
		constructor(bookingId) {
			super();
			this.#bookingId = bookingId;
		}
		hasDeal() {
			return Boolean(this.#deal);
		}
		get #deal() {
			return this.#booking?.externalData?.find(data => data.entityTypeId === booking_const.CrmEntity.Deal) || null;
		}
		get #booking() {
			return booking_core.Core.getStore().getters[`${booking_const.Model.Bookings}/getById`](this.#bookingId);
		}
		openDeal() {
			super.openDealSidePanel({
				deal: this.#deal,
				onClose: async deal => {
					if (deal?.value) {
						void booking_provider_service_bookingService.bookingService.getById(this.#bookingId);
						void booking_provider_service_mainPageService.mainPageService.fetchCounters();
					}
				}
			});
		}
		async createDeal() {
			await booking_provider_service_bookingService.bookingService.createDeal(this.#bookingId);
			this.openDeal();
		}
		saveDeal(dealData) {
			const externalData = this.#booking.externalData.filter(data => data.entityTypeId !== booking_const.CrmEntity.Deal);
			if (dealData) {
				externalData.push(dealData);
			}
			void booking_provider_service_bookingService.bookingService.update({
				id: this.#bookingId,
				externalData
			});
		}
	}

	class WaitListDealHelper extends DealHelper {
		#waitListItemId;
		constructor(waitListItemId) {
			super();
			this.#waitListItemId = waitListItemId;
		}
		hasDeal() {
			return Boolean(this.#deal);
		}
		get #deal() {
			return this.#waitListItem?.externalData?.find(data => data.entityTypeId === booking_const.CrmEntity.Deal) || null;
		}
		get #waitListItem() {
			return booking_core.Core.getStore().getters[`${booking_const.Model.WaitList}/getById`](this.#waitListItemId);
		}
		openDeal() {
			super.openDealSidePanel({
				deal: this.#deal,
				onClose: async deal => {
					if (deal?.value) {
						await booking_provider_service_waitListService.waitListService.getById(this.#waitListItemId);
					}
				}
			});
		}
		createDeal() {
			const itemIdQueryParamName = 'waitListItemId';
			super.createCrmDeal({
				itemIdQueryParamName,
				itemId: this.#waitListItemId,
				clients: this.#waitListItem?.clients || [],
				onLoad: async data => {
					if (!data.isDeal || this.#waitListItemId !== data.itemIdFromQuery) {
						return;
					}
					await this.saveDeal(data.dealData);
				},
				onClose: async () => {
					if (this.#deal?.value) {
						await this.saveDeal(this.#deal);
					}
				}
			});
		}
		async saveDeal(dealData) {
			const externalData = dealData ? [dealData] : [];
			await booking_provider_service_waitListService.waitListService.update({
				id: this.#waitListItemId,
				externalData
			});
		}
	}

	exports.BookingDealHelper = BookingDealHelper;
	exports.DealHelper = DealHelper;
	exports.WaitListDealHelper = WaitListDealHelper;

})(this.BX.Booking.Lib = this.BX.Booking.Lib || {}, BX, BX.SidePanel, BX.Booking.Const, BX.Booking, BX.Booking.Provider.Service, BX.Booking.Provider.Service, BX.Booking.Provider.Service);
//# sourceMappingURL=deal-helper.bundle.js.map
