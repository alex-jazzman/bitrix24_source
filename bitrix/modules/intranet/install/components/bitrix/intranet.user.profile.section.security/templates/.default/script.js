/* eslint-disable */
this.BX = this.BX || {};
(function (exports,ui_sidepanel_layout,ui_cnt,main_sidepanel,intranet_notifyBanner_pushOtp,intranet_pushOtp_connectPopup,intranet_pushOtp_menu,ui_analytics,ui_buttons,main_core,main_popup) {
	'use strict';

	var _id = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("id");
	var _title = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("title");
	var _width = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("width");
	var _cacheable = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("cacheable");
	var _events = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("events");
	var _componentContent = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("componentContent");
	var _buttons = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("buttons");
	var _extensions = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("extensions");
	var _prepareComponentResponse = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("prepareComponentResponse");
	class ComponentSlider {
	  constructor(options) {
	    var _options$title, _options$width, _options$events, _options$buttons, _options$extensions;
	    Object.defineProperty(this, _prepareComponentResponse, {
	      value: _prepareComponentResponse2
	    });
	    Object.defineProperty(this, _id, {
	      writable: true,
	      value: void 0
	    });
	    Object.defineProperty(this, _title, {
	      writable: true,
	      value: void 0
	    });
	    Object.defineProperty(this, _width, {
	      writable: true,
	      value: void 0
	    });
	    Object.defineProperty(this, _cacheable, {
	      writable: true,
	      value: void 0
	    });
	    Object.defineProperty(this, _events, {
	      writable: true,
	      value: {}
	    });
	    Object.defineProperty(this, _componentContent, {
	      writable: true,
	      value: void 0
	    });
	    Object.defineProperty(this, _buttons, {
	      writable: true,
	      value: []
	    });
	    Object.defineProperty(this, _extensions, {
	      writable: true,
	      value: []
	    });
	    babelHelpers.classPrivateFieldLooseBase(this, _id)[_id] = options.id;
	    babelHelpers.classPrivateFieldLooseBase(this, _title)[_title] = (_options$title = options.title) != null ? _options$title : '';
	    babelHelpers.classPrivateFieldLooseBase(this, _width)[_width] = (_options$width = options.width) != null ? _options$width : 1100;
	    babelHelpers.classPrivateFieldLooseBase(this, _cacheable)[_cacheable] = options.cacheable !== false;
	    babelHelpers.classPrivateFieldLooseBase(this, _events)[_events] = (_options$events = options.events) != null ? _options$events : {};
	    babelHelpers.classPrivateFieldLooseBase(this, _componentContent)[_componentContent] = options.componentContent;
	    babelHelpers.classPrivateFieldLooseBase(this, _buttons)[_buttons] = (_options$buttons = options.buttons) != null ? _options$buttons : [];
	    babelHelpers.classPrivateFieldLooseBase(this, _extensions)[_extensions] = (_options$extensions = options.extensions) != null ? _options$extensions : [];
	  }
	  open() {
	    main_sidepanel.SidePanel.Instance.open(babelHelpers.classPrivateFieldLooseBase(this, _id)[_id], {
	      width: babelHelpers.classPrivateFieldLooseBase(this, _width)[_width],
	      cacheable: babelHelpers.classPrivateFieldLooseBase(this, _cacheable)[_cacheable],
	      contentCallback: () => {
	        var _babelHelpers$classPr;
	        return ui_sidepanel_layout.Layout.createContent({
	          title: (_babelHelpers$classPr = babelHelpers.classPrivateFieldLooseBase(this, _title)[_title]) != null ? _babelHelpers$classPr : '',
	          extensions: babelHelpers.classPrivateFieldLooseBase(this, _extensions)[_extensions],
	          design: {
	            section: false,
	            margin: true
	          },
	          content: () => {
	            return babelHelpers.classPrivateFieldLooseBase(this, _componentContent)[_componentContent]().then(babelHelpers.classPrivateFieldLooseBase(this, _prepareComponentResponse)[_prepareComponentResponse]);
	          },
	          buttons: () => {
	            return babelHelpers.classPrivateFieldLooseBase(this, _buttons)[_buttons];
	          }
	        }).then(container => {
	          var _container$innerHTML;
	          return {
	            html: (_container$innerHTML = container == null ? void 0 : container.innerHTML) != null ? _container$innerHTML : ''
	          };
	        });
	      },
	      events: babelHelpers.classPrivateFieldLooseBase(this, _events)[_events]
	    });
	  }
	}
	function _prepareComponentResponse2(response) {
	  var _response$data, _response$data2, _response$data3, _response$data4;
	  let content = response == null ? void 0 : (_response$data = response.data) == null ? void 0 : _response$data.html;
	  ((response == null ? void 0 : (_response$data2 = response.data) == null ? void 0 : _response$data2.assets.css) || []).forEach(link => {
	    content += `<link rel="stylesheet" href="${link}">`;
	  });
	  ((response == null ? void 0 : (_response$data3 = response.data) == null ? void 0 : _response$data3.assets.js) || []).forEach(link => {
	    content += `<script src="${link}"><\/script>`;
	  });
	  ((response == null ? void 0 : (_response$data4 = response.data) == null ? void 0 : _response$data4.assets.string) || []).forEach(script => {
	    content += script;
	  });
	  return content;
	}

	var _signedParameters = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("signedParameters");
	var _userId = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("userId");
	var _isCloud = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("isCloud");
	var _passwordNetworkUrl = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("passwordNetworkUrl");
	var _signedUserId = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("signedUserId");
	var _setAnalyticsEventHandlers = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("setAnalyticsEventHandlers");
	class SecuritySection {
	  constructor(_options) {
	    Object.defineProperty(this, _setAnalyticsEventHandlers, {
	      value: _setAnalyticsEventHandlers2
	    });
	    Object.defineProperty(this, _signedParameters, {
	      writable: true,
	      value: void 0
	    });
	    Object.defineProperty(this, _userId, {
	      writable: true,
	      value: void 0
	    });
	    Object.defineProperty(this, _isCloud, {
	      writable: true,
	      value: void 0
	    });
	    Object.defineProperty(this, _passwordNetworkUrl, {
	      writable: true,
	      value: void 0
	    });
	    Object.defineProperty(this, _signedUserId, {
	      writable: true,
	      value: void 0
	    });
	    babelHelpers.classPrivateFieldLooseBase(this, _signedParameters)[_signedParameters] = _options.signedParameters;
	    babelHelpers.classPrivateFieldLooseBase(this, _signedUserId)[_signedUserId] = _options.signedUserId;
	    babelHelpers.classPrivateFieldLooseBase(this, _userId)[_userId] = _options.userId;
	    babelHelpers.classPrivateFieldLooseBase(this, _isCloud)[_isCloud] = _options.isCloud === true;
	    babelHelpers.classPrivateFieldLooseBase(this, _passwordNetworkUrl)[_passwordNetworkUrl] = main_core.Type.isStringFilled(_options.passwordNetworkUrl) ? _options.passwordNetworkUrl : '';
	    babelHelpers.classPrivateFieldLooseBase(this, _setAnalyticsEventHandlers)[_setAnalyticsEventHandlers](_options);
	  }
	  open2FaSlider() {
	    new ComponentSlider({
	      id: 'user_profile_2fa',
	      title: main_core.Loc.getMessage('INTRANET_USER_SECURITY_PUSH_OTP_AUTH'),
	      width: 600,
	      extensions: ['intranet.push-otp.connect-popup'],
	      componentContent: () => {
	        return BX.ajax.runComponentAction('bitrix:intranet.user.profile.security', 'otpList', {
	          signedParameters: babelHelpers.classPrivateFieldLooseBase(this, _signedParameters)[_signedParameters],
	          mode: 'ajax',
	          data: {
	            userId: babelHelpers.classPrivateFieldLooseBase(this, _userId)[_userId]
	          }
	        });
	      },
	      events: {
	        onClose: () => {
	          this.reload();
	        }
	      }
	    }).open();
	  }
	  openOld2Fa() {
	    BX.Intranet.UserProfile.Security.changeContent('otpList');
	  }
	  openChangePassword() {
	    if (babelHelpers.classPrivateFieldLooseBase(this, _isCloud)[_isCloud]) {
	      if (main_core.Type.isStringFilled(babelHelpers.classPrivateFieldLooseBase(this, _passwordNetworkUrl)[_passwordNetworkUrl])) {
	        window.open(babelHelpers.classPrivateFieldLooseBase(this, _passwordNetworkUrl)[_passwordNetworkUrl]);
	      } else {
	        console.error('Password change URL is not defined.');
	      }
	    } else {
	      this.openPasswordSlider();
	    }
	  }
	  openPasswordSlider() {
	    main_sidepanel.SidePanel.Instance.open(`/bitrix/components/bitrix/intranet.user.profile.password/index.php?userId=${main_core.Text.encode(babelHelpers.classPrivateFieldLooseBase(this, _userId)[_userId])}`, {
	      cacheable: false,
	      width: 700
	    });
	  }
	  openOldPassword() {
	    BX.Intranet.UserProfile.Security.changeContent('changePassword');
	  }
	  reload() {
	    BX.Intranet.UserProfile.Security.changeContent('otpConnected');
	  }
	  logoutAllRequest() {
	    return BX.ajax.runAction('intranet.v2.Otp.logoutAll', {
	      data: {
	        signedUserId: babelHelpers.classPrivateFieldLooseBase(this, _signedUserId)[_signedUserId]
	      }
	    });
	  }
	  logoutAll() {
	    var _this$logoutAllReques;
	    (_this$logoutAllReques = this.logoutAllRequest()) == null ? void 0 : _this$logoutAllReques.then(response => {
	      BX.UI.Notification.Center.notify({
	        content: main_core.Loc.getMessage('INTRANET_USER_SECURITY_EXIT_SUCCESS'),
	        autoHide: true,
	        position: 'bottom-right',
	        closeButton: false
	      });
	    });
	  }
	  renderPhoneConfirmationCounter(wrapper) {
	    const counter = new ui_cnt.Counter({
	      color: ui_cnt.Counter.Color.DANGER,
	      size: ui_cnt.Counter.Size.MEDIUM,
	      value: 1,
	      style: ui_cnt.CounterStyle.FILLED_ALERT,
	      useAirDesign: true
	    });
	    counter.renderTo(wrapper);
	  }
	}
	function _setAnalyticsEventHandlers2(options) {
	  if (options.emailElement) {
	    main_core.Event.bind(options.emailElement, 'click', () => {
	      ui_analytics.sendData({
	        tool: 'user_settings',
	        category: 'security',
	        event: 'click',
	        c_element: 'email'
	      });
	    });
	  }
	  if (options.phoneElement) {
	    main_core.Event.bind(options.phoneElement, 'click', () => {
	      ui_analytics.sendData({
	        tool: 'user_settings',
	        category: 'security',
	        event: 'click',
	        c_element: 'phone'
	      });
	    });
	  }
	  if (options.socservElement) {
	    main_core.Event.bind(options.socservElement, 'click', () => {
	      ui_analytics.sendData({
	        tool: 'user_settings',
	        category: 'security',
	        event: 'click',
	        c_element: 'socserv'
	      });
	    });
	  }
	  if (options.passwordElement) {
	    main_core.Event.bind(options.passwordElement, 'click', () => {
	      ui_analytics.sendData({
	        tool: 'user_settings',
	        category: 'security',
	        event: 'click',
	        c_element: 'password'
	      });
	    });
	  }
	}

	var _getConnectPopup = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("getConnectPopup");
	var _sendAnalyticEvent = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("sendAnalyticEvent");
	class BannerFactory {
	  static create(options) {
	    let bannerPushOtp = null;
	    if (options.canShowBannerPushOtp) {
	      if (!options.isOtpActive) {
	        const popup = babelHelpers.classPrivateFieldLooseBase(this, _getConnectPopup)[_getConnectPopup](options);
	        bannerPushOtp = new intranet_notifyBanner_pushOtp.PushOtp({
	          title: options.title,
	          text: options.text,
	          clickEnableBtn: () => {
	            popup.show();
	            babelHelpers.classPrivateFieldLooseBase(this, _sendAnalyticEvent)[_sendAnalyticEvent]('banner_on');
	          }
	        });
	      } else if (options.isNotPushOtp) {
	        let clickDisableBtn = null;
	        if (options.canDeactivate) {
	          clickDisableBtn = event => {
	            const menu = new intranet_pushOtp_menu.Menu(event.button, {
	              days: options.days,
	              callback: item => {
	                intranet_pushOtp_connectPopup.pauseOtpRequest(item.numDays, options.signedUserId).then(() => BX.Intranet.UserProfile.Security.changeContent('otpConnected')).catch(response => console.error(response));
	              }
	            });
	            menu.show();
	            babelHelpers.classPrivateFieldLooseBase(this, _sendAnalyticEvent)[_sendAnalyticEvent]('banner_off');
	          };
	        }
	        const popup = babelHelpers.classPrivateFieldLooseBase(this, _getConnectPopup)[_getConnectPopup](options);
	        bannerPushOtp = new intranet_notifyBanner_pushOtp.PushOtp({
	          title: options.title,
	          text: options.text,
	          clickEnableBtn: () => {
	            popup.show();
	            babelHelpers.classPrivateFieldLooseBase(this, _sendAnalyticEvent)[_sendAnalyticEvent]('banner_on');
	          },
	          clickDisableBtn
	        });
	      }
	    }
	    return bannerPushOtp;
	  }
	}
	function _getConnectPopup2(options) {
	  const provider = new intranet_pushOtp_connectPopup.EnablePushOtpProvider(options);
	  return options.provideSmsOtp ? provider.full() : provider.onlyPushOtp();
	}
	function _sendAnalyticEvent2(cElement) {
	  ui_analytics.sendData({
	    tool: 'user_settings',
	    category: 'security',
	    event: 'click',
	    c_element: cElement
	  });
	}
	Object.defineProperty(BannerFactory, _sendAnalyticEvent, {
	  value: _sendAnalyticEvent2
	});
	Object.defineProperty(BannerFactory, _getConnectPopup, {
	  value: _getConnectPopup2
	});

	let _ = t => t,
	  _t,
	  _t2,
	  _t3;
	var _options = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("options");
	var _cache = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("cache");
	var _getEmailRestoreButton = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("getEmailRestoreButton");
	var _getPhoneRestoreButton = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("getPhoneRestoreButton");
	var _createSuccessContentByEmail = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("createSuccessContentByEmail");
	var _createSuccessContentByPhone = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("createSuccessContentByPhone");
	var _createErrorContent = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("createErrorContent");
	var _createPopup = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("createPopup");
	class RestoreNetworkPassword {
	  constructor(options) {
	    Object.defineProperty(this, _createPopup, {
	      value: _createPopup2
	    });
	    Object.defineProperty(this, _createErrorContent, {
	      value: _createErrorContent2
	    });
	    Object.defineProperty(this, _createSuccessContentByPhone, {
	      value: _createSuccessContentByPhone2
	    });
	    Object.defineProperty(this, _createSuccessContentByEmail, {
	      value: _createSuccessContentByEmail2
	    });
	    Object.defineProperty(this, _getPhoneRestoreButton, {
	      value: _getPhoneRestoreButton2
	    });
	    Object.defineProperty(this, _getEmailRestoreButton, {
	      value: _getEmailRestoreButton2
	    });
	    Object.defineProperty(this, _options, {
	      writable: true,
	      value: void 0
	    });
	    Object.defineProperty(this, _cache, {
	      writable: true,
	      value: new main_core.Cache.MemoryCache()
	    });
	    babelHelpers.classPrivateFieldLooseBase(this, _options)[_options] = options;
	  }
	  renderTo(target) {
	    if (babelHelpers.classPrivateFieldLooseBase(this, _options)[_options].useEmail) {
	      babelHelpers.classPrivateFieldLooseBase(this, _getEmailRestoreButton)[_getEmailRestoreButton]().renderTo(target);
	    }
	    if (babelHelpers.classPrivateFieldLooseBase(this, _options)[_options].usePhone) {
	      babelHelpers.classPrivateFieldLooseBase(this, _getPhoneRestoreButton)[_getPhoneRestoreButton]().renderTo(target);
	    }
	  }
	}
	function _getEmailRestoreButton2() {
	  return babelHelpers.classPrivateFieldLooseBase(this, _cache)[_cache].remember('emailRestoreButton', () => {
	    return new ui_buttons.Button({
	      text: main_core.Loc.getMessage('INTRANET_USER_SECURITY_RESTORE_PASSWORD_BUTTON_EMAIL'),
	      style: ui_buttons.AirButtonStyle.OUTLINE,
	      useAirDesign: true,
	      onclick: button => {
	        button.setWaiting(true);
	        main_core.ajax.runAction('bitrix24.v2.Password.restoreByEmail', {
	          data: {
	            userId: babelHelpers.classPrivateFieldLooseBase(this, _options)[_options].userId
	          }
	        }).then(() => {
	          button.setWaiting(false);
	          babelHelpers.classPrivateFieldLooseBase(this, _createPopup)[_createPopup](babelHelpers.classPrivateFieldLooseBase(this, _createSuccessContentByEmail)[_createSuccessContentByEmail]()).show();
	        }).catch(response => {
	          button.setWaiting(false);
	          if (response.errors[0].message) {
	            babelHelpers.classPrivateFieldLooseBase(this, _createPopup)[_createPopup](babelHelpers.classPrivateFieldLooseBase(this, _createErrorContent)[_createErrorContent](response.errors[0].message)).show();
	          }
	        });
	      }
	    });
	  });
	}
	function _getPhoneRestoreButton2() {
	  return babelHelpers.classPrivateFieldLooseBase(this, _cache)[_cache].remember('phoneRestoreButton', () => {
	    return new ui_buttons.Button({
	      text: main_core.Loc.getMessage('INTRANET_USER_SECURITY_RESTORE_PASSWORD_BUTTON_PHONE'),
	      style: ui_buttons.AirButtonStyle.OUTLINE,
	      useAirDesign: true,
	      onclick: button => {
	        button.setWaiting(true);
	        main_core.ajax.runAction('bitrix24.v2.Password.restoreByPhone', {
	          data: {
	            userId: babelHelpers.classPrivateFieldLooseBase(this, _options)[_options].userId
	          }
	        }).then(() => {
	          button.setWaiting(false);
	          babelHelpers.classPrivateFieldLooseBase(this, _createPopup)[_createPopup](babelHelpers.classPrivateFieldLooseBase(this, _createSuccessContentByPhone)[_createSuccessContentByPhone]()).show();
	        }).catch(response => {
	          button.setWaiting(false);
	          if (response.errors[0].message) {
	            babelHelpers.classPrivateFieldLooseBase(this, _createPopup)[_createPopup](babelHelpers.classPrivateFieldLooseBase(this, _createErrorContent)[_createErrorContent](response.errors[0].message)).show();
	          }
	        });
	      }
	    });
	  });
	}
	function _createSuccessContentByEmail2() {
	  return main_core.Tag.render(_t || (_t = _`
			<div class="b24network-account-popup-inner">
				<div class="b24network-account-popup-title">
					${0}
				</div>
				<div class="b24network-account-popup-text">${0}</div>
				<div class="b24network-account-popup-text">${0}</div>
				<div class="b24network-account-popup-text">${0}</div>
			</div>
		`), main_core.Loc.getMessage('INTRANET_USER_SECURITY_RESTORE_PASSWORD_POPUP_TITLE_SUCCESS'), main_core.Loc.getMessage('INTRANET_USER_SECURITY_RESTORE_PASSWORD_POPUP_DESCRIPTION_BY_EMAIL_1'), main_core.Loc.getMessage('INTRANET_USER_SECURITY_RESTORE_PASSWORD_POPUP_DESCRIPTION_BY_EMAIL_2'), main_core.Loc.getMessage('INTRANET_USER_SECURITY_RESTORE_PASSWORD_POPUP_DESCRIPTION_BY_EMAIL_3'));
	}
	function _createSuccessContentByPhone2() {
	  return main_core.Tag.render(_t2 || (_t2 = _`
			<div class="b24network-account-popup-inner">
				<div class="b24network-account-popup-title">
					${0}
				</div>
				<div class="b24network-account-popup-text">${0}</div>
				<div class="b24network-account-popup-text">${0}</div>
				<div class="b24network-account-popup-text">${0}</div>
			</div>
		`), main_core.Loc.getMessage('INTRANET_USER_SECURITY_RESTORE_PASSWORD_POPUP_TITLE_SUCCESS'), main_core.Loc.getMessage('INTRANET_USER_SECURITY_RESTORE_PASSWORD_POPUP_DESCRIPTION_BY_PHONE_1'), main_core.Loc.getMessage('INTRANET_USER_SECURITY_RESTORE_PASSWORD_POPUP_DESCRIPTION_BY_PHONE_2'), main_core.Loc.getMessage('INTRANET_USER_SECURITY_RESTORE_PASSWORD_POPUP_DESCRIPTION_BY_PHONE_3'));
	}
	function _createErrorContent2(errorMessage) {
	  return main_core.Tag.render(_t3 || (_t3 = _`
			<div class="b24network-account-popup-inner">
				<div class="b24network-account-popup-title">
					${0}
				</div>
				<div class="b24network-account-popup-text">${0}</div>
			</div>
		`), main_core.Loc.getMessage('INTRANET_USER_SECURITY_RESTORE_PASSWORD_POPUP_TITLE_ERROR'), main_core.Text.encode(errorMessage));
	}
	function _createPopup2(content) {
	  const popup = new main_popup.Popup({
	    autoHide: true,
	    className: 'b24network-account-popup',
	    closeByEsc: true,
	    closeIcon: true,
	    content,
	    cacheable: false,
	    width: 450,
	    buttons: [new ui_buttons.CloseButton({
	      onclick() {
	        popup.close();
	      },
	      useAirDesign: true
	    })]
	  });
	  return popup;
	}

	exports.SecuritySection = SecuritySection;
	exports.BannerFactory = BannerFactory;
	exports.RestoreNetworkPassword = RestoreNetworkPassword;

}((this.BX.Intranet = this.BX.Intranet || {}),BX.UI.SidePanel,BX.UI,BX.SidePanel,BX.Intranet.NotifyBanner,BX.Intranet.PushOtp,BX.Intranet.PushOtp,BX.UI.Analytics,BX.UI,BX,BX.Main));
//# sourceMappingURL=script.js.map
