/* eslint-disable */
this.BX = this.BX || {};
this.BX.Landing = this.BX.Landing || {};
(function (exports,landing_widget) {
	'use strict';

	var BpWidgetV2 = function BpWidgetV2(element, options) {
	  babelHelpers.classCallCheck(this, BpWidgetV2);
	  if (!element) {
	    return;
	  }
	  var mainContainer = element.querySelector('.landing-widget-view-main');
	  var sidebarContainer = element.querySelector('.landing-widget-view-sidebar');
	  var extendButton = element.querySelector('.landing-widget-button.extend-list-button');
	  var viewAllButton = element.querySelector('.landing-widget-button.view-all-button');
	  var grid = element.querySelector('.landing-widget-content-grid');
	  var widgetOptions = {
	    mainContainer: mainContainer,
	    sidebarContainer: sidebarContainer,
	    isShowExtendButton: options.isShowExtendButton,
	    extendButton: extendButton,
	    viewAllButton: viewAllButton,
	    grid: grid,
	    gridExtendedClass: 'extended',
	    buttonHideClass: 'hide'
	  };
	  var widget = new landing_widget.Widget(element, widgetOptions);
	  widget.deleteContextDependentContainer();
	  widget.toggleExtendViewButtonBehavior();
	};

	exports.BpWidgetV2 = BpWidgetV2;

}((this.BX.Landing.Widget = this.BX.Landing.Widget || {}),BX.Landing));
//# sourceMappingURL=script.js.map
