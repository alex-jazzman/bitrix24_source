/* eslint-disable */
this.BX = this.BX || {};
this.BX.OpenLines = this.BX.OpenLines || {};
this.BX.OpenLines.v2 = this.BX.OpenLines.v2 || {};
(function (exports) {
	'use strict';

	class CrmFormManager {
		#crmFormService;
		#store;
		constructor(store, crmFormService) {
			this.#crmFormService = crmFormService;
			this.#store = store;
		}
		async loadForms() {
			const cachedForms = this.#store.getters['openLines/crmForm/getList']();
			if (cachedForms.length > 0) {
				return cachedForms;
			}
			return this.#crmFormService.loadForms();
		}
		async sendForm(dialogId, formData) {
			await this.#crmFormService.sendForm(dialogId, formData.id);
		}
	}

	exports.CrmFormManager = CrmFormManager;

})(this.BX.OpenLines.v2.Lib = this.BX.OpenLines.v2.Lib || {});
//# sourceMappingURL=crm-form.bundle.js.map
