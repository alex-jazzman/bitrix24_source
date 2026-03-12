/* eslint-disable */
this.BX = this.BX || {};
this.BX.Bizproc = this.BX.Bizproc || {};
(function (exports,ui_entitySelector,main_core) {
	'use strict';

	var _templateObject;
	function _classPrivateMethodInitSpec(obj, privateSet) { _checkPrivateRedeclaration(obj, privateSet); privateSet.add(obj); }
	function _checkPrivateRedeclaration(obj, privateCollection) { if (privateCollection.has(obj)) { throw new TypeError("Cannot initialize the same private elements twice on an object"); } }
	function _classPrivateMethodGet(receiver, privateSet, fn) { if (!privateSet.has(receiver)) { throw new TypeError("attempted to get private field on non-instance"); } return fn; }
	var _bindEvent = /*#__PURE__*/new WeakSet();
	var _onItemCreated = /*#__PURE__*/new WeakSet();
	var Footer = /*#__PURE__*/function (_DefaultFooter) {
	  babelHelpers.inherits(Footer, _DefaultFooter);
	  function Footer(dialog, options) {
	    var _this;
	    babelHelpers.classCallCheck(this, Footer);
	    _this = babelHelpers.possibleConstructorReturn(this, babelHelpers.getPrototypeOf(Footer).call(this, dialog, options));
	    _classPrivateMethodInitSpec(babelHelpers.assertThisInitialized(_this), _onItemCreated);
	    _classPrivateMethodInitSpec(babelHelpers.assertThisInitialized(_this), _bindEvent);
	    _this.label = options.label ? options.label.toString() : '';
	    _this.url = options.url ? options.url.toString() : '';
	    _this.itemLink = options.itemLink ? options.itemLink.toString() : '';
	    return _this;
	  }
	  babelHelpers.createClass(Footer, [{
	    key: "getContent",
	    value: function getContent() {
	      var link = main_core.Tag.render(_templateObject || (_templateObject = babelHelpers.taggedTemplateLiteral(["\n\t\t\t<span class=\"ui-selector-footer-link ui-selector-footer-link-add\">\n\t\t\t\t", "\n\t\t\t</span>\n\t\t"])), main_core.Text.encode(this.label));
	      _classPrivateMethodGet(this, _bindEvent, _bindEvent2).call(this, link);
	      return link;
	    }
	  }]);
	  return Footer;
	}(ui_entitySelector.DefaultFooter);
	function _bindEvent2(link) {
	  var _this2 = this;
	  main_core.Event.bind(link, 'click', function (event) {
	    event.preventDefault();
	    BX.SidePanel.Instance.open(_this2.url, {
	      width: 1000,
	      requestMethod: 'post',
	      events: {
	        onCloseComplete: function onCloseComplete(event) {
	          var slider = event.getSlider();
	          var dictionary = slider ? slider.getData() : null;
	          var data = null;
	          if (dictionary && dictionary.has('data')) {
	            var rawData = dictionary.get('data');
	            data = {
	              id: rawData.storageId || rawData.id || null,
	              title: rawData.storageTitle || rawData.title || ''
	            };
	            if (data) {
	              _classPrivateMethodGet(_this2, _onItemCreated, _onItemCreated2).call(_this2, data);
	            }
	          }
	        }
	      }
	    });
	  });
	}
	function _onItemCreated2(data) {
	  var item = this.getDialog().addItem({
	    id: data.id,
	    entityId: this.getDialog().getEntities()[0].id,
	    title: data.title,
	    link: "".concat(this.itemLink).concat(data.id)
	  });
	  item.select();
	}

	var _templateObject$1, _templateObject2;
	function ownKeys(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); enumerableOnly && (symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; })), keys.push.apply(keys, symbols); } return keys; }
	function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = null != arguments[i] ? arguments[i] : {}; i % 2 ? ownKeys(Object(source), !0).forEach(function (key) { babelHelpers.defineProperty(target, key, source[key]); }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)) : ownKeys(Object(source)).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } return target; }
	function _classPrivateMethodInitSpec$1(obj, privateSet) { _checkPrivateRedeclaration$1(obj, privateSet); privateSet.add(obj); }
	function _classPrivateFieldInitSpec(obj, privateMap, value) { _checkPrivateRedeclaration$1(obj, privateMap); privateMap.set(obj, value); }
	function _checkPrivateRedeclaration$1(obj, privateCollection) { if (privateCollection.has(obj)) { throw new TypeError("Cannot initialize the same private elements twice on an object"); } }
	function _classPrivateMethodGet$1(receiver, privateSet, fn) { if (!privateSet.has(receiver)) { throw new TypeError("attempted to get private field on non-instance"); } return fn; }
	var _containerId = /*#__PURE__*/new WeakMap();
	var _config = /*#__PURE__*/new WeakMap();
	var _inputName = /*#__PURE__*/new WeakMap();
	var _property = /*#__PURE__*/new WeakMap();
	var _initialValue = /*#__PURE__*/new WeakMap();
	var _container = /*#__PURE__*/new WeakMap();
	var _selector = /*#__PURE__*/new WeakMap();
	var _hiddenInputsContainer = /*#__PURE__*/new WeakMap();
	var _isMultiple = /*#__PURE__*/new WeakSet();
	var _createSelector = /*#__PURE__*/new WeakSet();
	var _createHiddenInputsContainer = /*#__PURE__*/new WeakSet();
	var _bindEvents = /*#__PURE__*/new WeakSet();
	var _updateInputValues = /*#__PURE__*/new WeakSet();
	var _renderHiddenInputs = /*#__PURE__*/new WeakSet();
	var _appendInput = /*#__PURE__*/new WeakSet();
	var _parseInitialValue = /*#__PURE__*/new WeakSet();
	var EntitySelector = /*#__PURE__*/function () {
	  function EntitySelector(options) {
	    babelHelpers.classCallCheck(this, EntitySelector);
	    _classPrivateMethodInitSpec$1(this, _parseInitialValue);
	    _classPrivateMethodInitSpec$1(this, _appendInput);
	    _classPrivateMethodInitSpec$1(this, _renderHiddenInputs);
	    _classPrivateMethodInitSpec$1(this, _updateInputValues);
	    _classPrivateMethodInitSpec$1(this, _bindEvents);
	    _classPrivateMethodInitSpec$1(this, _createHiddenInputsContainer);
	    _classPrivateMethodInitSpec$1(this, _createSelector);
	    _classPrivateMethodInitSpec$1(this, _isMultiple);
	    _classPrivateFieldInitSpec(this, _containerId, {
	      writable: true,
	      value: void 0
	    });
	    _classPrivateFieldInitSpec(this, _config, {
	      writable: true,
	      value: void 0
	    });
	    _classPrivateFieldInitSpec(this, _inputName, {
	      writable: true,
	      value: void 0
	    });
	    _classPrivateFieldInitSpec(this, _property, {
	      writable: true,
	      value: void 0
	    });
	    _classPrivateFieldInitSpec(this, _initialValue, {
	      writable: true,
	      value: void 0
	    });
	    _classPrivateFieldInitSpec(this, _container, {
	      writable: true,
	      value: null
	    });
	    _classPrivateFieldInitSpec(this, _selector, {
	      writable: true,
	      value: null
	    });
	    _classPrivateFieldInitSpec(this, _hiddenInputsContainer, {
	      writable: true,
	      value: null
	    });
	    babelHelpers.classPrivateFieldSet(this, _containerId, options.containerId);
	    babelHelpers.classPrivateFieldSet(this, _config, options.config || {});
	    babelHelpers.classPrivateFieldSet(this, _inputName, options.inputName);
	    babelHelpers.classPrivateFieldSet(this, _property, options.property);
	    babelHelpers.classPrivateFieldSet(this, _initialValue, options.initialValue || '');
	  }
	  babelHelpers.createClass(EntitySelector, [{
	    key: "init",
	    value: function init() {
	      babelHelpers.classPrivateFieldSet(this, _container, document.getElementById(babelHelpers.classPrivateFieldGet(this, _containerId)));
	      if (!babelHelpers.classPrivateFieldGet(this, _container)) {
	        return;
	      }
	      _classPrivateMethodGet$1(this, _createSelector, _createSelector2).call(this);
	      _classPrivateMethodGet$1(this, _createHiddenInputsContainer, _createHiddenInputsContainer2).call(this);
	      _classPrivateMethodGet$1(this, _renderHiddenInputs, _renderHiddenInputs2).call(this, _classPrivateMethodGet$1(this, _parseInitialValue, _parseInitialValue2).call(this, babelHelpers.classPrivateFieldGet(this, _initialValue)));
	      _classPrivateMethodGet$1(this, _bindEvents, _bindEvents2).call(this);
	    }
	  }, {
	    key: "destroy",
	    value: function destroy() {
	      babelHelpers.classPrivateFieldSet(this, _container, null);
	      babelHelpers.classPrivateFieldSet(this, _selector, null);
	      babelHelpers.classPrivateFieldSet(this, _hiddenInputsContainer, null);
	    }
	  }], [{
	    key: "create",
	    value: function create(options) {
	      var instance = new EntitySelector(options);
	      instance.init();
	      return instance;
	    }
	  }, {
	    key: "decorateNode",
	    value: function decorateNode(container, options) {
	      if (!container) {
	        return null;
	      }
	      if (!EntitySelector.selectors) {
	        EntitySelector.selectors = new WeakMap();
	      }
	      var selector = EntitySelector.selectors.get(container);
	      if (!selector) {
	        var config = JSON.parse(container.dataset.config || '{}');
	        config.containerId = container.id;
	        var configs = main_core.Type.isPlainObject(options) ? options : {};
	        config.config = _objectSpread(_objectSpread({}, config.config), configs);
	        selector = BX.Bizproc.EntitySelector.create(config);
	        EntitySelector.selectors.set(container, selector);
	      }
	      return selector;
	    }
	  }]);
	  return EntitySelector;
	}();
	function _isMultiple2() {
	  var multiple = babelHelpers.classPrivateFieldGet(this, _property).Multiple;
	  return multiple === true;
	}
	function _createSelector2() {
	  if (babelHelpers.classPrivateFieldGet(this, _config).dialogOptions.footerOptions) {
	    babelHelpers.classPrivateFieldGet(this, _config).dialogOptions.footer = Footer;
	  }
	  babelHelpers.classPrivateFieldGet(this, _config).dialogOptions.id = "entityselector_".concat(babelHelpers.classPrivateFieldGet(this, _inputName));
	  babelHelpers.classPrivateFieldSet(this, _selector, new ui_entitySelector.TagSelector(babelHelpers.classPrivateFieldGet(this, _config)));
	  babelHelpers.classPrivateFieldGet(this, _selector).renderTo(babelHelpers.classPrivateFieldGet(this, _container));
	}
	function _createHiddenInputsContainer2() {
	  babelHelpers.classPrivateFieldSet(this, _hiddenInputsContainer, main_core.Tag.render(_templateObject$1 || (_templateObject$1 = babelHelpers.taggedTemplateLiteral(["<div></div>"]))));
	  main_core.Dom.hide(babelHelpers.classPrivateFieldGet(this, _hiddenInputsContainer));
	  main_core.Dom.append(babelHelpers.classPrivateFieldGet(this, _hiddenInputsContainer), babelHelpers.classPrivateFieldGet(this, _container));
	}
	function _bindEvents2() {
	  var _babelHelpers$classPr,
	    _this = this;
	  if (!((_babelHelpers$classPr = babelHelpers.classPrivateFieldGet(this, _selector)) !== null && _babelHelpers$classPr !== void 0 && _babelHelpers$classPr.dialog)) {
	    return;
	  }
	  babelHelpers.classPrivateFieldGet(this, _selector).dialog.subscribe('Item:onSelect', function (event) {
	    _classPrivateMethodGet$1(_this, _updateInputValues, _updateInputValues2).call(_this);
	  });
	  babelHelpers.classPrivateFieldGet(this, _selector).dialog.subscribe('Item:onDeselect', function (event) {
	    _classPrivateMethodGet$1(_this, _updateInputValues, _updateInputValues2).call(_this);
	  });
	}
	function _updateInputValues2() {
	  if (!babelHelpers.classPrivateFieldGet(this, _selector)) {
	    return;
	  }
	  var dialog = babelHelpers.classPrivateFieldGet(this, _selector).getDialog();
	  if (!dialog) {
	    return;
	  }
	  var selectedItems = dialog.getSelectedItems();
	  var values = selectedItems.map(function (item) {
	    return String(item.getId());
	  });
	  _classPrivateMethodGet$1(this, _renderHiddenInputs, _renderHiddenInputs2).call(this, values);
	}
	function _renderHiddenInputs2(values) {
	  var _this2 = this;
	  if (!babelHelpers.classPrivateFieldGet(this, _hiddenInputsContainer)) {
	    return;
	  }
	  main_core.Dom.clean(babelHelpers.classPrivateFieldGet(this, _hiddenInputsContainer));
	  if (values.length === 0) {
	    _classPrivateMethodGet$1(this, _appendInput, _appendInput2).call(this, '');
	    return;
	  }
	  values.forEach(function (value) {
	    _classPrivateMethodGet$1(_this2, _appendInput, _appendInput2).call(_this2, value);
	  });
	}
	function _appendInput2(value) {
	  if (!babelHelpers.classPrivateFieldGet(this, _hiddenInputsContainer)) {
	    return;
	  }
	  var input = main_core.Tag.render(_templateObject2 || (_templateObject2 = babelHelpers.taggedTemplateLiteral(["<input type=\"hidden\" />"])));
	  input.name = _classPrivateMethodGet$1(this, _isMultiple, _isMultiple2).call(this) ? "".concat(babelHelpers.classPrivateFieldGet(this, _inputName), "[]") : babelHelpers.classPrivateFieldGet(this, _inputName);
	  input.value = value;
	  main_core.Dom.append(input, babelHelpers.classPrivateFieldGet(this, _hiddenInputsContainer));
	}
	function _parseInitialValue2(value) {
	  if (!value) {
	    return [];
	  }
	  if (_classPrivateMethodGet$1(this, _isMultiple, _isMultiple2).call(this) && main_core.Type.isArray(value)) {
	    return value;
	  }
	  return [value];
	}
	babelHelpers.defineProperty(EntitySelector, "selectors", null);
	BX.Bizproc.EntitySelector = EntitySelector;

	exports.EntitySelector = EntitySelector;

}((this.BX.Bizproc.EntitySelector = this.BX.Bizproc.EntitySelector || {}),BX.UI.EntitySelector,BX));
//# sourceMappingURL=bp-entity-selector.bundle.js.map
