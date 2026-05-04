/* eslint-disable */
this.BX = this.BX || {};
this.BX.Intranet = this.BX.Intranet || {};
(function (exports, main_core, ui_avatar, ui_label, ui_dialogs_messagebox, ui_formElements_field, bitrix24_firstAdminGuard, intranet_fireEmployeeWizard, intranet_reinvite, im_public, ui_entitySelector) {
	'use strict';

	function _classPrivateFieldInitSpec$1(e, t, a) { _checkPrivateRedeclaration$3(e, t), t.set(e, a); }
	function _checkPrivateRedeclaration$3(e, t) { if (t.has(e)) throw new TypeError("Cannot initialize the same private elements twice on an object"); }
	function _classPrivateFieldGet$1(s, a) { return s.get(_assertClassBrand$3(s, a)); }
	function _classPrivateFieldSet$1(s, a, r) { return s.set(_assertClassBrand$3(s, a), r), r; }
	function _assertClassBrand$3(e, t, n) { if ("function" == typeof e ? e === t : e.has(t)) return arguments.length < 3 ? t : n; throw new TypeError("Private element is not present on this object"); }
	var _fieldId = /*#__PURE__*/new WeakMap();
	var _gridId = /*#__PURE__*/new WeakMap();
	class BaseField {
		constructor(params) {
			var _params$gridId;
			_classPrivateFieldInitSpec$1(this, _fieldId, void 0);
			_classPrivateFieldInitSpec$1(this, _gridId, void 0);
			_classPrivateFieldSet$1(_fieldId, this, params.fieldId);
			_classPrivateFieldSet$1(_gridId, this, (_params$gridId = params.gridId) !== null && _params$gridId !== void 0 ? _params$gridId : null);
		}
		getGridId() {
			return _classPrivateFieldGet$1(_gridId, this);
		}
		getFieldId() {
			return _classPrivateFieldGet$1(_fieldId, this);
		}
		getGrid() {
			var _grid;
			let grid = null;
			if (_classPrivateFieldGet$1(_gridId, this)) {
				grid = BX.Main.gridManager.getById(_classPrivateFieldGet$1(_gridId, this));
			}
			return (_grid = grid) === null || _grid === void 0 ? void 0 : _grid.instance;
		}
		getFieldNode() {
			return document.getElementById(this.getFieldId());
		}
		appendToFieldNode(element) {
			main_core.Dom.append(element, this.getFieldNode());
		}
	}

	class PhotoField extends BaseField {
		render(params) {
			var _avatar;
			const avatarOptions = {
				size: 40,
				userpicPath: params.photoUrl ? params.photoUrl : null
			};
			let avatar = null;
			if (params.role === 'collaber') {
				avatar = new ui_avatar.AvatarRoundGuest(avatarOptions);
			} else if (params.role === 'extranet') {
				avatar = new ui_avatar.AvatarRoundExtranet(avatarOptions);
			} else {
				avatar = new ui_avatar.AvatarRound(avatarOptions);
			}
			(_avatar = avatar) === null || _avatar === void 0 || _avatar.renderTo(this.getFieldNode());
			main_core.Dom.addClass(this.getFieldNode(), 'user-grid_user-photo');
		}
	}

	var _templateObject$3, _templateObject2$2, _templateObject3$1, _templateObject4, _templateObject5, _templateObject6, _templateObject7, _templateObject8;
	function _classPrivateMethodInitSpec$1(e, a) { _checkPrivateRedeclaration$2(e, a), a.add(e); }
	function _checkPrivateRedeclaration$2(e, t) { if (t.has(e)) throw new TypeError("Cannot initialize the same private elements twice on an object"); }
	function _assertClassBrand$2(e, t, n) { if ("function" == typeof e ? e === t : e.has(t)) return arguments.length < 3 ? t : n; throw new TypeError("Private element is not present on this object"); }
	var _FullNameField_brand = /*#__PURE__*/new WeakSet();
	class FullNameField extends BaseField {
		constructor() {
			super(...arguments);
			_classPrivateMethodInitSpec$1(this, _FullNameField_brand);
		}
		render(params) {
			const fullNameContainer = main_core.Tag.render(_templateObject$3 || (_templateObject$3 = babelHelpers.taggedTemplateLiteral(["\n\t\t\t<div class=\"user-grid_full-name-container\">", "</div>\n\t\t"])), _assertClassBrand$2(_FullNameField_brand, this, _getFullNameLink).call(this, params.fullName, params.profileLink));
			if (params.position) {
				main_core.Dom.append(_assertClassBrand$2(_FullNameField_brand, this, _getPositionLabelContainer).call(this, main_core.Text.encode(params.position)), fullNameContainer);
			}
			switch (params.role) {
				case 'integrator':
					main_core.Dom.append(_assertClassBrand$2(_FullNameField_brand, this, _getIntegratorBalloonContainer).call(this), fullNameContainer);
					break;
				case 'admin':
					main_core.Dom.append(_assertClassBrand$2(_FullNameField_brand, this, _getAdminBalloonContainer).call(this, params.isFirstAdmin), fullNameContainer);
					break;
				case 'extranet':
					main_core.Dom.append(_assertClassBrand$2(_FullNameField_brand, this, _getExtranetBalloonContainer).call(this), fullNameContainer);
					break;
				case 'collaber':
					main_core.Dom.append(_assertClassBrand$2(_FullNameField_brand, this, _getCollaberBalloonContainer).call(this), fullNameContainer);
					break;
			}
			switch (params.inviteStatus) {
				case 'INVITE_AWAITING_APPROVE':
					main_core.Dom.append(_assertClassBrand$2(_FullNameField_brand, this, _getWaitingConfirmationLabelContainer).call(this), fullNameContainer);
					break;
				case 'INVITED':
					main_core.Dom.append(_assertClassBrand$2(_FullNameField_brand, this, _getInvitedLabelContainer).call(this), fullNameContainer);
					break;
			}
			this.appendToFieldNode(fullNameContainer);
		}
	}
	function _getFullNameLink(fullName, profileLink) {
		return main_core.Tag.render(_templateObject2$2 || (_templateObject2$2 = babelHelpers.taggedTemplateLiteral(["\n\t\t\t<a class=\"user-grid_full-name-label\" href=\"", "\">\n\t\t\t\t", "\n\t\t\t</a>\n\t\t"])), profileLink, fullName);
	}
	function _getInvitedLabelContainer() {
		const label = new ui_label.Label({
			text: main_core.Loc.getMessage('INTRANET_JS_CONTROL_BALLOON_INVITATION_NOT_ACCEPTED'),
			color: ui_label.LabelColor.LIGHT_BLUE,
			fill: true,
			size: ui_label.Label.Size.MD,
			customClass: 'user-grid_label'
		});
		return label.render();
	}
	function _getWaitingConfirmationLabelContainer() {
		const label = new ui_label.Label({
			text: main_core.Loc.getMessage('INTRANET_JS_CONTROL_BALLOON_NOT_CONFIRMED'),
			color: ui_label.LabelColor.YELLOW,
			fill: true,
			size: ui_label.Label.Size.MD,
			customClass: 'user-grid_label'
		});
		return label.render();
	}
	function _getPositionLabelContainer(position) {
		return main_core.Tag.render(_templateObject3$1 || (_templateObject3$1 = babelHelpers.taggedTemplateLiteral(["<div class=\"user-grid_position-label\">", "</div>"])), position);
	}
	function _getIntegratorBalloonContainer() {
		var _Extension$getSetting;
		return main_core.Tag.render(_templateObject4 || (_templateObject4 = babelHelpers.taggedTemplateLiteral(["\n\t\t\t<span class=\"user-grid_role-label --integrator\">\n\t\t\t\t", "\n\t\t\t</span>\n\t\t"])), ((_Extension$getSetting = main_core.Extension.getSettings('intranet.grid.user-grid')) === null || _Extension$getSetting === void 0 ? void 0 : _Extension$getSetting.isRenamedIntegrator) === 'Y' ? main_core.Loc.getMessage('INTRANET_JS_CONTROL_BALLOON_INTEGRATOR_RENAMED') : main_core.Loc.getMessage('INTRANET_JS_CONTROL_BALLOON_INTEGRATOR'));
	}
	function _getAdminBalloonContainer(isFirstAdmin) {
		if (isFirstAdmin) {
			return main_core.Tag.render(_templateObject5 || (_templateObject5 = babelHelpers.taggedTemplateLiteral(["\n\t\t\t\t<span class=\"user-grid_role-label --first-admin\">\n\t\t\t\t\t", "\n\t\t\t\t</span>\n\t\t\t"])), main_core.Loc.getMessage('INTRANET_JS_CONTROL_BALLOON_FIRST_ADMIN'));
		}
		return main_core.Tag.render(_templateObject6 || (_templateObject6 = babelHelpers.taggedTemplateLiteral(["\n\t\t\t<span class=\"user-grid_role-label --admin\">\n\t\t\t\t", "\n\t\t\t</span>\n\t\t"])), main_core.Loc.getMessage('INTRANET_JS_CONTROL_BALLOON_ADMIN'));
	}
	function _getExtranetBalloonContainer() {
		return main_core.Tag.render(_templateObject7 || (_templateObject7 = babelHelpers.taggedTemplateLiteral(["\n\t\t\t<span class=\"user-grid_role-label --extranet\">\n\t\t\t\t", "\n\t\t\t</span>\n\t\t"])), main_core.Loc.getMessage('INTRANET_JS_CONTROL_BALLOON_EXTRANET'));
	}
	function _getCollaberBalloonContainer() {
		return main_core.Tag.render(_templateObject8 || (_templateObject8 = babelHelpers.taggedTemplateLiteral(["\n\t\t\t<span class=\"user-grid_role-label --collaber\">\n\t\t\t\t", "\n\t\t\t</span>\n\t\t"])), main_core.Loc.getMessage('INTRANET_JS_CONTROL_BALLOON_COLLABER'));
	}

	var _templateObject$2, _templateObject2$1;
	class EmployeeField extends BaseField {
		render(params) {
			const photoFieldId = main_core.Text.getRandom(6);
			const fullNameFieldId = main_core.Text.getRandom(6);
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
	}

	class ConnectField extends BaseField {
		render(params) {
			const button = new BX.UI.Button({
				text: main_core.Loc.getMessage('INTRANET_JS_CONTROL_BUTTON_SEND_MESSAGE'),
				useAirDesign: true,
				style: BX.UI.AirButtonStyle.FILLED,
				size: BX.UI.Button.Size.EXTRA_SMALL,
				onclick: () => {
					var _top$BXIM;
					(_top$BXIM = top.BXIM) === null || _top$BXIM === void 0 || _top$BXIM.openMessenger(params.userId);
				}
			});
			button.renderTo(this.getFieldNode());
		}
	}

	function _classPrivateFieldInitSpec(e, t, a) { _checkPrivateRedeclaration$1(e, t), t.set(e, a); }
	function _checkPrivateRedeclaration$1(e, t) { if (t.has(e)) throw new TypeError("Cannot initialize the same private elements twice on an object"); }
	function _classPrivateFieldGet(s, a) { return s.get(_assertClassBrand$1(s, a)); }
	function _classPrivateFieldSet(s, a, r) { return s.set(_assertClassBrand$1(s, a), r), r; }
	function _assertClassBrand$1(e, t, n) { if ("function" == typeof e ? e === t : e.has(t)) return arguments.length < 3 ? t : n; throw new TypeError("Private element is not present on this object"); }
	var _grid = /*#__PURE__*/new WeakMap();
	var _firstAdminId = /*#__PURE__*/new WeakMap();
	class GridManager {
		constructor(gridId) {
			var _BX$Main$gridManager$;
			let isCloud = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : false;
			let isFirstAdminConfirmationEnabled = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : false;
			_classPrivateFieldInitSpec(this, _grid, void 0);
			_classPrivateFieldInitSpec(this, _firstAdminId, undefined);
			babelHelpers.defineProperty(this, "isCloud", false);
			babelHelpers.defineProperty(this, "isFirstAdminConfirmationEnabled", false);
			_classPrivateFieldSet(_grid, this, (_BX$Main$gridManager$ = BX.Main.gridManager.getById(gridId)) === null || _BX$Main$gridManager$ === void 0 ? void 0 : _BX$Main$gridManager$.instance);
			this.isCloud = isCloud;
			this.isFirstAdminConfirmationEnabled = isFirstAdminConfirmationEnabled;
		}
		static getInstance(gridId) {
			let isCloud = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : false;
			let isFirstAdminConfirmationEnabled = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : false;
			if (!this.instances[gridId]) {
				this.instances[gridId] = new GridManager(gridId, isCloud, isFirstAdminConfirmationEnabled);
			}
			return this.instances[gridId];
		}
		static setSort(options) {
			var _BX$Main$gridManager$2;
			const grid = (_BX$Main$gridManager$2 = BX.Main.gridManager.getById(options.gridId)) === null || _BX$Main$gridManager$2 === void 0 ? void 0 : _BX$Main$gridManager$2.instance;
			if (main_core.Type.isObject(grid)) {
				grid.tableFade();
				grid.getUserOptions().setSort(options.sortBy, options.order, () => {
					grid.reload();
				});
			}
		}
		static setFilter(options) {
			var _BX$Main$gridManager$3;
			const grid = (_BX$Main$gridManager$3 = BX.Main.gridManager.getById(options.gridId)) === null || _BX$Main$gridManager$3 === void 0 ? void 0 : _BX$Main$gridManager$3.instance;
			const filter = BX.Main.filterManager.getById(options.gridId);
			if (main_core.Type.isObject(grid) && main_core.Type.isObject(filter)) {
				filter.getApi().extendFilter(options.filter);
			}
		}
		static reinviteCloudAction(data) {
			return main_core.ajax.runAction('intranet.invite.reinviteWithChangeContact', {
				data
			}).then(response => {
				if (response.data.result) {
					const InviteAccessPopup = new BX.PopupWindow({
						content: "<p>".concat(main_core.Loc.getMessage('INTRANET_USER_LIST_ACTION_REINVITE_SUCCESS'), "</p>"),
						autoHide: true
					});
					InviteAccessPopup.show();
				}
				return response;
			}, response => {
				const errors = response.errors.map(error => error.message);
				ui_formElements_field.ErrorCollection.showSystemError(errors.join('<br>'));
				return response;
			});
		}
		static reinviteAction(userId, isExtranetUser) {
			return main_core.ajax.runAction('intranet.controller.invite.reinvite', {
				data: {
					params: {
						userId,
						extranet: isExtranetUser ? 'Y' : 'N'
					}
				}
			}).then(response => {
				if (response.data.result) {
					const InviteAccessPopup = new BX.PopupWindow({
						content: "<p>".concat(main_core.Loc.getMessage('INTRANET_USER_LIST_ACTION_REINVITE_SUCCESS'), "</p>"),
						autoHide: true
					});
					InviteAccessPopup.show();
				}
				return response;
			});
		}
		getGrid() {
			return _classPrivateFieldGet(_grid, this);
		}
		confirmAction(params) {
			if (params.userId) {
				this.confirmUser(params.isAccept ? 'confirm' : 'decline', () => {
					const row = _classPrivateFieldGet(_grid, this).getRows().getById(params.userId);
					row === null || row === void 0 || row.stateLoad();
					main_core.ajax.runAction('intranet.controller.invite.confirmUserRequest', {
						data: {
							userId: params.userId,
							isAccept: params.isAccept ? 'Y' : 'N'
						}
					}).then(response => {
						if (response.data === true) {
							row === null || row === void 0 || row.update();
						} else if (params.isAccept) {
							row === null || row === void 0 || row.stateUnload();
						} else {
							this.activityAction({
								userId: params.userId,
								action: 'deleteOrFire'
							});
						}
					}).catch(() => {
						if (params.isAccept) {
							row === null || row === void 0 || row.stateUnload();
						} else {
							this.activityAction({
								userId: params.userId,
								action: 'deleteOrFire'
							});
						}
					});
				});
			}
		}
		activityAction(params) {
			var _params$userId, _params$action;
			const userId = (_params$userId = params.userId) !== null && _params$userId !== void 0 ? _params$userId : null;
			const action = (_params$action = params.action) !== null && _params$action !== void 0 ? _params$action : null;
			if (!userId) {
				return;
			}
			if (action === 'fire' || action === 'deleteOrFire') {
				_classPrivateFieldGet(_grid, this).getLoader().show();
				this.runFireWizard(userId).then(response => {
					_classPrivateFieldGet(_grid, this).getLoader().hide();
					const wizard = new intranet_fireEmployeeWizard.FireEmployeeWizard({
						...response.data,
						onConfirm: data => {
							intranet_fireEmployeeWizard.MoveWebhookRequest.send(userId, data).then(() => {
								this.handleFirstAdminFireSingle(userId, params.userFullName, params.currentUserId, () => {
									this.executeUserAction(userId, action, data);
								});
							}).catch(error => console.warn(error));
						}
					});
					wizard.show();
				}).catch(response => {
					_classPrivateFieldGet(_grid, this).getLoader().hide();
					console.warn(response);
				});
			} else {
				this.confirmUser(action, () => {
					this.executeUserAction(userId, action);
				});
			}
		}
		handleFirstAdminFireSingle(userId, userFullName, currentUserId, fallbackAction) {
			if (!this.isCloud || !this.isFirstAdminConfirmationEnabled) {
				fallbackAction();
				return;
			}
			this.checkIfFirstAdmin(userId).then(isFirstAdmin => {
				if (!isFirstAdmin) {
					throw new Error('User is not first admin');
				}
				const guard = new bitrix24_firstAdminGuard.FirstAdminGuard(userFullName || '', currentUserId || 0, userId);
				guard.confirmAction('bitrix24.v2.FirstAdmin.FirstAdminRightsController.sendFireRequest', () => {
					this.firstAdminConfirm({
						userId: Number(currentUserId),
						toUser: Number(userId)
					});
				}, () => {});
			}).catch(() => {
				fallbackAction();
			});
		}
		firstAdminConfirm(data) {
			main_core.ajax.runAction('bitrix24.v2.FirstAdmin.FirstAdminRightsController.sendFireRequest', {
				data
			}).then(response => {
				if (response.status === 'success') {
					BX.UI.Notification.Center.notify({
						content: main_core.Loc.getMessage('INTRANET_USER_LIST_FIRST_GROUP_ACTION_FIRST_ADMIN_REQUEST_SENT', {
							'[b]': '<b>',
							'[/b]': '</b>',
							'[br]': '<br>'
						}),
						autoHide: true,
						autoHideDelay: 3000,
						useAirDesign: true
					});
				}
			}).catch(() => {
				ui_formElements_field.ErrorCollection.showSystemError('An error occurred while sending fire request');
			});
		}
		executeUserAction(userId, action) {
			let options = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};
			this.createHandlerByAction(action).call(this, userId, action, options);
		}
		confirmUser(action, callBack) {
			var _this$getConfirmTitle, _this$getConfirmMessa;
			ui_dialogs_messagebox.MessageBox.show({
				title: (_this$getConfirmTitle = this.getConfirmTitle(action)) !== null && _this$getConfirmTitle !== void 0 ? _this$getConfirmTitle : '',
				message: (_this$getConfirmMessa = this.getConfirmMessage(action)) !== null && _this$getConfirmMessa !== void 0 ? _this$getConfirmMessa : '',
				buttons: ui_dialogs_messagebox.MessageBoxButtons.YES_CANCEL,
				yesCaption: this.getConfirmButtonText(action),
				onYes: messageBox => {
					callBack();
					messageBox.close();
				}
			});
		}
		executeFireAction(userId, action) {
			const row = _classPrivateFieldGet(_grid, this).getRows().getById(userId);
			row === null || row === void 0 || row.stateLoad();
			main_core.ajax.runAction("intranet.v2.User.".concat(action), {
				data: {
					userId
				}
			}).then(() => {
				row === null || row === void 0 || row.update();
			}).catch(response => {
				row === null || row === void 0 || row.stateUnload();
				const errors = response.errors.map(error => error.message);
				ui_formElements_field.ErrorCollection.showSystemError(errors.join('<br>'));
			});
		}
		executeRestoreAction(userId, action) {
			const row = _classPrivateFieldGet(_grid, this).getRows().getById(userId);
			row === null || row === void 0 || row.stateLoad();
			main_core.ajax.runAction('intranet.v2.User.restore', {
				data: {
					userId
				}
			}).then(() => {
				row === null || row === void 0 || row.update();
			}).catch(response => {
				row === null || row === void 0 || row.stateUnload();
				const errors = response.errors.map(error => error.message);
				ui_formElements_field.ErrorCollection.showSystemError(errors.join('<br>'));
			});
		}
		createHandlerByAction(action) {
			const handlers = {
				fire: this.executeFireAction,
				deleteOrFire: this.executeFireAction,
				restore: this.executeRestoreAction
			};
			const handler = handlers[action];
			if (!main_core.Type.isFunction(handler)) {
				throw new TypeError("Handler is not defined for action ".concat(action));
			}
			return handler;
		}
		runFireWizard(userId) {
			return main_core.Runtime.loadExtension('intranet.fire-employee-wizard').then(_ref => {
				let {
					FireWizardConfigProvider
				} = _ref;
				return FireWizardConfigProvider.fetch(userId);
			});
		}
		getConfirmTitle(action) {
			switch (action) {
				case 'restore':
					return main_core.Loc.getMessage('INTRANET_USER_LIST_ACTION_RESTORE_TITLE');
				case 'confirm':
					return main_core.Loc.getMessage('INTRANET_USER_LIST_ACTION_CONFIRM_TITLE');
				case 'delete':
				case 'deleteOrFire':
					return main_core.Loc.getMessage('INTRANET_USER_LIST_ACTION_DELETE_TITLE');
				case 'fire':
					return main_core.Loc.getMessage('INTRANET_USER_LIST_ACTION_DEACTIVATE_TITLE');
				case 'deactivateInvited':
					return main_core.Loc.getMessage('INTRANET_USER_LIST_ACTION_DEACTIVATE_INVITED_TITLE');
				case 'decline':
					return main_core.Loc.getMessage('INTRANET_USER_LIST_ACTION_DECLINE_TITLE');
				default:
					return '';
			}
		}
		getConfirmMessage(action) {
			switch (action) {
				case 'restore':
				case 'confirm':
					return main_core.Loc.getMessage('INTRANET_USER_LIST_ACTION_CONFIRM_MESSAGE');
				case 'delete':
				case 'deleteOrFire':
					return main_core.Loc.getMessage('INTRANET_USER_LIST_ACTION_DELETE_MESSAGE');
				case 'fire':
					return main_core.Loc.getMessage('INTRANET_USER_LIST_ACTION_DEACTIVATE_MESSAGE');
				case 'deactivateInvited':
					return main_core.Loc.getMessage('INTRANET_USER_LIST_ACTION_DEACTIVATE_INVITED_MESSAGE');
				case 'decline':
					return main_core.Loc.getMessage('INTRANET_USER_LIST_ACTION_DECLINE_MESSAGE');
				default:
					return '';
			}
		}
		getConfirmButtonText(action) {
			switch (action) {
				case 'restore':
					return main_core.Loc.getMessage('INTRANET_USER_LIST_ACTION_RESTORE_BUTTON');
				case 'confirm':
					return main_core.Loc.getMessage('INTRANET_USER_LIST_ACTION_CONFIRM_BUTTON');
				case 'delete':
				case 'deleteOrFire':
					return main_core.Loc.getMessage('INTRANET_USER_LIST_ACTION_DELETE_BUTTON');
				case 'fire':
					return main_core.Loc.getMessage('INTRANET_USER_LIST_ACTION_DEACTIVATE_BUTTON');
				case 'deactivateInvited':
					return main_core.Loc.getMessage('INTRANET_USER_LIST_ACTION_DEACTIVATE_INVITED_BUTTON');
				case 'decline':
					return main_core.Loc.getMessage('INTRANET_USER_LIST_ACTION_DECLINE_BUTTON');
				default:
					return null;
			}
		}
		getFirstAdminId() {
			if (_classPrivateFieldGet(_firstAdminId, this) !== undefined) {
				return Promise.resolve(_classPrivateFieldGet(_firstAdminId, this));
			}
			return main_core.ajax.runAction('bitrix24.v2.FirstAdmin.FirstAdminRightsController.getPortalCreator').then(response => {
				_classPrivateFieldSet(_firstAdminId, this, Number(response.data.id));
				return _classPrivateFieldGet(_firstAdminId, this);
			}).catch(() => {
				_classPrivateFieldSet(_firstAdminId, this, null);
				return null;
			});
		}
		checkIfFirstAdmin(userId) {
			return this.getFirstAdminId().then(firstAdminId => {
				return firstAdminId && Number(userId) === Number(firstAdminId);
			});
		}
	}
	babelHelpers.defineProperty(GridManager, "instances", []);

	var _templateObject$1;
	function _classPrivateMethodInitSpec(e, a) { _checkPrivateRedeclaration(e, a), a.add(e); }
	function _checkPrivateRedeclaration(e, t) { if (t.has(e)) throw new TypeError("Cannot initialize the same private elements twice on an object"); }
	function _assertClassBrand(e, t, n) { if ("function" == typeof e ? e === t : e.has(t)) return arguments.length < 3 ? t : n; throw new TypeError("Private element is not present on this object"); }
	var _ActivityField_brand = /*#__PURE__*/new WeakSet();
	class ActivityField extends BaseField {
		constructor() {
			super(...arguments);
			_classPrivateMethodInitSpec(this, _ActivityField_brand);
		}
		render(params) {
			var _params$action;
			let title = '';
			let color = '';
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
			const counter = main_core.Tag.render(_templateObject$1 || (_templateObject$1 = babelHelpers.taggedTemplateLiteral(["\n\t\t\t<div class=\"ui-counter user-grid_invitation-counter\">\n\t\t\t\t<div class=\"ui-counter-inner\">1</div>\n\t\t\t</div>\n\t\t"])));
			main_core.Dom.append(counter, this.getFieldNode());
			const button = new BX.UI.Button({
				text: title,
				color,
				noCaps: true,
				size: BX.UI.Button.Size.EXTRA_SMALL,
				tag: BX.UI.Button.Tag.INPUT,
				round: true,
				onclick: () => {
					_assertClassBrand(_ActivityField_brand, this, _onClick).call(this, params, button);
				}
			});
			button.renderTo(this.getFieldNode());
		}
	}
	function _updateData(data) {
		var _GridManager$getInsta;
		if (!main_core.Type.isStringFilled(data.get('newEmail')) && !main_core.Type.isBoolean(data.get('newPhone'))) {
			top.console.error('Empty new email or phone');
			return;
		}
		const row = (_GridManager$getInsta = GridManager.getInstance(this.gridId).getGrid()) === null || _GridManager$getInsta === void 0 ? void 0 : _GridManager$getInsta.getRows().getById(this.userId);
		row === null || row === void 0 || row.stateLoad();
		GridManager.reinviteCloudAction(data).then(response => {
			row === null || row === void 0 || row.update();
			row === null || row === void 0 || row.stateUnload();
		});
	}
	function _onClick(params, button) {
		if (!params.enabled) {
			const popup = BX.PopupWindowManager.create('intranet-user-grid-invitation-disabled', null, {
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
			_assertClassBrand(_ActivityField_brand, this, _actionFactory).call(this, params.action).call(this, params, button);
		}
	}
	function _actionFactory(action) {
		switch (action) {
			case 'accept':
				return _assertClassBrand(_ActivityField_brand, this, _acceptAction);
			case 'invite':
				return _assertClassBrand(_ActivityField_brand, this, _inviteAction);
			default:
				return _assertClassBrand(_ActivityField_brand, this, _inviteAction);
		}
	}
	function _inviteAction(params, button) {
		if (params.isCloud === true) {
			var _ref, _params$email;
			const reinvitePopup = new intranet_reinvite.ReinvitePopup({
				userId: params.userId,
				formType: params.email ? intranet_reinvite.FormType.EMAIL : intranet_reinvite.FormType.PHONE,
				bindElement: button.getContainer(),
				inputValue: (_ref = (_params$email = params.email) !== null && _params$email !== void 0 ? _params$email : params.phoneNumber) !== null && _ref !== void 0 ? _ref : '',
				transport: _assertClassBrand(_ActivityField_brand, this, _updateData).bind(params)
			});
			//This is a hack. When the row is updated, a new button is created.
			reinvitePopup.getPopup().setBindElement(button.getContainer());
			reinvitePopup.show();
		} else {
			button.setWaiting(true);
			GridManager.reinviteAction(params.userId, params.isExtranet).then(() => {
				button.setWaiting(false);
			});
		}
	}
	function _acceptAction(params, button) {
		GridManager.getInstance(params.gridId).confirmAction({
			isAccept: true,
			userId: params.userId
		});
	}

	var _templateObject2, _templateObject3;
	class DepartmentField extends BaseField {
		render(params) {
			main_core.Dom.addClass(this.getFieldNode(), 'user-grid_department-container');
			if (params.departments.length === 0 && params.canEdit) {
				// TODO: add department button
				return;
			} else {
				Object.values(params.departments).forEach(department => {
					const isSelected = department.id === params.selectedDepartment;
					const onclick = () => {
						GridManager.setFilter({
							gridId: this.getGridId(),
							filter: {
								DEPARTMENT: isSelected ? '' : department.id,
								DEPARTMENT_label: isSelected ? '' : department.name
							}
						});
					};
					const button = main_core.Tag.render(_templateObject2 || (_templateObject2 = babelHelpers.taggedTemplateLiteral(["\n\t\t\t\t\t<div\n\t\t\t\t\t\tclass=\"user-grid_department-btn ", "\"\n\t\t\t\t\t\tonclick=\"", "\"\n\t\t\t\t\t\t>\n\t\t\t\t\t\t<div class=\"user-grid_department-name-container\">\n\t\t\t\t\t\t\t", "\n\t\t\t\t\t\t</div>\n\t\t\t\t\t</div>\n\t\t\t\t"])), isSelected ? '--selected' : '', onclick, department.name);
					if (isSelected) {
						main_core.Dom.append(main_core.Tag.render(_templateObject3 || (_templateObject3 = babelHelpers.taggedTemplateLiteral(["\n\t\t\t\t\t\t<div class=\"user-grid_department-btn-remove ui-icon-set --cross-60\"></div>\n\t\t\t\t\t"]))), button);
					}
					this.appendToFieldNode(button);
				});
			}
		}
	}

	/**
	 * @abstract
	 */
	class BaseAction {
		/**
		 * @abstract
		 */
		static getActionId() {
			throw new Error('not implemented');
		}

		/**
		 * @abstract
		 */
		getAjaxMethod() {
			throw new Error('not implemented');
		}
		constructor(params) {
			var _params$showPopups;
			this.grid = params.grid;
			this.userFilter = params.filter;
			this.selectedUsers = params.selectedUsers;
			this.showPopups = (_params$showPopups = params.showPopups) !== null && _params$showPopups !== void 0 ? _params$showPopups : true;
			this.isCloud = params.isCloud;
			this.isFirstAdminConfirmationEnabled = params.isFirstAdminConfirmationEnabled;
			this.currentUserId = params.currentUserId;
			this.currentUserName = params.currentUserName;
			this.firstAdminId = params.firstAdminId;
		}
		execute() {
			const confirmationPopup = this.showPopups ? this.getConfirmationPopup() : null;
			if (confirmationPopup) {
				confirmationPopup.setOkCallback(() => {
					this.sendActionRequest();
					confirmationPopup.close();
				});
				confirmationPopup.show();
			} else {
				this.sendActionRequest();
			}
		}
		getConfirmationPopup() {
			return null;
		}
		sendActionRequest() {
			var _this$selectedUsers;
			this.grid.tableFade();
			const selectedRows = (_this$selectedUsers = this.selectedUsers) !== null && _this$selectedUsers !== void 0 ? _this$selectedUsers : this.grid.getRows().getSelectedIds();
			const isSelectedAllRows = this.grid.getRows().isAllSelected() ? 'Y' : 'N';
			BX.ajax.runAction(this.getAjaxMethod(), {
				data: {
					fields: {
						userIds: selectedRows,
						isSelectedAllRows,
						filter: this.userFilter
					}
				}
			}).then(result => this.handleSuccess(result)).catch(result => this.handleError(result));
		}
		handleSuccess(result) {
			this.grid.reload();
			if (this.showPopups) {
				const {
					skippedActiveUsers,
					skippedFiredUsers
				} = result.data;
				if (skippedActiveUsers && Object.keys(skippedActiveUsers).length > 0) {
					this.showActiveUsersPopup(skippedActiveUsers);
				} else if (skippedFiredUsers && Object.keys(skippedFiredUsers).length > 0) {
					this.showFiredUsersPopup(skippedFiredUsers);
				}
			}
		}
		handleError(result) {
			this.grid.tableUnfade();
			this.unselectRows(this.grid);
			console.error(result);
			if (this.showPopups && result.errors && result.errors.length > 0) {
				const errorMessage = result.errors.map(item => {
					return item.message;
				}).join(', ');
				ui_dialogs_messagebox.MessageBox.show({
					message: errorMessage,
					buttons: ui_dialogs_messagebox.MessageBoxButtons.YES,
					yesCaption: main_core.Loc.getMessage('INTRANET_USER_LIST_ACTION_UNDERSTOOD_BUTTON'),
					onYes: messageBox => {
						messageBox.close();
					}
				});
			}
		}
		showActiveUsersPopup(activeUsers) {
			ui_dialogs_messagebox.MessageBox.show({
				title: main_core.Loc.getMessage(this.getSkippedUsersTitleCode()),
				message: this.getMessageWithProfileNames(this.getSkippedUsersMessageCode(), activeUsers),
				buttons: ui_dialogs_messagebox.MessageBoxButtons.YES,
				yesCaption: main_core.Loc.getMessage('INTRANET_USER_LIST_ACTION_UNDERSTOOD_BUTTON'),
				onYes: messageBox => {
					messageBox.close();
				}
			});
		}
		showFiredUsersPopup(firedUsers) {
			ui_dialogs_messagebox.MessageBox.show({
				title: main_core.Loc.getMessage('INTRANET_USER_LIST_GROUP_ACTION_FIRE_SKIPPED_TITLE'),
				message: this.getMessageWithProfileNames('INTRANET_USER_LIST_GROUP_ACTION_FIRE_SKIPPED_MESSAGE', firedUsers),
				buttons: ui_dialogs_messagebox.MessageBoxButtons.YES,
				yesCaption: main_core.Loc.getMessage('INTRANET_USER_LIST_ACTION_UNDERSTOOD_BUTTON'),
				onYes: messageBox => {
					messageBox.close();
				}
			});
		}
		getMessageWithProfileNames(messageCode, users) {
			const maxDisplayCount = 5;
			const userValues = Object.values(users);
			const displayedNames = userValues.slice(0, maxDisplayCount).map(user => user.fullName);
			const remainingCount = userValues.length - maxDisplayCount;
			const namesString = displayedNames.join(', ');
			if (displayedNames.length < 2 && remainingCount < 1) {
				return main_core.Loc.getMessage("".concat(messageCode, "_SINGLE"), {
					'#USER#': namesString
				});
			}
			if (remainingCount > 0) {
				return main_core.Loc.getMessage("".concat(messageCode, "_REMAINING"), {
					'#USER_LIST#': namesString,
					'#USER_REMAINING#': remainingCount
				});
			}
			return main_core.Loc.getMessage(messageCode, {
				'#USER_LIST#': namesString
			});
		}
		getSkippedUsersTitleCode() {
			return '';
		}
		getSkippedUsersMessageCode() {
			return '';
		}
		unselectRows(grid) {
			grid.getRows().unselectAll();
			grid.updateCounterDisplayed();
			grid.updateCounterSelected();
			grid.disableActionsPanel();
			BX.onCustomEvent(window, 'Grid::allRowsUnselected', []);
		}
	}

	class FireAction extends BaseAction {
		static getActionId() {
			return 'fire';
		}
		execute() {
			const confirmationPopup = this.showPopups ? this.getConfirmationPopup() : null;
			if (confirmationPopup) {
				confirmationPopup.setOkCallback(() => {
					confirmationPopup.close();
					this.executeAfterConfirmation();
				});
				confirmationPopup.show();
			} else {
				this.executeAfterConfirmation();
			}
		}
		executeAfterConfirmation() {
			if (this.firstAdminId) {
				var _this$selectedUsers;
				const selectedRows = (_this$selectedUsers = this.selectedUsers) !== null && _this$selectedUsers !== void 0 ? _this$selectedUsers : this.grid.getRows().getSelectedIds();
				const isFirstAdminSelected = selectedRows.some(userId => Number(userId) === Number(this.firstAdminId));
				if (isFirstAdminSelected) {
					this.handleFirstAdminFire();
					return;
				}
			}
			this.sendActionRequest();
		}
		handleFirstAdminFire() {
			const guard = new bitrix24_firstAdminGuard.FirstAdminGuard(this.currentUserName || '', this.currentUserId || 0, this.firstAdminId);
			guard.confirmAction('bitrix24.v2.FirstAdmin.FirstAdminRightsController.sendFireRequest', () => {
				var _this$selectedUsers2;
				main_core.ajax.runAction('bitrix24.v2.FirstAdmin.FirstAdminRightsController.sendFireRequest', {
					data: {
						userId: Number(this.currentUserId),
						toUser: Number(this.firstAdminId)
					}
				}).then(fireResponse => {
					if (fireResponse.status === 'success') {
						BX.UI.Notification.Center.notify({
							content: main_core.Loc.getMessage('INTRANET_USER_LIST_FIRST_GROUP_ACTION_FIRST_ADMIN_REQUEST_SENT', {
								'[b]': '<b>',
								'[/b]': '</b>',
								'[br]': '<br>'
							}),
							autoHide: true,
							autoHideDelay: 3000,
							useAirDesign: true
						});
					}
				}).catch(error => {
					ui_formElements_field.ErrorCollection.showSystemError('An error occurred while sending fire request');
				});
				const selectedRows = (_this$selectedUsers2 = this.selectedUsers) !== null && _this$selectedUsers2 !== void 0 ? _this$selectedUsers2 : this.grid.getRows().getSelectedIds();
				const nonFirstAdminUsers = selectedRows.filter(userId => Number(userId) !== Number(this.firstAdminId));
				if (nonFirstAdminUsers.length > 0) {
					this.selectedUsers = nonFirstAdminUsers;
					this.sendActionRequest();
				} else {
					this.grid.reload();
				}
			}, () => {
				var _this$selectedUsers3;
				const selectedRows = (_this$selectedUsers3 = this.selectedUsers) !== null && _this$selectedUsers3 !== void 0 ? _this$selectedUsers3 : this.grid.getRows().getSelectedIds();
				this.selectedUsers = selectedRows.filter(id => Number(id) !== Number(this.firstAdminId));
				this.sendActionRequest();
			});
		}
		getConfirmationPopup() {
			return new ui_dialogs_messagebox.MessageBox({
				message: main_core.Loc.getMessage('INTRANET_USER_LIST_GROUP_ACTION_FIRE_MESSAGE'),
				title: main_core.Loc.getMessage('INTRANET_USER_LIST_GROUP_ACTION_FIRE_MESSAGE_TITLE'),
				buttons: ui_dialogs_messagebox.MessageBoxButtons.OK_CANCEL,
				okCaption: main_core.Loc.getMessage('INTRANET_USER_LIST_GROUP_ACTION_FIRE_MESSAGE_BUTTON')
			});
		}
		getAjaxMethod() {
			return 'intranet.controller.user.userlist.groupFire';
		}
		getSkippedUsersMessageCode() {
			return 'INTRANET_USER_LIST_GROUP_ACTION_FIRE_SKIPPED_MESSAGE';
		}
		getSkippedUsersTitleCode() {
			return 'INTRANET_USER_LIST_GROUP_ACTION_FIRE_SKIPPED_TITLE';
		}
	}

	class DeleteAction extends BaseAction {
		static getActionId() {
			return 'delete';
		}
		getAjaxMethod() {
			return 'intranet.controller.user.userlist.groupDelete';
		}
		getConfirmationPopup() {
			return new ui_dialogs_messagebox.MessageBox({
				message: main_core.Loc.getMessage('INTRANET_USER_LIST_GROUP_ACTION_DELETE_MESSAGE'),
				title: main_core.Loc.getMessage('INTRANET_USER_LIST_GROUP_ACTION_DELETE_MESSAGE_TITLE'),
				buttons: ui_dialogs_messagebox.MessageBoxButtons.OK_CANCEL,
				okCaption: main_core.Loc.getMessage('INTRANET_USER_LIST_GROUP_ACTION_DELETE_MESSAGE_BUTTON')
			});
		}
		showActiveUsersPopup(activeUsers) {
			ui_dialogs_messagebox.MessageBox.show({
				title: main_core.Loc.getMessage('INTRANET_USER_LIST_GROUP_ACTION_DELETE_SKIPPED_TITLE'),
				message: this.getMessageWithProfileNames('INTRANET_USER_LIST_GROUP_ACTION_DELETE_SKIPPED_MESSAGE', activeUsers),
				buttons: ui_dialogs_messagebox.MessageBoxButtons.YES_CANCEL,
				yesCaption: main_core.Loc.getMessage('INTRANET_USER_LIST_ACTION_DEACTIVATE_INVITED_BUTTON'),
				onYes: messageBox => {
					messageBox.close();
					new FireAction({
						selectedUsers: Object.keys(activeUsers),
						grid: this.grid,
						filter: this.userFilter,
						showPopups: false,
						isCloud: this.isCloud,
						isFirstAdminConfirmationEnabled: this.isFirstAdminConfirmationEnabled,
						currentUserId: this.currentUserId,
						currentUserName: this.currentUserName,
						firstAdminId: this.firstAdminId
					}).execute();
				},
				onNo: () => {
					this.grid.reload();
				}
			});
		}
		showFiredUsersPopup(firedUsers) {
			ui_dialogs_messagebox.MessageBox.show({
				title: main_core.Loc.getMessage('INTRANET_USER_LIST_GROUP_ACTION_DELETE_FIRED_TITLE'),
				message: this.getMessageWithProfileNames('INTRANET_USER_LIST_GROUP_ACTION_DELETE_FIRED_MESSAGE', firedUsers),
				buttons: ui_dialogs_messagebox.MessageBoxButtons.YES,
				yesCaption: main_core.Loc.getMessage('INTRANET_USER_LIST_ACTION_UNDERSTOOD_BUTTON'),
				onYes: messageBox => {
					messageBox.close();
				}
			});
		}
		getSkippedUsersTitleCode() {
			return 'INTRANET_USER_LIST_GROUP_ACTION_DELETE_SKIPPED_TITLE';
		}
		getSkippedUsersMessageCode() {
			return 'INTRANET_USER_LIST_GROUP_ACTION_DELETE_SKIPPED_MESSAGE';
		}
	}

	class ConfirmAction extends BaseAction {
		static getActionId() {
			return 'confirm';
		}
		getConfirmationPopup() {
			return new ui_dialogs_messagebox.MessageBox({
				message: main_core.Loc.getMessage('INTRANET_USER_LIST_GROUP_ACTION_CONFIRM_MESSAGE'),
				title: main_core.Loc.getMessage('INTRANET_USER_LIST_GROUP_ACTION_CONFIRM_MESSAGE_TITLE'),
				buttons: ui_dialogs_messagebox.MessageBoxButtons.OK_CANCEL,
				okCaption: main_core.Loc.getMessage('INTRANET_USER_LIST_GROUP_ACTION_CONFIRM_MESSAGE_BUTTON')
			});
		}
		handleSuccess(result) {
			this.grid.reload();
			if (this.showPopups) {
				const {
					skippedFiredUsers
				} = result.data;
				if (skippedFiredUsers && Object.keys(skippedFiredUsers).length > 0) {
					this.showFiredUsersPopup(skippedFiredUsers);
				}
			}
		}
		showFiredUsersPopup(firedUsers) {
			ui_dialogs_messagebox.MessageBox.show({
				title: main_core.Loc.getMessage('INTRANET_USER_LIST_GROUP_ACTION_ACCEPT_FIRED_TITLE'),
				message: this.getMessageWithProfileNames('INTRANET_USER_LIST_GROUP_ACTION_ACCEPT_FIRED_MESSAGE', firedUsers),
				buttons: ui_dialogs_messagebox.MessageBoxButtons.YES,
				yesCaption: main_core.Loc.getMessage('INTRANET_USER_LIST_ACTION_UNDERSTOOD_BUTTON'),
				onYes: messageBox => {
					messageBox.close();
				}
			});
		}
		getAjaxMethod() {
			return 'intranet.controller.user.userlist.groupConfirm';
		}
		getSkippedUsersMessageCode() {
			return 'INTRANET_USER_LIST_GROUP_ACTION_CONFIRM_SKIPPED_MESSAGE';
		}
		getSkippedUsersTitleCode() {
			return 'INTRANET_USER_LIST_GROUP_ACTION_CONFIRM_SKIPPED_TITLE';
		}
	}

	class DeclineAction extends BaseAction {
		static getActionId() {
			return 'decline';
		}
		getConfirmationPopup() {
			return new ui_dialogs_messagebox.MessageBox({
				message: main_core.Loc.getMessage('INTRANET_USER_LIST_GROUP_ACTION_DECLINE_MESSAGE'),
				title: main_core.Loc.getMessage('INTRANET_USER_LIST_GROUP_ACTION_DECLINE_MESSAGE_TITLE'),
				buttons: ui_dialogs_messagebox.MessageBoxButtons.OK_CANCEL,
				okCaption: main_core.Loc.getMessage('INTRANET_USER_LIST_GROUP_ACTION_DECLINE_MESSAGE_BUTTON')
			});
		}
		showActiveUsersPopup(activeUsers) {
			ui_dialogs_messagebox.MessageBox.show({
				title: main_core.Loc.getMessage('INTRANET_USER_LIST_GROUP_ACTION_DELETE_SKIPPED_TITLE'),
				message: this.getMessageWithProfileNames('INTRANET_USER_LIST_GROUP_ACTION_DELETE_SKIPPED_MESSAGE', activeUsers),
				buttons: ui_dialogs_messagebox.MessageBoxButtons.YES_CANCEL,
				yesCaption: main_core.Loc.getMessage('INTRANET_USER_LIST_ACTION_DEACTIVATE_INVITED_BUTTON'),
				onYes: messageBox => {
					messageBox.close();
					new FireAction({
						selectedUsers: Object.keys(activeUsers),
						grid: this.grid,
						filter: this.userFilter,
						showPopups: false,
						isCloud: this.isCloud,
						isFirstAdminConfirmationEnabled: this.isFirstAdminConfirmationEnabled,
						currentUserId: this.currentUserId,
						currentUserName: this.currentUserName,
						firstAdminId: this.firstAdminId
					}).execute();
				}
			});
		}
		getAjaxMethod() {
			return 'intranet.controller.user.userlist.groupDecline';
		}
		getSkippedUsersMessageCode() {
			return 'INTRANET_USER_LIST_GROUP_ACTION_CONFIRM_SKIPPED_MESSAGE';
		}
		getSkippedUsersTitleCode() {
			return 'INTRANET_USER_LIST_GROUP_ACTION_CONFIRM_SKIPPED_TITLE';
		}
	}

	class ReinviteAction extends BaseAction {
		static getActionId() {
			return 'reInvite';
		}
		getAjaxMethod() {
			return 'intranet.controller.user.userlist.groupReInvite';
		}
		handleSuccess(result) {
			this.grid.tableUnfade();
			const {
				skippedActiveUsers,
				skippedFiredUsers,
				skippedWaitingUsers
			} = result.data;
			if (skippedActiveUsers && Object.keys(skippedActiveUsers).length > 0) {
				this.showActiveUsersPopup(skippedActiveUsers);
			} else if (skippedWaitingUsers && Object.keys(skippedWaitingUsers).length > 0) {
				this.showWaitingUsersPopup(skippedWaitingUsers);
			} else if (skippedFiredUsers && Object.keys(skippedFiredUsers).length > 0) {
				this.showFiredUsersPopup(skippedFiredUsers);
			} else {
				var _BX$Bitrix;
				BX.UI.Notification.Center.notify({
					content: main_core.Loc.getMessage('INTRANET_USER_LIST_GROUP_ACTION_REINVITE_SUCCESS'),
					autoHide: true,
					position: 'bottom-right',
					category: 'menu-self-item-popup',
					autoHideDelay: 3000
				});
				(_BX$Bitrix = BX.Bitrix24) === null || _BX$Bitrix === void 0 || (_BX$Bitrix = _BX$Bitrix.EmailConfirmation) === null || _BX$Bitrix === void 0 || _BX$Bitrix.showPopupDispatched();
			}
			this.unselectRows(this.grid);
		}
		showWaitingUsersPopup(waitingUsers) {
			ui_dialogs_messagebox.MessageBox.show({
				title: main_core.Loc.getMessage('INTRANET_USER_LIST_GROUP_ACTION_ALREADY_ACCEPT_INVITE_TITLE'),
				message: this.getMessageWithProfileNames('INTRANET_USER_LIST_GROUP_ACTION_ALREADY_ACCEPT_INVITE_MESSAGE', waitingUsers),
				buttons: ui_dialogs_messagebox.MessageBoxButtons.YES_CANCEL,
				yesCaption: main_core.Loc.getMessage('INTRANET_USER_LIST_GROUP_ACTION_CONFIRM_MESSAGE_BUTTON'),
				onYes: messageBox => {
					messageBox.close();
					new ConfirmAction({
						grid: this.grid,
						filter: this.userFilter,
						selectedUsers: Object.keys(waitingUsers),
						showPopups: false
					}).execute();
				}
			});
		}
		showFiredUsersPopup(firedUsers) {
			ui_dialogs_messagebox.MessageBox.show({
				title: main_core.Loc.getMessage('INTRANET_USER_LIST_GROUP_ACTION_ACCEPT_FIRED_TITLE'),
				message: this.getMessageWithProfileNames('INTRANET_USER_LIST_GROUP_ACTION_ACCEPT_FIRED_MESSAGE', firedUsers),
				buttons: ui_dialogs_messagebox.MessageBoxButtons.YES,
				yesCaption: main_core.Loc.getMessage('INTRANET_USER_LIST_ACTION_UNDERSTOOD_BUTTON'),
				onYes: messageBox => {
					messageBox.close();
				}
			});
		}
		getSkippedUsersMessageCode() {
			return 'INTRANET_USER_LIST_GROUP_ACTION_CONFIRM_SKIPPED_MESSAGE';
		}
		getSkippedUsersTitleCode() {
			return 'INTRANET_USER_LIST_GROUP_ACTION_CONFIRM_SKIPPED_TITLE';
		}
	}

	class CreateChatAction extends BaseAction {
		static getActionId() {
			return 'createChat';
		}
		getAjaxMethod() {
			return 'intranet.controller.user.userlist.createChat';
		}
		handleSuccess(result) {
			this.grid.tableUnfade();
			const chatId = result.data;
			im_public.Messenger.openChat("chat".concat(chatId));
			this.unselectRows(this.grid);
		}
	}

	var _templateObject;
	class ChangeDepartmentAction extends BaseAction {
		static getActionId() {
			return 'changeDepartment';
		}
		getAjaxMethod() {
			return 'intranet.controller.user.userlist.groupChangeDepartment';
		}
		execute() {
			const saveButton = new BX.UI.SaveButton({
				onclick: () => {
					const selectedIds = dialog.getSelectedItems().map(item => item.id);
					dialog.hide();
					if (selectedIds.length > 0) {
						this.sendChangeDepartmentRequest(selectedIds);
					} else {
						this.unselectRows(this.grid);
					}
				},
				size: BX.UI.Button.Size.SMALL
			});
			const cancelButton = new BX.UI.CancelButton({
				onclick: () => {
					dialog.hide();
				},
				size: BX.UI.Button.Size.SMALL
			});
			const footer = main_core.Tag.render(_templateObject || (_templateObject = babelHelpers.taggedTemplateLiteral(["<span></span>"])));
			saveButton.renderTo(footer);
			cancelButton.renderTo(footer);
			const dialog = new ui_entitySelector.Dialog({
				dropdownMode: true,
				enableSearch: true,
				compactView: true,
				multiple: true,
				footer,
				entities: [{
					id: 'department',
					options: {
						selectMode: 'departmentsOnly',
						allowSelectRootDepartment: true
					}
				}]
			});
			dialog.show();
		}
		sendChangeDepartmentRequest(departmentIds) {
			var _this$selectedUsers;
			this.grid.tableFade();
			const selectedRows = (_this$selectedUsers = this.selectedUsers) !== null && _this$selectedUsers !== void 0 ? _this$selectedUsers : this.grid.getRows().getSelectedIds();
			const isSelectedAllRows = this.grid.getRows().isAllSelected() ? 'Y' : 'N';
			BX.ajax.runAction(this.getAjaxMethod(), {
				data: {
					fields: {
						userIds: selectedRows,
						isSelectedAllRows,
						filter: this.userFilter,
						departmentIds
					}
				}
			}).then(result => this.handleSuccess(result)).catch(result => this.handleError(result));
		}
		getSkippedUsersTitleCode() {
			return 'INTRANET_USER_LIST_GROUP_ACTION_EXTRANET_CHANGE_DEPARTMENT_TITLE';
		}
		getSkippedUsersMessageCode() {
			return this.isCloud ? 'INTRANET_USER_LIST_GROUP_ACTION_EXTRANET_CHANGE_DEPARTMENT_MESSAGE_CLOUD' : 'INTRANET_USER_LIST_GROUP_ACTION_EXTRANET_CHANGE_DEPARTMENT_MESSAGE';
		}
	}

	const ACTIONS = [DeleteAction, FireAction, ConfirmAction, DeclineAction, ReinviteAction, CreateChatAction, ChangeDepartmentAction];
	class ActionFactory {
		static createAction(actionId, params) {
			const ActionClass = ACTIONS.find(action => action.getActionId() === actionId);
			if (!ActionClass) {
				throw new Error("Unknown actionId: ".concat(actionId));
			}
			return new ActionClass(params);
		}
	}

	class Panel {
		static executeAction(params) {
			try {
				var _BX$Main$gridManager$;
				const grid = (_BX$Main$gridManager$ = BX.Main.gridManager.getById(params.gridId)) === null || _BX$Main$gridManager$ === void 0 ? void 0 : _BX$Main$gridManager$.instance;
				if (params.isCloud && params.isFirstAdminConfirmationEnabled) {
					Panel.checkFirstAdminInSelection(grid).then(firstAdminId => {
						const action = ActionFactory.createAction(params.actionId, {
							grid,
							filter: params.filter,
							isCloud: params.isCloud,
							isFirstAdminConfirmationEnabled: params.isFirstAdminConfirmationEnabled,
							currentUserId: params.currentUserId,
							currentUserName: params.currentUserName,
							firstAdminId
						});
						action.execute();
					}).catch(error => {
						console.error('Error checking first admin in selection:', error);
					});
				} else {
					const action = ActionFactory.createAction(params.actionId, {
						grid,
						filter: params.filter,
						isCloud: params.isCloud,
						isFirstAdminConfirmationEnabled: params.isFirstAdminConfirmationEnabled,
						currentUserId: params.currentUserId,
						currentUserName: params.currentUserName,
						firstAdminId: null
					});
					action.execute();
				}
			} catch (error) {
				console.error('Error executing action:', error);
			}
		}
		static checkFirstAdminInSelection(grid) {
			const selectedRows = grid.getRows().getSelectedIds();
			return main_core.ajax.runAction('bitrix24.v2.FirstAdmin.FirstAdminRightsController.getPortalCreator').then(response => {
				const portalCreatorId = Number(response.data.id);
				const found = selectedRows.find(userId => Number(userId) === portalCreatorId);
				return found ? portalCreatorId : null;
			}).catch(() => {
				return null;
			});
		}
	}

	exports.ActivityField = ActivityField;
	exports.BaseField = BaseField;
	exports.ConnectField = ConnectField;
	exports.DepartmentField = DepartmentField;
	exports.EmployeeField = EmployeeField;
	exports.FullNameField = FullNameField;
	exports.GridManager = GridManager;
	exports.Panel = Panel;
	exports.PhotoField = PhotoField;

})(this.BX.Intranet.UserList = this.BX.Intranet.UserList || {}, BX, BX.UI, BX.UI, BX.UI.Dialogs, BX.UI.FormElements, BX.Bitrix24, BX.Intranet, BX.Intranet.Reinvite, BX.Messenger.v2.Lib, BX.UI.EntitySelector);
//# sourceMappingURL=grid.bundle.js.map
