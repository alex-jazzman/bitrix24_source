/* eslint-disable */
this.BX = this.BX || {};
this.BX.Landing = this.BX.Landing || {};
this.BX.Landing.UI = this.BX.Landing.UI || {};
(function (exports, landing_ui_field_basefield, main_core, main_core_events, landing_ui_component_internal) {
  'use strict';

  var _templateObject;
  function _classPrivateMethodInitSpec(e, a) { _checkPrivateRedeclaration(e, a), a.add(e); }
  function _checkPrivateRedeclaration(e, t) { if (t.has(e)) throw new TypeError("Cannot initialize the same private elements twice on an object"); }
  function _assertClassBrand(e, t, n) { if ("function" == typeof e ? e === t : e.has(t)) return arguments.length < 3 ? t : n; throw new TypeError("Private element is not present on this object"); }

  var _TextField_brand = /*#__PURE__*/new WeakSet();
  var TextField = /*#__PURE__*/function (_landing_ui_field_bas) {
    function TextField(options) {
      var _this$options$footerT;
      var _this;
      babelHelpers.classCallCheck(this, TextField);
      _this = _landing_ui_field_bas.call(this, options) || this;
      _classPrivateMethodInitSpec(_this, _TextField_brand);
      _this.setEventNamespace('BX.Landing.UI.Field.TextField');
      _this.subscribeFromOptions(landing_ui_component_internal.fetchEventsFromOptions(options));
      _this.bind = _this.options.bind;
      _this.changeTagButton = _this.options.changeTagButton;
      _this.onInputHandler = main_core.Type.isFunction(_this.options.onInput) ? _this.options.onInput : function () {};
      _this.onValueChangeHandler = main_core.Type.isFunction(_this.options.onValueChange) ? _this.options.onValueChange : function () {};
      _this.textOnly = main_core.Type.isBoolean(_this.options.textOnly) ? _this.options.textOnly : false;
      _this.content = _this.textOnly ? main_core.Text.encode(_this.content) : _this.content;
      _this.input.innerHTML = _this.content;
      _assertClassBrand(_TextField_brand, _this, _createFooter).call(_this);
      _this.setFooterText((_this$options$footerT = _this.options.footerText) !== null && _this$options$footerT !== void 0 ? _this$options$footerT : '');
      _this.onInputClick = _this.onInputClick.bind(_this);
      _this.onInputMousedown = _this.onInputMousedown.bind(_this);
      _this.onDocumentMouseup = _this.onDocumentMouseup.bind(_this);
      _this.onInputInput = _this.onInputInput.bind(_this);
      _this.onDocumentClick = _this.onDocumentClick.bind(_this);
      _this.onDocumentKeydown = _this.onDocumentKeydown.bind(_this);
      _this.onInputKeydown = _this.onInputKeydown.bind(_this);
      _this.onInputFocus = _this.onInputFocus.bind(_this);
      _this.enableTextboxAccessibility({
        multiline: !_this.isTextOnly()
      });
      main_core.Event.bind(_this.input, 'click', _this.onInputClick);
      main_core.Event.bind(_this.input, 'mousedown', _this.onInputMousedown);
      main_core.Event.bind(_this.input, 'input', _this.onInputInput);
      main_core.Event.bind(_this.input, 'keydown', _this.onInputKeydown);
      main_core.Event.bind(_this.input, 'focus', _this.onInputFocus);
      var editorPanel = BX.Landing.UI.Panel.EditorPanel.getInstance();
      var editorPanelDocument = editorPanel && editorPanel.layout ? editorPanel.layout.ownerDocument : null;
      if (editorPanelDocument) {
        main_core.Event.bind(editorPanelDocument, 'click', _this.onDocumentClick);
        main_core.Event.bind(editorPanelDocument, 'keydown', _this.onDocumentKeydown);
        main_core.Event.bind(editorPanelDocument, 'mouseup', _this.onDocumentMouseup);
      }
      return _this;
    }
    babelHelpers.inherits(TextField, _landing_ui_field_bas);
    var _proto = TextField.prototype;
    _proto.onInputInput = function onInputInput() {
      this.onInputHandler(this.input.innerText);
      this.onValueChangeHandler(this);
      var event = new main_core_events.BaseEvent({
        data: {
          value: this.getValue()
        },
        compatData: [this.getValue()]
      });
      this.emit('onChange', event);
    };
    _proto.onDocumentKeydown = function onDocumentKeydown(event) {
      if (event.keyCode === 27) {
        if (this.isEditable()) {
          if (this === BX.Landing.UI.Field.BaseField.currentField) {
            BX.Landing.UI.Panel.EditorPanel.getInstance().hide();
          }
          this.disableEdit();
        }
      }
    };
    _proto.onInputKeydown = function onInputKeydown(event) {
      if (event.keyCode === 13) {
        if (this.isTextOnly()) {
          event.preventDefault();
        }
      }
    };
    _proto.onInputFocus = function onInputFocus() {
      this.enableEdit();
    };
    _proto.enableTextOnly = function enableTextOnly() {
      this.textOnly = true;
      this.input.innerHTML = "".concat(this.input.innerText).trim();
      main_core.Dom.attr(this.input, 'aria-multiline', null);
    };
    _proto.disableTextOnly = function disableTextOnly() {
      this.textOnly = false;
      main_core.Dom.attr(this.input, 'aria-multiline', 'true');
    };
    _proto.isTextOnly = function isTextOnly() {
      return this.textOnly;
    };
    _proto.isContentEditable = function isContentEditable() {
      return this.contentEditable !== false;
    };
    _proto.onDocumentClick = function onDocumentClick(event) {
      if (this.isClickInsideField(event) || this.isClickInsideEditorPanel(event) || this.isClickInsidePopup(event)) {
        this.fromInput = false;
        return;
      }
      if (this.isEditable() && !this.fromInput) {
        if (this === BX.Landing.UI.Field.BaseField.currentField) {
          BX.Landing.UI.Panel.EditorPanel.getInstance().hide();
        }
        this.disableEdit();
      }
      this.fromInput = false;
    };
    _proto.isClickInsideField = function isClickInsideField(event) {
      if (!event || !event.target) {
        return false;
      }
      return Boolean(this.input && this.input.contains(event.target));
    };
    _proto.isClickInsideEditorPanel = function isClickInsideEditorPanel(event) {
      if (!event || !event.target) {
        return false;
      }
      var editorPanel = BX.Landing.UI.Panel.EditorPanel.getInstance();
      return Boolean(editorPanel && editorPanel.layout && editorPanel.layout.contains(event.target));
    };
    _proto.isClickInsidePopup = function isClickInsidePopup(event) {
      return Boolean(event && event.target && event.target.closest && event.target.closest('.popup-window'));
    };
    _proto.onDocumentMouseup = function onDocumentMouseup() {
      var _this2 = this;
      setTimeout(function () {
        _this2.fromInput = false;
      }, 10);
    };
    _proto.onInputClick = function onInputClick(event) {
      event.preventDefault();
      event.stopPropagation();
      this.fromInput = false;
    };
    _proto.onInputMousedown = function onInputMousedown(event) {
      this.enableEdit();
      BX.Landing.UI.Tool.ColorPicker.hideAll();
      requestAnimationFrame(function () {
        if (event.target.nodeName === 'A') {
          var range = document.createRange();
          range.selectNode(event.target);
          window.getSelection().removeAllRanges();
          window.getSelection().addRange(range);
        }
      });
      this.fromInput = true;
      event.stopPropagation();
    };
    _proto.enableEdit = function enableEdit() {
      if (!this.isEditable()) {
        if (this !== BX.Landing.UI.Field.BaseField.currentField && BX.Landing.UI.Field.BaseField.currentField !== null) {
          BX.Landing.UI.Field.BaseField.currentField.disableEdit();
        }
        BX.Landing.UI.Field.BaseField.currentField = this;
        if (!this.isTextOnly()) {
          if (this.changeTagButton) {
            this.changeTagButton.onChangeHandler = this.onChangeTag.bind(this);
          }
          BX.Landing.UI.Panel.EditorPanel.getInstance().show(this.layout, null, this.changeTagButton ? [this.changeTagButton] : null);
          this.input.contentEditable = true;
        } else {
          BX.Landing.UI.Panel.EditorPanel.getInstance().hide();
          this.input.contentEditable = true;
        }
        if (!this.isContentEditable()) {
          this.input.contentEditable = false;
        }
      }
    };
    _proto.onChangeTag = function onChangeTag(value) {
      this.tag = value;
    };
    _proto.disableEdit = function disableEdit() {
      this.input.contentEditable = false;
    };
    _proto.isEditable = function isEditable() {
      return this.input.isContentEditable;
    };
    _proto.reset = function reset() {
      this.setValue('');
    };
    _proto.adjustTags = function adjustTags(element) {
      if (element.lastChild && element.lastChild.nodeName === 'BR') {
        main_core.Dom.remove(element.lastChild);
        this.adjustTags(element);
      }
      return element;
    };
    _proto.getValue = function getValue() {
      if (this.textOnly) {
        return this.input.innerText;
      }
      return this.adjustTags(main_core.Runtime.clone(this.input)).innerHTML.replace(/&nbsp;/g, '');
    };
    _proto.setFooterText = function setFooterText(text) {
      this.footer.innerText = text;
    };
    _proto.showFooter = function showFooter() {
      main_core.Dom.show(this.footer);
    };
    _proto.hideFooter = function hideFooter() {
      main_core.Dom.hide(this.footer);
    };
    _proto.setWarningStatus = function setWarningStatus() {
      main_core.Dom.addClass(this.getLayout(), 'landing-ui-field-warning');
    };
    _proto.unsetWarningStatus = function unsetWarningStatus() {
      main_core.Dom.removeClass(this.layout, 'landing-ui-field-warning');
    };
    return babelHelpers.createClass(TextField);
  }(landing_ui_field_basefield.BaseField);
  function _createFooter() {
    this.footer = main_core.Tag.render(_templateObject || (_templateObject = babelHelpers.taggedTemplateLiteral(["<div class=\"landing-ui-field-bottom ui-ctl-bottom\" hidden></div>"])));
    main_core.Dom.append(this.footer, this.getLayout());
  }
  exports.Text = TextField;
  exports.TextField = TextField;
})(this.BX.Landing.UI.Field = this.BX.Landing.UI.Field || {}, BX.Landing.UI.Field, BX, BX.Event, BX.Landing.UI.Component);
//# sourceMappingURL=textfield.bundle.js.map