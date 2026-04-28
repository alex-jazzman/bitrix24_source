/* eslint-disable */
this.BX = this.BX || {};
this.BX.Intranet = this.BX.Intranet || {};
(function (exports,main_core_cache,main_core_events,main_popup,main_core,ui_buttons,ui_iconSet_social,intranet_pushOtp_connectPopup,main_sidepanel,ui_analytics) {
	'use strict';

	let _ = t => t,
	  _t,
	  _t2,
	  _t3,
	  _t4,
	  _t5,
	  _t6;
	var _cache = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("cache");
	var _getPopup = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("getPopup");
	var _getPopupColorClass = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("getPopupColorClass");
	var _getContent = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("getContent");
	var _getHeader = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("getHeader");
	var _getDeviceItem = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("getDeviceItem");
	var _getDeviceIconClass = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("getDeviceIconClass");
	var _getNumberItem = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("getNumberItem");
	var _getNumberActionConfig = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("getNumberActionConfig");
	var _getPhoneNumber = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("getPhoneNumber");
	var _getButtonsContainer = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("getButtonsContainer");
	var _getOpenSettingsButton = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("getOpenSettingsButton");
	var _getConfirmButton = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("getConfirmButton");
	var _getExtensionSettings = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("getExtensionSettings");
	class TrustDeviceConfirmation extends main_core_events.EventEmitter {
	  constructor() {
	    super();
	    Object.defineProperty(this, _getExtensionSettings, {
	      value: _getExtensionSettings2
	    });
	    Object.defineProperty(this, _getConfirmButton, {
	      value: _getConfirmButton2
	    });
	    Object.defineProperty(this, _getOpenSettingsButton, {
	      value: _getOpenSettingsButton2
	    });
	    Object.defineProperty(this, _getButtonsContainer, {
	      value: _getButtonsContainer2
	    });
	    Object.defineProperty(this, _getPhoneNumber, {
	      value: _getPhoneNumber2
	    });
	    Object.defineProperty(this, _getNumberActionConfig, {
	      value: _getNumberActionConfig2
	    });
	    Object.defineProperty(this, _getNumberItem, {
	      value: _getNumberItem2
	    });
	    Object.defineProperty(this, _getDeviceIconClass, {
	      value: _getDeviceIconClass2
	    });
	    Object.defineProperty(this, _getDeviceItem, {
	      value: _getDeviceItem2
	    });
	    Object.defineProperty(this, _getHeader, {
	      value: _getHeader2
	    });
	    Object.defineProperty(this, _getContent, {
	      value: _getContent2
	    });
	    Object.defineProperty(this, _getPopupColorClass, {
	      value: _getPopupColorClass2
	    });
	    Object.defineProperty(this, _getPopup, {
	      value: _getPopup2
	    });
	    Object.defineProperty(this, _cache, {
	      writable: true,
	      value: new main_core_cache.MemoryCache()
	    });
	    this.setEventNamespace('BX.Intranet.PushOtp.TrustDeviceConfirmation');
	  }
	  show() {
	    babelHelpers.classPrivateFieldLooseBase(this, _getPopup)[_getPopup]().show();
	  }
	}
	function _getPopup2() {
	  return babelHelpers.classPrivateFieldLooseBase(this, _cache)[_cache].remember('popup', () => {
	    return new main_popup.Popup({
	      id: 'trust-device-confirmation-popup',
	      width: 590,
	      content: babelHelpers.classPrivateFieldLooseBase(this, _getContent)[_getContent](),
	      fixed: true,
	      disableScroll: true,
	      overlay: true,
	      className: `intranet-trust-device-confirmation-popup${babelHelpers.classPrivateFieldLooseBase(this, _getPopupColorClass)[_getPopupColorClass]()}`,
	      events: {
	        onShow: () => {
	          ui_analytics.sendData({
	            tool: 'push',
	            category: 'push_check_data_2fa',
	            event: 'click'
	          });
	          BX.userOptions.save('intranet', 'otp_device_last_confirmation_date', null, BX.Main.DateTimeFormat.format('d.m.Y'));
	          BX.userOptions.del('intranet', 'require_show_device_confirmation_date');
	        },
	        onClose: () => {
	          this.emit('onClose');
	        }
	      }
	    });
	  });
	}
	function _getPopupColorClass2() {
	  const isDeactivated = babelHelpers.classPrivateFieldLooseBase(this, _getExtensionSettings)[_getExtensionSettings]().isDeactivated;
	  if (isDeactivated) {
	    return '--red';
	  }
	  return '--blue';
	}
	function _getContent2() {
	  return babelHelpers.classPrivateFieldLooseBase(this, _cache)[_cache].remember('content', () => {
	    return main_core.Tag.render(_t || (_t = _`
				<div class="intranet-trust-device-confirmation-popup__wrapper">
					${0}
					<div class="intranet-trust-device-confirmation-popup__content">
						${0}
						${0}
					</div>
					${0}
				</div>
			`), babelHelpers.classPrivateFieldLooseBase(this, _getHeader)[_getHeader](), babelHelpers.classPrivateFieldLooseBase(this, _getDeviceItem)[_getDeviceItem](), babelHelpers.classPrivateFieldLooseBase(this, _getExtensionSettings)[_getExtensionSettings]().canSendSms ? babelHelpers.classPrivateFieldLooseBase(this, _getNumberItem)[_getNumberItem]() : '', babelHelpers.classPrivateFieldLooseBase(this, _getButtonsContainer)[_getButtonsContainer]());
	  });
	}
	function _getHeader2() {
	  return babelHelpers.classPrivateFieldLooseBase(this, _cache)[_cache].remember('header', () => {
	    return main_core.Tag.render(_t2 || (_t2 = _`
				<div class="intranet-trust-device-confirmation-popup__header">
					<div class="intranet-trust-device-confirmation-popup__title-wrapper">
						<div class="intranet-trust-device-confirmation-popup__title">
							${0}
						</div>
						<div class="intranet-trust-device-confirmation-popup__description">
							${0}
						</div>
					</div>
					<div class="intranet-trust-device-confirmation-popup__icon">
						<i></i>
					</div>
				</div>
			`), main_core.Loc.getMessage('INTRANET_TRUST_DEVICE_CONFIRMATION_TITLE'), main_core.Loc.getMessage('INTRANET_TRUST_DEVICE_CONFIRMATION_DESCRIPTION'));
	  });
	}
	function _getDeviceItem2() {
	  return babelHelpers.classPrivateFieldLooseBase(this, _cache)[_cache].remember('deviceItem', () => {
	    const onclick = () => {
	      const provider = new intranet_pushOtp_connectPopup.EnablePushOtpProvider(babelHelpers.classPrivateFieldLooseBase(this, _getExtensionSettings)[_getExtensionSettings]());
	      provider.onlyPushOtp().show();
	    };
	    return main_core.Tag.render(_t3 || (_t3 = _`
				<div class="intranet-trust-device-confirmation-popup-content__item">
					<div class="intranet-trust-device-confirmation-popup-content-item__icon-wrapper">
						<i class="intranet-trust-device-confirmation-popup-content-item__icon --device"></i>
					</div>
					<div class="intranet-trust-device-confirmation-popup-content-item__text">
						<div class="intranet-trust-device-confirmation-popup-content-item__title">
							${0}
						</div>
						<div data-testid="bx-intranet-trust-device-confirmation-popup-device-data" class="intranet-trust-device-confirmation-popup-content-item__description">
							<i class="ui-icon-set ${0}"></i>
							<span>${0}</span>
						</div>
					</div>
					<div data-testid="bx-intranet-trust-device-confirmation-popup-device-action" onclick="${0}" class="intranet-trust-device-confirmation-popup-content-item__action">
						${0}
					</div>
				</div>
			`), main_core.Loc.getMessage('INTRANET_TRUST_DEVICE_CONFIRMATION_DEVICE_TITLE'), babelHelpers.classPrivateFieldLooseBase(this, _getDeviceIconClass)[_getDeviceIconClass](), main_core.Text.encode(babelHelpers.classPrivateFieldLooseBase(this, _getExtensionSettings)[_getExtensionSettings]().device), onclick, main_core.Loc.getMessage('INTRANET_TRUST_DEVICE_CONFIRMATION_ACTION_CHANGE'));
	  });
	}
	function _getDeviceIconClass2() {
	  if (babelHelpers.classPrivateFieldLooseBase(this, _getExtensionSettings)[_getExtensionSettings]().platform === 'ios') {
	    return '--apple-and-ios';
	  }
	  if (babelHelpers.classPrivateFieldLooseBase(this, _getExtensionSettings)[_getExtensionSettings]().platform === 'android') {
	    return '--android';
	  }
	  return '';
	}
	function _getNumberItem2() {
	  return babelHelpers.classPrivateFieldLooseBase(this, _cache)[_cache].remember('numberItem', () => {
	    return main_core.Tag.render(_t4 || (_t4 = _`
				<div class="intranet-trust-device-confirmation-popup-content__item">
					<div class="intranet-trust-device-confirmation-popup-content-item__icon-wrapper">
						<i class="intranet-trust-device-confirmation-popup-content-item__icon --number"></i>
					</div>
					<div class="intranet-trust-device-confirmation-popup-content-item__text">
						<div class="intranet-trust-device-confirmation-popup-content-item__title">
							${0}
						</div>
						<div data-testid="bx-intranet-trust-device-confirmation-popup-phone-data" class="intranet-trust-device-confirmation-popup-content-item__description">
							${0}
						</div>
					</div>
					<div data-testid="bx-intranet-trust-device-confirmation-popup-phone-action" onclick="${0}" class="intranet-trust-device-confirmation-popup-content-item__action ${0}">
						${0}
					</div>
				</div>
			`), main_core.Loc.getMessage('INTRANET_TRUST_DEVICE_CONFIRMATION_PHONE_NUMBER_TITLE'), babelHelpers.classPrivateFieldLooseBase(this, _getPhoneNumber)[_getPhoneNumber](), babelHelpers.classPrivateFieldLooseBase(this, _getNumberActionConfig)[_getNumberActionConfig]().onclick, babelHelpers.classPrivateFieldLooseBase(this, _getNumberActionConfig)[_getNumberActionConfig]().modifyClass, babelHelpers.classPrivateFieldLooseBase(this, _getNumberActionConfig)[_getNumberActionConfig]().title);
	  });
	}
	function _getNumberActionConfig2() {
	  return babelHelpers.classPrivateFieldLooseBase(this, _cache)[_cache].remember('numberActionConfig', () => {
	    const provider = new intranet_pushOtp_connectPopup.EnablePushOtpProvider(babelHelpers.classPrivateFieldLooseBase(this, _getExtensionSettings)[_getExtensionSettings]());
	    const onclick = () => {
	      provider.onlySmsOtpChange().show();
	    };
	    if (!babelHelpers.classPrivateFieldLooseBase(this, _getExtensionSettings)[_getExtensionSettings]().phoneNumber) {
	      return {
	        title: main_core.Loc.getMessage('INTRANET_TRUST_DEVICE_CONFIRMATION_ACTION_ADD'),
	        onclick,
	        modifyClass: '--action-blue'
	      };
	    }
	    if (babelHelpers.classPrivateFieldLooseBase(this, _getExtensionSettings)[_getExtensionSettings]().isPhoneNumberConfirmed) {
	      return {
	        title: main_core.Loc.getMessage('INTRANET_TRUST_DEVICE_CONFIRMATION_ACTION_CHANGE'),
	        onclick,
	        modifyClass: ''
	      };
	    }
	    return {
	      title: main_core.Loc.getMessage('INTRANET_TRUST_DEVICE_CONFIRMATION_ACTION_CONFIRM'),
	      onclick: () => {
	        provider.onlySmsOtpConfirm().show();
	      },
	      modifyClass: '--action-blue'
	    };
	  });
	}
	function _getPhoneNumber2() {
	  return babelHelpers.classPrivateFieldLooseBase(this, _cache)[_cache].remember('phoneNumber', () => {
	    return babelHelpers.classPrivateFieldLooseBase(this, _getExtensionSettings)[_getExtensionSettings]().phoneNumber || main_core.Tag.render(_t5 || (_t5 = _`<span class="--disabled-item">${0}</span>`), main_core.Loc.getMessage('INTRANET_TRUST_DEVICE_CONFIRMATION_PHONE_NUMBER_NOT_SET'));
	  });
	}
	function _getButtonsContainer2() {
	  return babelHelpers.classPrivateFieldLooseBase(this, _cache)[_cache].remember('buttonsContainer', () => {
	    return main_core.Tag.render(_t6 || (_t6 = _`
				<div class="intranet-trust-device-confirmation-popup__buttons">
					${0}
					${0}
				</div>
			`), babelHelpers.classPrivateFieldLooseBase(this, _getOpenSettingsButton)[_getOpenSettingsButton]().render(), babelHelpers.classPrivateFieldLooseBase(this, _getConfirmButton)[_getConfirmButton]().render());
	  });
	}
	function _getOpenSettingsButton2() {
	  return babelHelpers.classPrivateFieldLooseBase(this, _cache)[_cache].remember('openSettingsButton', () => {
	    return new ui_buttons.Button({
	      text: main_core.Loc.getMessage('INTRANET_TRUST_DEVICE_CONFIRMATION_BUTTON_SETTINGS'),
	      style: ui_buttons.AirButtonStyle.FILLED,
	      useAirDesign: true,
	      size: ui_buttons.ButtonSize.LARGE,
	      onclick: () => {
	        babelHelpers.classPrivateFieldLooseBase(this, _getPopup)[_getPopup]().close();
	        main_sidepanel.SidePanel.Instance.open(babelHelpers.classPrivateFieldLooseBase(this, _getExtensionSettings)[_getExtensionSettings]().settingsPath, {
	          events: {
	            onOpen: () => {
	              main_core_events.EventEmitter.subscribeOnce('BX.Intranet.Security:onChangePage', event => {
	                if (event.data.page === 'otpConnected') {
	                  main_core_events.EventEmitter.emit('BX.Intranet.Security:shouldOpen2FaSlider');
	                }
	              });
	            }
	          }
	        });
	        ui_analytics.sendData({
	          tool: 'push',
	          category: 'push_check_data_2fa',
	          event: 'click',
	          c_section: 'setting'
	        });
	      },
	      props: {
	        'data-testid': 'bx-intranet-trust-device-confirmation-popup-settings-button'
	      }
	    });
	  });
	}
	function _getConfirmButton2() {
	  return babelHelpers.classPrivateFieldLooseBase(this, _cache)[_cache].remember('confirmButton', () => {
	    return new ui_buttons.Button({
	      text: main_core.Loc.getMessage('INTRANET_TRUST_DEVICE_CONFIRMATION_BUTTON_CONFIRM'),
	      style: ui_buttons.AirButtonStyle.OUTLINE,
	      useAirDesign: true,
	      size: ui_buttons.ButtonSize.LARGE,
	      onclick: () => {
	        babelHelpers.classPrivateFieldLooseBase(this, _getPopup)[_getPopup]().close();
	        ui_analytics.sendData({
	          tool: 'push',
	          category: 'push_check_data_2fa',
	          event: 'click',
	          c_section: 'approve'
	        });
	      },
	      props: {
	        'data-testid': 'bx-intranet-trust-device-confirmation-popup-confirm-button'
	      }
	    });
	  });
	}
	function _getExtensionSettings2() {
	  return babelHelpers.classPrivateFieldLooseBase(this, _cache)[_cache].remember('extensionSettings', () => {
	    return main_core.Extension.getSettings('intranet.push-otp.trust-device-confirmation');
	  });
	}

	exports.TrustDeviceConfirmation = TrustDeviceConfirmation;

}((this.BX.Intranet.PushOtp = this.BX.Intranet.PushOtp || {}),BX.Cache,BX.Event,BX.Main,BX,BX.UI,BX,BX.Intranet.PushOtp,BX.SidePanel,BX.UI.Analytics));
//# sourceMappingURL=trust-device-confirmation.bundle.js.map
