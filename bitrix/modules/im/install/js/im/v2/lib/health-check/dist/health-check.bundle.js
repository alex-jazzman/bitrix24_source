/* eslint-disable */
this.BX = this.BX || {};
this.BX.Messenger = this.BX.Messenger || {};
this.BX.Messenger.v2 = this.BX.Messenger.v2 || {};
(function (exports) {
	'use strict';

	class HealthCheckManager {
		static #instance;
		#isShown = false;
		static getInstance() {
			if (!this.#instance) {
				this.#instance = new this();
			}
			return this.#instance;
		}
		setIsShown(status) {
			this.#isShown = status;
		}
		getIsShown() {
			return this.#isShown;
		}
	}

	exports.HealthCheckManager = HealthCheckManager;

})(this.BX.Messenger.v2.Lib = this.BX.Messenger.v2.Lib || {});
//# sourceMappingURL=health-check.bundle.js.map
