/* eslint-disable */
this.BX = this.BX || {};
this.BX.OpenLines = this.BX.OpenLines || {};
this.BX.OpenLines.v2 = this.BX.OpenLines.v2 || {};
(function (exports) {
	'use strict';

	class SilentModeManager {
		#store;
		#service;
		constructor(store, service) {
			this.#store = store;
			this.#service = service;
		}
		getStatus(dialogId) {
			return this.#store.getters['openLines/currentSession/getSilentModeByDialogId'](dialogId);
		}
		async toggle(dialogId) {
			const currentStatus = this.getStatus(dialogId);
			await this.#service.set(dialogId, !currentStatus);
		}
	}

	exports.SilentModeManager = SilentModeManager;

})(this.BX.OpenLines.v2.Lib = this.BX.OpenLines.v2.Lib || {});
//# sourceMappingURL=silent-mode.bundle.js.map
