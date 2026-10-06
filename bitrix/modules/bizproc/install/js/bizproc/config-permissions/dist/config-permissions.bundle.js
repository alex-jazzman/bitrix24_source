/* eslint-disable */
this.BX = this.BX || {};
(function (exports, ui_accessrights_v2) {
	'use strict';

	class ConfigPermissions {
		#options;
		#app = null;
		constructor(options) {
			this.#options = options;
		}
		draw() {
			this.#app = new ui_accessrights_v2.App(this.#options);
			this.#app.draw();
			return this.#app;
		}
	}

	exports.ConfigPermissions = ConfigPermissions;

})(this.BX.Bizproc = this.BX.Bizproc || {}, BX.UI.AccessRights.V2);
//# sourceMappingURL=config-permissions.bundle.js.map
