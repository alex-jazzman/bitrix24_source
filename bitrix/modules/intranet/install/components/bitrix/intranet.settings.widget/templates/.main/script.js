/* eslint-disable */
this.BX = this.BX || {};
(function (exports, main_core, ui_popupcomponentsmaker, main_core_events) {
	'use strict';

	var _templateObject$1, _templateObject2$1;
	function _classPrivateMethodInitSpec$1(e, a) { _checkPrivateRedeclaration$1(e, a), a.add(e); }
	function _classPrivateFieldInitSpec$1(e, t, a) { _checkPrivateRedeclaration$1(e, t), t.set(e, a); }
	function _checkPrivateRedeclaration$1(e, t) { if (t.has(e)) throw new TypeError("Cannot initialize the same private elements twice on an object"); }
	function _classPrivateFieldGet$1(s, a) { return s.get(_assertClassBrand$1(s, a)); }
	function _classPrivateFieldSet$1(s, a, r) { return s.set(_assertClassBrand$1(s, a), r), r; }
	function _assertClassBrand$1(e, t, n) { if ("function" == typeof e ? e === t : e.has(t)) return arguments.length < 3 ? t : n; throw new TypeError("Private element is not present on this object"); }
	var _companyId = /*#__PURE__*/new WeakMap();
	var _requisiteId = /*#__PURE__*/new WeakMap();
	var _isConnected = /*#__PURE__*/new WeakMap();
	var _isPublic = /*#__PURE__*/new WeakMap();
	var _publicUrl = /*#__PURE__*/new WeakMap();
	var _editUrl = /*#__PURE__*/new WeakMap();
	var _requisiteElement = /*#__PURE__*/new WeakMap();
	var _requisitesPopup = /*#__PURE__*/new WeakMap();
	var _requisiteButton = /*#__PURE__*/new WeakMap();
	var _RequisiteSection_brand = /*#__PURE__*/new WeakSet();
	class RequisiteSection extends main_core_events.EventEmitter {
	  constructor(_options) {
	    super();
	    _classPrivateMethodInitSpec$1(this, _RequisiteSection_brand);
	    _classPrivateFieldInitSpec$1(this, _companyId, void 0);
	    _classPrivateFieldInitSpec$1(this, _requisiteId, void 0);
	    _classPrivateFieldInitSpec$1(this, _isConnected, void 0);
	    _classPrivateFieldInitSpec$1(this, _isPublic, void 0);
	    _classPrivateFieldInitSpec$1(this, _publicUrl, void 0);
	    _classPrivateFieldInitSpec$1(this, _editUrl, void 0);
	    _classPrivateFieldInitSpec$1(this, _requisiteElement, void 0);
	    _classPrivateFieldInitSpec$1(this, _requisitesPopup, void 0);
	    _classPrivateFieldInitSpec$1(this, _requisiteButton, void 0);
	    if (_options) {
	      _assertClassBrand$1(_RequisiteSection_brand, this, _updateOptions).call(this, _options);
	      top.BX.addCustomEvent('onLocalStorageSet', params => {
	        var _params$key;
	        const eventName = (_params$key = params === null || params === void 0 ? void 0 : params.key) !== null && _params$key !== void 0 ? _params$key : null;
	        if (eventName === 'onCrmEntityUpdate' || eventName === 'onCrmEntityCreate' || eventName === 'BX.Crm.RequisiteSliderDetails:onSave') {
	          _assertClassBrand$1(_RequisiteSection_brand, this, _getRequisites).call(this).then(() => {
	            _assertClassBrand$1(_RequisiteSection_brand, this, _updateElement).call(this);
	          });
	        }
	      });
	    }
	  }
	  getElement() {
	    if (!_classPrivateFieldGet$1(_requisiteElement, this)) {
	      _classPrivateFieldSet$1(_requisiteElement, this, main_core.Tag.render(_templateObject$1 || (_templateObject$1 = babelHelpers.taggedTemplateLiteral(["\n\t\t\t\t<div class=\"intranet-settings-widget__business-card intranet-settings-widget_box\" data-testid=\"settings-widget-block-requisite\">\n\t\t\t\t\t<div class=\"intranet-settings-widget__business-card_head intranet-settings-widget_inner\">\n\t\t\t\t\t\t<div class=\"intranet-settings-widget_icon-box --gray\">\n\t\t\t\t\t\t\t<div class=\"ui-icon-set --customer-card-1\"></div>\n\t\t\t\t\t\t</div>\n\t\t\t\t\t\t<div class=\"intranet-settings-widget__title\" data-role=\"requisite-widget-title\">\n\t\t\t\t\t\t\t", "\n\t\t\t\t\t\t</div>\n\t\t\t\t\t\t<i class=\"ui-icon-set --help\" onclick=\"BX.Helper.show('redirect=detail&code=18213326')\"></i>\n\t\t\t\t\t</div>\n\n\t\t\t\t\t<div class=\"intranet-settings-widget__business-card_footer\">\n\t\t\t\t\t\t", "\n\t\t\t\t\t\t", "\n\t\t\t\t\t</div>\n\t\t\t\t</div>\n\t\t\t"])), _classPrivateFieldGet$1(_isConnected, this) ? main_core.Loc.getMessage('INTRANET_SETTINGS_WIDGET_SECTION_REQUISITE_SITE_TITLE') : main_core.Loc.getMessage('INTRANET_SETTINGS_WIDGET_SECTION_REQUISITE_TITLE'), _assertClassBrand$1(_RequisiteSection_brand, this, _getRequisiteButton).call(this).getContainer(), _classPrivateFieldGet$1(_companyId, this) ? _assertClassBrand$1(_RequisiteSection_brand, this, _getRequisiteSettingsButton).call(this) : ''));
	    }
	    return _classPrivateFieldGet$1(_requisiteElement, this);
	  }
	}
	function _updateOptions(options) {
	  var _options$companyId, _options$requisiteId;
	  _classPrivateFieldSet$1(_companyId, this, (_options$companyId = options.companyId) !== null && _options$companyId !== void 0 ? _options$companyId : 0);
	  _classPrivateFieldSet$1(_requisiteId, this, (_options$requisiteId = options.requisiteId) !== null && _options$requisiteId !== void 0 ? _options$requisiteId : 0);
	  _classPrivateFieldSet$1(_isConnected, this, main_core.Type.isBoolean(options.isConnected) ? options.isConnected : false);
	  _classPrivateFieldSet$1(_isPublic, this, main_core.Type.isBoolean(options.isPublic) ? options.isPublic : false);
	  _classPrivateFieldSet$1(_publicUrl, this, main_core.Type.isString(options.publicUrl) ? options.publicUrl : '');
	  _classPrivateFieldSet$1(_editUrl, this, main_core.Type.isString(options.editUrl) ? options.editUrl : '');
	}
	function _updateElement() {
	  const currentElement = this.getElement();
	  _classPrivateFieldSet$1(_requisiteElement, this, null);
	  _classPrivateFieldSet$1(_requisiteButton, this, null);
	  main_core.Dom.replace(currentElement, this.getElement());
	}
	function _getRequisiteSettingsButton() {
	  const onclickRequisitesSettings = () => {
	    _assertClassBrand$1(_RequisiteSection_brand, this, _getRequisitesPopup).call(this).show();
	  };
	  return main_core.Tag.render(_templateObject2$1 || (_templateObject2$1 = babelHelpers.taggedTemplateLiteral(["\n\t\t\t<span onclick=\"", "\" class=\"intranet-settings-widget__requisite-btn\">\n\t\t\t\t<i class='ui-icon-set --more-information'></i>\n\t\t\t</span>\n\t\t"])), onclickRequisitesSettings);
	}
	function _getRequisitesPopup() {
	  if (!_classPrivateFieldGet$1(_requisitesPopup, this)) {
	    const onclickCopyLink = () => {
	      if (BX.clipboard.copy(_classPrivateFieldGet$1(_publicUrl, this))) {
	        BX.UI.Notification.Center.notify({
	          content: main_core.Loc.getMessage('INTRANET_SETTINGS_WIDGET_COPIED_POPUP'),
	          position: 'top-left',
	          autoHideDelay: 3000
	        });
	      }
	    };
	    const onclickConfigureSite = () => {
	      window.open(_classPrivateFieldGet$1(_editUrl, this), '_blank');
	      _classPrivateFieldGet$1(_requisitesPopup, this).close();
	      SettingsWidget.close();
	    };
	    let copyLinkButton = null;
	    if (_classPrivateFieldGet$1(_publicUrl, this)) {
	      copyLinkButton = {
	        html: "\n\t\t\t\t\t\t\t<div class=\"intranet-settings-widget__popup-item\">\n\t\t\t\t\t\t\t\t<div class=\"ui-icon-set --link-3\"></div> \n\t\t\t\t\t\t\t\t<div class=\"intranet-settings-widget__popup-name\">".concat(main_core.Loc.getMessage('INTRANET_SETTINGS_WIDGET_COPY_LINK_BUTTON'), "</div>\n\t\t\t\t\t\t\t</div>\n\t\t\t\t\t\t"),
	        onclick: onclickCopyLink
	      };
	    }
	    let configureSiteButton = null;
	    if (_classPrivateFieldGet$1(_editUrl, this)) {
	      configureSiteButton = {
	        html: "\n\t\t\t\t\t\t\t<div class=\"intranet-settings-widget__popup-item\">\n\t\t\t\t\t\t\t\t<div class=\"ui-icon-set --paint-1\"></div> \n\t\t\t\t\t\t\t\t<div class=\"intranet-settings-widget__popup-name\">".concat(main_core.Loc.getMessage('INTRANET_SETTINGS_CONFIGURE_CUTAWAY_SITE_BUTTON'), "</div>\n\t\t\t\t\t\t\t</div>\n\t\t\t\t\t\t"),
	        onclick: onclickConfigureSite
	      };
	    }
	    const onclickConfigureRequisites = () => {
	      if (_classPrivateFieldGet$1(_requisitesPopup, this)) {
	        _classPrivateFieldGet$1(_requisitesPopup, this).close();
	      }
	      SettingsWidget.close();
	      BX.SidePanel.Instance.open("/crm/company/details/".concat(_classPrivateFieldGet$1(_companyId, this), "/?init_mode=edit&rqedit=y"));
	    };
	    const configureRequisiteButton = {
	      html: "\n\t\t\t\t\t\t<div class=\"intranet-settings-widget__popup-item\">\n\t\t\t\t\t\t\t<div class=\"ui-icon-set --pencil-40\"></div>\n\t\t\t\t\t\t\t<div class=\"intranet-settings-widget__popup-name\">".concat(main_core.Loc.getMessage('INTRANET_SETTINGS_CONFIGURE_REQUISITE_BUTTON'), "</div>\n\t\t\t\t\t\t</div>\n\t\t\t\t\t"),
	      onclick: onclickConfigureRequisites
	    };
	    const popupWidth = 240;
	    _classPrivateFieldSet$1(_requisitesPopup, this, BX.PopupMenu.create('requisites-settings', event.currentTarget, [copyLinkButton, configureRequisiteButton, configureSiteButton], {
	      closeByEsc: true,
	      autoHide: true,
	      width: popupWidth,
	      offsetLeft: -72,
	      angle: {
	        offset: popupWidth / 2 - 15
	      },
	      events: {
	        onShow: () => {
	          setTimeout(() => {
	            main_core.Event.bindOnce(SettingsWidget.getInstance().getWidget().getPopup().getPopupContainer(), 'click', () => {
	              _classPrivateFieldGet$1(_requisitesPopup, this).close();
	            });
	          }, 0);
	        }
	      }
	    }));
	  }
	  return _classPrivateFieldGet$1(_requisitesPopup, this);
	}
	function _getButtonText() {
	  if (_classPrivateFieldGet$1(_isConnected, this)) {
	    return main_core.Loc.getMessage('INTRANET_SETTINGS_WIDGET_REDIRECT_TO_REQUISITE_BUTTON');
	  }
	  if (_classPrivateFieldGet$1(_companyId, this) > 0 && _classPrivateFieldGet$1(_requisiteId, this) > 0) {
	    return main_core.Loc.getMessage('INTRANET_SETTINGS_WIDGET_CREATE_LANDING');
	  }
	  return main_core.Loc.getMessage('INTRANET_SETTINGS_CONFIGURE_REQUISITE_BUTTON');
	}
	function _getRequisiteButton() {
	  if (!_classPrivateFieldGet$1(_requisiteButton, this)) {
	    _classPrivateFieldSet$1(_requisiteButton, this, new BX.UI.Button({
	      id: 'requisite-btn',
	      text: _assertClassBrand$1(_RequisiteSection_brand, this, _getButtonText).call(this),
	      noCaps: true,
	      onclick: _assertClassBrand$1(_RequisiteSection_brand, this, _handleButtonOnclick).bind(this),
	      className: 'ui-btn ui-btn-light-border ui-btn-round ui-btn-xs ui-btn-no-caps intranet-setting__btn-light'
	    }));
	  }
	  return _classPrivateFieldGet$1(_requisiteButton, this);
	}
	function _handleButtonOnclick() {
	  if (_classPrivateFieldGet$1(_isConnected, this)) {
	    _assertClassBrand$1(_RequisiteSection_brand, this, _handleOpenRequisite).call(this);
	  } else if (_classPrivateFieldGet$1(_companyId, this) > 0) {
	    if (_classPrivateFieldGet$1(_requisiteId, this) > 0) {
	      _assertClassBrand$1(_RequisiteSection_brand, this, _handleCreateLanding).call(this);
	    } else {
	      _assertClassBrand$1(_RequisiteSection_brand, this, _handleEditRequisite).call(this);
	    }
	  } else {
	    _assertClassBrand$1(_RequisiteSection_brand, this, _handleCreateCompany).call(this);
	  }
	}
	function _handleOpenRequisite() {
	  SettingsWidget.close();
	  window.open(_classPrivateFieldGet$1(_publicUrl, this), '_blank');
	}
	function _handleCreateLanding() {
	  _assertClassBrand$1(_RequisiteSection_brand, this, _getRequisiteButton).call(this).setWaiting(true);
	  _assertClassBrand$1(_RequisiteSection_brand, this, _createLanding).call(this).then(() => {
	    _classPrivateFieldSet$1(_requisitesPopup, this, null);
	    _classPrivateFieldSet$1(_requisiteButton, this, null);
	    _assertClassBrand$1(_RequisiteSection_brand, this, _updateElement).call(this);
	    if (!_classPrivateFieldGet$1(_isPublic, this)) {
	      const errorPopup = new Popup('public-landing-error', this.getElement().querySelector('[data-role="requisite-widget-title"]'), {
	        autoHide: true,
	        closeByEsc: true,
	        angle: true,
	        darkMode: true,
	        content: main_core.Loc.getMessage('INTRANET_SETTINGS_WIDGET_CREATE_LANDING_ERROR'),
	        events: {
	          onShow: () => {
	            setTimeout(() => {
	              main_core.Event.bindOnce(SettingsWidget.getInstance().getWidget().getPopup().getPopupContainer(), 'click', () => {
	                errorPopup.close();
	              });
	            }, 0);
	          },
	          onClose: () => {
	            errorPopup.destroy();
	          }
	        }
	      });
	      errorPopup.show();
	    }
	  });
	}
	function _createLanding() {
	  return new Promise(resolve => {
	    main_core.ajax.runComponentAction('bitrix:intranet.settings.widget', 'createRequisiteLanding', {
	      mode: 'class'
	    }).then(_ref => {
	      let {
	        data: {
	          isConnected,
	          isPublic,
	          publicUrl,
	          editUrl
	        }
	      } = _ref;
	      _classPrivateFieldSet$1(_isConnected, this, isConnected);
	      _classPrivateFieldSet$1(_isPublic, this, isPublic);
	      _classPrivateFieldSet$1(_publicUrl, this, publicUrl);
	      _classPrivateFieldSet$1(_editUrl, this, editUrl);
	      resolve();
	    });
	  });
	}
	function _handleEditRequisite() {
	  SettingsWidget.close();
	  BX.SidePanel.Instance.open("/crm/company/details/".concat(_classPrivateFieldGet$1(_companyId, this), "/?init_mode=edit&rqedit=y"));
	}
	function _handleCreateCompany() {
	  SettingsWidget.close();
	  BX.SidePanel.Instance.open('/crm/company/details/0/?mycompany=y&rqedit=y');
	}
	function _getRequisites() {
	  return new Promise(resolve => {
	    main_core.ajax.runComponentAction('bitrix:intranet.settings.widget', 'getRequisites', {
	      mode: 'class'
	    }).then(_ref2 => {
	      let {
	        data: {
	          requisite
	        }
	      } = _ref2;
	      _assertClassBrand$1(_RequisiteSection_brand, this, _updateOptions).call(this, requisite);
	      resolve();
	    });
	  });
	}

	var _templateObject, _templateObject2, _templateObject3, _templateObject4, _templateObject5, _templateObject6, _templateObject7, _templateObject8, _templateObject9, _templateObject0, _templateObject1, _templateObject10, _templateObject11, _templateObject12;
	function _classPrivateMethodInitSpec(e, a) { _checkPrivateRedeclaration(e, a), a.add(e); }
	function _classPrivateFieldInitSpec(e, t, a) { _checkPrivateRedeclaration(e, t), t.set(e, a); }
	function _checkPrivateRedeclaration(e, t) { if (t.has(e)) throw new TypeError("Cannot initialize the same private elements twice on an object"); }
	function _classPrivateFieldGet(s, a) { return s.get(_assertClassBrand(s, a)); }
	function _classPrivateFieldSet(s, a, r) { return s.set(_assertClassBrand(s, a), r), r; }
	function _assertClassBrand(e, t, n) { if ("function" == typeof e ? e === t : e.has(t)) return arguments.length < 3 ? t : n; throw new TypeError("Private element is not present on this object"); }
	var _widgetPopup = /*#__PURE__*/new WeakMap();
	var _target = /*#__PURE__*/new WeakMap();
	var _otp = /*#__PURE__*/new WeakMap();
	var _marketUrl = /*#__PURE__*/new WeakMap();
	var _theme = /*#__PURE__*/new WeakMap();
	var _holding = /*#__PURE__*/new WeakMap();
	var _holdingWidget = /*#__PURE__*/new WeakMap();
	var _isBitrix = /*#__PURE__*/new WeakMap();
	var _isFreeLicense = /*#__PURE__*/new WeakMap();
	var _isAdmin = /*#__PURE__*/new WeakMap();
	var _requisite = /*#__PURE__*/new WeakMap();
	var _requisiteSection = /*#__PURE__*/new WeakMap();
	var _settingsUrl = /*#__PURE__*/new WeakMap();
	var _isRenameable = /*#__PURE__*/new WeakMap();
	var _mainPage = /*#__PURE__*/new WeakMap();
	var _SettingsWidget_brand = /*#__PURE__*/new WeakSet();
	class SettingsWidget extends main_core_events.EventEmitter {
	  constructor(_options) {
	    super();
	    _classPrivateMethodInitSpec(this, _SettingsWidget_brand);
	    _classPrivateFieldInitSpec(this, _widgetPopup, void 0);
	    _classPrivateFieldInitSpec(this, _target, void 0);
	    _classPrivateFieldInitSpec(this, _otp, void 0);
	    _classPrivateFieldInitSpec(this, _marketUrl, void 0);
	    _classPrivateFieldInitSpec(this, _theme, void 0);
	    _classPrivateFieldInitSpec(this, _holding, null);
	    _classPrivateFieldInitSpec(this, _holdingWidget, void 0);
	    _classPrivateFieldInitSpec(this, _isBitrix, false);
	    _classPrivateFieldInitSpec(this, _isFreeLicense, false);
	    _classPrivateFieldInitSpec(this, _isAdmin, void 0);
	    _classPrivateFieldInitSpec(this, _requisite, void 0);
	    _classPrivateFieldInitSpec(this, _requisiteSection, void 0);
	    _classPrivateFieldInitSpec(this, _settingsUrl, void 0);
	    _classPrivateFieldInitSpec(this, _isRenameable, void 0);
	    _classPrivateFieldInitSpec(this, _mainPage, void 0);
	    this.setEventNamespace('BX.Intranet.SettingsWidget');
	    _classPrivateFieldSet(_marketUrl, this, _options.marketUrl);
	    _classPrivateFieldSet(_isBitrix, this, _options.isBitrix24);
	    _classPrivateFieldSet(_isFreeLicense, this, _options.isFreeLicense);
	    _classPrivateFieldSet(_isAdmin, this, _options.isAdmin);
	    _classPrivateFieldSet(_requisite, this, _options.requisite);
	    _classPrivateFieldSet(_settingsUrl, this, _options.settingsPath);
	    _classPrivateFieldSet(_isRenameable, this, _options.isRenameable);
	    _classPrivateFieldSet(_mainPage, this, _options.mainPage);
	    _classPrivateFieldSet(_requisiteSection, this, new RequisiteSection(_options.requisite));
	    _assertClassBrand(_SettingsWidget_brand, this, _setOptions).call(this, _options);
	  }
	  setTarget(target) {
	    _classPrivateFieldSet(_target, this, target);
	    return this;
	  }
	  setWidgetLoader(widgetLoader) {
	    _classPrivateFieldSet(_widgetPopup, this, new ui_popupcomponentsmaker.PopupComponentsMaker({
	      width: 374,
	      popupLoader: widgetLoader.getPopup(),
	      useAngle: false
	    }));
	    _classPrivateFieldGet(_widgetPopup, this).getPopup().subscribe('onClose', () => {
	      main_core.Event.unbindAll(this.getWidget().getPopup().getPopupContainer(), 'click');
	      _assertClassBrand(_SettingsWidget_brand, this, _updateAriaExpanded).call(this, false);
	    });
	    widgetLoader.clearBeforeInsertContent();
	    _assertClassBrand(_SettingsWidget_brand, this, _getItemsList).call(this).then(() => {
	      _assertClassBrand(_SettingsWidget_brand, this, _drawItemsList).call(this);
	    });
	    return this;
	  }
	  static bindWidget(widgetLoader) {
	    const instance = this.getInstance();
	    if (instance) {
	      instance.setWidgetLoader(widgetLoader);
	    }
	    return instance;
	  }
	  static bindAndShow(button) {
	    const instance = this.getInstance();
	    if (instance) {
	      main_core.Event.unbindAll(button);
	      main_core.Event.bind(button, 'click', instance.toggle.bind(instance, button));
	      instance.show(button);
	    }
	    return instance;
	  }
	  static init(options) {
	    if (_assertClassBrand(SettingsWidget, this, _instance)._ === null) {
	      _instance._ = _assertClassBrand(SettingsWidget, this, new this(options));
	    }
	    return _assertClassBrand(SettingsWidget, this, _instance)._;
	  }
	  static getInstance() {
	    return _assertClassBrand(SettingsWidget, this, _instance)._;
	  }
	  static close() {
	    const instance = this.getInstance();
	    if (instance) {
	      instance.getWidget().close();
	    }
	  }
	  toggle(targetNode) {
	    const popup = this.getWidget().getPopup();
	    if (popup.isShown()) {
	      popup.close();
	      _assertClassBrand(_SettingsWidget_brand, this, _updateAriaExpanded).call(this, false);
	    } else {
	      this.show(targetNode);
	    }
	  }
	  show(targetNode) {
	    const popup = this.getWidget().getPopup();
	    popup.setBindElement(targetNode);
	    popup.show();
	    if (popup.getPopupContainer().getBoundingClientRect().left < 30) {
	      main_core.Dom.style(popup.getPopupContainer(), {
	        left: '30px'
	      });
	    }
	    this.setTarget(targetNode);
	    _assertClassBrand(_SettingsWidget_brand, this, _updateAriaExpanded).call(this, true);
	  }
	  getWidget() {
	    return _classPrivateFieldGet(_widgetPopup, this);
	  }
	}
	function _setOptions(options) {
	  options.theme ? _classPrivateFieldSet(_theme, this, options.theme) : null;
	  options.otp ? _classPrivateFieldSet(_otp, this, options.otp) : null;
	  options.holding ? _assertClassBrand(_SettingsWidget_brand, this, _setHoldingOptions).call(this, options.holding) : null;
	}
	function _setHoldingOptions(options) {
	  var _options$isHolding, _options$affiliate, _options$canBeHolding, _options$canBeAffilia;
	  if (!main_core.Type.isPlainObject(options)) {
	    _classPrivateFieldSet(_holding, this, null);
	    return;
	  }
	  _classPrivateFieldSet(_holding, this, {
	    isHolding: (_options$isHolding = options.isHolding) !== null && _options$isHolding !== void 0 ? _options$isHolding : false,
	    affiliate: (_options$affiliate = options.affiliate) !== null && _options$affiliate !== void 0 ? _options$affiliate : null,
	    canBeHolding: (_options$canBeHolding = options.canBeHolding) !== null && _options$canBeHolding !== void 0 ? _options$canBeHolding : false,
	    canBeAffiliate: (_options$canBeAffilia = options.canBeAffiliate) !== null && _options$canBeAffilia !== void 0 ? _options$canBeAffilia : false
	  });
	}
	function _getItemsList() {
	  let reload = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : false;
	  if (reload === true || typeof _classPrivateFieldGet(_theme, this) === 'undefined') {
	    return new Promise(resolve => {
	      main_core.ajax.runComponentAction('bitrix:intranet.settings.widget', 'getData', {
	        mode: 'class'
	      }).then(_ref => {
	        let {
	          data: {
	            theme,
	            otp,
	            holding
	          }
	        } = _ref;
	        _classPrivateFieldSet(_theme, this, theme);
	        _classPrivateFieldSet(_otp, this, otp);
	        _assertClassBrand(_SettingsWidget_brand, this, _setHoldingOptions).call(this, holding);
	        resolve();
	      });
	    });
	  }
	  return Promise.resolve();
	}
	function _drawItemsList() {
	  const container = this.getWidget().getPopup().getPopupContainer();
	  main_core.Dom.append(_assertClassBrand(_SettingsWidget_brand, this, _getHeader).call(this), container);
	  const content = [_classPrivateFieldGet(_requisite, this) && _classPrivateFieldGet(_isAdmin, this) ? _assertClassBrand(_SettingsWidget_brand, this, _getRequisitesElement).call(this) : null, _classPrivateFieldGet(_mainPage, this).isAvailable ? _assertClassBrand(_SettingsWidget_brand, this, _getMainPageElement).call(this) : null, _classPrivateFieldGet(_isAdmin, this) ? _assertClassBrand(_SettingsWidget_brand, this, _getSecurityAndSettingsElement).call(this) : null, _classPrivateFieldGet(_isBitrix, this) ? _assertClassBrand(_SettingsWidget_brand, this, _getHoldingsElement).call(this) : null, _assertClassBrand(_SettingsWidget_brand, this, _getMigrateElement).call(this)];
	  content.forEach(element => {
	    main_core.Dom.append(element, container);
	  });
	  main_core.Dom.append(_assertClassBrand(_SettingsWidget_brand, this, _getFooter).call(this), container);
	}
	function _getLinkHeaderIcon() {
	  const onclickCopyLink = () => {
	    if (BX.clipboard.copy(window.location.origin)) {
	      BX.UI.Notification.Center.notify({
	        content: main_core.Loc.getMessage('INTRANET_SETTINGS_WIDGET_LINK_COPIED_POPUP'),
	        position: 'top-left',
	        autoHideDelay: 3000
	      });
	    }
	  };
	  return main_core.Tag.render(_templateObject || (_templateObject = babelHelpers.taggedTemplateLiteral(["<span class='ui-icon-set --link-3 intranet-settings-widget__header-btn' onclick=\"", "\"></span>"])), onclickCopyLink);
	}
	function _getEditHeaderIcon() {
	  const onclickEditLink = () => {
	    this.getWidget().close();
	    BX.SidePanel.Instance.open(_classPrivateFieldGet(_settingsUrl, this) + '?analyticContext=widget_settings_settings&page=portal&option=subDomainName');
	  };
	  return main_core.Tag.render(_templateObject2 || (_templateObject2 = babelHelpers.taggedTemplateLiteral(["<span class='ui-icon-set --pencil-40 intranet-settings-widget__header-btn' onclick=\"", "\"></span>"])), onclickEditLink);
	}
	function _getHeader() {
	  const header = main_core.Tag.render(_templateObject3 || (_templateObject3 = babelHelpers.taggedTemplateLiteral(["\n\t\t\t\t<div class=\"intranet-settings-widget__header\">\n\t\t\t\t\t<div class=\"intranet-settings-widget__header_inner\">\n\t\t\t\t\t\t<span class=\"intranet-settings-widget__header-name\">", "</span>\n\t\t\t\t\t\t", "\n\t\t\t\t\t</div>\n\t\t\t\t</div>\n\t\t\t"])), window.location.host, _classPrivateFieldGet(_isRenameable, this) ? _assertClassBrand(_SettingsWidget_brand, this, _getEditHeaderIcon).call(this) : _assertClassBrand(_SettingsWidget_brand, this, _getLinkHeaderIcon).call(this));
	  _assertClassBrand(_SettingsWidget_brand, this, _applyTheme).call(this, header, _classPrivateFieldGet(_theme, this));
	  const adaptedEmptyHeader = new ui_popupcomponentsmaker.PopupComponentsMakerItem({
	    withoutBackground: true,
	    html: header
	  }).getContainer();
	  main_core.Dom.addClass(adaptedEmptyHeader, '--widget-header');
	  main_core_events.EventEmitter.subscribe('BX.Intranet.Bitrix24:ThemePicker:onThemeApply', _ref2 => {
	    let {
	      data: {
	        theme
	      }
	    } = _ref2;
	    _assertClassBrand(_SettingsWidget_brand, this, _applyTheme).call(this, header, theme);
	  });
	  return adaptedEmptyHeader;
	}
	function _applyTheme(container, theme) {
	  const previewImage = "url('".concat(main_core.Text.encode(theme.previewImage), "')");
	  main_core.Dom.style(container, 'backgroundImage', previewImage);
	  main_core.Dom.removeClass(container, 'bitrix24-dark-theme bitrix24-light-theme');
	  const themeClass = String(theme.id).indexOf('dark:') === 0 ? 'bitrix24-dark-theme' : 'bitrix24-light-theme';
	  main_core.Dom.addClass(container, themeClass);
	}
	function _getFooter() {
	  const onclickOpenPartnerOrder = () => {
	    this.getWidget().close();
	    BX.UI.InfoHelper.show('info_implementation_request');
	  };
	  const partnerOrder = main_core.Tag.render(_templateObject4 || (_templateObject4 = babelHelpers.taggedTemplateLiteral(["\n\t\t\t<span class=\"intranet-settings-widget__footer-item\" onclick=\"", "\">\n\t\t\t\t", "\n\t\t\t</span>\n\t\t"])), onclickOpenPartnerOrder, main_core.Loc.getMessage('INTRANET_SETTINGS_WIDGET_ORDER_PARTNER_LINK_MSGVER_1'));
	  const onclickWhereToBegin = () => {
	    if (top.BX.Helper) {
	      this.getWidget().close();
	      top.BX.Helper.show('redirect=detail&code=18371844');
	    }
	  };
	  const onclickSupport = () => {
	    if (top.BX.Helper) {
	      this.getWidget().close();
	      if (_classPrivateFieldGet(_isFreeLicense, this)) {
	        BX.UI.InfoHelper.show('limit_support_bitrix');
	      } else {
	        BX.Helper.show('redirect=detail&code=12925062');
	      }
	    }
	  };
	  return main_core.Tag.render(_templateObject5 || (_templateObject5 = babelHelpers.taggedTemplateLiteral(["\n\t\t\t\t<div class=\"intranet-settings-widget__footer\">\n\t\t\t\t\t", "\n\t\t\t\t\t<span class=\"intranet-settings-widget__footer-item\" onclick=\"", "\">\n\t\t\t\t\t\t", "\n\t\t\t\t\t</span>\n\t\t\t\t\t<span class=\"intranet-settings-widget__footer-item\" onclick=\"", "\">\n\t\t\t\t\t\t", "\n\t\t\t\t\t</span>\n\t\t\t\t</div>\n\t\t\t"])), _classPrivateFieldGet(_isBitrix, this) ? partnerOrder : '', onclickWhereToBegin, main_core.Loc.getMessage('INTRANET_SETTINGS_WIDGET_WHERE_TO_BEGIN_LINK'), onclickSupport, main_core.Loc.getMessage('INTRANET_SETTINGS_WIDGET_SUPPORT_BUTTON'));
	}
	function _prepareElement(element) {
	  const item = this.getWidget().getItem({
	    html: element
	  });
	  const node = item.getContainer();
	  main_core.Dom.addClass(node, '--widget-item');
	  return node;
	}
	function _getMainPageElement() {
	  const onclick = () => {
	    this.getWidget().close();
	    BX.SidePanel.Instance.open(_classPrivateFieldGet(_mainPage, this).settingsPath);
	    // todo: add vibe analytic context sub_section = from_widget_vibe_point
	  };
	  const element = main_core.Tag.render(_templateObject6 || (_templateObject6 = babelHelpers.taggedTemplateLiteral(["\n\t\t\t<div onclick=\"", "\" class=\"intranet-settings-widget_box --clickable\" data-testid=\"settings-widget-block-main-page\">\n\t\t\t\t<div class=\"intranet-settings-widget_inner\">\n\t\t\t\t\t<div class=\"intranet-settings-widget_icon-box --green\">\n\t\t\t\t\t\t<div class=\"ui-icon-set --home-page\"></div>\n\t\t\t\t\t</div>\n\t\t\t\t\t<div class=\"intranet-settings-widget__title\">\n\t\t\t\t\t\t", "\n\t\t\t\t\t</div>\n\t\t\t\t</div>\n\t\t\t\t<div class=\"intranet-settings-widget__arrow-btn ui-icon-set --arrow-right\"></div>\n\t\t\t</div>\n\t\t"])), onclick, main_core.Loc.getMessage('INTRANET_SETTINGS_WIDGET_WELCOME_PAGE_TITLE'));
	  return _assertClassBrand(_SettingsWidget_brand, this, _prepareElement).call(this, element);
	}
	function _getRequisitesElement() {
	  return _assertClassBrand(_SettingsWidget_brand, this, _prepareElement).call(this, _classPrivateFieldGet(_requisiteSection, this).getElement());
	}
	function _getHoldingsElement() {
	  if (_classPrivateFieldGet(_isBitrix, this) !== true || _classPrivateFieldGet(_holding, this) === null) {
	    return null;
	  }
	  if (!main_core.Type.isPlainObject(_classPrivateFieldGet(_holding, this).affiliate)) {
	    return _assertClassBrand(_SettingsWidget_brand, this, _getEmptyHoldingsElement).call(this);
	  }
	  const affiliate = _classPrivateFieldGet(_holding, this).affiliate;
	  const onclickOpen = () => {
	    this.getWidget().close();
	    _assertClassBrand(_SettingsWidget_brand, this, _getHoldingWidget).call(this).show(_classPrivateFieldGet(_target, this));
	  };
	  const element = main_core.Tag.render(_templateObject7 || (_templateObject7 = babelHelpers.taggedTemplateLiteral(["\n\t\t<div class=\"intranet-settings-widget__branch\" onclick=\"", "\">\n\t\t\t<div class=\"intranet-settings-widget__branch-icon_box\">\n\t\t\t\t<div class=\"ui-icon-set intranet-settings-widget__branch-icon --filial-network\"></div>\n\t\t\t</div>\n\t\t\t<div class=\"intranet-settings-widget__branch_content\">\n\t\t\t\t<div class=\"intranet-settings-widget__branch-title\">\n\t\t\t\t\t", "\n\t\t\t\t</div>\n\t\t\t\t<div class=\"intranet-settings-widget__title\">\n\t\t\t\t\t", "\n\t\t\t\t</div>\n\t\t\t</div>\n\t\t\t<div class=\"intranet-settings-widget__branch-btn_box\">\n\t\t\t\t<button class=\"ui-btn ui-btn-light-border ui-btn-round ui-btn-xs ui-btn-no-caps intranet-setting__btn-light\">\n\t\t\t\t\t", "\n\t\t\t\t</button>\n\t\t\t</div>\n\t\t</div>\n\t\t"])), onclickOpen, affiliate.isHolding ? main_core.Loc.getMessage('INTRANET_SETTINGS_WIDGET_MAIN_BRANCH') : main_core.Loc.getMessage('INTRANET_SETTINGS_WIDGET_SECONDARY_BRANCH'), affiliate.name, main_core.Loc.getMessage('INTRANET_SETTINGS_WIDGET_BRANCHES'));
	  return _assertClassBrand(_SettingsWidget_brand, this, _prepareElement).call(this, element);
	}
	function _getHoldingWidget() {
	  if (!_classPrivateFieldGet(_holdingWidget, this)) {
	    _classPrivateFieldSet(_holdingWidget, this, BX.Intranet.HoldingWidget.getInstance());
	    const onclickClose = () => {
	      _classPrivateFieldGet(_holdingWidget, this).getWidget().close();
	      this.show();
	    };
	    const holdingWidgetCloseBtn = main_core.Tag.render(_templateObject8 || (_templateObject8 = babelHelpers.taggedTemplateLiteral(["\n\t\t\t\t<div class=\"intranet-settings-widget__close-btn\">\n\t\t\t\t\t<div onclick=\"", "\" class=\"ui-icon-set --arrow-left intranet-settings-widget__close-btn_icon\"></div>\n\t\t\t\t\t<div class=\"intranet-settings-widget__close-btn_name\">", "</div>\n\t\t\t\t</div>\n\t\t\t"])), onclickClose, main_core.Loc.getMessage('INTRANET_SETTINGS_WIDGET_BRANCH_LIST'));
	    _classPrivateFieldGet(_holdingWidget, this).getWidget().getPopup().getContentContainer().prepend(holdingWidgetCloseBtn);
	  }
	  return _classPrivateFieldGet(_holdingWidget, this);
	}
	function _getEmptyHoldingsElement() {
	  if (!main_core.Type.isPlainObject(_classPrivateFieldGet(_holding, this))) {
	    return null;
	  }
	  const title = _classPrivateFieldGet(_isAdmin, this) ? main_core.Loc.getMessage('INTRANET_SETTINGS_WIDGET_FILIAL_NETWORK') : main_core.Loc.getMessage('INTRANET_SETTINGS_WIDGET_FILIAL_NETWORK_UNAVAILABLE');
	  const buttonText = _classPrivateFieldGet(_isAdmin, this) ? main_core.Loc.getMessage('INTRANET_SETTINGS_WIDGET_FILIAL_SETTINGS') : main_core.Loc.getMessage('INTRANET_SETTINGS_WIDGET_FILIAL_ABOUT');
	  const onclickOpen = () => {
	    this.getWidget().close();
	    if (_classPrivateFieldGet(_holding, this).canBeHolding) {
	      _assertClassBrand(_SettingsWidget_brand, this, _getHoldingWidget).call(this).show(_classPrivateFieldGet(_target, this));
	    } else {
	      BX.UI.InfoHelper.show('limit_office_multiple_branches');
	    }
	  };
	  const lockIcon = main_core.Tag.render(_templateObject9 || (_templateObject9 = babelHelpers.taggedTemplateLiteral(["\n\t\t\t<div class=\"intranet-settings-widget__branch-lock-icon_box\">\n\t\t\t\t<div class=\"ui-icon-set intranet-settings-widget__branch-lock-icon --lock\"></div>\n\t\t\t</div>\n\t\t"])));
	  const element = main_core.Tag.render(_templateObject0 || (_templateObject0 = babelHelpers.taggedTemplateLiteral(["\n\t\t\t<div class=\"intranet-settings-widget__branch\" onclick=\"", "\" data-testid=\"settings-widget-block-filial-network\">\n\t\t\t\t<div class=\"intranet-settings-widget__branch-icon_box\">\n\t\t\t\t\t<div class=\"ui-icon-set intranet-settings-widget__branch-icon --filial-network\"></div>\n\t\t\t\t\t", "\n\t\t\t\t</div>\n\t\t\t\t<div class=\"intranet-settings-widget__branch_content\">\n\t\t\t\t\t<div class=\"intranet-settings-widget__title\">", "</div>\n\t\t\t\t</div>\n\t\t\t\t<div class=\"intranet-settings-widget__branch-btn_box\">\n\t\t\t\t\t<button class=\"ui-btn ui-btn-light-border ui-btn-round ui-btn-xs ui-btn-no-caps intranet-setting__btn-light\">", "</button>\n\t\t\t\t</div>\n\t\t\t</div>\n\t\t"])), onclickOpen, !_classPrivateFieldGet(_holding, this).canBeHolding ? lockIcon : '', title, buttonText);
	  return _assertClassBrand(_SettingsWidget_brand, this, _prepareElement).call(this, element);
	}
	function _getSecurityAndSettingsElement() {
	  return main_core.Tag.render(_templateObject1 || (_templateObject1 = babelHelpers.taggedTemplateLiteral(["\n\t\t\t<div class=\"intranet-settings-widget_inline-box\">\n\t\t\t\t", "\n\t\t\t\t", "\n\t\t\t</div>\n\t\t"])), _assertClassBrand(_SettingsWidget_brand, this, _getSecurityElement).call(this), _assertClassBrand(_SettingsWidget_brand, this, _getGeneralSettingsElement).call(this));
	}
	function _getSecurityElement() {
	  const onclick = () => {
	    this.getWidget().close();
	    BX.SidePanel.Instance.open(_classPrivateFieldGet(_settingsUrl, this) + '?page=security&analyticContext=widget_settings_settings');
	  };
	  const element = main_core.Tag.render(_templateObject10 || (_templateObject10 = babelHelpers.taggedTemplateLiteral(["\n\t\t\t<span onclick=\"", "\" class=\"intranet-settings-widget_box --clickable\" data-testid=\"settings-widget-block-security\">\n\t\t\t\t<div class=\"intranet-settings-widget_inner\">\n\t\t\t\t\t<div class=\"intranet-settings-widget_icon-box ", "\">\n\t\t\t\t\t\t<div class=\"ui-icon-set --shield\"></div>\n\t\t\t\t\t</div>\n\t\t\t\t\t<div class=\"intranet-settings-widget__title\">\n\t\t\t\t\t\t", "\n\t\t\t\t\t</div>\n\t\t\t\t</div>\n\t\t\t\t<div class=\"intranet-settings-widget__arrow-btn ui-icon-set --arrow-right\"></div>\n\t\t\t</span>\n\t\t"])), onclick, _classPrivateFieldGet(_otp, this).IS_ACTIVE === 'Y' ? '--green' : '--yellow', main_core.Loc.getMessage('INTRANET_SETTINGS_WIDGET_SECTION_SECURITY_TITLE'));
	  return _assertClassBrand(_SettingsWidget_brand, this, _prepareElement).call(this, element);
	}
	function _getGeneralSettingsElement() {
	  const onclick = () => {
	    this.getWidget().close();
	    BX.SidePanel.Instance.open(_classPrivateFieldGet(_settingsUrl, this) + '?analyticContext=widget_settings_settings');
	  };
	  const element = main_core.Tag.render(_templateObject11 || (_templateObject11 = babelHelpers.taggedTemplateLiteral(["\n\t\t\t<span onclick=\"", "\" class=\"intranet-settings-widget_box --clickable\" data-testid=\"settings-widget-block-general-settings\">\n\t\t\t\t<div class=\"intranet-settings-widget_inner\">\n\t\t\t\t\t<div class=\"intranet-settings-widget_icon-box --gray\">\n\t\t\t\t\t\t<div class=\"ui-icon-set --settings-2\"></div>\n\t\t\t\t\t</div>\n\t\t\t\t\t<div class=\"intranet-settings-widget__title\">\n\t\t\t\t\t\t", "\n\t\t\t\t\t</div>\n\t\t\t\t</div>\n\t\t\t\t<div class=\"intranet-settings-widget__arrow-btn ui-icon-set --arrow-right\"></div>\n\t\t\t</span>\n\t\t"])), onclick, main_core.Loc.getMessage('INTRANET_SETTINGS_WIDGET_SECTION_SETTINGS_TITLE'));
	  return _assertClassBrand(_SettingsWidget_brand, this, _prepareElement).call(this, element);
	}
	function _getMigrateElement() {
	  const onclick = () => {
	    this.getWidget().close();
	    BX.SidePanel.Instance.open("".concat(_classPrivateFieldGet(_marketUrl, this), "category/migration/"));
	  };
	  const element = main_core.Tag.render(_templateObject12 || (_templateObject12 = babelHelpers.taggedTemplateLiteral(["\n\t\t\t<div onclick=\"", "\" class=\"intranet-settings-widget_box --clickable\" data-testid=\"settings-widget-block-migrate\">\n\t\t\t\t<div class=\"intranet-settings-widget_inner\">\n\t\t\t\t\t<div class=\"intranet-settings-widget_icon-box --gray\">\n\t\t\t\t\t\t<div class=\"ui-icon-set --market-1\"></div>\n\t\t\t\t\t</div>\n\t\t\t\t\t<div class=\"intranet-settings-widget__title\">\n\t\t\t\t\t\t", "\n\t\t\t\t\t</div>\n\t\t\t\t</div>\n\t\t\t\t<div class=\"intranet-settings-widget__arrow-btn ui-icon-set --arrow-right\"></div>\n\t\t\t</div>\n\t\t"])), onclick, main_core.Loc.getMessage('INTRANET_SETTINGS_WIDGET_SECTION_MIGRATION_TITLE'));
	  return _assertClassBrand(_SettingsWidget_brand, this, _prepareElement).call(this, element);
	}
	function _updateAriaExpanded(expanded) {
	  if (_classPrivateFieldGet(_target, this)) {
	    main_core.Dom.attr(_classPrivateFieldGet(_target, this), 'aria-expanded', expanded);
	  }
	}
	var _instance = {
	  _: null
	};

	exports.SettingsWidget = SettingsWidget;

})(this.BX.Intranet = this.BX.Intranet || {}, BX, BX.UI, BX.Event);
//# sourceMappingURL=script.js.map
