/* eslint-disable */
this.BX = this.BX || {};
this.BX.AI = this.BX.AI || {};
(function (exports, ai_payload_basepayload) {
	'use strict';

	class Text extends ai_payload_basepayload.Base {
		/**
		 *
		 * @param {TextPayload} payload
		 */
		// eslint-disable-next-line no-useless-constructor
		constructor(payload) {
			super(payload);
		}
		setMarkers(markers) {
			return super.setMarkers(markers);
		}
		getMarkers() {
			return super.getMarkers();
		}
		getPrettifiedData() {
			return super.getPrettifiedData();
		}
		getRawData() {
			return super.getRawData();
		}
	}

	exports.Text = Text;

})(this.BX.AI.Payload = this.BX.AI.Payload || {}, BX.AI.Payload);
//# sourceMappingURL=textpayload.bundle.js.map
