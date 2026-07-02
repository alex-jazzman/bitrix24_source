/* eslint-disable */
this.BX = this.BX || {};
this.BX.OpenLines = this.BX.OpenLines || {};
this.BX.OpenLines.v2 = this.BX.OpenLines.v2 || {};
(function (exports, imopenlines_v2_provider_service, imopenlines_v2_lib_silentMode, imopenlines_v2_lib_crmForm, imopenlines_v2_lib_quickCommand) {
	'use strict';

	class ToolbarButtonsManager {
		#silentModeManager;
		#crmFormManager;
		#quickCommandManager;
		constructor(store, dialogId) {
			this.#silentModeManager = new imopenlines_v2_lib_silentMode.SilentModeManager(store, new imopenlines_v2_provider_service.SilentModeService());
			this.#crmFormManager = new imopenlines_v2_lib_crmForm.CrmFormManager(store, new imopenlines_v2_provider_service.CrmFormService());
			this.#quickCommandManager = new imopenlines_v2_lib_quickCommand.QuickCommandManager(dialogId);
		}
		destroy() {
			this.#quickCommandManager.destroy();
		}
		getSilentModeStatus(dialogId) {
			return this.#silentModeManager.getStatus(dialogId);
		}
		toggleSilentMode(dialogId) {
			return this.#silentModeManager.toggle(dialogId);
		}
		loadCrmForms() {
			return this.#crmFormManager.loadForms();
		}
		sendCrmForm(dialogId, form) {
			return this.#crmFormManager.sendForm(dialogId, form);
		}
	}

	exports.ToolbarButtonsManager = ToolbarButtonsManager;

})(this.BX.OpenLines.v2.Lib = this.BX.OpenLines.v2.Lib || {}, BX.OpenLines.v2.Provider.Service, BX.OpenLines.v2.Lib, BX.OpenLines.v2.Lib, BX.OpenLines.v2.Lib);
//# sourceMappingURL=toolbar-buttons.bundle.js.map
