/* eslint-disable */
this.BX = this.BX || {};
(function (exports,main_core,main_popup,ui_buttons) {
	'use strict';

	let _ = t => t,
	  _t;
	var _bindElement = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("bindElement");
	var _popup = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("popup");
	var _popupId = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("popupId");
	var _submitButton = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("submitButton");
	var _renderPopupContent = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("renderPopupContent");
	var _createPopup = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("createPopup");
	var _initSubmitButton = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("initSubmitButton");
	class PopupLimits {
	  constructor(options) {
	    Object.defineProperty(this, _initSubmitButton, {
	      value: _initSubmitButton2
	    });
	    Object.defineProperty(this, _createPopup, {
	      value: _createPopup2
	    });
	    Object.defineProperty(this, _renderPopupContent, {
	      value: _renderPopupContent2
	    });
	    Object.defineProperty(this, _bindElement, {
	      writable: true,
	      value: null
	    });
	    Object.defineProperty(this, _popup, {
	      writable: true,
	      value: null
	    });
	    Object.defineProperty(this, _popupId, {
	      writable: true,
	      value: void 0
	    });
	    Object.defineProperty(this, _submitButton, {
	      writable: true,
	      value: void 0
	    });
	    this.isLimitEdit = false;
	    this.submitButtonCallback = () => {};
	    babelHelpers.classPrivateFieldLooseBase(this, _popupId)[_popupId] = options.popupId || String(Math.random());
	    babelHelpers.classPrivateFieldLooseBase(this, _bindElement)[_bindElement] = options.bindElement;
	    this.isLimitEdit = options.isLimitEdit === true;
	    this.submitButtonCallback = options.submitButtonCallback;
	    babelHelpers.classPrivateFieldLooseBase(this, _initSubmitButton)[_initSubmitButton]();
	  }
	  getPopupId() {
	    return babelHelpers.classPrivateFieldLooseBase(this, _popupId)[_popupId];
	  }
	  getPopup() {
	    return babelHelpers.classPrivateFieldLooseBase(this, _popup)[_popup];
	  }
	  show() {
	    if (babelHelpers.classPrivateFieldLooseBase(this, _popup)[_popup] === null) {
	      babelHelpers.classPrivateFieldLooseBase(this, _createPopup)[_createPopup]();
	    }
	    babelHelpers.classPrivateFieldLooseBase(this, _popup)[_popup].show();
	  }
	  hide() {
	    var _babelHelpers$classPr;
	    (_babelHelpers$classPr = babelHelpers.classPrivateFieldLooseBase(this, _popup)[_popup]) == null ? void 0 : _babelHelpers$classPr.close();
	  }
	}
	function _renderPopupContent2() {
	  return main_core.Tag.render(_t || (_t = _`
			<div class="disk-popup-limits__content">
				<div class="disk-popup-limits__content_main">
					<div class="disk-popup-limits__content_text">
						${0}
					</div>
					<div class="disk-popup-limits__content_icon-box">
						<div class="disk-popup-limits__content_icon"></div>
					</div>
				</div>
				<div class="disk-popup-limits__content_footer">
					${0}
				</div>
			</div>
		`), this.isLimitEdit ? main_core.Loc.getMessage('DISK_POPUP_LIMITS_EDIT') : main_core.Loc.getMessage('DISK_POPUP_LIMITS_DOCUMENT_CREATE'), babelHelpers.classPrivateFieldLooseBase(this, _submitButton)[_submitButton].render());
	}
	function _createPopup2() {
	  babelHelpers.classPrivateFieldLooseBase(this, _popup)[_popup] = new main_popup.Popup({
	    id: babelHelpers.classPrivateFieldLooseBase(this, _popupId)[_popupId],
	    bindElement: babelHelpers.classPrivateFieldLooseBase(this, _bindElement)[_bindElement],
	    titleBar: this.isLimitEdit ? main_core.Loc.getMessage('DISK_POPUP_LIMITS_TITLE_EDIT') : main_core.Loc.getMessage('DISK_POPUP_LIMITS_TITLE_DOCUMENT_CREATE'),
	    cacheable: true,
	    closeIcon: true,
	    className: 'disk-popup-limits',
	    content: babelHelpers.classPrivateFieldLooseBase(this, _renderPopupContent)[_renderPopupContent](),
	    width: 550,
	    padding: 0,
	    autoHide: true
	  });
	}
	function _initSubmitButton2() {
	  babelHelpers.classPrivateFieldLooseBase(this, _submitButton)[_submitButton] = new ui_buttons.Button({
	    color: ui_buttons.AirButtonStyle.FILLED,
	    useAirDesign: true,
	    text: main_core.Loc.getMessage('DISK_POPUP_LIMITS_SUBMIT_BTN'),
	    round: true,
	    noCaps: true,
	    size: ui_buttons.ButtonSize.MEDIUM,
	    onclick: this.submitButtonCallback
	  });
	}

	exports.PopupLimits = PopupLimits;

}((this.BX.Disk = this.BX.Disk || {}),BX,BX.Main,BX.UI));
//# sourceMappingURL=popup-limits.bundle.js.map
