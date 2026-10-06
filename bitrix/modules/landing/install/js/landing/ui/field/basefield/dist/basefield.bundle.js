/* eslint-disable */
this.BX = this.BX || {};
this.BX.Landing = this.BX.Landing || {};
this.BX.Landing.UI = this.BX.Landing.UI || {};
(function (exports, ui_designTokens, main_core, main_core_events, landing_ui_component_internal) {
  'use strict';

  var _templateObject, _templateObject2, _templateObject3, _templateObject4, _templateObject5;
  function ownKeys(e, r) { var t = Object.keys(e); if (Object.getOwnPropertySymbols) { var o = Object.getOwnPropertySymbols(e); r && (o = o.filter(function (r) { return Object.getOwnPropertyDescriptor(e, r).enumerable; })), t.push.apply(t, o); } return t; }
  function _objectSpread(e) { for (var r = 1; r < arguments.length; r++) { var t = null != arguments[r] ? arguments[r] : {}; r % 2 ? ownKeys(Object(t), !0).forEach(function (r) { babelHelpers.defineProperty(e, r, t[r]); }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(e, Object.getOwnPropertyDescriptors(t)) : ownKeys(Object(t)).forEach(function (r) { Object.defineProperty(e, r, Object.getOwnPropertyDescriptor(t, r)); }); } return e; }

  /**
   * @memberOf BX.Landing.UI.Field
   */
  var BaseField = /*#__PURE__*/function (_main_core_events$Eve) {
    function BaseField() {
      var _this;
      var options = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
      babelHelpers.classCallCheck(this, BaseField);
      _this = _main_core_events$Eve.call(this, options) || this;
      _this.setEventNamespace('BX.Landing.UI.Field');
      _this.subscribeFromOptions(landing_ui_component_internal.fetchEventsFromOptions(options));
      _this.data = _objectSpread({}, options);
      _this.options = _this.data;
      _this.id = Reflect.has(_this.data, 'id') ? _this.data.id : main_core.Text.getRandom();
      _this.selector = Reflect.has(_this.data, 'selector') ? _this.data.selector : main_core.Text.getRandom();
      _this.content = Reflect.has(_this.data, 'content') ? _this.data.content : '';
      _this.title = main_core.Type.isString(_this.data.title) ? _this.data.title : '';
      _this.placeholder = main_core.Type.isString(_this.data.placeholder) ? _this.data.placeholder : '';
      _this.className = main_core.Type.isString(_this.data.className) ? _this.data.className : '';
      _this.descriptionText = main_core.Type.isString(_this.data.description) ? _this.data.description : '';
      _this.description = null;
      _this.attribute = main_core.Type.isString(_this.data.attribute) ? _this.data.attribute : '';
      _this.hidden = main_core.Text.toBoolean(_this.data.hidden);
      _this.property = main_core.Type.isString(_this.data.property) ? _this.data.property : '';
      _this.style = Reflect.has(_this.data, 'style') ? _this.data.style : '';
      _this.cache = new main_core.Cache.MemoryCache();
      _this.contentRoot = Reflect.has(_this.data, 'contentRoot') ? _this.data.contentRoot : null;
      _this.readyToSave = true; // false - if data not loaded yet

      var onValueChange = _this.data.onValueChange;
      _this.onValueChangeHandler = main_core.Type.isFunction(onValueChange) ? onValueChange : function () {};
      _this.onPaste = _this.onPaste.bind(_this);
      _this.layout = BaseField.createLayout();
      _this.header = BaseField.createHeader();
      _this.input = _this.createInput();

      // Stable DOM ids, computed once before subclasses mutate this.id/this.selector.
      _this.headerId = "landing-ui-field-label-".concat(main_core.Text.getRandom());
      _this.descriptionId = "landing-ui-field-description-".concat(main_core.Text.getRandom());
      _this.errorId = "landing-ui-field-error-".concat(main_core.Text.getRandom());
      _this.errorNode = null;
      main_core.Dom.attr(_this.header, 'id', _this.headerId);
      if (!_this.input.id) {
        main_core.Dom.attr(_this.input, 'id', _this.id);
      }
      _this.setTitle(_this.title);
      main_core.Dom.append(_this.header, _this.layout);
      main_core.Dom.append(_this.input, _this.layout);
      main_core.Dom.attr(_this.layout, 'data-selector', _this.selector);
      _this.input.setAttribute('data-placeholder', _this.placeholder);
      if (main_core.Type.isArray(_this.className) || main_core.Type.isString(_this.className)) {
        main_core.Dom.addClass(_this.layout, _this.className);
      }
      _this.setDescription(_this.descriptionText);
      if (_this.data.disabled === true) {
        _this.disable();
      }
      if (options.skipPasteControl !== true) {
        main_core.Event.bind(_this.input, 'paste', _this.onPaste);
      }
      _this.init();
      if (_this.data.help) {
        var hintNode = document.createElement('span');
        hintNode.setAttribute('data-hint', _this.data.help);
        hintNode.setAttribute('data-hint-html', 'y');
        top.BX.UI.Hint.initNode(hintNode);
        BX.Dom.append(hintNode, _this.header);
        top.BX.UI.Hint.init(BX.Landing.UI.Panel.StylePanel.getInstance().layout);
      }
      return _this;
    }
    babelHelpers.inherits(BaseField, _main_core_events$Eve);
    BaseField.createLayout = function createLayout() {
      return main_core.Tag.render(_templateObject || (_templateObject = babelHelpers.taggedTemplateLiteral(["<div class=\"landing-ui-field\"></div>"])));
    };
    BaseField.createHeader = function createHeader() {
      return main_core.Tag.render(_templateObject2 || (_templateObject2 = babelHelpers.taggedTemplateLiteral(["<div class=\"landing-ui-field-header\"></div>"])));
    };
    BaseField.createDescription = function createDescription(text) {
      return main_core.Tag.render(_templateObject3 || (_templateObject3 = babelHelpers.taggedTemplateLiteral(["\n\t\t\t<div class=\"landing-ui-field-description\">\n\t\t\t\t<span class=\"fa fa-info-circle\"> </span> ", "\n\t\t\t</div>\n\t\t"])), text);
    };
    BaseField.createError = function createError(text) {
      return main_core.Tag.render(_templateObject4 || (_templateObject4 = babelHelpers.taggedTemplateLiteral(["\n\t\t\t<div class=\"landing-ui-field-description landing-ui-error\" role=\"alert\">\n\t\t\t\t<span class=\"fa fa-info-circle\"> </span> ", "\n\t\t\t</div>\n\t\t"])), text);
    };
    var _proto = BaseField.prototype;
    _proto.setTitle = function setTitle(title) {
      this.title = title;
      this.header.innerHTML = main_core.Text.encode(title);
      this.applyLabelledBy(title);
    };
    _proto.applyLabelledBy = function applyLabelledBy(title) {
      if (main_core.Type.isString(title) && title !== '') {
        main_core.Dom.attr(this.input, 'aria-labelledby', this.headerId);
      } else {
        main_core.Dom.attr(this.input, 'aria-labelledby', null);
      }
    };
    _proto.getDescription = function getDescription() {
      return this.layout.querySelector('.landing-ui-field-description:not(.landing-ui-error)');
    };
    _proto.setDescription = function setDescription(description) {
      if (main_core.Type.isString(description) && description !== '') {
        this.descriptionText = description;
        this.description = BaseField.createDescription(this.descriptionText);
        main_core.Dom.remove(this.getDescription());
        main_core.Dom.append(this.description, this.layout);
      }
      if (this.description) {
        main_core.Dom.attr(this.description, 'id', this.descriptionId);
      }
      this.syncDescribedBy();
    };
    _proto.removeDescription = function removeDescription() {
      main_core.Dom.remove(this.getDescription());
      this.description = null;
      this.descriptionText = '';
      this.syncDescribedBy();
    };
    _proto.setError = function setError(text) {
      this.clearError();
      this.errorNode = BaseField.createError(text);
      main_core.Dom.attr(this.errorNode, 'id', this.errorId);
      main_core.Dom.append(this.errorNode, this.layout);
      main_core.Dom.attr(this.input, 'aria-invalid', 'true');
      this.syncDescribedBy();
    };
    _proto.clearError = function clearError() {
      if (this.errorNode) {
        main_core.Dom.remove(this.errorNode);
        this.errorNode = null;
      }
      main_core.Dom.attr(this.input, 'aria-invalid', null);
      this.syncDescribedBy();
    };
    _proto.syncDescribedBy = function syncDescribedBy() {
      var ids = [this.description ? this.descriptionId : null, this.errorNode ? this.errorId : null].filter(Boolean);
      main_core.Dom.attr(this.input, 'aria-describedby', ids.length > 0 ? ids.join(' ') : null);
    };
    _proto.createInput = function createInput() {
      return main_core.Tag.render(_templateObject5 || (_templateObject5 = babelHelpers.taggedTemplateLiteral(["\n\t\t\t<div class=\"landing-ui-field-input\">", "</div>\n\t\t"])), this.content);
    }

    /**
     * Makes a non-native contentEditable input reachable and announced as a textbox.
     * Opt-in: only editable-div fields (TextField and descendants) call it, so native
     * inputs and non-text widgets that extend BaseField keep their own semantics.
     */;
    _proto.enableTextboxAccessibility = function enableTextboxAccessibility() {
      var options = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
      main_core.Dom.attr(this.input, 'tabindex', '0');
      main_core.Dom.attr(this.input, 'role', 'textbox');
      main_core.Dom.attr(this.input, 'aria-multiline', options.multiline === true ? 'true' : null);
    }

    // eslint-disable-next-line class-methods-use-this
;
    _proto.init = function init() {};
    _proto.getContext = function getContext() {
      if (this.input.ownerDocument) {
        return this.input.ownerDocument.defaultView;
      }
      return window;
    }

    // eslint-disable-next-line class-methods-use-this
;
    _proto.onPaste = function onPaste(event) {
      event.preventDefault();
      event.stopPropagation();
      if (event.clipboardData && event.clipboardData.getData) {
        var sourceText = event.clipboardData.getData('text/plain');
        var encodedText = BX.Text.encode(sourceText);
        var formattedHtml = encodedText.replace(new RegExp('\n', 'g'), '<br>');
        this.getContext().document.execCommand('insertHTML', false, formattedHtml);
      } else {
        // ie11
        var text = window.clipboardData.getData('text');
        this.getContext().document.execCommand('paste', true, BX.Text.encode(text));
      }
    };
    _proto.getNode = function getNode() {
      return this.layout;
    };
    _proto.isChanged = function isChanged() {
      var _this2 = this;
      var content = function () {
        if (main_core.Type.isNil(_this2.content)) {
          return '';
        }
        if (main_core.Type.isString(_this2.content)) {
          return _this2.content.trim();
        }
        return _this2.content;
      }();
      return content !== this.getValue();
    };
    _proto.getValue = function getValue() {
      return this.input.innerHTML.trim();
    };
    _proto.setValue = function setValue() {
      var value = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : '';
      var preparedValue = this.textOnly ? main_core.Text.encode(value) : value;
      this.input.innerHTML = preparedValue.toString().trim();
      this.onValueChangeHandler(this);
      var event = new main_core.Event.BaseEvent({
        data: {
          value: this.getValue()
        },
        compatData: [this.getValue()]
      });
      this.emit('change', event);
      this.emit('onChange', event);
    };
    _proto.enable = function enable() {
      main_core.Dom.attr(this.layout, 'disabled', null);
      main_core.Dom.removeClass(this.layout, 'landing-ui-disabled');
    };
    _proto.disable = function disable() {
      main_core.Dom.attr(this.layout, 'disabled', true);
      main_core.Dom.addClass(this.layout, 'landing-ui-disabled');
    }

    // eslint-disable-next-line class-methods-use-this
;
    _proto.reset = function reset() {};
    _proto.onFrameLoad = function onFrameLoad() {};
    _proto.clone = function clone(data) {
      return new this.constructor(main_core.Runtime.clone(data || this.data));
    };
    _proto.getLayout = function getLayout() {
      return this.layout;
    };
    _proto.setLayoutClass = function setLayoutClass(className) {
      main_core.Dom.addClass(this.layout, className);
    }

    /**
     * If field has inline style-properties (f.e. css variables) - get name of them
    	 * @returns {string[]}
     */;
    _proto.getInlineProperties = function getInlineProperties() {
      return [];
    }

    /**
     * If field need match computed styles by node - get name of style properties
     * @returns {string[]}
     */;
    _proto.getComputedProperties = function getComputedProperties() {
      // todo: get from typeSetting
      return [];
    }

    /**
     * If field work with pseudo element - return them (f.e. :after)
     * @returns {?string}
     */;
    _proto.getPseudoElement = function getPseudoElement() {
      // todo: from type settings
      return null;
    };
    return babelHelpers.createClass(BaseField);
  }(main_core_events.EventEmitter);
  BaseField.currentField = null;
  exports.BaseField = BaseField;
})(this.BX.Landing.UI.Field = this.BX.Landing.UI.Field || {}, window, BX, BX.Event, BX.Landing.UI.Component);
//# sourceMappingURL=basefield.bundle.js.map