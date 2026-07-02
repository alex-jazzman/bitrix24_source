/* eslint-disable */
this.BX = this.BX || {};
this.BX.Booking = this.BX.Booking || {};
(function (exports) {
	'use strict';

	const defaultOptions = {
		include: 'none'
	};
	const IncludeBoundaries = Object.freeze({
		all: 'all',
		left: 'left',
		right: 'right',
		none: 'none'
	});
	function inInterval(value, interval, options) {
		if (!Array.isArray(interval) && interval.length < 2) {
			throw new TypeError('"interval" must be an numeric array');
		}
		const {
			include
		} = {
			...defaultOptions,
			...options
		};
		if (include === IncludeBoundaries.all) {
			return interval[0] <= value && value <= interval[1];
		}
		if (include === IncludeBoundaries.left) {
			return interval[0] <= value && value < interval[1];
		}
		if (include === IncludeBoundaries.right) {
			return interval[0] < value && value <= interval[1];
		}
		return interval[0] < value && value < interval[1];
	}

	exports.IncludeBoundaries = IncludeBoundaries;
	exports.inInterval = inInterval;

})(this.BX.Booking.Lib = this.BX.Booking.Lib || {});
//# sourceMappingURL=in-interval.bundle.js.map
