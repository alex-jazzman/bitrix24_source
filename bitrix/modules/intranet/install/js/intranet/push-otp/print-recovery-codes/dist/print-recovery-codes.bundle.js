/* eslint-disable */
this.BX = this.BX || {};
this.BX.Intranet = this.BX.Intranet || {};
(function (exports,main_core,main_sidepanel) {
	'use strict';

	let _ = t => t,
	  _t,
	  _t2,
	  _t3,
	  _t4,
	  _t5,
	  _t6,
	  _t7,
	  _t8;
	var _options = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("options");
	var _content = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("content");
	var _getContent = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("getContent");
	var _createDescription = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("createDescription");
	var _createManual = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("createManual");
	var _createList = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("createList");
	var _createRecoveryCodesGrid = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("createRecoveryCodesGrid");
	var _setRecoveryCodes = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("setRecoveryCodes");
	var _createRecoveryCodesDescription = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("createRecoveryCodesDescription");
	class PrintRecoveryCodes {
	  constructor(options) {
	    Object.defineProperty(this, _createRecoveryCodesDescription, {
	      value: _createRecoveryCodesDescription2
	    });
	    Object.defineProperty(this, _setRecoveryCodes, {
	      value: _setRecoveryCodes2
	    });
	    Object.defineProperty(this, _createRecoveryCodesGrid, {
	      value: _createRecoveryCodesGrid2
	    });
	    Object.defineProperty(this, _createList, {
	      value: _createList2
	    });
	    Object.defineProperty(this, _createManual, {
	      value: _createManual2
	    });
	    Object.defineProperty(this, _createDescription, {
	      value: _createDescription2
	    });
	    Object.defineProperty(this, _getContent, {
	      value: _getContent2
	    });
	    Object.defineProperty(this, _options, {
	      writable: true,
	      value: void 0
	    });
	    Object.defineProperty(this, _content, {
	      writable: true,
	      value: void 0
	    });
	    babelHelpers.classPrivateFieldLooseBase(this, _options)[_options] = options;
	  }
	  renderTo(container) {
	    main_core.Dom.append(babelHelpers.classPrivateFieldLooseBase(this, _getContent)[_getContent](), container);
	    main_core.Event.bind(window, 'afterprint', () => {
	      main_sidepanel.SidePanel.Instance.getTopSlider().close();
	    });
	    window.print();
	  }
	}
	function _getContent2() {
	  if (!babelHelpers.classPrivateFieldLooseBase(this, _content)[_content]) {
	    const logoUrl = main_core.Extension.getSettings('intranet.push-otp.print-recovery-codes').get('logoUrl');
	    babelHelpers.classPrivateFieldLooseBase(this, _content)[_content] = main_core.Tag.render(_t || (_t = _`
				<div class="intranet-otp-codes-print-page__wrapper">
					<div class="intranet-otp-codes-print-page__header">
						<img 
							src="${0}"
							width="134"
							height="27"
							alt="logo"
						>
					</div>
					${0}
					${0}
					${0}
				</div>
			`), logoUrl, babelHelpers.classPrivateFieldLooseBase(this, _createDescription)[_createDescription](), babelHelpers.classPrivateFieldLooseBase(this, _createManual)[_createManual](), babelHelpers.classPrivateFieldLooseBase(this, _createList)[_createList]());
	  }
	  return babelHelpers.classPrivateFieldLooseBase(this, _content)[_content];
	}
	function _createDescription2() {
	  return main_core.Tag.render(_t2 || (_t2 = _`
			<div class="intranet-otp-codes-print-page__section">
				<div class="intranet-otp-codes-print-page-section__title">${0}</div>
				<div class="intranet-otp-codes-print-page-section__description">${0}</div>
			</div>
		`), main_core.Loc.getMessage('INTRANET_PUSH_OTP_PRINT_RECOVERY_CODES_TITLE'), main_core.Loc.getMessage('INTRANET_PUSH_OTP_PRINT_RECOVERY_CODES_DESCRIPTION', {
	    '#DOMAIN#': babelHelpers.classPrivateFieldLooseBase(this, _options)[_options].domain
	  }));
	}
	function _createManual2() {
	  return main_core.Tag.render(_t3 || (_t3 = _`
			<div class="intranet-otp-codes-print-page__section">
				<div class="intranet-otp-codes-print-page-section__title">${0}</div>
				<ol class="intranet-otp-codes-print-page-section__list">
					<li class="ui-text --md">${0}</li>
					<li class="ui-text --md">${0}</li>
					<li class="ui-text --md">${0}</li>
				</ol>
			</div>
		`), main_core.Loc.getMessage('INTRANET_PUSH_OTP_PRINT_RECOVERY_CODES_MANUAL_TITLE'), main_core.Loc.getMessage('INTRANET_PUSH_OTP_PRINT_RECOVERY_CODES_MANUAL_STEP_1'), main_core.Loc.getMessage('INTRANET_PUSH_OTP_PRINT_RECOVERY_CODES_MANUAL_STEP_2'), main_core.Loc.getMessage('INTRANET_PUSH_OTP_PRINT_RECOVERY_CODES_MANUAL_STEP_3'));
	}
	function _createList2() {
	  return main_core.Tag.render(_t4 || (_t4 = _`
			<div class="intranet-otp-codes-print-page__section">
				<div class="intranet-otp-codes-print-page-section__title">${0}</div>
				${0}
				${0}
			</div>
		`), main_core.Loc.getMessage('INTRANET_PUSH_OTP_PRINT_RECOVERY_CODES_LIST_TITLE'), babelHelpers.classPrivateFieldLooseBase(this, _createRecoveryCodesGrid)[_createRecoveryCodesGrid](), babelHelpers.classPrivateFieldLooseBase(this, _createRecoveryCodesDescription)[_createRecoveryCodesDescription]());
	}
	function _createRecoveryCodesGrid2() {
	  const grid = main_core.Tag.render(_t5 || (_t5 = _`<ol class="intranet-otp-codes-print-page__grid ui-alert ui-alert-secondary"/>`));
	  const container = main_core.Tag.render(_t6 || (_t6 = _`
			<div class="intranet-otp-codes-print-page__grid-wrapper">
				${0}
			</div>
		`), grid);
	  babelHelpers.classPrivateFieldLooseBase(this, _setRecoveryCodes)[_setRecoveryCodes](grid);
	  return container;
	}
	function _setRecoveryCodes2(container) {
	  babelHelpers.classPrivateFieldLooseBase(this, _options)[_options].codes.forEach(code => {
	    main_core.Dom.append(main_core.Tag.render(_t7 || (_t7 = _`
				<li class="ui-text --sm intranet-otp-codes-print-page__grid-item">
					${0}
				</li>
			`), main_core.Text.encode(code.VALUE)), container);
	  });
	}
	function _createRecoveryCodesDescription2() {
	  return main_core.Tag.render(_t8 || (_t8 = _`
			<ul class="intranet-otp-codes-print-page-section__list --sm">
				<li class="ui-text --2xs">${0}</li>
				<li class="ui-text --2xs">${0}</li>
				<li class="ui-text --2xs">${0}</li>
			</ul>
		`), main_core.Loc.getMessage('INTRANET_PUSH_OTP_PRINT_RECOVERY_CODES_LIST_EXPLANATION_1'), main_core.Loc.getMessage('INTRANET_PUSH_OTP_PRINT_RECOVERY_CODES_LIST_EXPLANATION_2'), main_core.Loc.getMessage('INTRANET_PUSH_OTP_PRINT_RECOVERY_CODES_LIST_EXPLANATION_3'));
	}

	exports.PrintRecoveryCodes = PrintRecoveryCodes;

}((this.BX.Intranet.PushOtp = this.BX.Intranet.PushOtp || {}),BX,BX.SidePanel));
//# sourceMappingURL=print-recovery-codes.bundle.js.map
