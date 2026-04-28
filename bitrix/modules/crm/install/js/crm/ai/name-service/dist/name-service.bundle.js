/* eslint-disable */
this.BX = this.BX || {};
this.BX.Crm = this.BX.Crm || {};
(function (exports,main_core) {
	'use strict';

	var NameService = /*#__PURE__*/function () {
	  function NameService() {
	    babelHelpers.classCallCheck(this, NameService);
	  }
	  babelHelpers.createClass(NameService, null, [{
	    key: "copilotName",
	    value: function copilotName() {
	      return main_core.Loc.getMessage('COPILOT_NAME') || '';
	    }
	  }, {
	    key: "copilotNameReplacement",
	    value: function copilotNameReplacement() {
	      return {
	        '#COPILOT_NAME#': this.copilotName()
	      };
	    }
	  }]);
	  return NameService;
	}();

	exports.NameService = NameService;

}((this.BX.Crm.AI = this.BX.Crm.AI || {}),BX));
//# sourceMappingURL=name-service.bundle.js.map
