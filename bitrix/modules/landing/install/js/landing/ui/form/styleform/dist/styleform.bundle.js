/* eslint-disable */
this.BX = this.BX || {};
this.BX.Landing = this.BX.Landing || {};
this.BX.Landing.UI = this.BX.Landing.UI || {};
(function (exports, main_core, landing_ui_form_baseform, landing_ui_highlight, landing_ui_field_basefield, landing_env, landing_ui_component_internal) {
'use strict';

/**
 * @memberOf BX.Landing.UI.Form
 */
var _templateObject, _templateObject2, _templateObject3;
function _classPrivateMethodInitSpec(e, a) { _checkPrivateRedeclaration(e, a), a.add(e); }
function _classPrivateFieldInitSpec(e, t, a) { _checkPrivateRedeclaration(e, t), t.set(e, a); }
function _checkPrivateRedeclaration(e, t) { if (t.has(e)) throw new TypeError("Cannot initialize the same private elements twice on an object"); }
function _classPrivateFieldGet(s, a) { return s.get(_assertClassBrand(s, a)); }
function _classPrivateFieldSet(s, a, r) { return s.set(_assertClassBrand(s, a), r), r; }
function _assertClassBrand(e, t, n) { if ("function" == typeof e ? e === t : e.has(t)) return arguments.length < 3 ? t : n; throw new TypeError("Private element is not present on this object"); }
var _styleFields = /*#__PURE__*/new WeakMap();
var _StyleForm_brand = /*#__PURE__*/new WeakSet();
var StyleForm = /*#__PURE__*/function (_landing_ui_form_base) {
  function StyleForm() {
    var _this;
    var options = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
    _this = _landing_ui_form_base.call(this, options) || this;
    _classPrivateMethodInitSpec(_this, _StyleForm_brand);
    _classPrivateFieldInitSpec(_this, _styleFields, void 0);
    _this.setEventNamespace('BX.Landing.UI.Form.StyleForm');
    _this.subscribeFromOptions(landing_ui_component_internal.fetchEventsFromOptions(options));
    main_core.Dom.addClass(_this.layout, 'landing-ui-form-style');
    _this.iframe = 'iframe' in options ? options.iframe : null;
    _this.node = 'node' in options ? options.node : null;
    _this.selector = 'selector' in options ? options.selector : null;
    _this.collapsed = 'collapsed' in options ? options.collapsed : null;
    _this.currentTarget = 'currentTarget' in options ? options.currentTarget : null;
    _this.specialType = 'specialType' in options ? options.specialType : null;
    _classPrivateFieldSet(_styleFields, _this, new Map());
    _this.onHeaderEnter = _this.onHeaderEnter.bind(_this);
    _this.onHeaderLeave = _this.onHeaderLeave.bind(_this);
    _this.onHeaderClick = _this.onHeaderClick.bind(_this);
    _this.onHeaderKeyDown = _this.onHeaderKeyDown.bind(_this);
    _this.prepareHeader();
    main_core.Event.bind(_this.header, 'click', _this.onHeaderClick);
    main_core.Event.bind(_this.header, 'keydown', _this.onHeaderKeyDown);
    main_core.Event.bind(_this.header, 'mouseenter', _this.onHeaderEnter);
    main_core.Event.bind(_this.header, 'mouseleave', _this.onHeaderLeave);
    if (_this.iframe) {
      _this.onFrameLoad();
    }
    if (_this.collapsed) {
      main_core.Dom.addClass(_this.layout, 'landing-ui-form-style--collapsed');
    }
    _this.prepareHeaderA11y();
    if (_this.specialType && _this.specialType === 'crm_forms' && landing_env.Env.getInstance().getSpecialType() === 'crm_forms') {
      _assertClassBrand(_StyleForm_brand, _this, _addReplaceByTemplateCard).call(_this);
    }
    return _this;
  }
  babelHelpers.inherits(StyleForm, _landing_ui_form_base);
  var _proto = StyleForm.prototype;
  _proto.onFrameLoad = function onFrameLoad() {
    if (!this.node) {
      this.node = babelHelpers.toConsumableArray(this.iframe.document.querySelectorAll(this.selector));
    }
  };
  _proto.onHeaderEnter = function onHeaderEnter() {
    landing_ui_highlight.Highlight.getInstance().show(this.node);
  }

  // eslint-disable-next-line class-methods-use-this
;
  _proto.onHeaderLeave = function onHeaderLeave() {
    landing_ui_highlight.Highlight.getInstance().hide();
  };
  _proto.onHeaderClick = function onHeaderClick(event) {
    event.preventDefault();
    main_core.Dom.toggleClass(this.layout, 'landing-ui-form-style--collapsed');
    this.syncHeaderExpanded();
  };
  _proto.onHeaderKeyDown = function onHeaderKeyDown(event) {
    if (event.target !== event.currentTarget) {
      return;
    }
    if (event.key === 'Enter' || event.key === ' ' || event.key === 'Spacebar') {
      event.preventDefault();
      this.onHeaderClick(event);
    }
  };
  _proto.prepareHeaderA11y = function prepareHeaderA11y() {
    var bodyId = "landing-styleform-body-".concat(this.id);
    main_core.Dom.attr(this.body, 'id', bodyId);
    main_core.Dom.attr(this.header, {
      'role': 'button',
      'tabindex': '0',
      'aria-controls': bodyId
    });
    this.syncHeaderExpanded();
  };
  _proto.syncHeaderExpanded = function syncHeaderExpanded() {
    var collapsed = main_core.Dom.hasClass(this.layout, 'landing-ui-form-style--collapsed');
    main_core.Dom.attr(this.header, 'aria-expanded', collapsed ? 'false' : 'true');
  };
  _proto.addField = function addField(field) {
    if (field) {
      var _field$data;
      var attrKey = field === null || field === void 0 || (_field$data = field.data) === null || _field$data === void 0 ? void 0 : _field$data.attrKey;
      field.subscribe('onChange', this.onChange.bind(this));
      field.subscribe('onInit', this.onInit.bind(this));
      this.fields.add(field);
      BX.Dom.append(field.layout, this.body);
      if (attrKey) {
        _classPrivateFieldGet(_styleFields, this).set(attrKey, field.getLayout());
      }
    }
  };
  _proto.onChange = function onChange(event) {
    _assertClassBrand(_StyleForm_brand, this, _toggleLinkedFields).call(this, event.getData());
    this.emit('onChange');
  };
  _proto.onInit = function onInit(event) {
    _assertClassBrand(_StyleForm_brand, this, _toggleLinkedFields).call(this, event.getData());
    this.emit('onInit');
  };
  _proto.prepareHeader = function prepareHeader() {
    var headerText = BX.Dom.create({
      tag: 'div',
      props: {
        classList: 'landing-ui-form-header-text'
      }
    });
    if (this.header.childNodes) {
      this.header.childNodes.forEach(function (childNode) {
        BX.Dom.append(childNode, headerText);
      });
    }
    BX.Dom.append(headerText, this.header);
  };
  return StyleForm;
}(landing_ui_form_baseform.BaseForm);
function _toggleLinkedFields(fieldData) {
  var _this2 = this;
  // hide linked fields
  if (fieldData.hide && main_core.Type.isArray(fieldData.hide)) {
    fieldData.hide.map(function (attr) {
      var layout = _classPrivateFieldGet(_styleFields, _this2).get(attr);
      if (layout) {
        BX.Dom.style(layout, 'display', 'none');
      }
      return null;
    });
  }

  // show linked fields
  if (fieldData.show && main_core.Type.isArray(fieldData.show)) {
    fieldData.show.map(function (attr) {
      var layout = _classPrivateFieldGet(_styleFields, _this2).get(attr);
      if (layout) {
        BX.Dom.style(layout, 'display', 'block');
      }
      return null;
    });
  }
}
function _addReplaceByTemplateCard() {
  var isMinisitesAllowed = landing_env.Env.getInstance().getOptions().allow_minisites;
  var lockIcon = isMinisitesAllowed ? '' : main_core.Tag.render(_templateObject || (_templateObject = babelHelpers.taggedTemplateLiteral(["<span class=\"landing-ui-form-lock-icon\"></span>"])));
  var button = main_core.Tag.render(_templateObject2 || (_templateObject2 = babelHelpers.taggedTemplateLiteral(["\n\t\t\t<span class=\"landing-ui-form-replace-by-templates-card-button ui-btn ui-btn-sm ui-btn-primary ui-btn-hover ui-btn-round\">\n\t\t\t\t", "\n\t\t\t\t", "\n\t\t\t</span>\n\t\t"])), main_core.Loc.getMessage('LANDING_REPLACE_BY_TEMPLATES_BUTTON'), lockIcon);
  var card = main_core.Tag.render(_templateObject3 || (_templateObject3 = babelHelpers.taggedTemplateLiteral(["<div class=\"landing-ui-form-replace-by-templates-card\">\n\t\t\t<div class=\"landing-ui-form-replace-by-templates-card-title\">\n\t\t\t\t", "\n\t\t\t</div>\n\t\t\t", "\n\t\t</div>"])), main_core.Loc.getMessage('LANDING_REPLACE_BY_TEMPLATES_TITLE'), button);
  main_core.Dom.insertBefore(card, this.header);
  main_core.Event.bind(button, 'click', function () {
    if (!isMinisitesAllowed) {
      BX.UI.InfoHelper.show('limit_crm_forms_templates');
      return;
    }
    var templatesMarketUrl = landingParams['PAGE_URL_LANDING_REPLACE_FROM_STYLE'];
    if (templatesMarketUrl) {
      BX.SidePanel.Instance.open(templatesMarketUrl, {
        allowChangeHistory: false,
        cacheable: false,
        customLeftBoundary: 0
      });
    }
  });
}
exports.StyleForm = StyleForm;
})(this.BX.Landing.UI.Form = this.BX.Landing.UI.Form || {}, BX, BX.Landing.UI.Form, BX.Landing.UI, BX.Landing.UI.Field, BX.Landing, BX.Landing.UI.Component);
//# sourceMappingURL=styleform.bundle.js.map
