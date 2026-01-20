/* eslint-disable */
this.BX = this.BX || {};
this.BX.Intranet = this.BX.Intranet || {};
(function (exports,main_core,ui_buttons,ui_iconSet_api_core,ui_analytics) {
	'use strict';

	let _ = t => t,
	  _t,
	  _t2,
	  _t3,
	  _t4,
	  _t5,
	  _t6,
	  _t7,
	  _t8,
	  _t9,
	  _t10,
	  _t11,
	  _t12;
	var _cache = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("cache");
	var _options = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("options");
	var _getHeaderContainer = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("getHeaderContainer");
	var _getBodyContainer = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("getBodyContainer");
	var _getStatusContainer = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("getStatusContainer");
	var _getRemainderCodes = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("getRemainderCodes");
	var _getChevron = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("getChevron");
	var _getBodyContent = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("getBodyContent");
	var _getRecoveryCodesGrid = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("getRecoveryCodesGrid");
	var _setRecoveryCodes = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("setRecoveryCodes");
	var _getButtonsContainer = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("getButtonsContainer");
	var _getPrintButton = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("getPrintButton");
	var _getDownloadButton = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("getDownloadButton");
	var _getReloadButton = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("getReloadButton");
	var _getButtonStub = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("getButtonStub");
	var _getStubReloadButton = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("getStubReloadButton");
	var _reloadCodes = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("reloadCodes");
	var _sendAnalyticsEvent = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("sendAnalyticsEvent");
	class RecoveryCodes {
	  constructor(options) {
	    Object.defineProperty(this, _sendAnalyticsEvent, {
	      value: _sendAnalyticsEvent2
	    });
	    Object.defineProperty(this, _reloadCodes, {
	      value: _reloadCodes2
	    });
	    Object.defineProperty(this, _getStubReloadButton, {
	      value: _getStubReloadButton2
	    });
	    Object.defineProperty(this, _getButtonStub, {
	      value: _getButtonStub2
	    });
	    Object.defineProperty(this, _getReloadButton, {
	      value: _getReloadButton2
	    });
	    Object.defineProperty(this, _getDownloadButton, {
	      value: _getDownloadButton2
	    });
	    Object.defineProperty(this, _getPrintButton, {
	      value: _getPrintButton2
	    });
	    Object.defineProperty(this, _getButtonsContainer, {
	      value: _getButtonsContainer2
	    });
	    Object.defineProperty(this, _setRecoveryCodes, {
	      value: _setRecoveryCodes2
	    });
	    Object.defineProperty(this, _getRecoveryCodesGrid, {
	      value: _getRecoveryCodesGrid2
	    });
	    Object.defineProperty(this, _getBodyContent, {
	      value: _getBodyContent2
	    });
	    Object.defineProperty(this, _getChevron, {
	      value: _getChevron2
	    });
	    Object.defineProperty(this, _getRemainderCodes, {
	      value: _getRemainderCodes2
	    });
	    Object.defineProperty(this, _getStatusContainer, {
	      value: _getStatusContainer2
	    });
	    Object.defineProperty(this, _getBodyContainer, {
	      value: _getBodyContainer2
	    });
	    Object.defineProperty(this, _getHeaderContainer, {
	      value: _getHeaderContainer2
	    });
	    Object.defineProperty(this, _cache, {
	      writable: true,
	      value: new main_core.Cache.MemoryCache()
	    });
	    Object.defineProperty(this, _options, {
	      writable: true,
	      value: void 0
	    });
	    babelHelpers.classPrivateFieldLooseBase(this, _options)[_options] = options;
	  }
	  renderTo(element) {
	    main_core.Dom.append(babelHelpers.classPrivateFieldLooseBase(this, _getHeaderContainer)[_getHeaderContainer](), element);
	    main_core.Dom.append(babelHelpers.classPrivateFieldLooseBase(this, _getBodyContainer)[_getBodyContainer](), element);
	  }
	}
	function _getHeaderContainer2() {
	  return babelHelpers.classPrivateFieldLooseBase(this, _cache)[_cache].remember('header-container', () => {
	    main_core.Event.bind(babelHelpers.classPrivateFieldLooseBase(this, _getStatusContainer)[_getStatusContainer](), 'click', () => {
	      main_core.Dom.toggleClass(babelHelpers.classPrivateFieldLooseBase(this, _getChevron)[_getChevron](), '--show');
	      main_core.Dom.toggleClass(babelHelpers.classPrivateFieldLooseBase(this, _getBodyContainer)[_getBodyContainer](), '--show');
	    });
	    const onclick = event => {
	      event.preventDefault();
	      top.BX.Helper.show('redirect=detail&code=26676294');
	    };
	    return main_core.Tag.render(_t || (_t = _`
				<div class="intranet-user-otp-list__section-row-header-wrapper">
					<div class="intranet-user-otp-list__section-row-header">
						<div class="intranet-user-otp-list__row-label ui-text --md">
							<span class="ui-icon-set --o-note"></span>
							${0}
						</div>
						${0}
					</div>
					<p class="intranet-user-otp-list__section-row-description">
						${0}
					</p>
					<a onclick="${0}" class="intranet-user-otp-list__section-row-link ui-link ui-link-secondary ui-link-dashed">
						${0}
					</p>
				</div>
			`), main_core.Loc.getMessage('INTRANET_USER_OTP_LIST_RECOVERED_CODES'), babelHelpers.classPrivateFieldLooseBase(this, _getStatusContainer)[_getStatusContainer](), main_core.Loc.getMessage('INTRANET_USER_OTP_LIST_CODE_DESCRIPTION'), onclick, main_core.Loc.getMessage('INTRANET_USER_OTP_LIST_MORE_BTN'));
	  });
	}
	function _getBodyContainer2() {
	  return babelHelpers.classPrivateFieldLooseBase(this, _cache)[_cache].remember('body-container', () => {
	    return main_core.Tag.render(_t2 || (_t2 = _`
				<div id="row-content" class="intranet-user-otp-list__section-row-content">
					<div class="intranet-user-otp-list__section-row-content-wrapper">
						<div class="intranet-user-otp-list__section-row-divider"></div>
						${0}
					</div>
				</div>
			`), babelHelpers.classPrivateFieldLooseBase(this, _options)[_options].codes.length > 0 ? babelHelpers.classPrivateFieldLooseBase(this, _getBodyContent)[_getBodyContent]() : babelHelpers.classPrivateFieldLooseBase(this, _getButtonStub)[_getButtonStub]());
	  });
	}
	function _getStatusContainer2() {
	  return babelHelpers.classPrivateFieldLooseBase(this, _cache)[_cache].remember('status-container', () => {
	    return main_core.Tag.render(_t3 || (_t3 = _`
				<div id="row-status" class="intranet-user-otp-list__row-status intranet-user-otp-list__row-status--clickable">
					${0}
					${0}
				</div>
			`), babelHelpers.classPrivateFieldLooseBase(this, _getRemainderCodes)[_getRemainderCodes](), babelHelpers.classPrivateFieldLooseBase(this, _getChevron)[_getChevron]());
	  });
	}
	function _getRemainderCodes2() {
	  let icon = null;
	  let text = null;
	  if (babelHelpers.classPrivateFieldLooseBase(this, _options)[_options].codes.length > 0) {
	    icon = main_core.Tag.render(_t4 || (_t4 = _`<div class="ui-icon-set --o-circle-check"></div>`));
	    text = main_core.Loc.getMessage('INTRANET_USER_OTP_LIST_RECOVERED_CODES_COUNT', {
	      '#COUNT#': babelHelpers.classPrivateFieldLooseBase(this, _options)[_options].codes.length
	    });
	  } else {
	    icon = main_core.Tag.render(_t5 || (_t5 = _`<div class="ui-icon-set --o-alert-accent"></div>`));
	    text = main_core.Loc.getMessage('INTRANET_USER_OTP_LIST_RECOVERED_CODES_ENDED');
	  }
	  const container = main_core.Tag.render(_t6 || (_t6 = _`
			<div class="intranet-user-otp-list__row-value ui-text --md">
				${0}
			</div>
		`), text);
	  main_core.Dom.prepend(icon, container);
	  return container;
	}
	function _getChevron2() {
	  return babelHelpers.classPrivateFieldLooseBase(this, _cache)[_cache].remember('chevron', () => {
	    return main_core.Tag.render(_t7 || (_t7 = _`
				<div id="row-chevron" class="ui-icon-set --chevron-down-s"></div>
			`));
	  });
	}
	function _getBodyContent2() {
	  return babelHelpers.classPrivateFieldLooseBase(this, _cache)[_cache].remember('recovery-codes-list', () => {
	    return main_core.Tag.render(_t8 || (_t8 = _`
				<div class="intranet-otp-codes">
					${0}
					${0}
				</div>
			`), babelHelpers.classPrivateFieldLooseBase(this, _getRecoveryCodesGrid)[_getRecoveryCodesGrid](), babelHelpers.classPrivateFieldLooseBase(this, _getButtonsContainer)[_getButtonsContainer]());
	  });
	}
	function _getRecoveryCodesGrid2() {
	  return babelHelpers.classPrivateFieldLooseBase(this, _cache)[_cache].remember('recovery-codes-grid', () => {
	    const container = main_core.Tag.render(_t9 || (_t9 = _`
				<ol class="intranet-otp-codes__grid ui-alert ui-alert-primary"/>
			`));
	    babelHelpers.classPrivateFieldLooseBase(this, _setRecoveryCodes)[_setRecoveryCodes](container);
	    return container;
	  });
	}
	function _setRecoveryCodes2(container) {
	  babelHelpers.classPrivateFieldLooseBase(this, _options)[_options].codes.forEach(code => {
	    main_core.Dom.append(main_core.Tag.render(_t10 || (_t10 = _`
				<li class="ui-text --sm intranet-otp-codes__grid-item">
					${0}
				</li>
			`), main_core.Text.encode(code.VALUE)), container);
	  });
	}
	function _getButtonsContainer2() {
	  return babelHelpers.classPrivateFieldLooseBase(this, _cache)[_cache].remember('buttons-container', () => {
	    return main_core.Tag.render(_t11 || (_t11 = _`
				<div class="intranet-otp-codes__button-section">
					<div class="intranet-otp-codes__button-container">
						${0}
						${0}
					</div>
					<div class="intranet-otp-codes__button-container">
						${0}
					</div>
				</div>
			`), babelHelpers.classPrivateFieldLooseBase(this, _getPrintButton)[_getPrintButton]().render(), babelHelpers.classPrivateFieldLooseBase(this, _getDownloadButton)[_getDownloadButton]().render(), babelHelpers.classPrivateFieldLooseBase(this, _getReloadButton)[_getReloadButton]().render());
	  });
	}
	function _getPrintButton2() {
	  return babelHelpers.classPrivateFieldLooseBase(this, _cache)[_cache].remember('print-button', () => {
	    return new ui_buttons.Button({
	      text: main_core.Loc.getMessage('INTRANET_USER_OTP_LIST_PRINT_BTN'),
	      size: ui_buttons.Button.Size.SMALL,
	      style: ui_buttons.AirButtonStyle.PLAIN_NO_ACCENT,
	      useAirDesign: true,
	      icon: ui_iconSet_api_core.Outline.PRINTER,
	      onclick: () => {
	        window.print();
	        babelHelpers.classPrivateFieldLooseBase(this, _sendAnalyticsEvent)[_sendAnalyticsEvent]('print_codes_click');
	      }
	    });
	  });
	}
	function _getDownloadButton2() {
	  return babelHelpers.classPrivateFieldLooseBase(this, _cache)[_cache].remember('download-button', () => {
	    return new ui_buttons.Button({
	      text: main_core.Loc.getMessage('INTRANET_USER_OTP_LIST_DOWNLOAD_BTN'),
	      size: ui_buttons.Button.Size.SMALL,
	      style: ui_buttons.AirButtonStyle.PLAIN_NO_ACCENT,
	      useAirDesign: true,
	      icon: ui_iconSet_api_core.Outline.DOWNLOAD,
	      tag: ui_buttons.Button.Tag.LINK,
	      link: babelHelpers.classPrivateFieldLooseBase(this, _options)[_options].downloadLink,
	      onclick: () => {
	        babelHelpers.classPrivateFieldLooseBase(this, _sendAnalyticsEvent)[_sendAnalyticsEvent]('install_codes_click');
	      }
	    });
	  });
	}
	function _getReloadButton2() {
	  return babelHelpers.classPrivateFieldLooseBase(this, _cache)[_cache].remember('reload-button', () => {
	    return new ui_buttons.Button({
	      text: main_core.Loc.getMessage('INTRANET_USER_OTP_LIST_RELOAD_BTN'),
	      size: ui_buttons.Button.Size.SMALL,
	      style: ui_buttons.AirButtonStyle.PLAIN_ACCENT,
	      useAirDesign: true,
	      icon: ui_iconSet_api_core.Outline.REFRESH,
	      onclick: button => {
	        babelHelpers.classPrivateFieldLooseBase(this, _sendAnalyticsEvent)[_sendAnalyticsEvent]('refresh_code_click', 'security');
	        button.setWaiting(true);
	        // eslint-disable-next-line promise/catch-or-return
	        babelHelpers.classPrivateFieldLooseBase(this, _reloadCodes)[_reloadCodes]().then(() => {
	          button.setWaiting(false);
	        });
	      }
	    });
	  });
	}
	function _getButtonStub2() {
	  return babelHelpers.classPrivateFieldLooseBase(this, _cache)[_cache].remember('button-stub', () => {
	    return main_core.Tag.render(_t12 || (_t12 = _`
				<div class="intranet-otp-codes__button-section">
					${0}
				</div>
			`), babelHelpers.classPrivateFieldLooseBase(this, _getStubReloadButton)[_getStubReloadButton]().render());
	  });
	}
	function _getStubReloadButton2() {
	  return babelHelpers.classPrivateFieldLooseBase(this, _cache)[_cache].remember('stub-reload-button', () => {
	    return new ui_buttons.Button({
	      text: main_core.Loc.getMessage('INTRANET_USER_OTP_LIST_RELOAD_BTN'),
	      size: ui_buttons.Button.Size.MEDIUM,
	      style: ui_buttons.AirButtonStyle.FILLED,
	      useAirDesign: true,
	      icon: ui_iconSet_api_core.Outline.REFRESH,
	      wide: true,
	      onclick: button => {
	        babelHelpers.classPrivateFieldLooseBase(this, _sendAnalyticsEvent)[_sendAnalyticsEvent]('refresh_code_click', 'baloon');
	        button.setWaiting(true);
	        // eslint-disable-next-line promise/catch-or-return
	        babelHelpers.classPrivateFieldLooseBase(this, _reloadCodes)[_reloadCodes]().then(() => {
	          button.setWaiting(false);
	          main_core.Dom.replace(babelHelpers.classPrivateFieldLooseBase(this, _getButtonStub)[_getButtonStub](), babelHelpers.classPrivateFieldLooseBase(this, _getBodyContent)[_getBodyContent]());
	        });
	      }
	    });
	  });
	}
	function _reloadCodes2() {
	  return new Promise((resolve, reject) => {
	    main_core.ajax.runComponentAction('bitrix:security.user.recovery.codes', 'regenerateRecoveryCodes', {
	      mode: 'ajax'
	    }).then(response => {
	      babelHelpers.classPrivateFieldLooseBase(this, _options)[_options].codes = response.data;
	      main_core.Dom.clean(babelHelpers.classPrivateFieldLooseBase(this, _getRecoveryCodesGrid)[_getRecoveryCodesGrid]());
	      babelHelpers.classPrivateFieldLooseBase(this, _setRecoveryCodes)[_setRecoveryCodes](babelHelpers.classPrivateFieldLooseBase(this, _getRecoveryCodesGrid)[_getRecoveryCodesGrid]());
	      resolve();
	    }).catch(error => {
	      reject(error);
	    });
	  });
	}
	function _sendAnalyticsEvent2(eventName, cSection = null) {
	  const data = {
	    tool: 'user_settings',
	    category: 'security',
	    event: eventName
	  };
	  if (cSection) {
	    data.c_section = cSection;
	  }
	  ui_analytics.sendData(data);
	}

	exports.RecoveryCodes = RecoveryCodes;

}((this.BX.Intranet.Security = this.BX.Intranet.Security || {}),BX,BX.UI,BX.UI.IconSet,BX.UI.Analytics));
//# sourceMappingURL=script.js.map
