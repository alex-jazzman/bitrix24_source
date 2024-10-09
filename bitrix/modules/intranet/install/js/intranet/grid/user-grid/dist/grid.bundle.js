/* eslint-disable */
this.BX = this.BX || {};
this.BX.Intranet = this.BX.Intranet || {};
(function (exports,ui_label,ui_dialogs_messagebox,ui_formElements_field,ui_cnt,intranet_reinvite,main_core,ui_iconSet_main,ui_entitySelector) {
	'use strict';

	function _classPrivateFieldInitSpec(obj, privateMap, value) { _checkPrivateRedeclaration(obj, privateMap); privateMap.set(obj, value); }
	function _checkPrivateRedeclaration(obj, privateCollection) { if (privateCollection.has(obj)) { throw new TypeError("Cannot initialize the same private elements twice on an object"); } }
	var _fieldId = /*#__PURE__*/new WeakMap();
	var _gridId = /*#__PURE__*/new WeakMap();
	var BaseField = /*#__PURE__*/function () {
	  function BaseField(params) {
	    var _params$gridId;
	    babelHelpers.classCallCheck(this, BaseField);
	    _classPrivateFieldInitSpec(this, _fieldId, {
	      writable: true,
	      value: void 0
	    });
	    _classPrivateFieldInitSpec(this, _gridId, {
	      writable: true,
	      value: void 0
	    });
	    babelHelpers.classPrivateFieldSet(this, _fieldId, params.fieldId);
	    babelHelpers.classPrivateFieldSet(this, _gridId, (_params$gridId = params.gridId) !== null && _params$gridId !== void 0 ? _params$gridId : null);
	  }
	  babelHelpers.createClass(BaseField, [{
	    key: "getGridId",
	    value: function getGridId() {
	      return babelHelpers.classPrivateFieldGet(this, _gridId);
	    }
	  }, {
	    key: "getFieldId",
	    value: function getFieldId() {
	      return babelHelpers.classPrivateFieldGet(this, _fieldId);
	    }
	  }, {
	    key: "getGrid",
	    value: function getGrid() {
	      var _grid;
	      var grid = null;
	      if (babelHelpers.classPrivateFieldGet(this, _gridId)) {
	        grid = BX.Main.gridManager.getById(babelHelpers.classPrivateFieldGet(this, _gridId));
	      }
	      return (_grid = grid) === null || _grid === void 0 ? void 0 : _grid.instance;
	    }
	  }, {
	    key: "getFieldNode",
	    value: function getFieldNode() {
	      return document.getElementById(this.getFieldId());
	    }
	  }, {
	    key: "appendToFieldNode",
	    value: function appendToFieldNode(element) {
	      main_core.Dom.append(element, this.getFieldNode());
	    }
	  }]);
	  return BaseField;
	}();

	var _templateObject;
	var PhotoField = /*#__PURE__*/function (_BaseField) {
	  babelHelpers.inherits(PhotoField, _BaseField);
	  function PhotoField() {
	    babelHelpers.classCallCheck(this, PhotoField);
	    return babelHelpers.possibleConstructorReturn(this, babelHelpers.getPrototypeOf(PhotoField).apply(this, arguments));
	  }
	  babelHelpers.createClass(PhotoField, [{
	    key: "render",
	    value: function render(params) {
	      main_core.Dom.addClass(this.getFieldNode(), 'user-grid_user-photo');
	      if (params.photoUrl) {
	        main_core.Dom.style(this.getFieldNode(), {
	          'background-image': "url(\"".concat(params.photoUrl, "\")")
	        });
	      } else {
	        var iconClass = params.isInvited || !params.isConfirmed && params.isInvited ? '--person-clock' : '--person';
	        var photo = main_core.Tag.render(_templateObject || (_templateObject = babelHelpers.taggedTemplateLiteral(["\n\t\t\t\t<div class=\"ui-icon-set ", "\" style=\"--ui-icon-set__icon-size: 35px; --ui-icon-set__icon-color: #fff;\"></div>\n\t\t\t"])), iconClass);
	        main_core.Dom.append(photo, this.getFieldNode());
	      }
	    }
	  }]);
	  return PhotoField;
	}(BaseField);

	var _templateObject$1, _templateObject2, _templateObject3, _templateObject4, _templateObject5, _templateObject6;
	function _classPrivateMethodInitSpec(obj, privateSet) { _checkPrivateRedeclaration$1(obj, privateSet); privateSet.add(obj); }
	function _checkPrivateRedeclaration$1(obj, privateCollection) { if (privateCollection.has(obj)) { throw new TypeError("Cannot initialize the same private elements twice on an object"); } }
	function _classPrivateMethodGet(receiver, privateSet, fn) { if (!privateSet.has(receiver)) { throw new TypeError("attempted to get private field on non-instance"); } return fn; }
	var _getFullNameLink = /*#__PURE__*/new WeakSet();
	var _getInviteNotAcceptedContainer = /*#__PURE__*/new WeakSet();
	var _getInviteNotConfirmedContainer = /*#__PURE__*/new WeakSet();
	var _getPositionContainer = /*#__PURE__*/new WeakSet();
	var _getIntegratorBalloonContainer = /*#__PURE__*/new WeakSet();
	var _getAdminBalloonContainer = /*#__PURE__*/new WeakSet();
	var _getExtranetBalloonContainer = /*#__PURE__*/new WeakSet();
	var FullNameField = /*#__PURE__*/function (_BaseField) {
	  babelHelpers.inherits(FullNameField, _BaseField);
	  function FullNameField() {
	    var _babelHelpers$getProt;
	    var _this;
	    babelHelpers.classCallCheck(this, FullNameField);
	    for (var _len = arguments.length, args = new Array(_len), _key = 0; _key < _len; _key++) {
	      args[_key] = arguments[_key];
	    }
	    _this = babelHelpers.possibleConstructorReturn(this, (_babelHelpers$getProt = babelHelpers.getPrototypeOf(FullNameField)).call.apply(_babelHelpers$getProt, [this].concat(args)));
	    _classPrivateMethodInitSpec(babelHelpers.assertThisInitialized(_this), _getExtranetBalloonContainer);
	    _classPrivateMethodInitSpec(babelHelpers.assertThisInitialized(_this), _getAdminBalloonContainer);
	    _classPrivateMethodInitSpec(babelHelpers.assertThisInitialized(_this), _getIntegratorBalloonContainer);
	    _classPrivateMethodInitSpec(babelHelpers.assertThisInitialized(_this), _getPositionContainer);
	    _classPrivateMethodInitSpec(babelHelpers.assertThisInitialized(_this), _getInviteNotConfirmedContainer);
	    _classPrivateMethodInitSpec(babelHelpers.assertThisInitialized(_this), _getInviteNotAcceptedContainer);
	    _classPrivateMethodInitSpec(babelHelpers.assertThisInitialized(_this), _getFullNameLink);
	    return _this;
	  }
	  babelHelpers.createClass(FullNameField, [{
	    key: "render",
	    value: function render(params) {
	      var fullNameContainer = main_core.Tag.render(_templateObject$1 || (_templateObject$1 = babelHelpers.taggedTemplateLiteral(["\n\t\t\t<div class=\"user-grid_full-name-container\">", "</div>\n\t\t"])), _classPrivateMethodGet(this, _getFullNameLink, _getFullNameLink2).call(this, params.fullName, params.profileLink));
	      if (params.position) {
	        main_core.Dom.append(_classPrivateMethodGet(this, _getPositionContainer, _getPositionContainer2).call(this, main_core.Text.encode(params.position)), fullNameContainer);
	      }
	      if (!params.isInvited && params.isConfirmed) {
	        if (params.isIntegrator) {
	          main_core.Dom.append(_classPrivateMethodGet(this, _getIntegratorBalloonContainer, _getIntegratorBalloonContainer2).call(this), fullNameContainer);
	        } else if (params.isAdmin) {
	          main_core.Dom.append(_classPrivateMethodGet(this, _getAdminBalloonContainer, _getAdminBalloonContainer2).call(this), fullNameContainer);
	        } else if (params.isExtranet) {
	          main_core.Dom.append(_classPrivateMethodGet(this, _getExtranetBalloonContainer, _getExtranetBalloonContainer2).call(this), fullNameContainer);
	        }
	      } else if (params.isInvited && !params.isConfirmed) {
	        main_core.Dom.append(_classPrivateMethodGet(this, _getInviteNotConfirmedContainer, _getInviteNotConfirmedContainer2).call(this), fullNameContainer);
	      } else if (params.isInvited) {
	        main_core.Dom.append(_classPrivateMethodGet(this, _getInviteNotAcceptedContainer, _getInviteNotAcceptedContainer2).call(this), fullNameContainer);
	      }
	      this.appendToFieldNode(fullNameContainer);
	    }
	  }]);
	  return FullNameField;
	}(BaseField);
	function _getFullNameLink2(fullName, profileLink) {
	  return main_core.Tag.render(_templateObject2 || (_templateObject2 = babelHelpers.taggedTemplateLiteral(["<a class=\"user-grid_full-name-label\" href=\"", "\">", "</a>"])), profileLink, fullName);
	}
	function _getInviteNotAcceptedContainer2() {
	  var label = new ui_label.Label({
	    text: main_core.Loc.getMessage('INTRANET_JS_CONTROL_BALLOON_INVITATION_NOT_ACCEPTED'),
	    color: ui_label.LabelColor.LIGHT_BLUE,
	    fill: true,
	    size: ui_label.Label.Size.MD,
	    customClass: 'user-grid_label'
	  });
	  return label.render();
	}
	function _getInviteNotConfirmedContainer2() {
	  var label = new ui_label.Label({
	    text: main_core.Loc.getMessage('INTRANET_JS_CONTROL_BALLOON_NOT_CONFIRMED'),
	    color: ui_label.LabelColor.YELLOW,
	    fill: true,
	    size: ui_label.Label.Size.MD,
	    customClass: 'user-grid_label'
	  });
	  return label.render();
	}
	function _getPositionContainer2(position) {
	  return main_core.Tag.render(_templateObject3 || (_templateObject3 = babelHelpers.taggedTemplateLiteral(["<div class=\"user-grid_position-label\">", "</div>"])), position);
	}
	function _getIntegratorBalloonContainer2() {
	  return main_core.Tag.render(_templateObject4 || (_templateObject4 = babelHelpers.taggedTemplateLiteral(["\n\t\t\t<span class=\"user-grid_role-label --integrator\">\n\t\t\t\t", "\n\t\t\t</span>\n\t\t"])), main_core.Loc.getMessage('INTRANET_JS_CONTROL_BALLOON_INTEGRATOR'));
	}
	function _getAdminBalloonContainer2() {
	  return main_core.Tag.render(_templateObject5 || (_templateObject5 = babelHelpers.taggedTemplateLiteral(["\n\t\t\t<span class=\"user-grid_role-label --admin\">\n\t\t\t\t", "\n\t\t\t</span>\n\t\t"])), main_core.Loc.getMessage('INTRANET_JS_CONTROL_BALLOON_ADMIN'));
	}
	function _getExtranetBalloonContainer2() {
	  return main_core.Tag.render(_templateObject6 || (_templateObject6 = babelHelpers.taggedTemplateLiteral(["\n\t\t\t<span class=\"user-grid_role-label --extranet\">\n\t\t\t\t", "\n\t\t\t</span>\n\t\t"])), main_core.Loc.getMessage('INTRANET_JS_CONTROL_BALLOON_EXTRANET'));
	}

	var _templateObject$2, _templateObject2$1;
	var EmployeeField = /*#__PURE__*/function (_BaseField) {
	  babelHelpers.inherits(EmployeeField, _BaseField);
	  function EmployeeField() {
	    babelHelpers.classCallCheck(this, EmployeeField);
	    return babelHelpers.possibleConstructorReturn(this, babelHelpers.getPrototypeOf(EmployeeField).apply(this, arguments));
	  }
	  babelHelpers.createClass(EmployeeField, [{
	    key: "render",
	    value: function render(params) {
	      var photoFieldId = main_core.Text.getRandom(6);
	      var fullNameFieldId = main_core.Text.getRandom(6);
	      this.appendToFieldNode(main_core.Tag.render(_templateObject$2 || (_templateObject$2 = babelHelpers.taggedTemplateLiteral(["<span id=\"", "\"></span>"])), photoFieldId));
	      this.appendToFieldNode(main_core.Tag.render(_templateObject2$1 || (_templateObject2$1 = babelHelpers.taggedTemplateLiteral(["<span class=\"user-grid_full-name-wrapper\" id=\"", "\"></span>"])), fullNameFieldId));
	      new PhotoField({
	        fieldId: photoFieldId
	      }).render(params);
	      new FullNameField({
	        fieldId: fullNameFieldId
	      }).render(params);
	      main_core.Dom.addClass(this.getFieldNode(), 'user-grid_employee-card-container');
	    }
	  }]);
	  return EmployeeField;
	}(BaseField);

	function _classPrivateFieldInitSpec$1(obj, privateMap, value) { _checkPrivateRedeclaration$2(obj, privateMap); privateMap.set(obj, value); }
	function _checkPrivateRedeclaration$2(obj, privateCollection) { if (privateCollection.has(obj)) { throw new TypeError("Cannot initialize the same private elements twice on an object"); } }
	var _grid = /*#__PURE__*/new WeakMap();
	var GridManager = /*#__PURE__*/function () {
	  function GridManager(gridId) {
	    var _BX$Main$gridManager$;
	    babelHelpers.classCallCheck(this, GridManager);
	    _classPrivateFieldInitSpec$1(this, _grid, {
	      writable: true,
	      value: void 0
	    });
	    babelHelpers.classPrivateFieldSet(this, _grid, (_BX$Main$gridManager$ = BX.Main.gridManager.getById(gridId)) === null || _BX$Main$gridManager$ === void 0 ? void 0 : _BX$Main$gridManager$.instance);
	  }
	  babelHelpers.createClass(GridManager, [{
	    key: "getGrid",
	    value: function getGrid() {
	      return babelHelpers.classPrivateFieldGet(this, _grid);
	    }
	  }, {
	    key: "confirmAction",
	    value: function confirmAction(params) {
	      var _this = this;
	      if (params.userId) {
	        this.confirmUser(params.isAccept ? 'confirm' : 'decline', function () {
	          var row = babelHelpers.classPrivateFieldGet(_this, _grid).getRows().getById(params.userId);
	          row === null || row === void 0 ? void 0 : row.stateLoad();
	          BX.ajax.runAction('intranet.controller.invite.confirmUserRequest', {
	            data: {
	              userId: params.userId,
	              isAccept: params.isAccept ? 'Y' : 'N'
	            }
	          }).then(function (response) {
	            row === null || row === void 0 ? void 0 : row.update();
	          })["catch"](function (err) {
	            row === null || row === void 0 ? void 0 : row.stateUnload();
	            if (!params.isAccept) {
	              _this.activityAction({
	                userId: params.userId,
	                action: 'deactivateInvited'
	              });
	            }
	          });
	        });
	      }
	    }
	  }, {
	    key: "activityAction",
	    value: function activityAction(params) {
	      var _params$userId,
	        _params$action,
	        _this2 = this;
	      var userId = (_params$userId = params.userId) !== null && _params$userId !== void 0 ? _params$userId : null;
	      var action = (_params$action = params.action) !== null && _params$action !== void 0 ? _params$action : null;
	      if (userId) {
	        this.confirmUser(action, function () {
	          var row = babelHelpers.classPrivateFieldGet(_this2, _grid).getRows().getById(params.userId);
	          row === null || row === void 0 ? void 0 : row.stateLoad();
	          BX.ajax.runComponentAction('bitrix:intranet.user.list', 'setActivity', {
	            mode: 'class',
	            data: {
	              params: {
	                userId: userId,
	                action: action
	              }
	            }
	          }).then(function () {
	            row === null || row === void 0 ? void 0 : row.update();
	          })["catch"](function (response) {
	            row === null || row === void 0 ? void 0 : row.stateUnload();
	            if (BX.type.isNotEmptyObject(response) && BX.type.isArray(response.errors) && action === 'delete') {
	              return _this2.activityAction({
	                action: 'deactivateInvited',
	                userId: userId
	              });
	            }
	          });
	        });
	      }
	    }
	  }, {
	    key: "confirmUser",
	    value: function confirmUser(action, callBack) {
	      var _this$getConfirmTitle, _this$getConfirmMessa;
	      ui_dialogs_messagebox.MessageBox.show({
	        title: (_this$getConfirmTitle = this.getConfirmTitle(action)) !== null && _this$getConfirmTitle !== void 0 ? _this$getConfirmTitle : '',
	        message: (_this$getConfirmMessa = this.getConfirmMessage(action)) !== null && _this$getConfirmMessa !== void 0 ? _this$getConfirmMessa : '',
	        buttons: ui_dialogs_messagebox.MessageBoxButtons.YES_CANCEL,
	        yesCaption: this.getConfirmButtonText(action),
	        onYes: function onYes(messageBox) {
	          callBack();
	          messageBox.close();
	        }
	      });
	    }
	  }, {
	    key: "getConfirmTitle",
	    value: function getConfirmTitle(action) {
	      switch (action) {
	        case 'restore':
	          return main_core.Loc.getMessage('INTRANET_USER_LIST_ACTION_RESTORE_TITLE');
	        case 'confirm':
	          return main_core.Loc.getMessage('INTRANET_USER_LIST_ACTION_CONFIRM_TITLE');
	        case 'delete':
	          return main_core.Loc.getMessage('INTRANET_USER_LIST_ACTION_DELETE_TITLE');
	        case 'deactivate':
	          return main_core.Loc.getMessage('INTRANET_USER_LIST_ACTION_DEACTIVATE_TITLE');
	        case 'deactivateInvited':
	          return main_core.Loc.getMessage('INTRANET_USER_LIST_ACTION_DEACTIVATE_INVITED_TITLE');
	        case 'decline':
	          return main_core.Loc.getMessage('INTRANET_USER_LIST_ACTION_DECLINE_TITLE');
	        default:
	          return '';
	      }
	    }
	  }, {
	    key: "getConfirmMessage",
	    value: function getConfirmMessage(action) {
	      switch (action) {
	        case 'restore':
	        case 'confirm':
	          return main_core.Loc.getMessage('INTRANET_USER_LIST_ACTION_CONFIRM_MESSAGE');
	        case 'delete':
	          return main_core.Loc.getMessage('INTRANET_USER_LIST_ACTION_DELETE_MESSAGE');
	        case 'deactivate':
	          return main_core.Loc.getMessage('INTRANET_USER_LIST_ACTION_DEACTIVATE_MESSAGE');
	        case 'deactivateInvited':
	          return main_core.Loc.getMessage('INTRANET_USER_LIST_ACTION_DEACTIVATE_INVITED_MESSAGE');
	        case 'decline':
	          return main_core.Loc.getMessage('INTRANET_USER_LIST_ACTION_DECLINE_MESSAGE');
	        default:
	          return '';
	      }
	    }
	  }, {
	    key: "getConfirmButtonText",
	    value: function getConfirmButtonText(action) {
	      switch (action) {
	        case 'restore':
	          return main_core.Loc.getMessage('INTRANET_USER_LIST_ACTION_RESTORE_BUTTON');
	        case 'confirm':
	          return main_core.Loc.getMessage('INTRANET_USER_LIST_ACTION_CONFIRM_BUTTON');
	        case 'delete':
	          return main_core.Loc.getMessage('INTRANET_USER_LIST_ACTION_DELETE_BUTTON');
	        case 'deactivate':
	          return main_core.Loc.getMessage('INTRANET_USER_LIST_ACTION_DEACTIVATE_BUTTON');
	        case 'deactivateInvited':
	          return main_core.Loc.getMessage('INTRANET_USER_LIST_ACTION_DEACTIVATE_INVITED_BUTTON');
	        case 'decline':
	          return main_core.Loc.getMessage('INTRANET_USER_LIST_ACTION_DECLINE_BUTTON');
	        default:
	          return null;
	      }
	    }
	  }], [{
	    key: "getInstance",
	    value: function getInstance(gridId) {
	      if (!this.instances[gridId]) {
	        this.instances[gridId] = new GridManager(gridId);
	      }
	      return this.instances[gridId];
	    }
	  }, {
	    key: "setSort",
	    value: function setSort(options) {
	      var _BX$Main$gridManager$2;
	      var grid = (_BX$Main$gridManager$2 = BX.Main.gridManager.getById(options.gridId)) === null || _BX$Main$gridManager$2 === void 0 ? void 0 : _BX$Main$gridManager$2.instance;
	      if (main_core.Type.isObject(grid)) {
	        grid.tableFade();
	        grid.getUserOptions().setSort(options.sortBy, options.order, function () {
	          grid.reload();
	        });
	      }
	    }
	  }, {
	    key: "setFilter",
	    value: function setFilter(options) {
	      var _BX$Main$gridManager$3;
	      var grid = (_BX$Main$gridManager$3 = BX.Main.gridManager.getById(options.gridId)) === null || _BX$Main$gridManager$3 === void 0 ? void 0 : _BX$Main$gridManager$3.instance;
	      var filter = BX.Main.filterManager.getById(options.gridId);
	      if (main_core.Type.isObject(grid) && main_core.Type.isObject(filter)) {
	        filter.getApi().extendFilter(options.filter);
	      }
	    }
	  }, {
	    key: "reinviteCloudAction",
	    value: function reinviteCloudAction(data) {
	      return BX.ajax.runAction('intranet.invite.reinviteWithChangeContact', {
	        data: data
	      }).then(function (response) {
	        if (response.data.result) {
	          var InviteAccessPopup = new BX.PopupWindow({
	            content: "<p>".concat(main_core.Loc.getMessage('INTRANET_USER_LIST_ACTION_REINVITE_SUCCESS'), "</p>"),
	            autoHide: true
	          });
	          InviteAccessPopup.show();
	        }
	        return response;
	      }, function (response) {
	        var errors = response.errors.map(function (error) {
	          return error.message;
	        });
	        ui_formElements_field.ErrorCollection.showSystemError(errors.join('<br>'));
	        return response;
	      });
	    }
	  }, {
	    key: "reinviteAction",
	    value: function reinviteAction(userId, isExtranetUser) {
	      return BX.ajax.runAction('intranet.controller.invite.reinvite', {
	        data: {
	          params: {
	            userId: userId,
	            extranet: isExtranetUser ? 'Y' : 'N'
	          }
	        }
	      }).then(function (response) {
	        if (response.data.result) {
	          var InviteAccessPopup = new BX.PopupWindow({
	            content: "<p>".concat(main_core.Loc.getMessage('INTRANET_USER_LIST_ACTION_REINVITE_SUCCESS'), "</p>"),
	            autoHide: true
	          });
	          InviteAccessPopup.show();
	        }
	        return response;
	      });
	    }
	  }]);
	  return GridManager;
	}();
	babelHelpers.defineProperty(GridManager, "instances", []);

	var _templateObject$3;
	function _classPrivateMethodInitSpec$1(obj, privateSet) { _checkPrivateRedeclaration$3(obj, privateSet); privateSet.add(obj); }
	function _checkPrivateRedeclaration$3(obj, privateCollection) { if (privateCollection.has(obj)) { throw new TypeError("Cannot initialize the same private elements twice on an object"); } }
	function _classPrivateMethodGet$1(receiver, privateSet, fn) { if (!privateSet.has(receiver)) { throw new TypeError("attempted to get private field on non-instance"); } return fn; }
	var _updateData = /*#__PURE__*/new WeakSet();
	var _onClick = /*#__PURE__*/new WeakSet();
	var _actionFactory = /*#__PURE__*/new WeakSet();
	var _inviteAction = /*#__PURE__*/new WeakSet();
	var _acceptAction = /*#__PURE__*/new WeakSet();
	var ActivityField = /*#__PURE__*/function (_BaseField) {
	  babelHelpers.inherits(ActivityField, _BaseField);
	  function ActivityField() {
	    var _babelHelpers$getProt;
	    var _this;
	    babelHelpers.classCallCheck(this, ActivityField);
	    for (var _len = arguments.length, args = new Array(_len), _key = 0; _key < _len; _key++) {
	      args[_key] = arguments[_key];
	    }
	    _this = babelHelpers.possibleConstructorReturn(this, (_babelHelpers$getProt = babelHelpers.getPrototypeOf(ActivityField)).call.apply(_babelHelpers$getProt, [this].concat(args)));
	    _classPrivateMethodInitSpec$1(babelHelpers.assertThisInitialized(_this), _acceptAction);
	    _classPrivateMethodInitSpec$1(babelHelpers.assertThisInitialized(_this), _inviteAction);
	    _classPrivateMethodInitSpec$1(babelHelpers.assertThisInitialized(_this), _actionFactory);
	    _classPrivateMethodInitSpec$1(babelHelpers.assertThisInitialized(_this), _onClick);
	    _classPrivateMethodInitSpec$1(babelHelpers.assertThisInitialized(_this), _updateData);
	    return _this;
	  }
	  babelHelpers.createClass(ActivityField, [{
	    key: "render",
	    value: function render(params) {
	      var _params$action,
	        _this2 = this;
	      var title = '';
	      var color = '';
	      switch ((_params$action = params.action) !== null && _params$action !== void 0 ? _params$action : 'invite') {
	        case 'accept':
	          title = main_core.Loc.getMessage('INTRANET_JS_CONTROL_BUTTON_ACCEPT_ENTER');
	          color = BX.UI.Button.Color.PRIMARY;
	          break;
	        case 'invite':
	        default:
	          title = main_core.Loc.getMessage('INTRANET_JS_CONTROL_BUTTON_INVITE_AGAIN');
	          color = BX.UI.Button.Color.LIGHT_BORDER;
	          break;
	      }
	      var counter = main_core.Tag.render(_templateObject$3 || (_templateObject$3 = babelHelpers.taggedTemplateLiteral(["\n\t\t\t<div class=\"ui-counter user-grid_invitation-counter\">\n\t\t\t\t<div class=\"ui-counter-inner\">1</div>\n\t\t\t</div>\n\t\t"])));
	      main_core.Dom.append(counter, this.getFieldNode());
	      var button = new BX.UI.Button({
	        text: title,
	        color: color,
	        noCaps: true,
	        size: BX.UI.Button.Size.EXTRA_SMALL,
	        tag: BX.UI.Button.Tag.INPUT,
	        round: true,
	        onclick: function onclick() {
	          _classPrivateMethodGet$1(_this2, _onClick, _onClick2).call(_this2, params, button);
	        }
	      });
	      button.renderTo(this.getFieldNode());
	    }
	  }]);
	  return ActivityField;
	}(BaseField);
	function _updateData2(data) {
	  var _GridManager$getInsta;
	  var row = (_GridManager$getInsta = GridManager.getInstance(this.gridId).getGrid()) === null || _GridManager$getInsta === void 0 ? void 0 : _GridManager$getInsta.getRows().getById(this.userId);
	  row === null || row === void 0 ? void 0 : row.stateLoad();
	  GridManager.reinviteCloudAction(data).then(function (response) {
	    row === null || row === void 0 ? void 0 : row.update();
	    row === null || row === void 0 ? void 0 : row.stateUnload();
	  });
	}
	function _onClick2(params, button) {
	  if (!params.enabled) {
	    var popup = BX.PopupWindowManager.create('intranet-user-grid-invitation-disabled', null, {
	      darkMode: true,
	      content: main_core.Loc.getMessage('INTRANET_USER_LIST_ACTION_REINVITE_DISABLED'),
	      closeByEsc: true,
	      angle: true,
	      offsetLeft: 40,
	      maxWidth: 300,
	      overlay: false,
	      autoHide: true
	    });
	    popup.setBindElement(button.getContainer());
	    popup.show();
	  } else {
	    _classPrivateMethodGet$1(this, _actionFactory, _actionFactory2).call(this, params.action).call(this, params, button);
	  }
	}
	function _actionFactory2(action) {
	  switch (action) {
	    case 'accept':
	      return _classPrivateMethodGet$1(this, _acceptAction, _acceptAction2);
	      break;
	    case 'invite':
	      return _classPrivateMethodGet$1(this, _inviteAction, _inviteAction2);
	    default:
	      return _classPrivateMethodGet$1(this, _inviteAction, _inviteAction2);
	      break;
	  }
	}
	function _inviteAction2(params, button) {
	  if (params.isCloud === true) {
	    var _ref, _params$email;
	    var reinvitePopup = new intranet_reinvite.ReinvitePopup({
	      userId: params.userId,
	      transport: _classPrivateMethodGet$1(this, _updateData, _updateData2).bind(params),
	      //callback,
	      formType: params.email ? intranet_reinvite.FormType.EMAIL : intranet_reinvite.FormType.PHONE,
	      bindElement: button.getContainer(),
	      inputValue: (_ref = (_params$email = params.email) !== null && _params$email !== void 0 ? _params$email : params.phoneNumber) !== null && _ref !== void 0 ? _ref : ''
	    });
	    //This is a hack. When the row is updated, a new button is created.
	    reinvitePopup.getPopup().setBindElement(button.getContainer());
	    reinvitePopup.show();
	  } else {
	    button.setWaiting(true);
	    GridManager.reinviteAction(params.userId, params.isExtranet).then(function () {
	      button.setWaiting(false);
	    });
	  }
	}
	function _acceptAction2(params, button) {
	  GridManager.getInstance(params.gridId).confirmAction({
	    isAccept: true,
	    userId: params.userId
	  });
	}

	var _templateObject$4, _templateObject2$2, _templateObject3$1;
	var DepartmentField = /*#__PURE__*/function (_BaseField) {
	  babelHelpers.inherits(DepartmentField, _BaseField);
	  function DepartmentField() {
	    babelHelpers.classCallCheck(this, DepartmentField);
	    return babelHelpers.possibleConstructorReturn(this, babelHelpers.getPrototypeOf(DepartmentField).apply(this, arguments));
	  }
	  babelHelpers.createClass(DepartmentField, [{
	    key: "render",
	    value: function render(params) {
	      var _this = this;
	      main_core.Dom.addClass(this.getFieldNode(), 'user-grid_department-container');
	      if (params.departments.length === 0 && params.canEdit) {
	        // TODO: add department button
	        return;
	        var onclick = function onclick() {
	          var dialog = new ui_entitySelector.Dialog({
	            width: 300,
	            height: 300,
	            targetNode: addButton,
	            compactView: true,
	            multiple: false,
	            entities: [{
	              id: 'department',
	              options: {
	                selectMode: 'departmentsOnly',
	                allowSelectRootDepartment: true
	              }
	            }]
	          });
	          dialog.show();
	        };
	        var addButton = main_core.Tag.render(_templateObject$4 || (_templateObject$4 = babelHelpers.taggedTemplateLiteral(["\n\t\t\t\t<div class=\"user-grid_department-btn\" onclick=\"", "\">\n\t\t\t\t\t<div class=\"user-grid_department-icon-container\">\n\t\t\t\t\t\t<div class=\"ui-icon-set --plus-30\" style=\"--ui-icon-set__icon-size: 18px; --ui-icon-set__icon-color: #2fc6f6;\"></div>\n\t\t\t\t\t</div>\n\t\t\t\t\t<div class=\"user-grid_department-name-container\">\n\t\t\t\t\t\t", "\n\t\t\t\t\t</div>\n\t\t\t\t</div>\n\t\t\t"])), onclick, main_core.Loc.getMessage('INTRANET_JS_CONTROL_BALLOON_ADD_DEPARTMENT'));
	        this.appendToFieldNode(addButton);
	      } else {
	        Object.values(params.departments).forEach(function (department) {
	          var isSelected = department.id === params.selectedDepartment;
	          var onclick = function onclick() {
	            GridManager.setFilter({
	              gridId: _this.getGridId(),
	              filter: {
	                DEPARTMENT: isSelected ? '' : department.id,
	                DEPARTMENT_label: isSelected ? '' : department.name
	              }
	            });
	          };
	          var button = main_core.Tag.render(_templateObject2$2 || (_templateObject2$2 = babelHelpers.taggedTemplateLiteral(["\n\t\t\t\t\t<div\n\t\t\t\t\t\tclass=\"user-grid_department-btn ", "\"\n\t\t\t\t\t\tonclick=\"", "\"\n\t\t\t\t\t\t>\n\t\t\t\t\t\t<div class=\"user-grid_department-name-container\">\n\t\t\t\t\t\t\t", "\n\t\t\t\t\t\t</div>\n\t\t\t\t\t</div>\n\t\t\t\t"])), isSelected ? '--selected' : '', onclick, department.name);
	          if (isSelected) {
	            main_core.Dom.append(main_core.Tag.render(_templateObject3$1 || (_templateObject3$1 = babelHelpers.taggedTemplateLiteral(["\n\t\t\t\t\t\t<div class=\"user-grid_department-btn-remove ui-icon-set --cross-60\"></div>\n\t\t\t\t\t"]))), button);
	          }
	          _this.appendToFieldNode(button);
	        });
	      }
	    }
	  }]);
	  return DepartmentField;
	}(BaseField);

	exports.BaseField = BaseField;
	exports.PhotoField = PhotoField;
	exports.FullNameField = FullNameField;
	exports.EmployeeField = EmployeeField;
	exports.ActivityField = ActivityField;
	exports.DepartmentField = DepartmentField;
	exports.GridManager = GridManager;

}((this.BX.Intranet.UserList = this.BX.Intranet.UserList || {}),BX.UI,BX.UI.Dialogs,BX.UI.FormElements,BX.UI,BX.Intranet.Reinvite,BX,BX,BX.UI.EntitySelector));
//# sourceMappingURL=grid.bundle.js.map
