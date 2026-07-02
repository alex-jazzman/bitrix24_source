/* eslint-disable */
this.BX = this.BX || {};
this.BX.Bizproc = this.BX.Bizproc || {};
(function (exports,main_core,ui_entitySelector,main_core_events) {
	'use strict';

	var _templateObject;
	function _classPrivateMethodInitSpec(obj, privateSet) { _checkPrivateRedeclaration(obj, privateSet); privateSet.add(obj); }
	function _classPrivateFieldInitSpec(obj, privateMap, value) { _checkPrivateRedeclaration(obj, privateMap); privateMap.set(obj, value); }
	function _checkPrivateRedeclaration(obj, privateCollection) { if (privateCollection.has(obj)) { throw new TypeError("Cannot initialize the same private elements twice on an object"); } }
	function _classPrivateMethodGet(receiver, privateSet, fn) { if (!privateSet.has(receiver)) { throw new TypeError("attempted to get private field on non-instance"); } return fn; }
	function _createForOfIteratorHelper(o, allowArrayLike) { var it = typeof Symbol !== "undefined" && o[Symbol.iterator] || o["@@iterator"]; if (!it) { if (Array.isArray(o) || (it = _unsupportedIterableToArray(o)) || allowArrayLike && o && typeof o.length === "number") { if (it) o = it; var i = 0; var F = function F() {}; return { s: F, n: function n() { if (i >= o.length) return { done: true }; return { done: false, value: o[i++] }; }, e: function e(_e) { throw _e; }, f: F }; } throw new TypeError("Invalid attempt to iterate non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); } var normalCompletion = true, didErr = false, err; return { s: function s() { it = it.call(o); }, n: function n() { var step = it.next(); normalCompletion = step.done; return step; }, e: function e(_e2) { didErr = true; err = _e2; }, f: function f() { try { if (!normalCompletion && it["return"] != null) it["return"](); } finally { if (didErr) throw err; } } }; }
	function _unsupportedIterableToArray(o, minLen) { if (!o) return; if (typeof o === "string") return _arrayLikeToArray(o, minLen); var n = Object.prototype.toString.call(o).slice(8, -1); if (n === "Object" && o.constructor) n = o.constructor.name; if (n === "Map" || n === "Set") return Array.from(o); if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return _arrayLikeToArray(o, minLen); }
	function _arrayLikeToArray(arr, len) { if (len == null || len > arr.length) len = arr.length; for (var i = 0, arr2 = new Array(len); i < len; i++) arr2[i] = arr[i]; return arr2; }
	function mapStorageBlocksToFilterFields(storageBlocks, baseFieldsMap) {
	  var result = new Map(baseFieldsMap);
	  var _iterator = _createForOfIteratorHelper(storageBlocks),
	    _step;
	  try {
	    for (_iterator.s(); !(_step = _iterator.n()).done;) {
	      var _block$activity;
	      var block = _step.value;
	      var properties = (_block$activity = block.activity) === null || _block$activity === void 0 ? void 0 : _block$activity.Properties;
	      if (!(properties !== null && properties !== void 0 && properties.StorageCode) || !main_core.Type.isArrayFilled(properties.SelectedFields)) {
	        continue;
	      }
	      var dynamicFields = properties.SelectedFields.map(function (field) {
	        return {
	          Id: field.code,
	          Name: field.name,
	          Type: field.type,
	          Expression: "{{".concat(field.name, "}}"),
	          SystemExpression: "{=Storage:{".concat(field.code, "}}"),
	          Options: field.settings || null,
	          Settings: field.settings || null,
	          Multiple: field.multiple || false
	        };
	      });
	      var baseFields = Object.values(result.get('0') || {});
	      result.set(String(properties.StorageCode), [].concat(baseFields, babelHelpers.toConsumableArray(dynamicFields)));
	    }
	  } catch (err) {
	    _iterator.e(err);
	  } finally {
	    _iterator.f();
	  }
	  return result;
	}
	function resolveCurrentStorageId(form) {
	  var _form$codeFieldName;
	  var codeFieldName = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 'storage_code';
	  var storageInput = form.querySelector('input[name="storage_id"]');
	  var storageIdValue = (storageInput === null || storageInput === void 0 ? void 0 : storageInput.value) || '';
	  var storageCodeValue = ((_form$codeFieldName = form[codeFieldName]) === null || _form$codeFieldName === void 0 ? void 0 : _form$codeFieldName.value) || '';
	  return !storageIdValue || storageIdValue === '0' ? storageCodeValue : storageIdValue;
	}
	var _dialog = /*#__PURE__*/new WeakMap();
	var _onStateChange = /*#__PURE__*/new WeakMap();
	var _isUpdating = /*#__PURE__*/new WeakMap();
	var _footerOptions = /*#__PURE__*/new WeakMap();
	var _initialValue = /*#__PURE__*/new WeakMap();
	var _storageCodeInput = /*#__PURE__*/new WeakMap();
	var _dynamicStorageCodes = /*#__PURE__*/new WeakMap();
	var _setupFooter = /*#__PURE__*/new WeakSet();
	var _onStorageCreated = /*#__PURE__*/new WeakSet();
	var _initRouter = /*#__PURE__*/new WeakSet();
	var _bindEvents = /*#__PURE__*/new WeakSet();
	var _onDialogChange = /*#__PURE__*/new WeakSet();
	var _onDialogDeselect = /*#__PURE__*/new WeakSet();
	var _notifyStateChange = /*#__PURE__*/new WeakSet();
	var _updateStorageCodeInput = /*#__PURE__*/new WeakSet();
	var _onStorageRemove = /*#__PURE__*/new WeakSet();
	var StorageSelector = /*#__PURE__*/function () {
	  function StorageSelector(options) {
	    babelHelpers.classCallCheck(this, StorageSelector);
	    _classPrivateMethodInitSpec(this, _onStorageRemove);
	    _classPrivateMethodInitSpec(this, _updateStorageCodeInput);
	    _classPrivateMethodInitSpec(this, _notifyStateChange);
	    _classPrivateMethodInitSpec(this, _onDialogDeselect);
	    _classPrivateMethodInitSpec(this, _onDialogChange);
	    _classPrivateMethodInitSpec(this, _bindEvents);
	    _classPrivateMethodInitSpec(this, _initRouter);
	    _classPrivateMethodInitSpec(this, _onStorageCreated);
	    _classPrivateMethodInitSpec(this, _setupFooter);
	    _classPrivateFieldInitSpec(this, _dialog, {
	      writable: true,
	      value: null
	    });
	    _classPrivateFieldInitSpec(this, _onStateChange, {
	      writable: true,
	      value: void 0
	    });
	    _classPrivateFieldInitSpec(this, _isUpdating, {
	      writable: true,
	      value: false
	    });
	    _classPrivateFieldInitSpec(this, _footerOptions, {
	      writable: true,
	      value: null
	    });
	    _classPrivateFieldInitSpec(this, _initialValue, {
	      writable: true,
	      value: ''
	    });
	    _classPrivateFieldInitSpec(this, _storageCodeInput, {
	      writable: true,
	      value: null
	    });
	    _classPrivateFieldInitSpec(this, _dynamicStorageCodes, {
	      writable: true,
	      value: new Set()
	    });
	    this.dialogId = options.dialogId;
	    babelHelpers.classPrivateFieldSet(this, _onStateChange, options.onStateChange);
	    babelHelpers.classPrivateFieldSet(this, _initialValue, options.initialValue || '');
	    babelHelpers.classPrivateFieldSet(this, _footerOptions, options.footerOptions || null);
	    babelHelpers.classPrivateFieldSet(this, _storageCodeInput, options.storageCodeInput || null);
	    _classPrivateMethodGet(this, _initRouter, _initRouter2).call(this);
	  }
	  babelHelpers.createClass(StorageSelector, [{
	    key: "init",
	    value: function init() {
	      var _this = this;
	      babelHelpers.classPrivateFieldSet(this, _dialog, ui_entitySelector.Dialog.getById(this.dialogId));
	      if (babelHelpers.classPrivateFieldGet(this, _dialog) && babelHelpers.classPrivateFieldGet(this, _footerOptions)) {
	        _classPrivateMethodGet(this, _setupFooter, _setupFooter2).call(this);
	      }
	      _classPrivateMethodGet(this, _bindEvents, _bindEvents2).call(this);
	      main_core_events.EventEmitter.subscribeOnce('BX.Bizproc.CommonNodeSettings:onBlocksReady', function (event) {
	        var _event$getData = event.getData(),
	          blocks = _event$getData.blocks;
	        var storageBlocks = (blocks || []).filter(function (block) {
	          var _block$activity2;
	          return ((_block$activity2 = block.activity) === null || _block$activity2 === void 0 ? void 0 : _block$activity2.Type) === 'CreateStorageNode';
	        });
	        storageBlocks.forEach(function (block) {
	          var _block$activity$Prope, _block$activity3;
	          var properties = (_block$activity$Prope = (_block$activity3 = block.activity) === null || _block$activity3 === void 0 ? void 0 : _block$activity3.Properties) !== null && _block$activity$Prope !== void 0 ? _block$activity$Prope : {};
	          if (main_core.Type.isStringFilled(properties.StorageCode) && main_core.Type.isFunction(babelHelpers.classPrivateFieldGet(_this, _dialog).addItem)) {
	            babelHelpers.classPrivateFieldGet(_this, _dynamicStorageCodes).add(String(properties.StorageCode));
	            babelHelpers.classPrivateFieldGet(_this, _dialog).addItem({
	              id: properties.StorageCode,
	              entityId: 'dynamic-storage',
	              title: properties.StorageTitle,
	              caption: main_core.Loc.getMessage('BIZPROC_JS_STORAGE_SELECTOR_DYNAMIC') || '',
	              tabs: 'recents'
	            });
	          }
	        });
	        if (main_core.Type.isFunction(babelHelpers.classPrivateFieldGet(_this, _dialog).getItem)) {
	          var item = babelHelpers.classPrivateFieldGet(_this, _dialog).getItem({
	            id: babelHelpers.classPrivateFieldGet(_this, _initialValue),
	            entityId: 'dynamic-storage'
	          });
	          if (item) {
	            babelHelpers.classPrivateFieldSet(_this, _isUpdating, true);
	            item.select();
	            babelHelpers.classPrivateFieldSet(_this, _isUpdating, false);
	          }
	        }
	      });
	    }
	  }, {
	    key: "destroy",
	    value: function destroy() {
	      var dialog = ui_entitySelector.Dialog.getById(this.dialogId);
	      if (dialog) {
	        dialog.destroy();
	      }
	    }
	  }]);
	  return StorageSelector;
	}();
	function _setupFooter2() {
	  var _babelHelpers$classPr,
	    _this2 = this;
	  var label = ((_babelHelpers$classPr = babelHelpers.classPrivateFieldGet(this, _footerOptions)) === null || _babelHelpers$classPr === void 0 ? void 0 : _babelHelpers$classPr.label) || '';
	  var footer = main_core.Tag.render(_templateObject || (_templateObject = babelHelpers.taggedTemplateLiteral(["\n\t\t\t<span class=\"ui-selector-footer-link ui-selector-footer-link-add\">\n\t\t\t\t", "\n\t\t\t</span>\n\t\t"])), main_core.Text.encode(label));
	  main_core.Event.bind(footer, 'click', function () {
	    BX.SidePanel.Instance.open('/bitrix/components/bitrix/bizproc.storage.edit/', {
	      width: 1000,
	      cacheable: false,
	      events: {
	        onCloseComplete: function onCloseComplete(event) {
	          _classPrivateMethodGet(_this2, _onStorageCreated, _onStorageCreated2).call(_this2, event);
	        }
	      }
	    });
	  });
	  babelHelpers.classPrivateFieldGet(this, _dialog).setFooter(footer);
	}
	function _onStorageCreated2(event) {
	  var _babelHelpers$classPr2, _babelHelpers$classPr3;
	  var slider = event.getSlider();
	  var dictionary = slider ? slider.getData() : null;
	  if (!dictionary || !dictionary.has('data')) {
	    return;
	  }
	  var data = dictionary.get('data');
	  var storageId = Number(data.storageId || data.id) || null;
	  var title = data.storageTitle || data.title || '';
	  if (!storageId) {
	    return;
	  }
	  var entityId = ((_babelHelpers$classPr2 = babelHelpers.classPrivateFieldGet(this, _dialog).getEntities()[0]) === null || _babelHelpers$classPr2 === void 0 ? void 0 : _babelHelpers$classPr2.id) || 'bizproc-storage';
	  var itemLink = ((_babelHelpers$classPr3 = babelHelpers.classPrivateFieldGet(this, _footerOptions)) === null || _babelHelpers$classPr3 === void 0 ? void 0 : _babelHelpers$classPr3.itemLink) || '';
	  var item = babelHelpers.classPrivateFieldGet(this, _dialog).addItem({
	    id: storageId,
	    entityId: entityId,
	    title: title,
	    link: itemLink ? "".concat(itemLink).concat(storageId) : '',
	    tabs: 'recents'
	  });
	  if (item) {
	    item.select();
	  }
	}
	function _initRouter2() {
	  main_core.Runtime.loadExtension('bizproc.router').then(function (_ref) {
	    var Router = _ref.Router;
	    return Router.init();
	  })["catch"](function (e) {
	    return console.error(e);
	  });
	}
	function _bindEvents2() {
	  if (babelHelpers.classPrivateFieldGet(this, _dialog)) {
	    babelHelpers.classPrivateFieldGet(this, _dialog).subscribe('Item:onSelect', _classPrivateMethodGet(this, _onDialogChange, _onDialogChange2).bind(this));
	    babelHelpers.classPrivateFieldGet(this, _dialog).subscribe('Item:onDeselect', _classPrivateMethodGet(this, _onDialogDeselect, _onDialogDeselect2).bind(this));
	  }
	  main_core_events.EventEmitter.subscribe('BX.Bizproc.Component.StorageItemList:onStorageRemove', _classPrivateMethodGet(this, _onStorageRemove, _onStorageRemove2).bind(this));
	}
	function _onDialogChange2(event) {
	  if (babelHelpers.classPrivateFieldGet(this, _isUpdating)) {
	    return;
	  }
	  var data = event.getData();
	  var storageId = String(data.item.id);
	  _classPrivateMethodGet(this, _notifyStateChange, _notifyStateChange2).call(this, storageId);
	}
	function _onDialogDeselect2() {
	  if (babelHelpers.classPrivateFieldGet(this, _isUpdating)) {
	    return;
	  }
	  _classPrivateMethodGet(this, _notifyStateChange, _notifyStateChange2).call(this);
	}
	function _notifyStateChange2() {
	  var storageId = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : '';
	  _classPrivateMethodGet(this, _updateStorageCodeInput, _updateStorageCodeInput2).call(this, storageId);
	  if (main_core.Type.isFunction(babelHelpers.classPrivateFieldGet(this, _onStateChange))) {
	    babelHelpers.classPrivateFieldGet(this, _onStateChange).call(this, storageId);
	  }
	}
	function _updateStorageCodeInput2(storageId) {
	  if (!babelHelpers.classPrivateFieldGet(this, _storageCodeInput)) {
	    return;
	  }
	  babelHelpers.classPrivateFieldGet(this, _storageCodeInput).value = babelHelpers.classPrivateFieldGet(this, _dynamicStorageCodes).has(storageId) ? storageId : '';
	}
	function _onStorageRemove2(event) {
	  var storageId = Number(event.getData().storageId);
	  if (storageId <= 0 || !babelHelpers.classPrivateFieldGet(this, _dialog)) {
	    return;
	  }
	  var item = babelHelpers.classPrivateFieldGet(this, _dialog).getItem({
	    id: storageId,
	    entityId: 'bizproc-storage'
	  });
	  if (item) {
	    babelHelpers.classPrivateFieldGet(this, _dialog).removeItem(item);
	    _classPrivateMethodGet(this, _notifyStateChange, _notifyStateChange2).call(this);
	  }
	}

	exports.mapStorageBlocksToFilterFields = mapStorageBlocksToFilterFields;
	exports.resolveCurrentStorageId = resolveCurrentStorageId;
	exports.StorageSelector = StorageSelector;

}((this.BX.Bizproc.StorageSelector = this.BX.Bizproc.StorageSelector || {}),BX,BX.UI.EntitySelector,BX.Event));
//# sourceMappingURL=storage-selector.bundle.js.map
