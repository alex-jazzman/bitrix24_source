/* eslint-disable */
this.BX = this.BX || {};
(function (exports,main_core,main_popup,ui_buttons) {
	'use strict';

	let _ = t => t,
	  _t;
	var _getPopupContent = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("getPopupContent");
	var _wrapContent = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("wrapContent");
	class PartnerDiscontinue {
	  constructor() {
	    Object.defineProperty(this, _wrapContent, {
	      value: _wrapContent2
	    });
	    Object.defineProperty(this, _getPopupContent, {
	      value: _getPopupContent2
	    });
	  }
	  getPopup(options = {}) {
	    const popupOptions = main_core.Type.isPlainObject(options) ? options : {};
	    const title = main_core.Type.isStringFilled(popupOptions.title) ? popupOptions.title : main_core.Loc.getMessage('INTRANET_PARTNER_DISCONTINUE_POPUP_TITLE');
	    const yesText = main_core.Type.isStringFilled(popupOptions.yesText) ? popupOptions.yesText : main_core.Loc.getMessage('INTRANET_PARTNER_DISCONTINUE_YES_BTN');
	    const noText = main_core.Type.isStringFilled(popupOptions.noText) ? popupOptions.noText : main_core.Loc.getMessage('INTRANET_PARTNER_DISCONTINUE_NO_BTN');
	    const content = babelHelpers.classPrivateFieldLooseBase(this, _getPopupContent)[_getPopupContent](popupOptions.content);
	    const onConfirm = popupOptions.onConfirm;
	    const onCancel = popupOptions.onCancel;
	    const popup = new main_popup.Popup({
	      titleBar: title,
	      useAirDesign: true,
	      content,
	      closeIcon: true,
	      cacheable: true,
	      autoHide: true,
	      width: 452,
	      className: 'license-widget-partner-discontinue-popup',
	      overlay: {
	        opacity: 100,
	        backgroundColor: 'rgba(0, 32, 78, 0.46)'
	      },
	      buttons: [new ui_buttons.Button({
	        text: noText,
	        useAirDesign: true,
	        style: ui_buttons.AirButtonStyle.OUTLINE,
	        className: 'license-widget-partner-discontinue-popup-cancel-btn',
	        onclick: () => {
	          popup.close();
	          if (main_core.Type.isFunction(onCancel)) {
	            onCancel();
	          }
	        }
	      }), new ui_buttons.Button({
	        text: yesText,
	        useAirDesign: true,
	        style: ui_buttons.AirButtonStyle.FILLED,
	        onclick: () => {
	          popup.close();
	          if (main_core.Type.isFunction(onConfirm)) {
	            onConfirm();
	          }
	        }
	      })]
	    });
	    return popup;
	  }
	}
	function _getPopupContent2(content) {
	  if (content instanceof HTMLElement) {
	    return content;
	  }
	  if (main_core.Type.isStringFilled(content)) {
	    return babelHelpers.classPrivateFieldLooseBase(this, _wrapContent)[_wrapContent](content);
	  }
	  const message = main_core.Loc.getMessage('INTRANET_PARTNER_DISCONTINUE_POPUP_CONTENT_MSGVER_1', {
	    '[div]': '<div>',
	    '[/div]': '</div>'
	  });
	  return babelHelpers.classPrivateFieldLooseBase(this, _wrapContent)[_wrapContent](message);
	}
	function _wrapContent2(message) {
	  return main_core.Tag.render(_t || (_t = _`
			<div class="license-widget-partner-discontinue-popup-content">
				${0}
			</div>
		`), message);
	}

	exports.PartnerDiscontinue = PartnerDiscontinue;

}((this.BX.Intranet = this.BX.Intranet || {}),BX,BX.Main,BX.UI));
//# sourceMappingURL=partner-discontinue.bundle.js.map
