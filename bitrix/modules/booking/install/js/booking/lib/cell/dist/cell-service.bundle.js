/* eslint-disable */
this.BX = this.BX || {};
this.BX.Booking = this.BX.Booking || {};
(function (exports) {
	'use strict';

	class CellService {
		generateId(resourceId, fromTs, toTs) {
			return `${resourceId}-${fromTs}-${toTs}`;
		}
	}
	const cellService = new CellService();

	exports.cellService = cellService;

})(this.BX.Booking.Lib = this.BX.Booking.Lib || {});
//# sourceMappingURL=cell-service.bundle.js.map
