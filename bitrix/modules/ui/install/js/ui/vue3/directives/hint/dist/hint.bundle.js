/* eslint-disable */
this.BX = this.BX || {};
this.BX.Vue3 = this.BX.Vue3 || {};
(function (exports,ui_hint,main_core,main_popup) {
	'use strict';

	let _ = t => t,
	  _t;
	var _getText = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("getText");
	class Tooltip {
	  constructor() {
	    Object.defineProperty(this, _getText, {
	      value: _getText2
	    });
	    this.popup = null;
	  }
	  show(element, params) {
	    var _params$popupOptions;
	    this.hide();
	    const popupOptions = {
	      id: 'bx-vue-hint',
	      bindElement: element,
	      bindOptions: {
	        position: params.position === 'top' ? 'top' : 'bottom'
	      },
	      content: main_core.Tag.render(_t || (_t = _`
				<span class='ui-hint-content'>${0}</span>
			`), babelHelpers.classPrivateFieldLooseBase(this, _getText)[_getText](element, params)),
	      darkMode: true,
	      autoHide: true,
	      cacheable: false,
	      ...((_params$popupOptions = params.popupOptions) != null ? _params$popupOptions : null)
	    };
	    this.popup = new main_popup.Popup(popupOptions);
	    this.popup.show();
	  }
	  hide() {
	    var _this$popup;
	    (_this$popup = this.popup) == null ? void 0 : _this$popup.close();
	  }
	}
	function _getText2(element, params) {
	  if (main_core.Type.isStringFilled(params) && main_core.Type.isUndefined(element.dataset.hintHtml)) {
	    return main_core.Text.encode(params);
	  }
	  return params.html || main_core.Text.encode(params.text) || params;
	}
	const tooltip = new Tooltip();

	/**
	 * Hint Vue directive
	 *
	 * @package bitrix
	 * @subpackage ui
	 * @copyright 2001-2025 Bitrix
	 */
	const hint = {
	  async mounted(element, {
	    value
	  }) {
	    if (!value) {
	      return;
	    }
	    main_core.Event.bind(element, 'mouseenter', () => onMouseEnter(element, getParams(value)));
	    main_core.Event.bind(element, 'mouseleave', () => hideTooltip());
	    main_core.Event.bind(element, 'click', () => hideTooltip());
	  }
	};
	let showTimeout = null;
	function onMouseEnter(element, params) {
	  var _params$timeout;
	  clearTimeouts();
	  showTimeout = setTimeout(() => showTooltip(element, params), (_params$timeout = params.timeout) != null ? _params$timeout : 0);
	}
	function showTooltip(element, params) {
	  clearTimeouts();
	  tooltip.show(element, params);
	}
	function hideTooltip() {
	  clearTimeouts();
	  tooltip.hide();
	}
	function clearTimeouts() {
	  clearTimeout(showTimeout);
	}
	function getParams(value) {
	  return main_core.Type.isFunction(value) ? value() : value;
	}

	exports.hint = hint;

}((this.BX.Vue3.Directives = this.BX.Vue3.Directives || {}),BX,BX,BX.Main));
//# sourceMappingURL=hint.bundle.js.map
