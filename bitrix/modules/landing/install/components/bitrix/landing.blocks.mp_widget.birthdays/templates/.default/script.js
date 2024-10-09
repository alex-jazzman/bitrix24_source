/* eslint-disable */
this.BX = this.BX || {};
this.BX.Landing = this.BX.Landing || {};
(function (exports,landing_widget) {
	'use strict';

	var BirthdaysWidget = function BirthdaysWidget(element) {
	  babelHelpers.classCallCheck(this, BirthdaysWidget);
	  var mainContainer = element.querySelector('.landing-widget-view-main');
	  var sidebarContainer = element.querySelector('.landing-widget-view-sidebar');
	  var widgetOptions = {
	    mainContainer: mainContainer,
	    sidebarContainer: sidebarContainer
	  };
	  var widget = new landing_widget.Widget(element, widgetOptions);
	  widget.deleteContextDependentContainer();
	};

	exports.BirthdaysWidget = BirthdaysWidget;

}((this.BX.Landing.Widget = this.BX.Landing.Widget || {}),BX.Landing));
//# sourceMappingURL=script.js.map
