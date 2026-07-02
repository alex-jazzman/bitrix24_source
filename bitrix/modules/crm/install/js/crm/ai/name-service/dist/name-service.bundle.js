/* eslint-disable */
this.BX = this.BX || {};
this.BX.Crm = this.BX.Crm || {};
(function (exports, main_core) {
	'use strict';

	class NameService {
		static copilotName() {
			return main_core.Loc.getMessage('COPILOT_NAME') || '';
		}
		static copilotNameReplacement() {
			return {
				'#COPILOT_NAME#': this.copilotName()
			};
		}
	}

	exports.NameService = NameService;

})(this.BX.Crm.AI = this.BX.Crm.AI || {}, BX);
//# sourceMappingURL=name-service.bundle.js.map
