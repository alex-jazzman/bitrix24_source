/* eslint-disable */
this.BX = this.BX || {};
this.BX.OpenLines = this.BX.OpenLines || {};
this.BX.OpenLines.v2 = this.BX.OpenLines.v2 || {};
(function (exports,imopenlines_v2_lib_messageManager) {
	'use strict';

	const OpenLinesManager = {
	  getMessageName(message) {
	    const openLinesManager = new imopenlines_v2_lib_messageManager.OpenLinesMessageManager(message);
	    if (openLinesManager.checkComponentInOpenLinesList()) {
	      return openLinesManager.getMessageComponent();
	    }
	    return null;
	  }
	};

	exports.OpenLinesManager = OpenLinesManager;

}((this.BX.OpenLines.v2.Lib = this.BX.OpenLines.v2.Lib || {}),BX.OpenLines.v2.Lib));
//# sourceMappingURL=openlines.bundle.js.map
