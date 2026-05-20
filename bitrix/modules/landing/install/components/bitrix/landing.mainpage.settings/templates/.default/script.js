/* eslint-disable */
this.BX = this.BX || {};
this.BX.Landing = this.BX.Landing || {};
(function (exports,main_core,landing_integration_intranetSetting_vibePage) {
	'use strict';

	var SettingsPage = /*#__PURE__*/function () {
	  function SettingsPage(options) {
	    babelHelpers.classCallCheck(this, SettingsPage);
	    this.data = options.data;
	    this.contentNode = options.contentNode;
	  }
	  babelHelpers.createClass(SettingsPage, [{
	    key: "render",
	    value: function render() {
	      var page = new landing_integration_intranetSetting_vibePage.VibePage();
	      var payload = main_core.Type.isArray(this.data) ? {
	        vibes: this.data
	      } : this.data;
	      page.setData(payload);
	      page.setAnalytic({
	        context: {
	          analyticContext: 'from_custom_point'
	        }
	      });
	      page.appendSections(this.contentNode);
	    }
	  }]);
	  return SettingsPage;
	}();

	exports.SettingsPage = SettingsPage;

}((this.BX.Landing.Vibe = this.BX.Landing.Vibe || {}),BX,BX.Landing.Integration.IntranetSetting));
//# sourceMappingURL=script.js.map
