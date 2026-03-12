/* eslint-disable */
this.BX = this.BX || {};
this.BX.Bizproc = this.BX.Bizproc || {};
(function (exports,main_core,ui_entitySelector,main_core_events) {
	'use strict';

	function _classPrivateMethodInitSpec(obj, privateSet) { _checkPrivateRedeclaration(obj, privateSet); privateSet.add(obj); }
	function _classPrivateFieldInitSpec(obj, privateMap, value) { _checkPrivateRedeclaration(obj, privateMap); privateMap.set(obj, value); }
	function _checkPrivateRedeclaration(obj, privateCollection) { if (privateCollection.has(obj)) { throw new TypeError("Cannot initialize the same private elements twice on an object"); } }
	function _classPrivateMethodGet(receiver, privateSet, fn) { if (!privateSet.has(receiver)) { throw new TypeError("attempted to get private field on non-instance"); } return fn; }
	var _dialogId = /*#__PURE__*/new WeakMap();
	var _dialog = /*#__PURE__*/new WeakMap();
	var _codeInput = /*#__PURE__*/new WeakMap();
	var _onStateChange = /*#__PURE__*/new WeakMap();
	var _isUpdating = /*#__PURE__*/new WeakMap();
	var _initRouter = /*#__PURE__*/new WeakSet();
	var _bindEvents = /*#__PURE__*/new WeakSet();
	var _onDialogChange = /*#__PURE__*/new WeakSet();
	var _onCodeInputChange = /*#__PURE__*/new WeakSet();
	var _deselectDialog = /*#__PURE__*/new WeakSet();
	var _notifyStateChange = /*#__PURE__*/new WeakSet();
	var _onStorageRemove = /*#__PURE__*/new WeakSet();
	var StorageSelector = /*#__PURE__*/function () {
	  function StorageSelector(options) {
	    babelHelpers.classCallCheck(this, StorageSelector);
	    _classPrivateMethodInitSpec(this, _onStorageRemove);
	    _classPrivateMethodInitSpec(this, _notifyStateChange);
	    _classPrivateMethodInitSpec(this, _deselectDialog);
	    _classPrivateMethodInitSpec(this, _onCodeInputChange);
	    _classPrivateMethodInitSpec(this, _onDialogChange);
	    _classPrivateMethodInitSpec(this, _bindEvents);
	    _classPrivateMethodInitSpec(this, _initRouter);
	    _classPrivateFieldInitSpec(this, _dialogId, {
	      writable: true,
	      value: void 0
	    });
	    _classPrivateFieldInitSpec(this, _dialog, {
	      writable: true,
	      value: null
	    });
	    _classPrivateFieldInitSpec(this, _codeInput, {
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
	    babelHelpers.classPrivateFieldSet(this, _dialogId, options.dialogId);
	    babelHelpers.classPrivateFieldSet(this, _codeInput, options.storageCodeInput);
	    babelHelpers.classPrivateFieldSet(this, _onStateChange, options.onStateChange);
	    _classPrivateMethodGet(this, _initRouter, _initRouter2).call(this);
	  }
	  babelHelpers.createClass(StorageSelector, [{
	    key: "init",
	    value: function init() {
	      babelHelpers.classPrivateFieldSet(this, _dialog, ui_entitySelector.Dialog.getById(babelHelpers.classPrivateFieldGet(this, _dialogId)));
	      _classPrivateMethodGet(this, _bindEvents, _bindEvents2).call(this);
	    }
	  }]);
	  return StorageSelector;
	}();
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
	    var handler = _classPrivateMethodGet(this, _onDialogChange, _onDialogChange2).bind(this);
	    babelHelpers.classPrivateFieldGet(this, _dialog).subscribe('Item:onSelect', handler);
	    babelHelpers.classPrivateFieldGet(this, _dialog).subscribe('Item:onDeselect', handler);
	  }
	  if (babelHelpers.classPrivateFieldGet(this, _codeInput)) {
	    main_core.Event.bind(babelHelpers.classPrivateFieldGet(this, _codeInput), 'change', _classPrivateMethodGet(this, _onCodeInputChange, _onCodeInputChange2).bind(this));
	  }
	  main_core_events.EventEmitter.subscribe('BX.Bizproc.Component.StorageItemList:onStorageRemove', _classPrivateMethodGet(this, _onStorageRemove, _onStorageRemove2).bind(this));
	}
	function _onDialogChange2(event) {
	  if (babelHelpers.classPrivateFieldGet(this, _isUpdating)) {
	    return;
	  }
	  var data = event.getData();
	  var storageId = Number(data.item.id);
	  if (storageId > 0 && babelHelpers.classPrivateFieldGet(this, _codeInput)) {
	    babelHelpers.classPrivateFieldGet(this, _codeInput).value = '';
	  }
	  _classPrivateMethodGet(this, _notifyStateChange, _notifyStateChange2).call(this, storageId);
	}
	function _onCodeInputChange2() {
	  var _babelHelpers$classPr, _babelHelpers$classPr2, _babelHelpers$classPr3;
	  var currentDialogSelection = (_babelHelpers$classPr = babelHelpers.classPrivateFieldGet(this, _dialog)) === null || _babelHelpers$classPr === void 0 ? void 0 : (_babelHelpers$classPr2 = _babelHelpers$classPr.selectedItems.values()) === null || _babelHelpers$classPr2 === void 0 ? void 0 : (_babelHelpers$classPr3 = _babelHelpers$classPr2.next()) === null || _babelHelpers$classPr3 === void 0 ? void 0 : _babelHelpers$classPr3.value;
	  if (currentDialogSelection && babelHelpers.classPrivateFieldGet(this, _dialog)) {
	    _classPrivateMethodGet(this, _deselectDialog, _deselectDialog2).call(this);
	  }
	  _classPrivateMethodGet(this, _notifyStateChange, _notifyStateChange2).call(this);
	}
	function _deselectDialog2() {
	  babelHelpers.classPrivateFieldSet(this, _isUpdating, true);
	  babelHelpers.classPrivateFieldGet(this, _dialog).deselectAll();
	  babelHelpers.classPrivateFieldSet(this, _isUpdating, false);
	}
	function _notifyStateChange2() {
	  var storageId = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 0;
	  if (main_core.Type.isFunction(babelHelpers.classPrivateFieldGet(this, _onStateChange))) {
	    babelHelpers.classPrivateFieldGet(this, _onStateChange).call(this, storageId);
	  }
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

	exports.StorageSelector = StorageSelector;

}((this.BX.Bizproc.StorageSelector = this.BX.Bizproc.StorageSelector || {}),BX,BX.UI.EntitySelector,BX.Event));
//# sourceMappingURL=storage-selector.bundle.js.map
