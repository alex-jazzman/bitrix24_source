/* eslint-disable */
this.BX = this.BX || {};
(function (exports,ui_system_dialog,main_core_cache,ui_buttons,main_core,ui_notification) {
	'use strict';

	let _ = t => t,
	  _t,
	  _t2;
	var _cache = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("cache");
	var _getPopup = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("getPopup");
	var _getContent = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("getContent");
	var _getTrustedDeviceCheckbox = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("getTrustedDeviceCheckbox");
	var _isKeepTrustedDevice = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("isKeepTrustedDevice");
	var _logout = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("logout");
	var _getSettings = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("getSettings");
	class LogoutAllConfirm {
	  constructor() {
	    Object.defineProperty(this, _getSettings, {
	      value: _getSettings2
	    });
	    Object.defineProperty(this, _logout, {
	      value: _logout2
	    });
	    Object.defineProperty(this, _isKeepTrustedDevice, {
	      value: _isKeepTrustedDevice2
	    });
	    Object.defineProperty(this, _getTrustedDeviceCheckbox, {
	      value: _getTrustedDeviceCheckbox2
	    });
	    Object.defineProperty(this, _getContent, {
	      value: _getContent2
	    });
	    Object.defineProperty(this, _getPopup, {
	      value: _getPopup2
	    });
	    Object.defineProperty(this, _cache, {
	      writable: true,
	      value: new main_core_cache.MemoryCache()
	    });
	  }
	  show() {
	    babelHelpers.classPrivateFieldLooseBase(this, _getPopup)[_getPopup]().show();
	  }
	}
	function _getPopup2() {
	  return babelHelpers.classPrivateFieldLooseBase(this, _cache)[_cache].remember('popup', () => {
	    const dialog = new ui_system_dialog.Dialog({
	      closeByClickOutside: false,
	      hasOverlay: true,
	      width: 400,
	      content: babelHelpers.classPrivateFieldLooseBase(this, _getContent)[_getContent](),
	      centerButtons: [new ui_buttons.Button({
	        text: main_core.Loc.getMessage('INTRANET_LOGOUT_ALL_CONFIRM_BTN_YES'),
	        onclick: () => {
	          // eslint-disable-next-line promise/catch-or-return
	          babelHelpers.classPrivateFieldLooseBase(this, _logout)[_logout]().then(() => {
	            dialog.hide();
	            const settings = babelHelpers.classPrivateFieldLooseBase(this, _getSettings)[_getSettings]();
	            if (settings.pushOtpConnected && !babelHelpers.classPrivateFieldLooseBase(this, _isKeepTrustedDevice)[_isKeepTrustedDevice]()) {
	              // eslint-disable-next-line promise/catch-or-return
	              main_core.Runtime.loadExtension('intranet.push-otp.connect-popup').then(exports => {
	                const {
	                  EnablePushOtpProvider
	                } = exports;
	                main_core.ajax.runAction('intranet.v2.Otp.getConfig', {
	                  method: 'POST',
	                  data: {
	                    signedUserId: settings.signedUserId
	                  }
	                }).then(response => {
	                  const provider = new EnablePushOtpProvider({
	                    ...(response == null ? void 0 : response.data),
	                    signedUserId: settings.signedUserId,
	                    deviceName: settings.deviceName,
	                    devicePlatform: settings.devicePlatform
	                  });
	                  const popup = provider.reconnectDevice();
	                  popup.show();
	                  // eslint-disable-next-line promise/no-nesting
	                }).catch(() => {});
	              });
	            } else {
	              ui_notification.UI.Notification.Center.notify({
	                content: main_core.Loc.getMessage('INTRANET_LOGOUT_ALL_CONFIRM_NOTIFY_TEXT', {
	                  '#TITLE#': `<span style="font-size: 14px; font-weight: 500;line-height: 19px;">${main_core.Loc.getMessage('INTRANET_LOGOUT_ALL_CONFIRM_NOTIFY_TITLE')}</span>`
	                }),
	                autoHide: true,
	                position: 'bottom-right',
	                closeButton: false,
	                useAirDesign: true
	              });
	            }
	          });
	        },
	        useAirDesign: true,
	        style: ui_buttons.AirButtonStyle.FILLED
	      }), new ui_buttons.CancelButton({
	        onclick: () => {
	          dialog.hide();
	        },
	        useAirDesign: true,
	        style: ui_buttons.AirButtonStyle.OUTLINE
	      })]
	    });
	    return dialog;
	  });
	}
	function _getContent2() {
	  return babelHelpers.classPrivateFieldLooseBase(this, _cache)[_cache].remember('content', () => {
	    return main_core.Tag.render(_t || (_t = _`
				<div class="intranet-logout-all-confirm-popup">
					<i class="intranet-logout-all-confirm-popup__logo"></i>
					<div class="intranet-logout-all-confirm-popup__title">
						${0}
					</div>
					<div class="intranet-logout-all-confirm-popup__description">
						${0}
					</div>
				</div>
			`), main_core.Loc.getMessage('INTRANET_LOGOUT_ALL_CONFIRM_TITLE'), main_core.Loc.getMessage('INTRANET_LOGOUT_ALL_CONFIRM_DESCRIPTION'));
	  });
	}
	function _getTrustedDeviceCheckbox2() {
	  return babelHelpers.classPrivateFieldLooseBase(this, _cache)[_cache].remember('trusted-device', () => {
	    return main_core.Tag.render(_t2 || (_t2 = _`
				<div class="intranet-logout-all-confirm-popup__checkbox">
					<label class="intranet-logout-all-confirm-popup__checkbox-label">
						<input type="checkbox" checked>
						${0}
					</label>
				</div>
			`), main_core.Loc.getMessage('INTRANET_LOGOUT_ALL_CONFIRM_KEEP_TRUSTED'));
	  });
	}
	function _isKeepTrustedDevice2() {
	  return false;
	}
	function _logout2() {
	  return main_core.ajax.runAction('intranet.v2.Otp.logoutAll', {
	    data: {
	      signedUserId: babelHelpers.classPrivateFieldLooseBase(this, _getSettings)[_getSettings]().signedUserId,
	      keepTrustedDevice: babelHelpers.classPrivateFieldLooseBase(this, _isKeepTrustedDevice)[_isKeepTrustedDevice]() ? 'Y' : 'N'
	    }
	  });
	}
	function _getSettings2() {
	  return main_core.Extension.getSettings('intranet.logout-all-confirm');
	}

	exports.LogoutAllConfirm = LogoutAllConfirm;

}((this.BX.Intranet = this.BX.Intranet || {}),BX.UI.System,BX.Cache,BX.UI,BX,BX));
//# sourceMappingURL=logout-all-confirm.bundle.js.map
