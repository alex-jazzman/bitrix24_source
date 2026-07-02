/* eslint-disable */
this.BX = this.BX || {};
this.BX.Booking = this.BX.Booking || {};
(function (exports) {
	'use strict';

	class Timezone {
		static #cache = {};
		static getOffsetFromUtc(dateTs, timeZone) {
			const key = `${dateTs}-${timeZone}`;
			if (!this.#cache[key]) {
				const date = new Date(dateTs);
				const dateInTimezone = new Date(date.toLocaleString('en-US', {
					timeZone
				}));
				const dateInUTC = new Date(date.toLocaleString('en-US', {
					timeZone: 'UTC'
				}));
				this.#cache[key] = (dateInTimezone.getTime() - dateInUTC.getTime()) / 1000;
			}
			return this.#cache[key];
		}
		static getOffsetFromClientTimezone(dateTs, timeZone) {
			return (this.getOffsetFromUtc(dateTs, timeZone) + new Date(dateTs).getTimezoneOffset() * 60) * 1000;
		}
	}

	exports.Timezone = Timezone;

})(this.BX.Booking.Lib = this.BX.Booking.Lib || {});
//# sourceMappingURL=timezone.bundle.js.map
