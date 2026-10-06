/* eslint-disable */
this.BX = this.BX || {};
this.BX.Landing = this.BX.Landing || {};
this.BX.Landing.UI = this.BX.Landing.UI || {};
(function (exports, main_core, main_core_events, landing_loc) {
  'use strict';
  var _templateObject, _templateObject2, _templateObject3, _templateObject4, _templateObject5;
  function ownKeys(e, r) { var t = Object.keys(e); if (Object.getOwnPropertySymbols) { var o = Object.getOwnPropertySymbols(e); r && (o = o.filter(function (r) { return Object.getOwnPropertyDescriptor(e, r).enumerable; })), t.push.apply(t, o); } return t; }
  function _objectSpread(e) { for (var r = 1; r < arguments.length; r++) { var t = null != arguments[r] ? arguments[r] : {}; r % 2 ? ownKeys(Object(t), !0).forEach(function (r) { babelHelpers.defineProperty(e, r, t[r]); }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(e, Object.getOwnPropertyDescriptors(t)) : ownKeys(Object(t)).forEach(function (r) { Object.defineProperty(e, r, Object.getOwnPropertyDescriptor(t, r)); }); } return e; }

  /**
   * @memberOf BX.Landing.UI.Card
   */
  var BaseCard = /*#__PURE__*/function (_main_core_events$Eve) {
    function BaseCard() {
      var _this;
      var options = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
      babelHelpers.classCallCheck(this, BaseCard);
      _this = _main_core_events$Eve.call(this) || this;
      _this.setEventNamespace('BX.Landing.UI.Card.BaseCard');
      _this.cache = new main_core.Cache.MemoryCache();
      _this.data = _objectSpread({}, options);
      _this.options = _this.data;
      _this.id = main_core.Type.isStringFilled(_this.options.id) ? _this.options.id : main_core.Text.getRandom();
      _this.hidden = main_core.Text.toBoolean(_this.options.hidden);
      _this.layout = _this.getLayout();
      _this.header = _this.getHeader();
      _this.body = _this.getBody();
      _this.setTitle(_this.options.title || '');
      _this.setHidden(_this.options.hidden);
      if (main_core.Type.isStringFilled(_this.options.className)) {
        main_core.Dom.addClass(_this.layout, _this.options.className);
      }
      if (main_core.Type.isObject(_this.options.attrs)) {
        main_core.Dom.adjust(_this.layout, {
          attrs: _this.options.attrs
        });
      }
      _this.onClickHandler = main_core.Type.isFunction(_this.options.onClick) ? _this.options.onClick : function () {};
      _this.onClick = _this.onClick.bind(_this);
      _this.onKeyDown = _this.onKeyDown.bind(_this);
      _this.onActionKeyDown = _this.onActionKeyDown.bind(_this);
      _this.onCardFocusIn = _this.onCardFocusIn.bind(_this);
      _this.onCardFocusOut = _this.onCardFocusOut.bind(_this);
      main_core.Event.bind(_this.layout, 'click', _this.onClick);

      // Composite (roving) a11y is opt-in: the card becomes a focusable gridcell
      // only when placed into a role="grid" container (e.g. the "Add block" panel).
      _this.role = main_core.Type.isStringFilled(_this.options.role) ? _this.options.role : null;
      if (_this.role) {
        _this.setupGridcell();
      }
      return _this;
    }
    babelHelpers.inherits(BaseCard, _main_core_events$Eve);
    return babelHelpers.createClass(BaseCard, [{
      key: "setupGridcell",
      value: function setupGridcell() {
        main_core.Dom.attr(this.layout, {
          'role': this.role,
          'tabindex': '-1'
        });
        this.setAriaLabel(this.options.title || '');
        main_core.Event.bind(this.layout, 'keydown', this.onKeyDown);
        main_core.Event.bind(this.layout, 'focusin', this.onCardFocusIn);
        main_core.Event.bind(this.layout, 'focusout', this.onCardFocusOut);
      }
    }, {
      key: "setAriaLabel",
      value: function setAriaLabel(title) {
        if (this.role && main_core.Type.isStringFilled(title)) {
          main_core.Dom.attr(this.layout, 'aria-label', title);
        }
      }
    }, {
      key: "getCardActions",
      value: function getCardActions() {
        return babelHelpers.toConsumableArray(this.layout.querySelectorAll('[data-card-action]'));
      }
    }, {
      key: "onKeyDown",
      value: function onKeyDown(event) {
        if (event.target !== this.layout) {
          return;
        }
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          this.onClick();
        }
      }
    }, {
      key: "onActionKeyDown",
      value: function onActionKeyDown(event) {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          event.stopPropagation();
          event.currentTarget.click();
        }
      }
    }, {
      key: "onCardFocusIn",
      value: function onCardFocusIn() {
        this.getCardActions().forEach(function (action) {
          main_core.Dom.attr(action, 'tabindex', '0');
        });
      }
    }, {
      key: "onCardFocusOut",
      value: function onCardFocusOut(event) {
        if (this.layout.contains(event.relatedTarget)) {
          return;
        }
        this.getCardActions().forEach(function (action) {
          main_core.Dom.attr(action, 'tabindex', '-1');
        });
      }
    }, {
      key: "getLayout",
      value: function getLayout() {
        var _this2 = this;
        return this.cache.remember('layout', function () {
          return main_core.Tag.render(_templateObject || (_templateObject = babelHelpers.taggedTemplateLiteral(["\n\t\t\t\t<div class=\"landing-ui-card\">\n\t\t\t\t\t<div class=\"landing-ui-card-header-wrapper\">\n\t\t\t\t\t\t", "\n\t\t\t\t\t</div>\n\t\t\t\t\t", "\n\t\t\t\t</div>\n\t\t\t"])), _this2.getHeader(), _this2.getBody());
        });
      }
    }, {
      key: "getRemoveButton",
      value: function getRemoveButton() {
        var _this3 = this;
        return this.cache.remember('remove', function () {
          var button = main_core.Tag.render(_templateObject2 || (_templateObject2 = babelHelpers.taggedTemplateLiteral(["\n\t\t\t\t<div class=\"landing-ui-card-block-remove\"></div>\n\t\t\t"])));
          main_core.Dom.attr(button, {
            'role': 'button',
            'tabindex': '-1',
            'data-card-action': '',
            'aria-label': landing_loc.Loc.getMessage('LANDING_UI_CARD_REMOVE_BLOCK_LABEL')
          });
          main_core.Event.bind(button, 'keydown', _this3.onActionKeyDown);
          return button;
        });
      }
    }, {
      key: "getHeader",
      value: function getHeader() {
        return this.cache.remember('header', function () {
          return main_core.Tag.render(_templateObject3 || (_templateObject3 = babelHelpers.taggedTemplateLiteral(["\n\t\t\t\t<div class=\"landing-ui-card-header\"></div>\n\t\t\t"])));
        });
      }
    }, {
      key: "getBody",
      value: function getBody() {
        return this.cache.remember('body', function () {
          return main_core.Tag.render(_templateObject4 || (_templateObject4 = babelHelpers.taggedTemplateLiteral(["\n\t\t\t\t<div class=\"landing-ui-card-body\"></div>\n\t\t\t"])));
        });
      }
    }, {
      key: "addWarning",
      value: function addWarning(warning) {
        main_core.Dom.append(main_core.Tag.render(_templateObject5 || (_templateObject5 = babelHelpers.taggedTemplateLiteral(["\n\t\t\t\t<div class=\"landing-ui-card-body-warning\">", "</div>\n\t\t\t"])), warning), this.getBody());
        main_core.Dom.addClass(this.getBody(), '--warning');
      }
    }, {
      key: "setTitle",
      value: function setTitle(title) {
        this.getHeader().textContent = title;
        this.setAriaLabel(title);
      }
    }, {
      key: "setHidden",
      value: function setHidden(hidden) {
        main_core.Dom.attr(this.getLayout(), 'hidden', hidden || null);
      }
    }, {
      key: "onClick",
      value: function onClick() {
        this.onClickHandler(this);
        this.emit('onClick');
      }

      /**
       * Can be overwriting in child classes. Called at the added card to panel
       */
    }, {
      key: "onAppend",
      value: function onAppend() {}
    }, {
      key: "show",
      value: function show() {
        this.setHidden(false);
      }
    }, {
      key: "isShown",
      value: function isShown() {
        return main_core.Dom.attr(this.getLayout(), 'hidden') === null;
      }
    }, {
      key: "hide",
      value: function hide() {
        this.setHidden(true);
      }
    }, {
      key: "getNode",
      value: function getNode() {
        return this.getLayout();
      }
    }]);
  }(main_core_events.EventEmitter);
  exports.BaseCard = BaseCard;
})(this.BX.Landing.UI.Card = this.BX.Landing.UI.Card || {}, BX, BX.Event, BX.Landing);//# sourceMappingURL=basecard.bundle.js.map
