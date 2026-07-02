/* eslint-disable */
this.BX = this.BX || {};
this.BX.Booking = this.BX.Booking || {};
this.BX.Booking.Provider = this.BX.Booking.Provider || {};
(function (exports, booking_core, booking_const, booking_lib_apiClient) {
	'use strict';

	function mapDtoToModel(bookingInfoDto) {
		return {
			id: bookingInfoDto.id,
			resources: bookingInfoDto.resources || [],
			services: bookingInfoDto.services || [],
			client: bookingInfoDto.client,
			note: bookingInfoDto.note ?? ''
		};
	}

	class CalendarDataService {
		async loadBookingInfo(bookingId) {
			try {
				const bookingInfoDto = await booking_lib_apiClient.apiClient.post('CalendarData.bookingInfo', {
					bookingId
				});
				await booking_core.Core.getStore().dispatch(`${booking_const.Model.BookingInfo}/setBookingInfo`, mapDtoToModel(bookingInfoDto));
			} catch (error) {
				console.error('CalendarDataService. Load booking info error', error);
			}
		}
	}
	const calendarDataService = new CalendarDataService();

	exports.CalendarDataService = CalendarDataService;
	exports.calendarDataService = calendarDataService;

})(this.BX.Booking.Provider.Service = this.BX.Booking.Provider.Service || {}, BX.Booking, BX.Booking.Const, BX.Booking.Lib);
//# sourceMappingURL=calendar-data-service.bundle.js.map
