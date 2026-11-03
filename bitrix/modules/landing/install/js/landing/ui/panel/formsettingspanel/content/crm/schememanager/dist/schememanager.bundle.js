/* eslint-disable */
this.BX = this.BX || {};
this.BX.Landing = this.BX.Landing || {};
this.BX.Landing.Ui = this.BX.Landing.Ui || {};
this.BX.Landing.Ui.Panel = this.BX.Landing.Ui.Panel || {};
this.BX.Landing.Ui.Panel.Formsettingspanel = this.BX.Landing.Ui.Panel.Formsettingspanel || {};
this.BX.Landing.Ui.Panel.Formsettingspanel.Content = this.BX.Landing.Ui.Panel.Formsettingspanel.Content || {};
this.BX.Landing.Ui.Panel.Formsettingspanel.Content.Crm = this.BX.Landing.Ui.Panel.Formsettingspanel.Content.Crm || {};
(function (exports) {
	'use strict';

	class SchemeManager {
		#schemes;
		#defaultSchemes;
		constructor(schemes) {
			this.#schemes = schemes;
			this.#defaultSchemes = this.#schemes.filter(scheme => !scheme.dynamic);
		}
		isInvoice(schemeId) {
			return this.findSchemeById(schemeId).hasInvoice;
		}
		findSchemeById(schemeId) {
			return this.#schemes.find(scheme => scheme.id === schemeId);
		}
		getSpecularSchemeId(schemeId) {
			return this.findSchemeById(schemeId).specularId;
		}
		isDefaultScheme(schemeId) {
			return this.#defaultSchemes.findIndex(scheme => scheme.id === schemeId) !== -1;
		}
	}

	exports.SchemeManager = SchemeManager;

})(this.BX.Landing.Ui.Panel.Formsettingspanel.Content.Crm.SchemeManager = this.BX.Landing.Ui.Panel.Formsettingspanel.Content.Crm.SchemeManager || {});
//# sourceMappingURL=schememanager.bundle.js.map
