/* eslint-disable */
this.BX = this.BX || {};
this.BX.Crm = this.BX.Crm || {};
this.BX.Crm.Integration = this.BX.Crm.Integration || {};
(function (exports, main_core) {
	'use strict';

	const EXTENSION_NAME = 'crm.integration.ui.settings';
	const Setting = {
		UseAirDesign: 'useAirDesign'
	};
	class Settings {
		static get(setting) {
			return main_core.Extension.getSettings(EXTENSION_NAME).get(setting);
		}
	}

	exports.Setting = Setting;
	exports.Settings = Settings;

})(this.BX.Crm.Integration.UI = this.BX.Crm.Integration.UI || {}, BX);
//# sourceMappingURL=settings.bundle.js.map
