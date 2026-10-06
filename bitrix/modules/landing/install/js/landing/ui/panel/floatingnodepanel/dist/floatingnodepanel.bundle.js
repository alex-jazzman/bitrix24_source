/* eslint-disable */
this.BX = this.BX || {};
this.BX.Landing = this.BX.Landing || {};
this.BX.Landing.UI = this.BX.Landing.UI || {};
(function (exports, main_core, landing_ui_panel_base) {
  'use strict';
  var _templateObject;
  function _classPrivateMethodInitSpec(e, a) { _checkPrivateRedeclaration(e, a), a.add(e); }
  function _classPrivateFieldInitSpec(e, t, a) { _checkPrivateRedeclaration(e, t), t.set(e, a); }
  function _checkPrivateRedeclaration(e, t) { if (t.has(e)) throw new TypeError("Cannot initialize the same private elements twice on an object"); }
  function _classPrivateFieldGet(s, a) { return s.get(_assertClassBrand(s, a)); }
  function _classPrivateFieldSet(s, a, r) { return s.set(_assertClassBrand(s, a), r), r; }
  function _assertClassBrand(e, t, n) { if ("function" == typeof e ? e === t : e.has(t)) return arguments.length < 3 ? t : n; throw new TypeError("Private element is not present on this object"); }

  var PANEL_INSET = 12;
  var _buttons = /*#__PURE__*/new WeakMap();
  var _targetNode = /*#__PURE__*/new WeakMap();
  var _targetNodeTabIndex = /*#__PURE__*/new WeakMap();
  var _restoringFocus = /*#__PURE__*/new WeakMap();
  var _FloatingNodePanel_brand = /*#__PURE__*/new WeakSet();
  var _onMouseEnter = /*#__PURE__*/new WeakMap();
  var _onMouseLeave = /*#__PURE__*/new WeakMap();
  var _onKeyDown = /*#__PURE__*/new WeakMap();
  var FloatingNodePanel = /*#__PURE__*/function (_landing_ui_panel_bas) {
    function FloatingNodePanel(options) {
      var _this;
      babelHelpers.classCallCheck(this, FloatingNodePanel);
      _this = _landing_ui_panel_bas.call(this) || this;
      _classPrivateMethodInitSpec(_this, _FloatingNodePanel_brand);
      _classPrivateFieldInitSpec(_this, _buttons, void 0);
      _classPrivateFieldInitSpec(_this, _targetNode, null);
      _classPrivateFieldInitSpec(_this, _targetNodeTabIndex, undefined);
      _classPrivateFieldInitSpec(_this, _restoringFocus, false);
      _classPrivateFieldInitSpec(_this, _onMouseEnter, function (event) {
        var _classPrivateFieldGet2;
        if (_classPrivateFieldGet(_restoringFocus, _this)) {
          return;
        }
        void _this.show();
        if (event.type === 'focusin' && (_classPrivateFieldGet2 = _classPrivateFieldGet(_targetNode, _this)) !== null && _classPrivateFieldGet2 !== void 0 && _classPrivateFieldGet2.matches(':focus-visible')) {
          var _this$layout$querySel;
          (_this$layout$querySel = _this.layout.querySelector('button')) === null || _this$layout$querySel === void 0 || _this$layout$querySel.focus();
        }
      });
      _classPrivateFieldInitSpec(_this, _onMouseLeave, function (event) {
        var relatedTarget = event.relatedTarget;
        if (main_core.Type.isDomNode(relatedTarget) && (_this.layout.contains(relatedTarget) || _classPrivateFieldGet(_targetNode, _this) && _classPrivateFieldGet(_targetNode, _this).contains(relatedTarget))) {
          return;
        }
        void _this.hide();
      });
      _classPrivateFieldInitSpec(_this, _onKeyDown, function (event) {
        if (event.key === 'Escape' && _this.isShown()) {
          void _this.hide();
        }
      });
      _this.setEventNamespace('BX.Landing.UI.Panel.FloatingNodePanel');
      _classPrivateFieldSet(_buttons, _this, main_core.Type.isArrayFilled(options === null || options === void 0 ? void 0 : options.buttons) ? options.buttons : []);
      main_core.Dom.addClass(_this.layout, 'landing-ui-panel-floating-node');
      _classPrivateFieldGet(_buttons, _this).forEach(function (button) {
        return _this.appendContent(_assertClassBrand(_FloatingNodePanel_brand, _this, _renderButton).call(_this, button));
      });
      main_core.Event.bind(_this.layout, 'mouseenter', _classPrivateFieldGet(_onMouseEnter, _this));
      main_core.Event.bind(_this.layout, 'mouseleave', _classPrivateFieldGet(_onMouseLeave, _this));
      return _this;
    }
    babelHelpers.inherits(FloatingNodePanel, _landing_ui_panel_bas);
    return babelHelpers.createClass(FloatingNodePanel, [{
      key: "attach",
      value: function attach(targetNode) {
        if (!main_core.Type.isDomNode(targetNode)) {
          return;
        }
        this.detach();
        if (targetNode.tabIndex < 0) {
          _classPrivateFieldSet(_targetNodeTabIndex, this, targetNode.getAttribute('tabindex'));
          targetNode.tabIndex = 0;
        }
        _classPrivateFieldSet(_targetNode, this, targetNode);
        main_core.Event.bind(targetNode, 'mouseenter', _classPrivateFieldGet(_onMouseEnter, this));
        main_core.Event.bind(targetNode, 'mouseleave', _classPrivateFieldGet(_onMouseLeave, this));
        main_core.Event.bind(targetNode, 'focusin', _classPrivateFieldGet(_onMouseEnter, this));
        main_core.Event.bind(targetNode, 'focusout', _classPrivateFieldGet(_onMouseLeave, this));
        main_core.Event.bind(targetNode.ownerDocument, 'keydown', _classPrivateFieldGet(_onKeyDown, this));
        this.renderTo(targetNode.ownerDocument.body);
        main_core.Event.bind(this.layout, 'focusout', _classPrivateFieldGet(_onMouseLeave, this));
      }
    }, {
      key: "detach",
      value: function detach() {
        if (!_classPrivateFieldGet(_targetNode, this)) {
          return;
        }
        main_core.Event.unbind(_classPrivateFieldGet(_targetNode, this), 'mouseenter', _classPrivateFieldGet(_onMouseEnter, this));
        main_core.Event.unbind(_classPrivateFieldGet(_targetNode, this), 'mouseleave', _classPrivateFieldGet(_onMouseLeave, this));
        main_core.Event.unbind(_classPrivateFieldGet(_targetNode, this), 'focusin', _classPrivateFieldGet(_onMouseEnter, this));
        main_core.Event.unbind(_classPrivateFieldGet(_targetNode, this), 'focusout', _classPrivateFieldGet(_onMouseLeave, this));
        main_core.Event.unbind(_classPrivateFieldGet(_targetNode, this).ownerDocument, 'keydown', _classPrivateFieldGet(_onKeyDown, this));
        main_core.Event.unbind(this.layout, 'focusout', _classPrivateFieldGet(_onMouseLeave, this));
        _assertClassBrand(_FloatingNodePanel_brand, this, _restoreTargetNodeTabIndex).call(this);
        _classPrivateFieldSet(_targetNode, this, null);
        this.remove();
      }
    }, {
      key: "show",
      value: function show() {
        if (!this.isShown()) {
          main_core.Dom.removeClass(this.layout, this.classHide);
          main_core.Dom.addClass(this.layout, this.classShow);
        }
        _assertClassBrand(_FloatingNodePanel_brand, this, _adjustPosition).call(this);
        return Promise.resolve();
      }
    }, {
      key: "hide",
      value: function hide() {
        var focusWasInside = this.layout.contains(this.layout.ownerDocument.activeElement);
        if (this.isShown()) {
          main_core.Dom.removeClass(this.layout, this.classShow);
          main_core.Dom.addClass(this.layout, this.classHide);
        }
        if (focusWasInside) {
          var _classPrivateFieldGet3;
          _classPrivateFieldSet(_restoringFocus, this, true);
          (_classPrivateFieldGet3 = _classPrivateFieldGet(_targetNode, this)) === null || _classPrivateFieldGet3 === void 0 || _classPrivateFieldGet3.focus({
            preventScroll: true
          });
          _classPrivateFieldSet(_restoringFocus, this, false);
        }
        return Promise.resolve();
      }
    }]);
  }(landing_ui_panel_base.BasePanel);
  function _restoreTargetNodeTabIndex() {
    if (_classPrivateFieldGet(_targetNodeTabIndex, this) === undefined || !_classPrivateFieldGet(_targetNode, this)) {
      return;
    }
    if (_classPrivateFieldGet(_targetNodeTabIndex, this) === null) {
      _classPrivateFieldGet(_targetNode, this).removeAttribute('tabindex');
    } else {
      _classPrivateFieldGet(_targetNode, this).setAttribute('tabindex', _classPrivateFieldGet(_targetNodeTabIndex, this));
    }
    _classPrivateFieldSet(_targetNodeTabIndex, this, undefined);
  }
  function _renderButton(button) {
    var layout = main_core.Tag.render(_templateObject || (_templateObject = babelHelpers.taggedTemplateLiteral(["\n\t\t\t<button\n\t\t\t\ttype=\"button\"\n\t\t\t\tclass=\"landing-ui-panel-floating-node__button\"\n\t\t\t\tdata-id=\"", "\"\n\t\t\t\tdata-testid=\"", "\"\n\t\t\t\ttitle=\"", "\"\n\t\t\t>\n\t\t\t\t<span class=\"ui-icon-set ", " landing-ui-panel-floating-node__icon\"></span>\n\t\t\t</button>\n\t\t"])), main_core.Text.encode(button.id), main_core.Text.encode("landing-floating-node-".concat(button.id, "-btn")), main_core.Text.encode(button.title), main_core.Text.encode(button.iconClass));
    main_core.Event.bind(layout, 'click', function (event) {
      event.preventDefault();
      event.stopPropagation();
      button.onClick(event);
    });
    return layout;
  }
  function _adjustPosition() {
    if (!_classPrivateFieldGet(_targetNode, this)) {
      return;
    }
    var targetWindow = _classPrivateFieldGet(_targetNode, this).ownerDocument.defaultView;
    if (!targetWindow) {
      return;
    }
    var targetRect = _classPrivateFieldGet(_targetNode, this).getBoundingClientRect();
    var panelRect = this.layout.getBoundingClientRect();
    var centerX = targetRect.left + targetRect.width / 2;
    var centerY = targetRect.top + targetRect.height / 2;
    var targetWidth = _classPrivateFieldGet(_targetNode, this).offsetWidth || targetRect.width;
    var targetHeight = _classPrivateFieldGet(_targetNode, this).offsetHeight || targetRect.height;
    var targetTop = centerY - targetHeight / 2;
    var targetLeft = centerX - targetWidth / 2;
    var targetRight = centerX + targetWidth / 2;
    var top = targetTop + targetWindow.pageYOffset + PANEL_INSET;
    var left = Math.max(targetLeft + targetWindow.pageXOffset + PANEL_INSET, targetRight + targetWindow.pageXOffset - panelRect.width - PANEL_INSET);
    main_core.Dom.style(this.layout, {
      top: "".concat(top, "px"),
      left: "".concat(left, "px")
    });
  }
  exports.FloatingNodePanel = FloatingNodePanel;
})(this.BX.Landing.UI.Panel = this.BX.Landing.UI.Panel || {}, BX, BX.Landing.UI.Panel);
//# sourceMappingURL=floatingnodepanel.bundle.js.map
