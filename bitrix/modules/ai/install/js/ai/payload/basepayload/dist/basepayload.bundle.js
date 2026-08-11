/* eslint-disable */
this.BX = this.BX || {};
this.BX.AI = this.BX.AI || {};
(function (exports) {
	'use strict';

	class Base {
		payload = null;
		markers = {};
		constructor(payload) {
			this.payload = payload;
		}
		setMarkers(markers) {
			this.markers = markers;
			return this;
		}
		getMarkers() {
			return this.markers;
		}

		/**
		 * Returns data in pretty style.
		 *
		 * @return {*}
		 */
		getPrettifiedData() {
			return this.payload;
		}

		/**
		 * Returns data in raw style.
		 *
		 * @return {*}
		 */
		getRawData() {
			return this.payload;
		}
	}

	exports.Base = Base;

})(this.BX.AI.Payload = this.BX.AI.Payload || {});
//# sourceMappingURL=basepayload.bundle.js.map
