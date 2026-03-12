/* eslint-disable */
this.BX = this.BX || {};
this.BX.Disk = this.BX.Disk || {};
(function (exports,main_popup,disk_users,main_core_events,disk_sharingLegacyPopup,disk_externalLink,ui_buttons,ui_iconSet_outline,disk_promoBoost,disk_onlyofficePromoActions,ui_dialogs_messagebox,main_core_cache,main_core,pull_client) {
	'use strict';

	function _classPrivateMethodInitSpec(obj, privateSet) { _checkPrivateRedeclaration(obj, privateSet); privateSet.add(obj); }
	function _checkPrivateRedeclaration(obj, privateCollection) { if (privateCollection.has(obj)) { throw new TypeError("Cannot initialize the same private elements twice on an object"); } }
	function _classPrivateMethodGet(receiver, privateSet, fn) { if (!privateSet.has(receiver)) { throw new TypeError("attempted to get private field on non-instance"); } return fn; }
	var ALLOWED_ATTEMPTS_TO_GET_USER_INFO = 3;
	var SECONDS_TO_ACTUALIZE_ONLINE = 25;
	var _makeLinkAbsolute = /*#__PURE__*/new WeakSet();
	var UserManager = /*#__PURE__*/function () {
	  function UserManager(options) {
	    babelHelpers.classCallCheck(this, UserManager);
	    _classPrivateMethodInitSpec(this, _makeLinkAbsolute);
	    babelHelpers.defineProperty(this, "userBoxNode", null);
	    babelHelpers.defineProperty(this, "context", null);
	    babelHelpers.defineProperty(this, "alreadySaidHi", false);
	    this.users = new BX.Disk.Users([]);
	    this.badAttempts = new Map();
	    this.context = options.context;
	    this.userBoxNode = options.userBoxNode;
	    this.alreadySaidHi = false;
	    this.add(this.context.currentUser);
	    this.bindEvents();
	  }
	  babelHelpers.createClass(UserManager, [{
	    key: "bindEvents",
	    value: function bindEvents() {
	      var _this = this;
	      main_core_events.EventEmitter.subscribe('onPullStatus', function (event) {
	        if (event.getData()[0] === 'online') {
	          _this.handleWhenPullConnected();
	        }
	      });
	    }
	  }, {
	    key: "handleWhenPullConnected",
	    value: function handleWhenPullConnected() {
	      if (!this.sentGreetings()) {
	        this.sendHiToUsers();
	        setInterval(this.actualizeOnline.bind(this), 1000 * SECONDS_TO_ACTUALIZE_ONLINE);
	      }
	    }
	  }, {
	    key: "actualizeOnline",
	    value: function actualizeOnline() {
	      this.refineUsersByOnline();
	      if (!this.sentGreetings()) {
	        this.sendHiToUsers();
	      } else {
	        this.sendPingToUsers();
	      }
	    }
	  }, {
	    key: "sentGreetings",
	    value: function sentGreetings() {
	      return this.alreadySaidHi;
	    }
	  }, {
	    key: "sendHiToUsers",
	    value: function sendHiToUsers() {
	      if (!pull_client.PULL.isConnected()) {
	        return;
	      }
	      pull_client.PULL.sendMessageToChannels([this.context.object.publicChannel], 'disk', 'hiToDocument', {
	        user: {
	          id: this.context.currentUser.id,
	          name: this.context.currentUser.name,
	          avatar: _classPrivateMethodGet(this, _makeLinkAbsolute, _makeLinkAbsolute2).call(this, this.context.currentUser.avatar)
	        }
	      });
	      this.alreadySaidHi = true;
	    }
	  }, {
	    key: "sendWelcomeToUser",
	    value: function sendWelcomeToUser() {
	      if (!pull_client.PULL.isConnected()) {
	        return;
	      }
	      pull_client.PULL.sendMessageToChannels([this.context.object.publicChannel], 'disk', 'welcomeToDocument', {
	        user: {
	          id: this.context.currentUser.id,
	          name: this.context.currentUser.name,
	          avatar: _classPrivateMethodGet(this, _makeLinkAbsolute, _makeLinkAbsolute2).call(this, this.context.currentUser.avatar)
	        }
	      });
	    }
	  }, {
	    key: "sendPingToUsers",
	    value: function sendPingToUsers() {
	      if (!pull_client.PULL.isConnected()) {
	        return;
	      }
	      pull_client.PULL.sendMessageToChannels([this.context.object.publicChannel], 'disk', 'pingDocument', {
	        fromUserId: this.context.currentUser.id,
	        infoToken: this.context.currentUser.infoToken
	      });
	    }
	  }, {
	    key: "add",
	    value: function add(user) {
	      if (!this.users.hasUser(user.id)) {
	        this.users.addUser(user);
	        console.log('Hi new user!', user.id);
	      }
	      this.updateOnline(user.id);
	      this.renderBox();
	    }
	  }, {
	    key: "updateOnline",
	    value: function updateOnline(userId) {
	      if (this.users.hasUser(userId)) {
	        this.users.getUser(userId).onlineAt = Date.now();
	      }
	    }
	  }, {
	    key: "getUserInfo",
	    value: function getUserInfo(userId, infoToken) {
	      var _this2 = this;
	      if (this.badAttempts.get(userId) >= ALLOWED_ATTEMPTS_TO_GET_USER_INFO) {
	        return new Promise(function (resolve, reject) {
	          reject({
	            status: 'blocked'
	          });
	        });
	      }
	      return new Promise(function (resolve, reject) {
	        main_core.ajax.runComponentAction('bitrix:disk.file.editor-onlyoffice', 'getUserInfo', {
	          mode: 'ajax',
	          json: {
	            documentSessionId: _this2.context.documentSession.id,
	            documentSessionHash: _this2.context.documentSession.hash,
	            userId: userId,
	            infoToken: infoToken
	          }
	        }).then(function (response) {
	          if (response.status === 'success') {
	            _this2.badAttempts["delete"](userId);
	            resolve(response.data.user);
	          }
	        }, function (response) {
	          var attempts = _this2.badAttempts.get(userId) || 0;
	          _this2.badAttempts.set(userId, attempts + 1);
	          console.log(_this2.badAttempts);
	          reject(response);
	        });
	      });
	    }
	  }, {
	    key: "has",
	    value: function has(userId) {
	      return this.users.hasUser(userId);
	    }
	  }, {
	    key: "remove",
	    value: function remove(userId) {
	      if (userId === this.context.currentUser.id) {
	        return;
	      }
	      this.users.deleteUser(userId);
	      this.renderBox();
	    }
	  }, {
	    key: "refineUsersByOnline",
	    value: function refineUsersByOnline() {
	      var _this3 = this;
	      var secondsToOffline = 1000 * (SECONDS_TO_ACTUALIZE_ONLINE + 1) * 2;
	      var now = Date.now();
	      this.users.forEach(function (user) {
	        if (now - user.onlineAt > secondsToOffline) {
	          _this3.remove(user.id);
	        }
	      });
	    }
	  }, {
	    key: "renderBox",
	    value: function renderBox() {
	      if (!this.userBoxNode.childElementCount) {
	        this.userBoxNode.appendChild(this.users.getContainer());
	      }
	    }
	  }]);
	  return UserManager;
	}();
	function _makeLinkAbsolute2(link) {
	  if (link.includes('http://') || link.includes('https://')) {
	    return link;
	  }
	  return document.location.origin + link;
	}

	var BaseCommandHandler = /*#__PURE__*/function () {
	  function BaseCommandHandler(commandOptions) {
	    babelHelpers.classCallCheck(this, BaseCommandHandler);
	    babelHelpers.defineProperty(this, "options", null);
	    babelHelpers.defineProperty(this, "onlyOffice", null);
	    babelHelpers.defineProperty(this, "userManager", null);
	    this.options = commandOptions;
	    this.userManager = commandOptions.userManager;
	    this.context = commandOptions.context;
	    this.onlyOffice = commandOptions.onlyOffice;
	  }
	  babelHelpers.createClass(BaseCommandHandler, [{
	    key: "getModuleId",
	    value: function getModuleId() {
	      return 'disk';
	    }
	  }, {
	    key: "getSubscriptionType",
	    value: function getSubscriptionType() {
	      return pull_client.PullClient.SubscriptionType.Server;
	    }
	  }, {
	    key: "filterCurrentObject",
	    value: function filterCurrentObject(handler) {
	      var _this = this;
	      return function (data) {
	        if (_this.context.object.id !== data.object.id) {
	          return;
	        }
	        return handler(data);
	      };
	    }
	  }, {
	    key: "isCurrentUser",
	    value: function isCurrentUser(userId) {
	      return this.context.currentUser.id === userId;
	    }
	  }]);
	  return BaseCommandHandler;
	}();

	var ClientCommandHandler = /*#__PURE__*/function (_BaseCommandHandler) {
	  babelHelpers.inherits(ClientCommandHandler, _BaseCommandHandler);
	  function ClientCommandHandler() {
	    babelHelpers.classCallCheck(this, ClientCommandHandler);
	    return babelHelpers.possibleConstructorReturn(this, babelHelpers.getPrototypeOf(ClientCommandHandler).apply(this, arguments));
	  }
	  babelHelpers.createClass(ClientCommandHandler, [{
	    key: "getSubscriptionType",
	    value: function getSubscriptionType() {
	      return pull_client.PullClient.SubscriptionType.Client;
	    }
	  }, {
	    key: "getMap",
	    value: function getMap() {
	      return {
	        exitDocument: this.handleExitDocument.bind(this),
	        pingDocument: this.handlePingDocument.bind(this),
	        hiToDocument: this.handleHiToDocument.bind(this),
	        welcomeToDocument: this.handleWelcomeToDocument.bind(this)
	      };
	    }
	  }, {
	    key: "handleExitDocument",
	    value: function handleExitDocument(data) {
	      console.log('exitDocument', data);
	      var fromUserId = data.fromUserId;
	      if (!this.isCurrentUser(fromUserId)) {
	        this.userManager.remove(fromUserId);
	      }
	    }
	  }, {
	    key: "handleWelcomeToDocument",
	    value: function handleWelcomeToDocument(data) {
	      console.log('handleWelcomeToDocument', data);
	      this.processNewbieInDocument(data);
	    }
	  }, {
	    key: "handleHiToDocument",
	    value: function handleHiToDocument(data) {
	      console.log('handleHiToDocument', data);
	      var newbieAdded = this.processNewbieInDocument(data);
	      if (newbieAdded) {
	        //immediately send welcome to add actual online information for new user.
	        this.userManager.sendWelcomeToUser();
	      }
	    }
	  }, {
	    key: "processNewbieInDocument",
	    value: function processNewbieInDocument(data) {
	      var fromUserId = data.user.id;
	      if (this.isCurrentUser(fromUserId)) {
	        return false;
	      }
	      if (this.userManager.has(fromUserId)) {
	        this.userManager.updateOnline(fromUserId);
	        return false;
	      }
	      this.userManager.add(data.user);
	      return true;
	    }
	  }, {
	    key: "handlePingDocument",
	    value: function handlePingDocument(data) {
	      var _this = this;
	      console.log('handlePingDocument', data);
	      var fromUserId = data.fromUserId;
	      if (this.isCurrentUser(fromUserId)) {
	        return;
	      }
	      if (this.userManager.has(fromUserId)) {
	        this.userManager.updateOnline(fromUserId);
	      } else {
	        if (this.userManager.sentGreetings()) {
	          this.userManager.getUserInfo(data.fromUserId, data.infoToken).then(function (userData) {
	            _this.userManager.add(userData);
	          }, function () {});
	        }
	      }
	    }
	  }]);
	  return ClientCommandHandler;
	}(BaseCommandHandler);

	var _templateObject, _templateObject2;
	function _classPrivateMethodInitSpec$1(obj, privateSet) { _checkPrivateRedeclaration$1(obj, privateSet); privateSet.add(obj); }
	function _checkPrivateRedeclaration$1(obj, privateCollection) { if (privateCollection.has(obj)) { throw new TypeError("Cannot initialize the same private elements twice on an object"); } }
	function _classPrivateMethodGet$1(receiver, privateSet, fn) { if (!privateSet.has(receiver)) { throw new TypeError("attempted to get private field on non-instance"); } return fn; }
	var _handleClickToRefreshEditor = /*#__PURE__*/new WeakSet();
	var ServerCommandHandler = /*#__PURE__*/function (_BaseCommandHandler) {
	  babelHelpers.inherits(ServerCommandHandler, _BaseCommandHandler);
	  function ServerCommandHandler() {
	    var _babelHelpers$getProt;
	    var _this;
	    babelHelpers.classCallCheck(this, ServerCommandHandler);
	    for (var _len = arguments.length, args = new Array(_len), _key = 0; _key < _len; _key++) {
	      args[_key] = arguments[_key];
	    }
	    _this = babelHelpers.possibleConstructorReturn(this, (_babelHelpers$getProt = babelHelpers.getPrototypeOf(ServerCommandHandler)).call.apply(_babelHelpers$getProt, [this].concat(args)));
	    _classPrivateMethodInitSpec$1(babelHelpers.assertThisInitialized(_this), _handleClickToRefreshEditor);
	    return _this;
	  }
	  babelHelpers.createClass(ServerCommandHandler, [{
	    key: "getMap",
	    value: function getMap() {
	      return {
	        onlyoffice: this.filterCurrentObject(this.handleSavedDocument.bind(this)),
	        contentUpdated: this.filterCurrentObject(this.handleContentUpdated.bind(this))
	      };
	    }
	  }, {
	    key: "handleSavedDocument",
	    value: function handleSavedDocument(data) {
	      console.log('handleSavedDocument', data);
	      if (data.documentSessionInfo.wasFinallySaved) {
	        BX.UI.Notification.Center.notify({
	          autoHide: false,
	          content: main_core.Loc.getMessage('DISK_FILE_EDITOR_ONLYOFFICE_SAVED_AFTER_IDLE')
	        });
	      }
	    }
	  }, {
	    key: "handleContentUpdated",
	    value: function handleContentUpdated(data) {
	      var _this2 = this;
	      console.log('handleContentUpdated', data);
	      if (!data.object.updatedBy || this.isCurrentUser(data.object.updatedBy)) {
	        return;
	      }
	      if (this.onlyOffice.wasDocumentChanged()) {
	        this.userManager.getUserInfo(data.object.updatedBy, data.updatedBy.infoToken).then(function (userData) {
	          BX.UI.Notification.Center.notify({
	            content: main_core.Loc.getMessage('DISK_FILE_EDITOR_ONLYOFFICE_SAVED_WHILE_EDITING', {
	              '#NAME#': main_core.Text.encode(data.object.name),
	              '#USER_NAME#': main_core.Text.encode(userData.name)
	            })
	          });
	        }, function () {});
	      } else if (this.onlyOffice.isViewMode()) {
	        this.userManager.getUserInfo(data.object.updatedBy, data.updatedBy.infoToken).then(function (userData) {
	          var content = main_core.Loc.getMessage('DISK_FILE_EDITOR_ONLYOFFICE_VIEW_NON_ACTUAL_VERSION', {
	            '#NAME#': main_core.Text.encode(data.object.name),
	            '#USER_NAME#': main_core.Text.encode(userData.name)
	          });
	          content = main_core.Tag.render(_templateObject || (_templateObject = babelHelpers.taggedTemplateLiteral(["<span>", "</span>"])), content);
	          var refreshButton = content.querySelector('[data-refresh-btn]');
	          if (refreshButton) {
	            main_core.Tag.style(refreshButton)(_templateObject2 || (_templateObject2 = babelHelpers.taggedTemplateLiteral(["\n\t\t\t\t\t\tcursor: pointer;\n\t\t\t\t\t"])));
	            refreshButton.addEventListener('click', _classPrivateMethodGet$1(_this2, _handleClickToRefreshEditor, _handleClickToRefreshEditor2).bind(_this2));
	          }
	          BX.UI.Notification.Center.notify({
	            content: content
	          });
	        }, function () {});
	      }
	    }
	  }]);
	  return ServerCommandHandler;
	}(BaseCommandHandler);
	function _handleClickToRefreshEditor2() {
	  this.onlyOffice.reloadView();
	}

	var _templateObject$1, _templateObject2$1;
	var CustomErrorControl = /*#__PURE__*/function () {
	  function CustomErrorControl() {
	    babelHelpers.classCallCheck(this, CustomErrorControl);
	  }
	  babelHelpers.createClass(CustomErrorControl, [{
	    key: "showWhenTooLarge",
	    value: function showWhenTooLarge(fileName, container, targetNode, linkToDownload, downloadSizeValue) {
	      this.showCommonWarning({
	        container: container,
	        targetNode: targetNode,
	        title: main_core.Loc.getMessage('DISK_FILE_EDITOR_ONLYOFFICE_CUSTOM_ERROR_LARGE_FILE_TITLE'),
	        description: main_core.Loc.getMessage('DISK_FILE_EDITOR_ONLYOFFICE_CUSTOM_ERROR_LARGE_FILE_DESCR'),
	        fileName: fileName,
	        linkToDownload: linkToDownload,
	        downloadSizeValue: downloadSizeValue
	      });
	    }
	  }, {
	    key: "showWhenNotFound",
	    value: function showWhenNotFound(container, targetNode) {
	      this.showCommonWarning({
	        container: container,
	        targetNode: targetNode,
	        title: main_core.Loc.getMessage('DISK_FILE_EDITOR_ONLYOFFICE_CUSTOM_ERROR_FILE_TITLE'),
	        description: main_core.Loc.getMessage('DISK_FILE_EDITOR_ONLYOFFICE_CUSTOM_ERROR_RIGHTS_OR_NOT_FOUND_DESCR')
	      });
	    }
	  }, {
	    key: "showCommonWarning",
	    value: function showCommonWarning(options) {
	      var containerClass = 'disk-fe-office-warning--popup';
	      var fileNameNode = '';
	      if (options.fileName) {
	        fileNameNode = main_core.Tag.render(_templateObject$1 || (_templateObject$1 = babelHelpers.taggedTemplateLiteral(["<div class=\"disk-fe-office-warning-file-name\">", "</div>"])), main_core.Text.encode(options.fileName));
	      }
	      var downloadButtonNode = '';
	      if (options.linkToDownload) {
	        var downloadSize = '';
	        if (options.downloadSizeValue) {
	          downloadSize = options.downloadSizeValue;
	        }
	        var downloadButton = new ui_buttons.Button({
	          text: main_core.Loc.getMessage('DISK_FILE_EDITOR_ONLYOFFICE_HEADER_BTN_DOWNLOAD'),
	          round: true,
	          noCaps: true,
	          tag: ui_buttons.Button.Tag.LINK,
	          link: options.linkToDownload,
	          color: ui_buttons.AirButtonStyle.FILLED,
	          className: '--air disk-fe-office-warning-btn',
	          icon: ui_buttons.ButtonIcon.DOWNLOAD,
	          iconPosition: 'left',
	          size: ui_buttons.ButtonSize.LARGE,
	          props: {
	            target: '_blank'
	          }
	        });
	        downloadButtonNode = downloadButton.render();
	        downloadButton.setText("".concat(main_core.Loc.getMessage('DISK_FILE_EDITOR_ONLYOFFICE_HEADER_BTN_DOWNLOAD'), " ").concat(downloadSize));
	      }
	      var errorControl = main_core.Tag.render(_templateObject2$1 || (_templateObject2$1 = babelHelpers.taggedTemplateLiteral(["\n\t\t\t<div class=\"disk-fe-office-warning-wrap\">\n\t\t\t\t<div class=\"disk-fe-office-warning-overlay\"></div>\n\t\t\t\t<div class=\"disk-fe-office-warning-box\">\n\t\t\t\t\t<div class=\"disk-fe-office-warning-icon\"></div>\n\t\t\t\t\t<div class=\"disk-fe-office-warning-title\">", "</div>\t\t\t\t\n\t\t\t\t\t<div class=\"disk-fe-office-warning-desc\">", "</div>\n\t\t\t\t\t", "\n\t\t\t\t\t", "\n\t\t\t\t</div>\n\t\t\t</div>\n\t\t"])), options.title, options.description, fileNameNode, downloadButtonNode);
	      main_core.Dom.addClass(options.container, containerClass);
	      main_core.Dom.prepend(errorControl, options.targetNode);
	    }
	  }]);
	  return CustomErrorControl;
	}();

	function ownKeys(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); enumerableOnly && (symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; })), keys.push.apply(keys, symbols); } return keys; }
	function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = null != arguments[i] ? arguments[i] : {}; i % 2 ? ownKeys(Object(source), !0).forEach(function (key) { babelHelpers.defineProperty(target, key, source[key]); }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)) : ownKeys(Object(source)).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } return target; }
	function _classPrivateMethodInitSpec$2(obj, privateSet) { _checkPrivateRedeclaration$2(obj, privateSet); privateSet.add(obj); }
	function _checkPrivateRedeclaration$2(obj, privateCollection) { if (privateCollection.has(obj)) { throw new TypeError("Cannot initialize the same private elements twice on an object"); } }
	function _classPrivateMethodGet$2(receiver, privateSet, fn) { if (!privateSet.has(receiver)) { throw new TypeError("attempted to get private field on non-instance"); } return fn; }
	var SECONDS_TO_MARK_AS_STILL_WORKING = 60;
	var cache = new main_core_cache.LocalStorageCache();
	var _trackWork = /*#__PURE__*/new WeakSet();
	var OnlyOffice = /*#__PURE__*/function () {
	  function OnlyOffice(editorOptions) {
	    babelHelpers.classCallCheck(this, OnlyOffice);
	    _classPrivateMethodInitSpec$2(this, _trackWork);
	    babelHelpers.defineProperty(this, "editor", null);
	    babelHelpers.defineProperty(this, "editorJson", null);
	    babelHelpers.defineProperty(this, "userBoxNode", null);
	    babelHelpers.defineProperty(this, "editorNode", null);
	    babelHelpers.defineProperty(this, "editorWrapperNode", null);
	    babelHelpers.defineProperty(this, "targetNode", null);
	    babelHelpers.defineProperty(this, "documentSession", null);
	    babelHelpers.defineProperty(this, "linkToEdit", null);
	    babelHelpers.defineProperty(this, "linkToView", null);
	    babelHelpers.defineProperty(this, "linkToDownload", null);
	    babelHelpers.defineProperty(this, "downloadSizeValue", null);
	    babelHelpers.defineProperty(this, "pullConfig", null);
	    babelHelpers.defineProperty(this, "pullUserConfig", null);
	    babelHelpers.defineProperty(this, "editButton", null);
	    babelHelpers.defineProperty(this, "setupSharingButton", null);
	    babelHelpers.defineProperty(this, "documentWasChanged", false);
	    babelHelpers.defineProperty(this, "dontEndCurrentDocumentSession", false);
	    babelHelpers.defineProperty(this, "context", null);
	    babelHelpers.defineProperty(this, "usersInDocument", null);
	    babelHelpers.defineProperty(this, "sharingControlType", null);
	    babelHelpers.defineProperty(this, "brokenDocumentOpened", false);
	    babelHelpers.defineProperty(this, "sessionBoostOptions", null);
	    babelHelpers.defineProperty(this, "unifiedLinkAccessOnly", false);
	    babelHelpers.defineProperty(this, "promoShowImmediately", false);
	    babelHelpers.defineProperty(this, "onlyOfficePromoActions", null);
	    babelHelpers.defineProperty(this, "realtimeForceReloadTag", null);
	    babelHelpers.defineProperty(this, "realtimeForceReloadCommand", null);
	    babelHelpers.defineProperty(this, "autoForceReloadAfter", null);
	    babelHelpers.defineProperty(this, "texts", null);
	    babelHelpers.defineProperty(this, "userPullClient", null);
	    var options = main_core.Type.isPlainObject(editorOptions) ? editorOptions : {};
	    this.pullConfig = options.pullConfig;
	    this.pullUserConfig = options.pullUserConfig;
	    this.documentSession = options.documentSession;
	    this.linkToEdit = options.linkToEdit;
	    this.linkToView = options.linkToView;
	    this.linkToDownload = options.linkToDownload;
	    this.downloadSizeValue = options.downloadSizeValue;
	    this.targetNode = options.targetNode;
	    this.userBoxNode = options.userBoxNode;
	    this.editorNode = options.editorNode;
	    this.editorWrapperNode = options.editorWrapperNode;
	    this.editButton = ui_buttons.ButtonManager.createByUniqId(editorOptions.panelButtonUniqIds.edit);
	    this.setupSharingButton = ui_buttons.ButtonManager.createByUniqId(editorOptions.panelButtonUniqIds.setupSharing);
	    this.sharingControlType = editorOptions.sharingControlType;
	    this.context = {
	      currentUser: options.currentUser,
	      documentSession: this.documentSession,
	      object: options.object,
	      attachedObject: options.attachedObject
	    };
	    this.context.object.publicChannel = options.publicChannel;
	    this.usersInDocument = new UserManager({
	      context: this.context,
	      userBoxNode: this.userBoxNode
	    });
	    this.sessionBoostButton = disk_promoBoost.Factory.getSessionBoostButton(editorOptions.sessionBoostButtonContainerId);
	    this.sessionBoostOptions = options.sessionBoostOptions;
	    this.unifiedLinkAccessOnly = options.unifiedLinkAccessOnly;
	    this.promoShowImmediately = options.promoShowImmediately;
	    this.onlyOfficePromoActions = new disk_onlyofficePromoActions.OnlyOfficePromoActions();
	    this.realtimeForceReloadTag = options.realtimeForceReloadTag;
	    this.realtimeForceReloadCommand = options.realtimeForceReloadCommand;
	    this.autoForceReloadAfter = options.autoForceReloadAfter || 300000; // default is 5 minutes in ms
	    this.texts = options.texts || {};
	    this.initializeEditor(options.editorJson);
	    var currentSlider = BX.SidePanel.Instance.getSliderByWindow(window);
	    if (currentSlider) {
	      currentSlider.getData().set('documentSession', this.documentSession);
	    }
	    this.loadDiskExtensionInTopWindow();
	    this.initPull();
	    this.bindEvents();
	    if (this.isEditMode()) {
	      this.registerTimerToTrackWork();
	    }
	    if (this.promoShowImmediately && this.onlyOfficePromoActions.shouldShow()) {
	      this.onlyOfficePromoActions.show(this.editButton.getMainButton().button, true);
	    }
	    if (disk_promoBoost.Checker.isSessionBoostAvailable()) {
	      var _this$sessionBoostOpt;
	      this.sessionBoostButton.init();
	      this.sessionBoostButton.setOverlayToWidget();
	      if (this.isEditMode() && (_this$sessionBoostOpt = this.sessionBoostOptions) !== null && _this$sessionBoostOpt !== void 0 && _this$sessionBoostOpt.shouldShowButtonWidgetInstantly) {
	        this.showSessionBoostWidgetOnBoostButton();
	        this.saveWidgetOnBoostButtonView();
	      }
	    }
	  }
	  babelHelpers.createClass(OnlyOffice, [{
	    key: "registerTimerToTrackWork",
	    value: function registerTimerToTrackWork() {
	      setInterval(_classPrivateMethodGet$2(this, _trackWork, _trackWork2).bind(this), SECONDS_TO_MARK_AS_STILL_WORKING * 1000);
	    }
	  }, {
	    key: "initPull",
	    value: function initPull() {
	      if (this.pullConfig) {
	        BX.PULL = new pull_client.PullClient({
	          skipStorageInit: true
	        });
	        BX.PULL.start(this.pullConfig);
	      }
	      if (this.pullUserConfig) {
	        this.userPullClient = new pull_client.PullClient();
	        this.userPullClient.start(this.pullUserConfig);
	      }
	    }
	  }, {
	    key: "bindEvents",
	    value: function bindEvents() {
	      var _this = this;
	      main_core_events.EventEmitter.subscribe('SidePanel.Slider:onClose', this.handleSliderClose.bind(this));
	      main_core_events.EventEmitter.subscribe(window, 'beforeunload', this.handleClose.bind(this));
	      if (window.top !== window) {
	        main_core_events.EventEmitter.subscribe(window, 'message', function (event) {
	          if (event.data === 'closeIframe') {
	            _this.handleClose();
	          }
	        });
	      }
	      if (this.editorJson.document.permissions.edit === true && this.editButton) {
	        if (Object.prototype.hasOwnProperty.call(this.editButton, 'mainButton')) {
	          this.editButton.getMainButton().bindEvent('click', this.handleClickEditButton.bind(this));
	          var menuWindow = this.editButton.getMenuWindow();
	          var menuItems = main_core.Runtime.clone(menuWindow.getMenuItems());
	          menuItems.forEach(function (menuItem) {
	            var menuItemOptions = main_core.Runtime.clone(menuItem.options);
	            menuItemOptions.onclick = _this.handleClickEditSubItems.bind(_this);
	            menuWindow.removeMenuItem(menuItem.getId());
	            menuWindow.addMenuItem(menuItemOptions);
	          });
	        } else {
	          this.editButton.bindEvent('click', this.handleClickEditButton.bind(this));
	        }
	      }
	      if (this.setupSharingButton) {
	        var _menuWindow = this.setupSharingButton.getMenuWindow();
	        var extLinkOptions = _menuWindow.getMenuItem('ext-link').options;
	        extLinkOptions.onclick = this.handleClickSharingByExternalLink.bind(this);
	        _menuWindow.removeMenuItem('ext-link');
	        _menuWindow.addMenuItem(extLinkOptions);
	        var sharingOptions = _menuWindow.getMenuItem('sharing').options;
	        sharingOptions.onclick = this.handleClickSharing.bind(this);
	        _menuWindow.removeMenuItem('sharing');
	        _menuWindow.addMenuItem(sharingOptions);
	      }
	      pull_client.PULL.subscribe(new ClientCommandHandler({
	        onlyOffice: this,
	        context: this.context,
	        userManager: this.usersInDocument
	      }));
	      pull_client.PULL.subscribe(new ServerCommandHandler({
	        onlyOffice: this,
	        context: this.context,
	        userManager: this.usersInDocument
	      }));
	      if (this.userPullClient && this.realtimeForceReloadTag) {
	        this.userPullClient.extendWatch(this.realtimeForceReloadTag);
	        this.userPullClient.subscribe({
	          type: BX.PullClient.SubscriptionType.Server,
	          moduleId: 'disk',
	          command: this.realtimeForceReloadCommand,
	          callback: function callback(data) {
	            var message = {
	              regular: _this.texts.forceReloadRegularServer,
	              booster: _this.texts.forceReloadBoosterServer
	            }[data.newServersType] || _this.texts.forceReloadUndefinedServer;
	            var mb = new ui_dialogs_messagebox.MessageBox({
	              message: message,
	              modal: true,
	              onOk: function onOk() {
	                return location.reload();
	              },
	              okCaption: _this.texts.forceReloadPopupOkButton,
	              buttons: ui_dialogs_messagebox.MessageBoxButtons.OK
	            });
	            mb.show();
	            setTimeout(function () {
	              location.reload();
	            }, _this.autoForceReloadAfter);
	          }
	        });
	      }
	    }
	  }, {
	    key: "initializeEditor",
	    value: function initializeEditor(options) {
	      var _options$document, _options$document$per;
	      if (!options) {
	        return;
	      }
	      options.events = _objectSpread(_objectSpread({}, options.events), {}, {
	        onDocumentStateChange: this.handleDocumentStateChange.bind(this),
	        onDocumentReady: this.handleDocumentReady.bind(this),
	        onMetaChange: this.handleMetaChange.bind(this),
	        onInfo: this.handleInfo.bind(this),
	        onWarning: this.handleWarning.bind(this),
	        onError: this.handleError.bind(this),
	        onRequestClose: this.handleRequestClose.bind(this)
	      });
	      if ((_options$document = options.document) !== null && _options$document !== void 0 && (_options$document$per = _options$document.permissions) !== null && _options$document$per !== void 0 && _options$document$per.rename) {
	        options.events.onRequestRename = this.handleRequestRename.bind(this);
	      }
	      this.editorJson = options;
	      this.editor = new DocsAPI.DocEditor(this.editorNode.id, options);
	    }
	  }, {
	    key: "loadDiskExtensionInTopWindow",
	    value: function loadDiskExtensionInTopWindow() {
	      if (window.top !== window && !BX.getClass('window.top.BX.Disk.endEditSession')) {
	        top.BX.loadExt('disk');
	      }
	    }
	  }, {
	    key: "emitEventOnSaved",
	    value: function emitEventOnSaved() {
	      var sliderByWindow = BX.SidePanel.Instance.getSliderByWindow(window);
	      if (sliderByWindow) {
	        BX.SidePanel.Instance.postMessageAll(window, 'Disk.OnlyOffice:onSaved', {
	          documentSession: this.documentSession,
	          object: this.context.object
	        });
	      }
	      main_core_events.EventEmitter.emit('Disk.OnlyOffice:onSaved', {
	        documentSession: this.documentSession,
	        object: this.context.object
	      });
	    }
	  }, {
	    key: "emitEventOnClosed",
	    value: function emitEventOnClosed() {
	      var sliderByWindow = BX.SidePanel.Instance.getSliderByWindow(window);
	      var process = 'edit';
	      if (sliderByWindow) {
	        process = sliderByWindow.getData().get('process') || 'edit';
	        BX.SidePanel.Instance.postMessageAll(window, 'Disk.OnlyOffice:onClosed', {
	          documentSession: this.documentSession,
	          object: this.context.object,
	          process: process
	        });
	      }
	      main_core_events.EventEmitter.emit('Disk.OnlyOffice:onClosed', {
	        documentSession: this.documentSession,
	        object: this.context.object,
	        process: process
	      });
	    }
	  }, {
	    key: "handleClickEditButton",
	    value: function handleClickEditButton() {
	      if (this.onlyOfficePromoActions.shouldShow()) {
	        this.onlyOfficePromoActions.show(this.editButton.getMainButton().button, true);
	        BX.UI.Analytics.sendData({
	          tool: 'docs',
	          category: 'docs',
	          event: 'oo_limit_edit',
	          c_sub_section: 'old_element',
	          c_element: 'view_mode',
	          p3: this.context.object.docType,
	          p4: "fileId_".concat(this.context.object.id)
	        });
	        return;
	      }
	      this.handleRequestEditRights();
	    }
	  }, {
	    key: "showSessionBoostWidgetOnBoostButton",
	    value: function showSessionBoostWidgetOnBoostButton() {
	      this.sessionBoostButton.showWidget();
	    }
	  }, {
	    key: "saveWidgetOnBoostButtonView",
	    value: function saveWidgetOnBoostButtonView() {
	      if (this.sessionBoostOptions !== null) {
	        var _this$sessionBoostOpt2 = this.sessionBoostOptions.optionParamsToControlButtonWidgetDisplay,
	          category = _this$sessionBoostOpt2.category,
	          name = _this$sessionBoostOpt2.name;
	        main_core.userOptions.save(category, name, null, Math.floor(Date.now() / 1000));
	        main_core.userOptions.send(null);
	      }
	    }
	  }, {
	    key: "handleClickSharing",
	    value: function handleClickSharing() {
	      switch (this.sharingControlType) {
	        case disk_sharingLegacyPopup.SharingControlType.WITH_CHANGE_RIGHTS:
	          new disk_sharingLegacyPopup.LegacyPopup().showSharingDetailWithChangeRights({
	            object: this.context.object
	          });
	          break;
	        case disk_sharingLegacyPopup.SharingControlType.WITH_SHARING:
	          new disk_sharingLegacyPopup.LegacyPopup().showSharingDetailWithChangeRights({
	            object: this.context.object
	          });
	          break;
	        case disk_sharingLegacyPopup.SharingControlType.WITHOUT_EDIT:
	          new disk_sharingLegacyPopup.LegacyPopup().showSharingDetailWithoutEdit({
	            object: this.context.object
	          });
	          break;
	        case disk_sharingLegacyPopup.SharingControlType.BLOCKED_BY_FEATURE:
	          BX.UI.InfoHelper.show('limit_office_files_access_permissions');
	          break;
	        default:
	          console.warn('Unknown sharingControlType', this.sharingControlType);
	      }
	    }
	  }, {
	    key: "handleClickSharingByExternalLink",
	    value: function handleClickSharingByExternalLink(event, menuItem) {
	      if (menuItem.dataset.shouldBlockExternalLinkFeature) {
	        eval(menuItem.dataset.blockerExternalLinkFeature);
	        return;
	      }
	      if (this.unifiedLinkAccessOnly) {
	        disk_externalLink.ExternalLinkForUnifiedLink.showPopup(this.context.object.uniqueCode);
	      } else {
	        disk_externalLink.ExternalLink.showPopup(this.context.object.id);
	      }
	    }
	  }, {
	    key: "handleClickEditSubItems",
	    value: function handleClickEditSubItems(event, menuItem) {
	      var serviceCode = menuItem.getId();
	      if (serviceCode === 'onlyoffice') {
	        this.handleClickEditButton();
	        return;
	      }
	      BX.Disk.Viewer.Actions.runActionEdit({
	        name: this.context.object.name,
	        objectId: this.context.object.id,
	        attachedObjectId: this.context.attachedObject.id,
	        serviceCode: serviceCode
	      });
	    }
	  }, {
	    key: "handleSaveButtonClick",
	    value: function handleSaveButtonClick() {
	      var _this2 = this;
	      pull_client.PULL.subscribe({
	        moduleId: 'disk',
	        command: 'onlyoffice',
	        callback: function callback(data) {
	          if (data.hash === _this2.documentSession.hash) {
	            _this2.emitEventOnSaved();
	            window.BX.Disk.showModalWithStatusAction();
	            BX.SidePanel.Instance.close();
	          }
	        }
	      });
	    }
	  }, {
	    key: "handleRequestClose",
	    value: function handleRequestClose() {
	      var currentSlider = BX.SidePanel.Instance.getSliderByWindow(window);
	      if (!currentSlider) {
	        return;
	      }
	      currentSlider.getData().set('dontInvokeRequestClose', true);
	      this.handleClose();
	      currentSlider.close();
	    }
	  }, {
	    key: "isDocumentReadyToEdit",
	    value: function isDocumentReadyToEdit() {
	      if (this.brokenDocumentOpened) {
	        return false;
	      }
	      if (!this.caughtDocumentReady) {
	        return false;
	      }
	      return true;
	    }
	  }, {
	    key: "handleSliderClose",
	    value: function handleSliderClose(event) {
	      var currentSlider = BX.SidePanel.Instance.getSliderByWindow(window);
	      if (!currentSlider) {
	        return;
	      }
	      var currentSliderData = currentSlider.getData();
	      var uid = currentSliderData.get('uid');

	      /** @type {BX.SidePanel.Event} */
	      var _event$getData = event.getData(),
	        _event$getData2 = babelHelpers.slicedToArray(_event$getData, 1),
	        sliderEvent = _event$getData2[0];
	      if (sliderEvent.getSlider().getData().get('uid') !== uid) {
	        return;
	      }
	      if (this.isViewMode() || !this.isDocumentReadyToEdit()) {
	        this.handleClose();
	        return;
	      }
	      if (this.editor.hasOwnProperty('requestClose')) {
	        if (currentSliderData.get('dontInvokeRequestClose')) {
	          return;
	        }
	        this.editor.requestClose();
	        sliderEvent.denyAction();
	      } else {
	        this.handleClose();
	      }
	    }
	  }, {
	    key: "handleClose",
	    value: function handleClose() {
	      pull_client.PULL.sendMessageToChannels([this.context.object.publicChannel], 'disk', 'exitDocument', {
	        fromUserId: this.context.currentUser.id
	      });
	      this.emitEventOnClosed();
	      if (this.dontEndCurrentDocumentSession) {
	        return;
	      }
	      top.BX.Disk.endEditSession({
	        id: this.documentSession.id,
	        hash: this.documentSession.hash,
	        documentWasChanged: this.documentWasChanged
	      });
	    }
	  }, {
	    key: "handleDocumentStateChange",
	    value: function handleDocumentStateChange(event) {
	      if (!this.caughtDocumentReady || !this.caughtInfoEvent) {
	        return;
	      }
	      if (Date.now() - Math.max(this.caughtDocumentReady, this.caughtInfoEvent) < 500) {
	        return;
	      }
	      this.documentWasChanged = true;
	    }
	  }, {
	    key: "wasDocumentChanged",
	    value: function wasDocumentChanged() {
	      return this.documentWasChanged;
	    }
	  }, {
	    key: "isEditMode",
	    value: function isEditMode() {
	      return this.editorJson.editorConfig.mode === 'edit';
	    }
	  }, {
	    key: "isViewMode",
	    value: function isViewMode() {
	      return !this.isEditMode();
	    }
	  }, {
	    key: "reloadView",
	    value: function reloadView() {
	      if (this.isViewMode()) {
	        document.location = this.linkToView;
	      }
	    }
	  }, {
	    key: "handleInfo",
	    value: function handleInfo() {
	      this.caughtInfoEvent = Date.now();
	    }
	  }, {
	    key: "handleWarning",
	    value: function handleWarning(d) {
	      console.log('onlyoffice warning:', d.data);
	    }
	  }, {
	    key: "handleError",
	    value: function handleError(d) {
	      var _this3 = this;
	      console.log('onlyoffice error:', d.data);
	      if (d.data.errorCode === -82) {
	        this.brokenDocumentOpened = true;
	        this.processBrokenDocument();
	      } else if (d.data.errorCode === -84) {
	        setTimeout(function () {
	          new CustomErrorControl().showWhenTooLarge(_this3.context.object.name, _this3.getEditorWrapperNode(), _this3.getContainer(), _this3.linkToDownload, _this3.downloadSizeValue);
	        }, 100);
	      }
	    }
	  }, {
	    key: "processBrokenDocument",
	    value: function processBrokenDocument() {
	      if (!this.context.documentSession.id || !this.brokenDocumentOpened) {
	        return;
	      }
	      var key = "oo_broken_doc_".concat(this.context.documentSession.id);
	      var lastTime = cache.get(key);
	      if (lastTime && Date.now() - lastTime < 1000 * 60) {
	        return;
	      }
	      main_core.ajax.runAction('disk.api.onlyoffice.recoverSessionWithBrokenFile', {
	        mode: 'ajax',
	        json: {
	          force: true,
	          sessionId: this.documentSession.id,
	          documentSessionHash: this.documentSession.hash
	        }
	      }).then(function (response) {
	        if (response.status === 'success') {
	          document.location.href = response.data.link;
	        }
	      });
	      cache.set(key, Date.now());
	    }
	  }, {
	    key: "handleRequestRename",
	    value: function handleRequestRename(event) {
	      var newName = event.data;
	      main_core.ajax.runAction('disk.api.onlyoffice.renameDocument', {
	        mode: 'ajax',
	        json: {
	          documentSessionId: this.context.documentSession.id,
	          documentSessionHash: this.context.documentSession.hash,
	          newName: newName
	        }
	      });
	    }
	  }, {
	    key: "handleMetaChange",
	    value: function handleMetaChange(event) {}
	  }, {
	    key: "handleDocumentReady",
	    value: function handleDocumentReady() {
	      this.caughtDocumentReady = Date.now();
	    }
	  }, {
	    key: "handleRequestEditRights",
	    value: function handleRequestEditRights() {
	      this.dontEndCurrentDocumentSession = true;
	      var linkToEdit = BX.util.add_url_param('/bitrix/services/main/ajax.php', {
	        action: 'disk.api.documentService.goToEdit',
	        serviceCode: 'onlyoffice',
	        documentSessionId: this.documentSession.id,
	        documentSessionHash: this.documentSession.hash
	      });
	      if (this.linkToEdit) {
	        linkToEdit = this.linkToEdit;
	      }
	      var currentSlider = BX.SidePanel.Instance.getSliderByWindow(window);
	      if (!currentSlider) {
	        window.location = linkToEdit;
	        return;
	      }
	      var customLeftBoundary = currentSlider.getCustomLeftBoundary();
	      currentSlider.close();
	      BX.SidePanel.Instance.open(linkToEdit, {
	        width: '100%',
	        customLeftBoundary: customLeftBoundary,
	        cacheable: false,
	        allowChangeHistory: false,
	        data: {
	          documentEditor: true
	        }
	      });
	    }
	  }, {
	    key: "getEditor",
	    value: function getEditor() {
	      return this.editor;
	    }
	  }, {
	    key: "getEditorNode",
	    value: function getEditorNode() {
	      return this.editorNode;
	    }
	  }, {
	    key: "getEditorWrapperNode",
	    value: function getEditorWrapperNode() {
	      return this.editorWrapperNode;
	    }
	  }, {
	    key: "getContainer",
	    value: function getContainer() {
	      return this.targetNode;
	    }
	  }]);
	  return OnlyOffice;
	}();
	function _trackWork2() {
	  main_core.ajax.runComponentAction('bitrix:disk.file.editor-onlyoffice', 'markAsStillWorkingSession', {
	    mode: 'ajax',
	    json: {
	      documentSessionId: this.context.documentSession.id,
	      documentSessionHash: this.context.documentSession.hash
	    }
	  }).then(function (responce) {});
	}

	var Waiting = /*#__PURE__*/function () {
	  function Waiting(waitingOptions) {
	    babelHelpers.classCallCheck(this, Waiting);
	    babelHelpers.defineProperty(this, "documentSession", null);
	    babelHelpers.defineProperty(this, "object", null);
	    babelHelpers.defineProperty(this, "unifiedLinkMode", false);
	    var options = main_core.Type.isPlainObject(waitingOptions) ? waitingOptions : {};
	    this.documentSession = options.documentSession;
	    this.object = options.object;
	    this.unifiedLinkMode = options.unifiedLinkMode;
	    var loader = new BX.Loader({
	      target: options.targetNode
	    });
	    loader.show();
	    this.bindEvents();
	    this.handleSavedDocument({});
	  }
	  babelHelpers.createClass(Waiting, [{
	    key: "bindEvents",
	    value: function bindEvents() {
	      pull_client.PULL.subscribe({
	        type: BX.PullClient.SubscriptionType.Server,
	        moduleId: 'disk',
	        command: 'onlyoffice',
	        callback: this.handleSavedDocument.bind(this)
	      });
	    }
	  }, {
	    key: "handleSavedDocument",
	    value: function handleSavedDocument(data) {
	      var _this = this;
	      console.log('handleSavedDocument', data);
	      main_core.ajax.runAction('disk.api.onlyoffice.continueWithNewSession', {
	        mode: 'ajax',
	        json: {
	          sessionId: this.documentSession.id,
	          documentSessionHash: this.documentSession.hash
	        }
	      }).then(function (response) {
	        if (response.status === 'success') {
	          if (_this.unifiedLinkMode) {
	            window.location.reload();
	          } else {
	            document.location.href = response.data.documentSession.link;
	          }
	        }
	      });
	    }
	  }]);
	  return Waiting;
	}();

	exports.OnlyOffice = OnlyOffice;
	exports.Waiting = Waiting;
	exports.CustomErrorControl = CustomErrorControl;

}((this.BX.Disk.Editor = this.BX.Disk.Editor || {}),BX.Main,BX.Disk,BX.Event,BX.Disk.Sharing,BX.Disk,BX.UI,BX,BX.Disk.PromoBoost,BX.Disk.OnlyOfficePromoActions,BX.UI.Dialogs,BX.Cache,BX,BX));
//# sourceMappingURL=script.js.map
