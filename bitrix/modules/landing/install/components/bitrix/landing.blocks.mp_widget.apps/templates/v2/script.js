/* eslint-disable */
this.BX = this.BX || {};
this.BX.Landing = this.BX.Landing || {};
(function (exports,ui_qrauthorization,landing_widget,main_core) {
	'use strict';

	var AppsWidgetV2 = function AppsWidgetV2(element) {
	  var options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
	  babelHelpers.classCallCheck(this, AppsWidgetV2);
	  var mainContainer = element.querySelector('.landing-widget-view-main');
	  var sidebarContainer = element.querySelector('.landing-widget-view-sidebar');
	  var widgetOptions = {
	    mainContainer: mainContainer,
	    sidebarContainer: sidebarContainer
	  };
	  var widget = new landing_widget.Widget(element, widgetOptions);
	  widget.deleteContextDependentContainer();
	  var qrButton = element.querySelector('.landing-widget-qr-button');
	  var qrAuth = new ui_qrauthorization.QrAuthorization(options);
	  if (qrButton && qrAuth) {
	    main_core.Event.bind(qrButton, 'click', function () {
	      var popup = qrAuth.getPopup();
	      if (popup) {
	        popup.show();
	      }
	    });
	  }
	};

	exports.AppsWidgetV2 = AppsWidgetV2;

}((this.BX.Landing.Widget = this.BX.Landing.Widget || {}),BX.UI,BX.Landing,BX));
//# sourceMappingURL=script.js.map
