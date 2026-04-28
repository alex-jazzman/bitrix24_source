/* eslint-disable */
this.BX = this.BX || {};
(function (exports,main_core,ui_system_dialog,ui_system_typography) {
	'use strict';

	var _templateObject;
	function ownKeys(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); enumerableOnly && (symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; })), keys.push.apply(keys, symbols); } return keys; }
	function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = null != arguments[i] ? arguments[i] : {}; i % 2 ? ownKeys(Object(source), !0).forEach(function (key) { babelHelpers.defineProperty(target, key, source[key]); }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)) : ownKeys(Object(source)).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } return target; }
	function _classPrivateMethodInitSpec(obj, privateSet) { _checkPrivateRedeclaration(obj, privateSet); privateSet.add(obj); }
	function _classPrivateFieldInitSpec(obj, privateMap, value) { _checkPrivateRedeclaration(obj, privateMap); privateMap.set(obj, value); }
	function _checkPrivateRedeclaration(obj, privateCollection) { if (privateCollection.has(obj)) { throw new TypeError("Cannot initialize the same private elements twice on an object"); } }
	function _classPrivateMethodGet(receiver, privateSet, fn) { if (!privateSet.has(receiver)) { throw new TypeError("attempted to get private field on non-instance"); } return fn; }
	var _isPopupClosedByUser = /*#__PURE__*/new WeakMap();
	var _loadingPopup = /*#__PURE__*/new WeakMap();
	var _loadingMessage = /*#__PURE__*/new WeakMap();
	var _errorMessage = /*#__PURE__*/new WeakMap();
	var _popupOptions = /*#__PURE__*/new WeakMap();
	var _callbacks = /*#__PURE__*/new WeakMap();
	var _hideLoadingPopup = /*#__PURE__*/new WeakSet();
	var _getDefaultPopupOptions = /*#__PURE__*/new WeakSet();
	var _getContent = /*#__PURE__*/new WeakSet();
	var LoadingPopup = /*#__PURE__*/function () {
	  function LoadingPopup() {
	    var options = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
	    babelHelpers.classCallCheck(this, LoadingPopup);
	    _classPrivateMethodInitSpec(this, _getContent);
	    _classPrivateMethodInitSpec(this, _getDefaultPopupOptions);
	    _classPrivateMethodInitSpec(this, _hideLoadingPopup);
	    _classPrivateFieldInitSpec(this, _isPopupClosedByUser, {
	      writable: true,
	      value: false
	    });
	    _classPrivateFieldInitSpec(this, _loadingPopup, {
	      writable: true,
	      value: null
	    });
	    _classPrivateFieldInitSpec(this, _loadingMessage, {
	      writable: true,
	      value: void 0
	    });
	    _classPrivateFieldInitSpec(this, _errorMessage, {
	      writable: true,
	      value: void 0
	    });
	    _classPrivateFieldInitSpec(this, _popupOptions, {
	      writable: true,
	      value: void 0
	    });
	    _classPrivateFieldInitSpec(this, _callbacks, {
	      writable: true,
	      value: void 0
	    });
	    babelHelpers.classPrivateFieldSet(this, _loadingMessage, options.loadingMessage || main_core.Loc.getMessage('BICONNECTOR_LOADING_POPUP_LOAD_MESSAGE'));
	    babelHelpers.classPrivateFieldSet(this, _errorMessage, options.errorMessage || main_core.Loc.getMessage('BICONNECTOR_LOADING_POPUP_LOAD_ERROR'));
	    var defaultOptions = _classPrivateMethodGet(this, _getDefaultPopupOptions, _getDefaultPopupOptions2).call(this);
	    babelHelpers.classPrivateFieldSet(this, _popupOptions, _objectSpread(_objectSpread({}, defaultOptions), options.popupOptions));
	    babelHelpers.classPrivateFieldSet(this, _callbacks, options.callbacks);
	  }
	  babelHelpers.createClass(LoadingPopup, [{
	    key: "showLoadPopup",
	    value: function showLoadPopup() {
	      var _this = this;
	      babelHelpers.classPrivateFieldSet(this, _isPopupClosedByUser, false);
	      babelHelpers.classPrivateFieldSet(this, _loadingPopup, new ui_system_dialog.Dialog(babelHelpers.classPrivateFieldGet(this, _popupOptions)));
	      babelHelpers.classPrivateFieldGet(this, _loadingPopup).show();
	      babelHelpers.classPrivateFieldGet(this, _callbacks).loadData().then(function (result) {
	        if (babelHelpers.classPrivateFieldGet(_this, _isPopupClosedByUser)) {
	          return;
	        }
	        _classPrivateMethodGet(_this, _hideLoadingPopup, _hideLoadingPopup2).call(_this);
	        if (babelHelpers.classPrivateFieldGet(_this, _callbacks).checkData(result)) {
	          babelHelpers.classPrivateFieldGet(_this, _callbacks).onSuccess();
	        } else {
	          babelHelpers.classPrivateFieldGet(_this, _callbacks).onFail();
	        }
	      })["catch"](function () {
	        _classPrivateMethodGet(_this, _hideLoadingPopup, _hideLoadingPopup2).call(_this);
	        BX.UI.Notification.Center.notify({
	          content: babelHelpers.classPrivateFieldGet(_this, _errorMessage)
	        });
	      });
	    }
	  }]);
	  return LoadingPopup;
	}();
	function _hideLoadingPopup2() {
	  if (babelHelpers.classPrivateFieldGet(this, _loadingPopup)) {
	    babelHelpers.classPrivateFieldGet(this, _loadingPopup).hide();
	    babelHelpers.classPrivateFieldSet(this, _loadingPopup, null);
	  }
	}
	function _getDefaultPopupOptions2() {
	  var _this2 = this;
	  return {
	    content: _classPrivateMethodGet(this, _getContent, _getContent2).call(this),
	    width: 400,
	    height: 176,
	    title: ' ',
	    hasCloseButton: true,
	    hasOverlay: true,
	    disableScrolling: false,
	    hasVerticalPadding: false,
	    hasHorizontalPadding: false,
	    events: {
	      onHide: function onHide() {
	        babelHelpers.classPrivateFieldSet(_this2, _isPopupClosedByUser, true);
	      }
	    }
	  };
	}
	function _getContent2() {
	  var loadingText = ui_system_typography.Text.render(babelHelpers.classPrivateFieldGet(this, _loadingMessage), {
	    size: 'sm'
	  });
	  return main_core.Tag.render(_templateObject || (_templateObject = babelHelpers.taggedTemplateLiteral(["\n\t\t\t<div class=\"biconnector-loading-popup\">\n\t\t\t\t<div class=\"biconnector-loading-popup-spinner-wrapper\">\n\t\t\t\t\t<img\n\t\t\t\t\t\tclass=\"biconnector-loading-popup-spinner\"\n\t\t\t\t\t\tsrc=\"/bitrix/js/biconnector/loading-popup/src/images/spinner.png\"\n\t\t\t\t\t\talt=\"Loading\"\n\t\t\t\t\t/>\n\t\t\t\t</div>\n\t\t\t\t<div class=\"biconnector-loading-popup-text\">\n\t\t\t\t\t", "\n\t\t\t\t</div>\n\t\t\t</div>\n\t\t"])), loadingText);
	}

	exports.LoadingPopup = LoadingPopup;

}((this.BX.Biconnector = this.BX.Biconnector || {}),BX,BX.UI.System,BX.UI.System.Typography));
