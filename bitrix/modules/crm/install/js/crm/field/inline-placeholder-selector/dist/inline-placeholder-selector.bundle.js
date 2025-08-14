/* eslint-disable */
this.BX = this.BX || {};
this.BX.Crm = this.BX.Crm || {};
(function (exports,main_core,ui_entitySelector) {
	'use strict';

	var _templateObject, _templateObject2, _templateObject3, _templateObject4, _templateObject5, _templateObject6;
	function _classPrivateMethodInitSpec(obj, privateSet) { _checkPrivateRedeclaration(obj, privateSet); privateSet.add(obj); }
	function _classPrivateFieldInitSpec(obj, privateMap, value) { _checkPrivateRedeclaration(obj, privateMap); privateMap.set(obj, value); }
	function _checkPrivateRedeclaration(obj, privateCollection) { if (privateCollection.has(obj)) { throw new TypeError("Cannot initialize the same private elements twice on an object"); } }
	function _classPrivateMethodGet(receiver, privateSet, fn) { if (!privateSet.has(receiver)) { throw new TypeError("attempted to get private field on non-instance"); } return fn; }
	var InlinePlaceholderSelectorMode = {
	  INPUT: 'input',
	  TEXTAREA: 'textarea'
	};
	var _mode = /*#__PURE__*/new WeakMap();
	var _value = /*#__PURE__*/new WeakMap();
	var _target = /*#__PURE__*/new WeakMap();
	var _menuButton = /*#__PURE__*/new WeakMap();
	var _dialog = /*#__PURE__*/new WeakMap();
	var _inputElement = /*#__PURE__*/new WeakMap();
	var _entityTypeId = /*#__PURE__*/new WeakMap();
	var _getDialog = /*#__PURE__*/new WeakSet();
	var _render = /*#__PURE__*/new WeakSet();
	var _renderFormElement = /*#__PURE__*/new WeakSet();
	var _openMenu = /*#__PURE__*/new WeakSet();
	var _onSelect = /*#__PURE__*/new WeakSet();
	var InlinePlaceholderSelector = /*#__PURE__*/function () {
	  function InlinePlaceholderSelector(params) {
	    var _params$mode, _params$value;
	    babelHelpers.classCallCheck(this, InlinePlaceholderSelector);
	    _classPrivateMethodInitSpec(this, _onSelect);
	    _classPrivateMethodInitSpec(this, _openMenu);
	    _classPrivateMethodInitSpec(this, _renderFormElement);
	    _classPrivateMethodInitSpec(this, _render);
	    _classPrivateMethodInitSpec(this, _getDialog);
	    _classPrivateFieldInitSpec(this, _mode, {
	      writable: true,
	      value: void 0
	    });
	    _classPrivateFieldInitSpec(this, _value, {
	      writable: true,
	      value: void 0
	    });
	    _classPrivateFieldInitSpec(this, _target, {
	      writable: true,
	      value: void 0
	    });
	    _classPrivateFieldInitSpec(this, _menuButton, {
	      writable: true,
	      value: void 0
	    });
	    _classPrivateFieldInitSpec(this, _dialog, {
	      writable: true,
	      value: void 0
	    });
	    _classPrivateFieldInitSpec(this, _inputElement, {
	      writable: true,
	      value: void 0
	    });
	    _classPrivateFieldInitSpec(this, _entityTypeId, {
	      writable: true,
	      value: void 0
	    });
	    if (!main_core.Type.isDomNode(params.target)) {
	      throw new Error('Target DOM node not found');
	    }
	    babelHelpers.classPrivateFieldSet(this, _target, params.target);
	    babelHelpers.classPrivateFieldSet(this, _entityTypeId, main_core.Type.isInteger(params.entityTypeId) ? params.entityTypeId : 0);
	    babelHelpers.classPrivateFieldSet(this, _mode, (_params$mode = params.mode) !== null && _params$mode !== void 0 ? _params$mode : InlinePlaceholderSelectorMode.INPUT);
	    babelHelpers.classPrivateFieldSet(this, _value, (_params$value = params.value) !== null && _params$value !== void 0 ? _params$value : '');
	  }
	  babelHelpers.createClass(InlinePlaceholderSelector, [{
	    key: "show",
	    value: function show() {
	      main_core.Dom.append(_classPrivateMethodGet(this, _render, _render2).call(this), babelHelpers.classPrivateFieldGet(this, _target));
	    }
	  }, {
	    key: "getValue",
	    value: function getValue() {
	      var _babelHelpers$classPr;
	      return (_babelHelpers$classPr = babelHelpers.classPrivateFieldGet(this, _inputElement).value) !== null && _babelHelpers$classPr !== void 0 ? _babelHelpers$classPr : '';
	    }
	  }]);
	  return InlinePlaceholderSelector;
	}();
	function _getDialog2() {
	  var _this = this;
	  if (babelHelpers.classPrivateFieldGet(this, _dialog)) {
	    return babelHelpers.classPrivateFieldGet(this, _dialog);
	  }
	  babelHelpers.classPrivateFieldSet(this, _dialog, new ui_entitySelector.Dialog({
	    targetNode: babelHelpers.classPrivateFieldGet(this, _menuButton),
	    multiple: false,
	    showAvatars: false,
	    dropdownMode: true,
	    compactView: true,
	    enableSearch: true,
	    entities: [{
	      id: 'placeholder',
	      dynamicLoad: true,
	      dynamicSearch: false,
	      searchable: true,
	      options: {
	        entityTypeId: babelHelpers.classPrivateFieldGet(this, _entityTypeId)
	      }
	    }],
	    events: {
	      'Item:onSelect': function ItemOnSelect(event) {
	        var _event$getData = event.getData(),
	          selectedItem = _event$getData.item;
	        _classPrivateMethodGet(_this, _onSelect, _onSelect2).call(_this, selectedItem);
	      }
	    }
	  }));
	  return babelHelpers.classPrivateFieldGet(this, _dialog);
	}
	function _render2() {
	  babelHelpers.classPrivateFieldSet(this, _menuButton, main_core.Tag.render(_templateObject || (_templateObject = babelHelpers.taggedTemplateLiteral(["\n\t\t\t<span \n\t\t\tonclick=\"", "\"\n\t\t\tclass=\"crm-inline-placeholder-selector-dotted\"\n\t\t\t></span>\n\t\t"])), _classPrivateMethodGet(this, _openMenu, _openMenu2).bind(this)));
	  return main_core.Tag.render(_templateObject2 || (_templateObject2 = babelHelpers.taggedTemplateLiteral(["\n\t\t\t<div class=\"crm-inline-placeholder-selector\">\n\t\t\t\t", "\n\t\t\t\t", "\n\t\t\t</div>\n\t\t"])), _classPrivateMethodGet(this, _renderFormElement, _renderFormElement2).call(this), babelHelpers.classPrivateFieldGet(this, _menuButton));
	}
	function _renderFormElement2() {
	  if (babelHelpers.classPrivateFieldGet(this, _mode) === InlinePlaceholderSelectorMode.TEXTAREA) {
	    babelHelpers.classPrivateFieldSet(this, _inputElement, main_core.Tag.render(_templateObject3 || (_templateObject3 = babelHelpers.taggedTemplateLiteral(["<textarea class=\"ui-ctl-element\" name=\"subject\"></textarea>"]))));
	    babelHelpers.classPrivateFieldGet(this, _inputElement).value = babelHelpers.classPrivateFieldGet(this, _value);
	    return main_core.Tag.render(_templateObject4 || (_templateObject4 = babelHelpers.taggedTemplateLiteral(["\n\t\t\t\t<div class=\"ui-ctl ui-ctl-textarea ui-ctl-no-resize ui-ctl-w100\">\n\t\t\t\t\t", "\n\t\t\t\t</div>\n\t\t\t"])), babelHelpers.classPrivateFieldGet(this, _inputElement));
	  }
	  babelHelpers.classPrivateFieldSet(this, _inputElement, main_core.Tag.render(_templateObject5 || (_templateObject5 = babelHelpers.taggedTemplateLiteral(["<input type=\"text\" class=\"ui-ctl-element\" name=\"subject\">"]))));
	  babelHelpers.classPrivateFieldGet(this, _inputElement).value = babelHelpers.classPrivateFieldGet(this, _value);
	  return main_core.Tag.render(_templateObject6 || (_templateObject6 = babelHelpers.taggedTemplateLiteral(["\n\t\t\t<div class=\"ui-ctl ui-ctl-textbox ui-ctl-w100\">\n\t\t\t\t", "\n\t\t\t</div>\n\t\t"])), babelHelpers.classPrivateFieldGet(this, _inputElement));
	}
	function _openMenu2() {
	  _classPrivateMethodGet(this, _getDialog, _getDialog2).call(this).show();
	}
	function _onSelect2(selectedItem) {
	  var placeholder = "{".concat(selectedItem.customData.get('text'), "}");
	  var cursorPosition = babelHelpers.classPrivateFieldGet(this, _inputElement).selectionStart;
	  var currentValue = babelHelpers.classPrivateFieldGet(this, _inputElement).value;
	  babelHelpers.classPrivateFieldGet(this, _inputElement).value = currentValue.slice(0, cursorPosition) + placeholder + currentValue.slice(cursorPosition);
	  var newCursorPosition = cursorPosition + placeholder.length;
	  babelHelpers.classPrivateFieldGet(this, _inputElement).setSelectionRange(newCursorPosition, newCursorPosition);
	  babelHelpers.classPrivateFieldGet(this, _inputElement).focus();
	  _classPrivateMethodGet(this, _getDialog, _getDialog2).call(this).deselectAll();
	}

	exports.InlinePlaceholderSelectorMode = InlinePlaceholderSelectorMode;
	exports.InlinePlaceholderSelector = InlinePlaceholderSelector;

}((this.BX.Crm.Field = this.BX.Crm.Field || {}),BX,BX.UI.EntitySelector));
//# sourceMappingURL=inline-placeholder-selector.bundle.js.map
