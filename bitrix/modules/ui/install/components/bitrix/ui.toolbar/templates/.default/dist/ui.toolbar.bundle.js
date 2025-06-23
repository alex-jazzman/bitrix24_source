/* eslint-disable */
this.BX = this.BX || {};
(function (exports,ui_buttons,main_core,main_popup) {
	'use strict';

	function _classPrivateMethodInitSpec(obj, privateSet) { _checkPrivateRedeclaration(obj, privateSet); privateSet.add(obj); }
	function _classPrivateFieldInitSpec(obj, privateMap, value) { _checkPrivateRedeclaration(obj, privateMap); privateMap.set(obj, value); }
	function _checkPrivateRedeclaration(obj, privateCollection) { if (privateCollection.has(obj)) { throw new TypeError("Cannot initialize the same private elements twice on an object"); } }
	function _classPrivateMethodGet(receiver, privateSet, fn) { if (!privateSet.has(receiver)) { throw new TypeError("attempted to get private field on non-instance"); } return fn; }
	var TitleEditorEvents = {
	  beforeStartEditing: 'beforeStartEditing',
	  startEditing: 'startEditing',
	  finishEditing: 'finishEditing'
	};
	var _initialTitle = /*#__PURE__*/new WeakMap();
	var _defaultTitle = /*#__PURE__*/new WeakMap();
	var _toolbarNode = /*#__PURE__*/new WeakMap();
	var _titleNode = /*#__PURE__*/new WeakMap();
	var _inputNode = /*#__PURE__*/new WeakMap();
	var _editTitleButtonNode = /*#__PURE__*/new WeakMap();
	var _editTitleResultButtonsContainer = /*#__PURE__*/new WeakMap();
	var _titleIconButtonsContainer = /*#__PURE__*/new WeakMap();
	var _saveTitleButton = /*#__PURE__*/new WeakMap();
	var _cancelTitleEditButton = /*#__PURE__*/new WeakMap();
	var _isInit = /*#__PURE__*/new WeakMap();
	var _init = /*#__PURE__*/new WeakSet();
	var TitleEditor = /*#__PURE__*/function (_Event$EventEmitter) {
	  babelHelpers.inherits(TitleEditor, _Event$EventEmitter);
	  // #dataContainer: ?HTMLElement;

	  // #dataNode: ?HTMLElement;

	  function TitleEditor(options) {
	    var _this;
	    babelHelpers.classCallCheck(this, TitleEditor);
	    _this = babelHelpers.possibleConstructorReturn(this, babelHelpers.getPrototypeOf(TitleEditor).call(this, options));
	    _classPrivateMethodInitSpec(babelHelpers.assertThisInitialized(_this), _init);
	    _classPrivateFieldInitSpec(babelHelpers.assertThisInitialized(_this), _initialTitle, {
	      writable: true,
	      value: void 0
	    });
	    _classPrivateFieldInitSpec(babelHelpers.assertThisInitialized(_this), _defaultTitle, {
	      writable: true,
	      value: void 0
	    });
	    _classPrivateFieldInitSpec(babelHelpers.assertThisInitialized(_this), _toolbarNode, {
	      writable: true,
	      value: void 0
	    });
	    _classPrivateFieldInitSpec(babelHelpers.assertThisInitialized(_this), _titleNode, {
	      writable: true,
	      value: void 0
	    });
	    _classPrivateFieldInitSpec(babelHelpers.assertThisInitialized(_this), _inputNode, {
	      writable: true,
	      value: void 0
	    });
	    _classPrivateFieldInitSpec(babelHelpers.assertThisInitialized(_this), _editTitleButtonNode, {
	      writable: true,
	      value: void 0
	    });
	    _classPrivateFieldInitSpec(babelHelpers.assertThisInitialized(_this), _editTitleResultButtonsContainer, {
	      writable: true,
	      value: void 0
	    });
	    _classPrivateFieldInitSpec(babelHelpers.assertThisInitialized(_this), _titleIconButtonsContainer, {
	      writable: true,
	      value: void 0
	    });
	    _classPrivateFieldInitSpec(babelHelpers.assertThisInitialized(_this), _saveTitleButton, {
	      writable: true,
	      value: void 0
	    });
	    _classPrivateFieldInitSpec(babelHelpers.assertThisInitialized(_this), _cancelTitleEditButton, {
	      writable: true,
	      value: void 0
	    });
	    _classPrivateFieldInitSpec(babelHelpers.assertThisInitialized(_this), _isInit, {
	      writable: true,
	      value: false
	    });
	    _this.setEventNamespace('UI.Toolbar.TitleEditor');
	    _classPrivateMethodGet(babelHelpers.assertThisInitialized(_this), _init, _init2).call(babelHelpers.assertThisInitialized(_this), options);
	    return _this;
	  }
	  babelHelpers.createClass(TitleEditor, [{
	    key: "enable",
	    value: function enable() {
	      var isDisable = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : false;
	      if (!babelHelpers.classPrivateFieldGet(this, _isInit)) {
	        return;
	      }
	      this.changeDisplay(babelHelpers.classPrivateFieldGet(this, _editTitleButtonNode), isDisable === false);
	      // this.titleNode.textContent = isDisable === false
	      // 	? (this.dataNode.value ?? this.defaultTitle)
	      // 	: this.initialTitle
	      // ;

	      babelHelpers.classPrivateFieldGet(this, _titleNode).textContent = babelHelpers.classPrivateFieldGet(this, _initialTitle);
	    }
	  }, {
	    key: "disable",
	    value: function disable() {
	      this.enable(true);
	    } // onDataNodeChange()
	    // {
	    // 	this.#titleNode.textContent = this.#dataNode.value;
	    // }
	  }, {
	    key: "onKeyUp",
	    value: function onKeyUp(event) {
	      if (event.key === 'Enter') {
	        this.finishEdit();
	        event.preventDefault();
	        return false;
	      }
	      return true;
	    }
	  }, {
	    key: "startEdit",
	    value: function startEdit() {
	      // this.inputNode.value = this.dataNode.value || this.titleNode.textContent;

	      var event = new main_core.Event.BaseEvent();
	      this.emit(TitleEditorEvents.beforeStartEditing, event);
	      if (event.isDefaultPrevented()) {
	        return;
	      }
	      babelHelpers.classPrivateFieldGet(this, _inputNode).value = babelHelpers.classPrivateFieldGet(this, _titleNode).textContent;
	      this.changeDisplay(babelHelpers.classPrivateFieldGet(this, _titleNode), false);
	      this.changeDisplay(babelHelpers.classPrivateFieldGet(this, _editTitleButtonNode), false);
	      this.changeDisplay(babelHelpers.classPrivateFieldGet(this, _inputNode), true);
	      this.changeDisplay(babelHelpers.classPrivateFieldGet(this, _titleIconButtonsContainer), false);
	      main_core.Dom.addClass(babelHelpers.classPrivateFieldGet(this, _editTitleResultButtonsContainer), '--show');
	      main_core.Dom.addClass(babelHelpers.classPrivateFieldGet(this, _toolbarNode), '--title-editing');
	      babelHelpers.classPrivateFieldGet(this, _inputNode).focus();
	      this.emit(TitleEditorEvents.startEditing);
	    }
	  }, {
	    key: "finishEdit",
	    value: function finishEdit() {
	      // this.dataNode.value = this.inputNode.value;
	      babelHelpers.classPrivateFieldGet(this, _titleNode).textContent = babelHelpers.classPrivateFieldGet(this, _inputNode).value;
	      this.changeDisplay(babelHelpers.classPrivateFieldGet(this, _inputNode), false);
	      this.changeDisplay(babelHelpers.classPrivateFieldGet(this, _editTitleButtonNode), true);
	      this.changeDisplay(babelHelpers.classPrivateFieldGet(this, _titleNode), true);
	      this.changeDisplay(babelHelpers.classPrivateFieldGet(this, _titleIconButtonsContainer), true);
	      main_core.Dom.removeClass(babelHelpers.classPrivateFieldGet(this, _editTitleResultButtonsContainer), '--show');
	      main_core.Dom.removeClass(babelHelpers.classPrivateFieldGet(this, _toolbarNode), '--title-editing');
	      this.emit(TitleEditorEvents.finishEditing, {
	        updatedTitle: babelHelpers.classPrivateFieldGet(this, _inputNode).value
	      });
	    }
	  }, {
	    key: "cancelEdit",
	    value: function cancelEdit() {
	      this.changeDisplay(babelHelpers.classPrivateFieldGet(this, _inputNode), false);
	      this.changeDisplay(babelHelpers.classPrivateFieldGet(this, _editTitleButtonNode), true);
	      this.changeDisplay(babelHelpers.classPrivateFieldGet(this, _titleNode), true);
	      this.changeDisplay(babelHelpers.classPrivateFieldGet(this, _titleIconButtonsContainer), true);
	      main_core.Dom.removeClass(babelHelpers.classPrivateFieldGet(this, _editTitleResultButtonsContainer), '--show');
	      main_core.Dom.removeClass(babelHelpers.classPrivateFieldGet(this, _toolbarNode), '--title-editing');
	    }
	  }, {
	    key: "changeDisplay",
	    value: function changeDisplay(node, isShow) {
	      var displayValue = isShow ? '' : 'none';
	      main_core.Dom.style(node, 'display', displayValue);
	      return displayValue;
	    }
	  }]);
	  return TitleEditor;
	}(main_core.Event.EventEmitter);
	function _init2(params) {
	  var _this2 = this;
	  // if (!params.selector)
	  // {
	  // 	return;
	  // }
	  //
	  // this.dataContainer = document.querySelector(params.selector);
	  // if (!this.dataContainer)
	  // {
	  // 	return;
	  // }
	  //
	  // Dom.style(this.dataContainer, 'display', 'none');

	  babelHelpers.classPrivateFieldSet(this, _toolbarNode, document.getElementById('uiToolbarContainer'));
	  babelHelpers.classPrivateFieldSet(this, _titleNode, document.querySelector('.ui-wrap-title-name'));
	  babelHelpers.classPrivateFieldSet(this, _inputNode, document.querySelector('.ui-toolbar-edit-title-input'));
	  babelHelpers.classPrivateFieldSet(this, _editTitleButtonNode, document.querySelector('.ui-toolbar-edit-title-button'));
	  babelHelpers.classPrivateFieldSet(this, _editTitleResultButtonsContainer, document.getElementById('ui-toolbar-title-edit-result-buttons'));
	  babelHelpers.classPrivateFieldSet(this, _saveTitleButton, document.getElementById('ui-toolbar-save-title-button'));
	  babelHelpers.classPrivateFieldSet(this, _cancelTitleEditButton, document.getElementById('ui-toolbar-cancel-title-edit-button'));
	  babelHelpers.classPrivateFieldSet(this, _titleIconButtonsContainer, document.getElementById('ui-toolbar-title-item-box-buttons'));
	  babelHelpers.classPrivateFieldSet(this, _initialTitle, babelHelpers.classPrivateFieldGet(this, _titleNode).textContent);
	  babelHelpers.classPrivateFieldSet(this, _defaultTitle, params.defaultTitle);

	  // bind(this.dataNode, 'bxchange', this.onDataNodeChange.bind(this));
	  main_core.bind(babelHelpers.classPrivateFieldGet(this, _editTitleButtonNode), 'click', this.startEdit.bind(this));
	  main_core.bind(babelHelpers.classPrivateFieldGet(this, _inputNode), 'keyup', this.onKeyUp.bind(this));
	  main_core.bind(babelHelpers.classPrivateFieldGet(this, _inputNode), 'blur', function (event) {
	    if (event.relatedTarget === babelHelpers.classPrivateFieldGet(_this2, _cancelTitleEditButton)) {
	      _this2.cancelEdit();
	      return;
	    }
	    _this2.finishEdit();
	  });
	  main_core.bind(babelHelpers.classPrivateFieldGet(this, _saveTitleButton), 'click', this.finishEdit.bind(this));
	  main_core.bind(babelHelpers.classPrivateFieldGet(this, _cancelTitleEditButton), 'click', this.cancelEdit.bind(this));
	  babelHelpers.classPrivateFieldSet(this, _isInit, true);
	  if (!params.disabled) {
	    this.enable();
	  }
	}

	var ToolbarStar = /*#__PURE__*/function () {
	  function ToolbarStar() {
	    var _this = this;
	    babelHelpers.classCallCheck(this, ToolbarStar);
	    this.initialized = false;
	    this.currentPageInMenu = false;
	    this.starContNode = null;
	    main_core.ready(function () {
	      return _this.init();
	    });
	    main_core.Event.EventEmitter.subscribe('onFrameDataProcessed', function () {
	      _this.init();
	    });
	    // BX.addCustomEvent('onFrameDataProcessed', () => this.init());
	  }
	  babelHelpers.createClass(ToolbarStar, [{
	    key: "init",
	    value: function init() {
	      var _this2 = this;
	      this.starContNode = document.getElementById('uiToolbarStar');
	      if (!this.starContNode || this.initialized) {
	        return false;
	      }
	      this.initialized = true;
	      var currentFullPath = main_core.Dom.attr(this.starContNode, 'data-bx-url');
	      if (!main_core.Type.isStringFilled(currentFullPath)) {
	        currentFullPath = document.location.pathname + document.location.search;
	      }
	      currentFullPath = main_core.Uri.removeParam(currentFullPath, ['IFRAME', 'IFRAME_TYPE']);
	      top.BX.addCustomEvent('BX.Bitrix24.LeftMenuClass:onSendMenuItemData', function (params) {
	        _this2.processMenuItemData(params);
	      });
	      top.BX.addCustomEvent('BX.Bitrix24.LeftMenuClass:onStandardItemChangedSuccess', function (params) {
	        _this2.onStandardItemChangedSuccess(params);
	      });
	      top.BX.onCustomEvent('UI.Toolbar:onRequestMenuItemData', [{
	        currentFullPath: currentFullPath,
	        context: window
	      }]);
	      return true;
	    }
	  }, {
	    key: "processMenuItemData",
	    value: function processMenuItemData(params) {
	      var _this3 = this;
	      if (params.context && params.context !== window) {
	        return;
	      }
	      this.currentPageInMenu = params.currentPageInMenu;
	      if (main_core.Type.isObjectLike(params.currentPageInMenu)) {
	        main_core.Dom.addClass(this.starContNode, 'ui-toolbar-star-active');
	      }
	      this.starContNode.title = main_core.Loc.getMessage(main_core.Dom.hasClass(this.starContNode, 'ui-toolbar-star-active') ? 'UI_TOOLBAR_DELETE_PAGE_FROM_LEFT_MENU' : 'UI_TOOLBAR_ADD_PAGE_TO_LEFT_MENU');

	      // default page
	      if (main_core.Type.isDomNode(this.currentPageInMenu) && main_core.Dom.attr(this.currentPageInMenu, 'data-type') !== 'standard') {
	        this.starContNode.title = main_core.Loc.getMessage('UI_TOOLBAR_STAR_TITLE_DEFAULT_PAGE');
	        main_core.bind(this.starContNode, 'click', function () {
	          _this3.showMessage(main_core.Loc.getMessage('UI_TOOLBAR_STAR_TITLE_DEFAULT_PAGE_DELETE_ERROR'));
	        });
	        return true;
	      }

	      // any page
	      main_core.bind(this.starContNode, 'click', function () {
	        var _document$getElementB;
	        var pageTitle = ((_document$getElementB = document.getElementById('pagetitle')) === null || _document$getElementB === void 0 ? void 0 : _document$getElementB.innerText) || '';
	        var titleTemplate = _this3.starContNode.getAttribute('data-bx-title-template');
	        if (main_core.Type.isStringFilled(titleTemplate)) {
	          pageTitle = titleTemplate.replace(/#page_title#/i, pageTitle);
	        }
	        var pageLink = _this3.starContNode.getAttribute('data-bx-url');
	        if (!main_core.Type.isStringFilled(pageLink)) {
	          pageLink = document.location.pathname + document.location.search;
	        }
	        pageLink = main_core.Uri.removeParam(pageLink, ['IFRAME', 'IFRAME_TYPE']);
	        top.BX.onCustomEvent('UI.Toolbar:onStarClick', [{
	          isActive: main_core.Dom.hasClass(_this3.starContNode, 'ui-toolbar-star-active'),
	          context: window,
	          pageTitle: pageTitle,
	          pageLink: pageLink
	        }]);
	      });
	    }
	  }, {
	    key: "onStandardItemChangedSuccess",
	    value: function onStandardItemChangedSuccess(params) {
	      if (!main_core.Type.isBoolean(params.isActive) || !this.starContNode || params.context && params.context !== window) {
	        return;
	      }
	      if (params.isActive) {
	        this.showMessage(main_core.Loc.getMessage('UI_TOOLBAR_ITEM_WAS_ADDED_TO_LEFT'));
	        this.starContNode.title = main_core.Loc.getMessage('UI_TOOLBAR_DELETE_PAGE_FROM_LEFT_MENU');
	        main_core.Dom.addClass(this.starContNode, 'ui-toolbar-star-active');
	      } else {
	        this.showMessage(main_core.Loc.getMessage('UI_TOOLBAR_ITEM_WAS_DELETED_FROM_LEFT'));
	        this.starContNode.title = main_core.Loc.getMessage('UI_TOOLBAR_ADD_PAGE_TO_LEFT_MENU');
	        main_core.Dom.removeClass(this.starContNode, 'ui-toolbar-star-active');
	      }
	    }
	  }, {
	    key: "showMessage",
	    value: function showMessage(message) {
	      var popup = main_popup.PopupWindowManager.create('left-menu-message', this.starContNode, {
	        content: message,
	        darkMode: true,
	        offsetTop: 2,
	        offsetLeft: 0,
	        angle: true,
	        autoHide: true,
	        events: {
	          onPopupClose: function onPopupClose() {
	            if (popup) {
	              popup.destroy();
	              popup = null;
	            }
	          }
	        }
	      });
	      popup.show();
	      setTimeout(function () {
	        if (popup) {
	          popup.destroy();
	          popup = null;
	        }
	      }, 3000);
	    }
	  }]);
	  return ToolbarStar;
	}();

	function ownKeys(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); enumerableOnly && (symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; })), keys.push.apply(keys, symbols); } return keys; }
	function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = null != arguments[i] ? arguments[i] : {}; i % 2 ? ownKeys(Object(source), !0).forEach(function (key) { babelHelpers.defineProperty(target, key, source[key]); }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)) : ownKeys(Object(source)).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } return target; }
	function _createForOfIteratorHelper(o, allowArrayLike) { var it = typeof Symbol !== "undefined" && o[Symbol.iterator] || o["@@iterator"]; if (!it) { if (Array.isArray(o) || (it = _unsupportedIterableToArray(o)) || allowArrayLike && o && typeof o.length === "number") { if (it) o = it; var i = 0; var F = function F() {}; return { s: F, n: function n() { if (i >= o.length) return { done: true }; return { done: false, value: o[i++] }; }, e: function e(_e) { throw _e; }, f: F }; } throw new TypeError("Invalid attempt to iterate non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); } var normalCompletion = true, didErr = false, err; return { s: function s() { it = it.call(o); }, n: function n() { var step = it.next(); normalCompletion = step.done; return step; }, e: function e(_e2) { didErr = true; err = _e2; }, f: function f() { try { if (!normalCompletion && it["return"] != null) it["return"](); } finally { if (didErr) throw err; } } }; }
	function _unsupportedIterableToArray(o, minLen) { if (!o) return; if (typeof o === "string") return _arrayLikeToArray(o, minLen); var n = Object.prototype.toString.call(o).slice(8, -1); if (n === "Object" && o.constructor) n = o.constructor.name; if (n === "Map" || n === "Set") return Array.from(o); if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return _arrayLikeToArray(o, minLen); }
	function _arrayLikeToArray(arr, len) { if (len == null || len > arr.length) len = arr.length; for (var i = 0, arr2 = new Array(len); i < len; i++) arr2[i] = arr[i]; return arr2; }
	function _classPrivateMethodInitSpec$1(obj, privateSet) { _checkPrivateRedeclaration$1(obj, privateSet); privateSet.add(obj); }
	function _classPrivateFieldInitSpec$1(obj, privateMap, value) { _checkPrivateRedeclaration$1(obj, privateMap); privateMap.set(obj, value); }
	function _checkPrivateRedeclaration$1(obj, privateCollection) { if (privateCollection.has(obj)) { throw new TypeError("Cannot initialize the same private elements twice on an object"); } }
	function _classPrivateMethodGet$1(receiver, privateSet, fn) { if (!privateSet.has(receiver)) { throw new TypeError("attempted to get private field on non-instance"); } return fn; }
	var ToolbarEvents = {
	  beforeStartEditing: 'beforeStartEditing',
	  startEditing: 'startEditing',
	  finishEditing: 'finishEditing'
	};
	var _copyLinkButton = /*#__PURE__*/new WeakMap();
	var _titleEditor = /*#__PURE__*/new WeakMap();
	var _getClickOnCopyLinkButtonHandler = /*#__PURE__*/new WeakSet();
	var _initTitleEditor = /*#__PURE__*/new WeakSet();
	var Toolbar = /*#__PURE__*/function (_Event$EventEmitter) {
	  babelHelpers.inherits(Toolbar, _Event$EventEmitter);
	  // eslint-disable-next-line sonarjs/cognitive-complexity
	  function Toolbar() {
	    var _options$titleEditor;
	    var _this;
	    var _options = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
	    babelHelpers.classCallCheck(this, Toolbar);
	    _this = babelHelpers.possibleConstructorReturn(this, babelHelpers.getPrototypeOf(Toolbar).call(this, _options));
	    _classPrivateMethodInitSpec$1(babelHelpers.assertThisInitialized(_this), _initTitleEditor);
	    _classPrivateMethodInitSpec$1(babelHelpers.assertThisInitialized(_this), _getClickOnCopyLinkButtonHandler);
	    _classPrivateFieldInitSpec$1(babelHelpers.assertThisInitialized(_this), _copyLinkButton, {
	      writable: true,
	      value: void 0
	    });
	    _classPrivateFieldInitSpec$1(babelHelpers.assertThisInitialized(_this), _titleEditor, {
	      writable: true,
	      value: void 0
	    });
	    _this.setEventNamespace('BX.UI.Toolbar');
	    _this.titleMinWidth = main_core.Type.isNumber(_options.titleMinWidth) ? _options.titleMinWidth : 158;
	    _this.titleMaxWidth = main_core.Type.isNumber(_options.titleMaxWidth) ? _options.titleMaxWidth : '';
	    _this.filterMinWidth = main_core.Type.isNumber(_options.filterMinWidth) ? _options.filterMinWidth : 300;
	    _this.filterMaxWidth = main_core.Type.isNumber(_options.filterMaxWidth) ? _options.filterMaxWidth : 748;
	    _this.id = main_core.Type.isStringFilled(_options.id) ? _options.id : main_core.Text.getRandom();
	    _this.toolbarContainer = _options.target;
	    if (!main_core.Type.isDomNode(_this.toolbarContainer)) {
	      throw new Error('BX.UI.Toolbar: "target" parameter is required.');
	    }
	    _this.titleContainer = _this.toolbarContainer.querySelector('.ui-toolbar-title-box');
	    _this.filterContainer = _this.toolbarContainer.querySelector('.ui-toolbar-filter-box');
	    _this.filterButtons = _this.toolbarContainer.querySelector('.ui-toolbar-filter-buttons');
	    _this.rightButtons = _this.toolbarContainer.querySelector('.ui-toolbar-right-buttons');
	    _this.afterTitleButtons = _this.toolbarContainer.querySelector('.ui-toolbar-after-title-buttons');
	    babelHelpers.classPrivateFieldSet(babelHelpers.assertThisInitialized(_this), _copyLinkButton, _this.toolbarContainer.querySelector('#ui-toolbar-copy-link-button'));
	    if (babelHelpers.classPrivateFieldGet(babelHelpers.assertThisInitialized(_this), _copyLinkButton)) {
	      main_core.Event.bind(babelHelpers.classPrivateFieldGet(babelHelpers.assertThisInitialized(_this), _copyLinkButton), 'click', _classPrivateMethodGet$1(babelHelpers.assertThisInitialized(_this), _getClickOnCopyLinkButtonHandler, _getClickOnCopyLinkButtonHandler2).call(babelHelpers.assertThisInitialized(_this)));
	    }
	    if (!_this.filterContainer) {
	      _this.filterMinWidth = 0;
	      _this.filterMaxWidth = 0;
	    }
	    _this.buttons = Object.create(null);
	    _this.buttonIds = main_core.Type.isArray(_options.buttonIds) ? _options.buttonIds : [];
	    if (_this.buttonIds.length > 0) {
	      _this.buttonIds.forEach(function (buttonId) {
	        var button = ui_buttons.ButtonManager.createByUniqId(buttonId);
	        if (button) {
	          var container = button.getContainer();
	          container.originalWidth = container.offsetWidth;
	          if (!button.getIcon() && !main_core.Type.isStringFilled(button.getDataSet().toolbarCollapsedIcon)) {
	            if (button.getColor() === ui_buttons.ButtonColor.PRIMARY) {
	              button.setDataSet({
	                toolbarCollapsedIcon: ui_buttons.ButtonIcon.ADD
	              });
	            } else {
	              console.warn("BX.UI.Toolbar: the button \"".concat(button.getText(), "\" doesn't have an icon for collapsed mode. ") + 'Use the "data-toolbar-collapsed-icon" attribute.');
	            }
	          }
	          _this.buttons[buttonId] = button;
	        } else {
	          console.warn("BX.UI.Toolbar: the button \"".concat(buttonId, "\" wasn't initialized."));
	        }
	      });
	    }
	    _this.windowWidth = document.body.offsetWidth;
	    _this.reduceItemsWidth();
	    main_core.bind(window, 'resize', function () {
	      if (_this.isWindowIncreased()) {
	        _this.increaseItemsWidth();
	      } else {
	        _this.reduceItemsWidth();
	      }
	    });
	    if (((_options$titleEditor = _options.titleEditor) === null || _options$titleEditor === void 0 ? void 0 : _options$titleEditor.active) === true) {
	      babelHelpers.classPrivateFieldSet(babelHelpers.assertThisInitialized(_this), _titleEditor, _classPrivateMethodGet$1(babelHelpers.assertThisInitialized(_this), _initTitleEditor, _initTitleEditor2).call(babelHelpers.assertThisInitialized(_this), _options.titleEditor));
	    }
	    return _this;
	  }
	  babelHelpers.createClass(Toolbar, [{
	    key: "getButtons",
	    value: function getButtons() {
	      return this.buttons;
	    }
	  }, {
	    key: "getButton",
	    value: function getButton(id) {
	      return id in this.buttons ? this.buttons[id] : null;
	    }
	  }, {
	    key: "getId",
	    value: function getId() {
	      return this.id;
	    }
	  }, {
	    key: "isWindowIncreased",
	    value: function isWindowIncreased() {
	      var previous = this.windowWidth;
	      var current = document.body.offsetWidth;
	      this.windowWidth = current;
	      return current > previous;
	    }
	  }, {
	    key: "getContainerSize",
	    value: function getContainerSize() {
	      return this.toolbarContainer.offsetWidth;
	    }
	  }, {
	    key: "getInnerTotalWidth",
	    value: function getInnerTotalWidth() {
	      return this.toolbarContainer.scrollWidth;
	    }
	  }, {
	    key: "reduceItemsWidth",
	    value: function reduceItemsWidth() {
	      if (this.getInnerTotalWidth() <= this.getContainerSize()) {
	        return;
	      }
	      var buttons = Object.values(this.getButtons()).reverse();
	      var _iterator = _createForOfIteratorHelper(buttons),
	        _step;
	      try {
	        for (_iterator.s(); !(_step = _iterator.n()).done;) {
	          var _button$getDataSet;
	          var button = _step.value;
	          if (!button.getIcon() && !main_core.Type.isStringFilled((_button$getDataSet = button.getDataSet()) === null || _button$getDataSet === void 0 ? void 0 : _button$getDataSet.toolbarCollapsedIcon)) {
	            continue;
	          }
	          if (button.isCollapsed()) {
	            continue;
	          }
	          button.setCollapsed(true);
	          if (!button.getIcon()) {
	            button.setIcon(button.getDataSet().toolbarCollapsedIcon);
	          }
	          if (this.getInnerTotalWidth() <= this.getContainerSize()) {
	            return;
	          }
	        }
	      } catch (err) {
	        _iterator.e(err);
	      } finally {
	        _iterator.f();
	      }
	    }
	  }, {
	    key: "increaseItemsWidth",
	    value: function increaseItemsWidth() {
	      var buttons = Object.values(this.getButtons());
	      for (var _i = 0, _buttons = buttons; _i < _buttons.length; _i++) {
	        var _this$afterTitleButto, _this$filterButtons, _this$rightButtons;
	        var button = _buttons[_i];
	        var item = button.getContainer();
	        if (!button.isCollapsed()) {
	          continue;
	        }
	        var newInnerWidth = this.titleMinWidth + this.filterMinWidth + (((_this$afterTitleButto = this.afterTitleButtons) === null || _this$afterTitleButto === void 0 ? void 0 : _this$afterTitleButto.offsetWidth) || 0) + (((_this$filterButtons = this.filterButtons) === null || _this$filterButtons === void 0 ? void 0 : _this$filterButtons.offsetWidth) || 0) + (((_this$rightButtons = this.rightButtons) === null || _this$rightButtons === void 0 ? void 0 : _this$rightButtons.offsetWidth) || 0) + (item.originalWidth - item.offsetWidth);
	        if (newInnerWidth > this.getContainerSize()) {
	          break;
	        }
	        button.setCollapsed(false);
	        if (button.getIcon() === button.getDataSet().toolbarCollapsedIcon) {
	          var icon = main_core.Type.isStringFilled(button.options.icon) ? button.options.icon : null;
	          button.setIcon(icon);
	        }
	      }
	    }
	  }, {
	    key: "setTitle",
	    value: function setTitle(title) {
	      if (!this.titleContainer) {
	        return;
	      }
	      var pagetitle = this.titleContainer.querySelector('#pagetitle');
	      if (pagetitle) {
	        pagetitle.textContent = title;
	      }
	    }
	  }, {
	    key: "getContainer",
	    value: function getContainer() {
	      return this.toolbarContainer;
	    }
	  }, {
	    key: "getRightButtonsContainer",
	    value: function getRightButtonsContainer() {
	      return this.rightButtons;
	    }
	  }, {
	    key: "getTitleEditor",
	    value: function getTitleEditor() {
	      return babelHelpers.classPrivateFieldGet(this, _titleEditor);
	    }
	  }]);
	  return Toolbar;
	}(main_core.Event.EventEmitter);
	function _getClickOnCopyLinkButtonHandler2() {
	  var _this2 = this;
	  var popup = null;
	  return function () {
	    if (popup !== null) {
	      return;
	    }
	    var dataLink = main_core.Dom.attr(babelHelpers.classPrivateFieldGet(_this2, _copyLinkButton), 'data-link');
	    var currentPageLink = window.location.href;
	    var linkToCopy = main_core.Type.isStringFilled(dataLink) ? dataLink : currentPageLink;
	    linkToCopy = main_core.Uri.removeParam(linkToCopy, ['IFRAME', 'IFRAME_TYPE']);
	    var message = main_core.Dom.attr(babelHelpers.classPrivateFieldGet(_this2, _copyLinkButton), 'data-message');
	    popup = new main_popup.Popup({
	      bindElement: babelHelpers.classPrivateFieldGet(_this2, _copyLinkButton),
	      angle: true,
	      darkMode: true,
	      content: message,
	      autoHide: true,
	      cacheable: false
	    });
	    popup.setOffset({
	      offsetLeft: main_core.Dom.getPosition(babelHelpers.classPrivateFieldGet(_this2, _copyLinkButton)).width / 2
	    });
	    popup.show();
	    BX.clipboard.copy(linkToCopy);
	    setTimeout(function () {
	      popup = null;
	    }, 1000);
	  };
	}
	function _initTitleEditor2(options) {
	  var _this3 = this;
	  var titleEditorOptions = main_core.Type.isPlainObject(options) ? options : {};
	  var titleEditor = new TitleEditor(_objectSpread({}, titleEditorOptions));
	  titleEditor.subscribe(TitleEditorEvents.beforeStartEditing, function (editorEvent) {
	    var toolbarEvent = new main_core.Event.BaseEvent();
	    _this3.emit(TitleEditorEvents.beforeStartEditing, toolbarEvent);
	    if (toolbarEvent.isDefaultPrevented()) {
	      editorEvent.preventDefault();
	    }
	  });
	  titleEditor.subscribe(TitleEditorEvents.startEditing, function () {
	    _this3.emit(TitleEditorEvents.startEditing);
	  });
	  titleEditor.subscribe(TitleEditorEvents.finishEditing, function (event) {
	    var updatedTitle = event.getData().updatedTitle;
	    _this3.emit(TitleEditorEvents.finishEditing, {
	      updatedTitle: updatedTitle
	    });
	  });
	  return titleEditor;
	}
	babelHelpers.defineProperty(Toolbar, "TitleEditor", TitleEditor);
	babelHelpers.defineProperty(Toolbar, "Star", ToolbarStar);

	var Manager = /*#__PURE__*/function () {
	  function Manager() {
	    babelHelpers.classCallCheck(this, Manager);
	    this.toolbars = {};
	  }
	  babelHelpers.createClass(Manager, [{
	    key: "create",
	    value: function create(options) {
	      var toolbar = new Toolbar(options);
	      if (this.get(toolbar.getId())) {
	        throw new Error("The toolbar instance with the same 'id' already exists.");
	      }
	      this.toolbars[toolbar.getId()] = toolbar;
	      return toolbar;
	    }
	  }, {
	    key: "getDefaultToolbar",
	    value: function getDefaultToolbar() {
	      return this.get('default-toolbar');
	    }
	  }, {
	    key: "get",
	    value: function get(id) {
	      return id in this.toolbars ? this.toolbars[id] : null;
	    }
	  }]);
	  return Manager;
	}();
	var ToolbarManager = new Manager();

	exports.ToolbarManager = ToolbarManager;
	exports.ToolbarEvents = ToolbarEvents;
	exports.Toolbar = Toolbar;
	exports.ToolbarStar = ToolbarStar;

}((this.BX.UI = this.BX.UI || {}),BX.UI,BX,BX.Main));
//# sourceMappingURL=ui.toolbar.bundle.js.map
