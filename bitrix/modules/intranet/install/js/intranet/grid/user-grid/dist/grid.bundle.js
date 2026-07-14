/* eslint-disable */
this.BX = this.BX || {};
this.BX.Intranet = this.BX.Intranet || {};
(function (exports, main_core, ui_avatar, ui_label, ui_dialogs_messagebox, ui_formElements_field, bitrix24_firstAdminGuard, intranet_fireEmployeeWizard, ui_cnt, intranet_reinvite, ui_iconSet_main, ui_entitySelector, ui_hint, ui_iconSet_api_core, ui_system_chip, im_public) {
	'use strict';

	class BaseField {
		#fieldId;
		#gridId;
		constructor(params) {
			this.#fieldId = params.fieldId;
			this.#gridId = params.gridId ?? null;
		}
		getGridId() {
			return this.#gridId;
		}
		getFieldId() {
			return this.#fieldId;
		}
		getGrid() {
			let grid = null;
			if (this.#gridId) {
				grid = BX.Main.gridManager.getById(this.#gridId);
			}
			return grid?.instance;
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
			avatar?.renderTo(this.getFieldNode());
			main_core.Dom.addClass(this.getFieldNode(), 'user-grid_user-photo');
		}
	}

	class FullNameField extends BaseField {
		render(params) {
			const fullNameContainer = main_core.Tag.render`
			<div class="user-grid_full-name-container">${this.#getFullNameLink(params.fullName, params.profileLink)}</div>
		`;
			if (params.position) {
				main_core.Dom.append(this.#getPositionLabelContainer(main_core.Text.encode(params.position)), fullNameContainer);
			}
			switch (params.role) {
				case 'integrator':
					main_core.Dom.append(this.#getIntegratorBalloonContainer(), fullNameContainer);
					break;
				case 'admin':
					main_core.Dom.append(this.#getAdminBalloonContainer(params.isFirstAdmin), fullNameContainer);
					break;
				case 'extranet':
					main_core.Dom.append(this.#getExtranetBalloonContainer(), fullNameContainer);
					break;
				case 'collaber':
					main_core.Dom.append(this.#getCollaberBalloonContainer(), fullNameContainer);
					break;
			}
			switch (params.inviteStatus) {
				case 'INVITE_AWAITING_APPROVE':
					main_core.Dom.append(this.#getWaitingConfirmationLabelContainer(), fullNameContainer);
					break;
				case 'INVITED':
					main_core.Dom.append(this.#getInvitedLabelContainer(), fullNameContainer);
					break;
			}
			this.appendToFieldNode(fullNameContainer);
		}
		#getFullNameLink(fullName, profileLink) {
			return main_core.Tag.render`
			<a class="user-grid_full-name-label" href="${profileLink}">
				${fullName}
			</a>
		`;
		}
		#getInvitedLabelContainer() {
			const label = new ui_label.Label({
				text: main_core.Loc.getMessage('INTRANET_JS_CONTROL_BALLOON_INVITATION_NOT_ACCEPTED'),
				color: ui_label.LabelColor.LIGHT_BLUE,
				fill: true,
				size: ui_label.Label.Size.MD,
				customClass: 'user-grid_label'
			});
			return label.render();
		}
		#getWaitingConfirmationLabelContainer() {
			const label = new ui_label.Label({
				text: main_core.Loc.getMessage('INTRANET_JS_CONTROL_BALLOON_NOT_CONFIRMED'),
				color: ui_label.LabelColor.YELLOW,
				fill: true,
				size: ui_label.Label.Size.MD,
				customClass: 'user-grid_label'
			});
			return label.render();
		}
		#getPositionLabelContainer(position) {
			return main_core.Tag.render`<div class="user-grid_position-label">${position}</div>`;
		}
		#getIntegratorBalloonContainer() {
			return main_core.Tag.render`
			<span class="user-grid_role-label --integrator">
				${main_core.Extension.getSettings('intranet.grid.user-grid')?.isRenamedIntegrator === 'Y' ? main_core.Loc.getMessage('INTRANET_JS_CONTROL_BALLOON_INTEGRATOR_RENAMED') : main_core.Loc.getMessage('INTRANET_JS_CONTROL_BALLOON_INTEGRATOR')}
			</span>
		`;
		}
		#getAdminBalloonContainer(isFirstAdmin) {
			if (isFirstAdmin) {
				return main_core.Tag.render`
				<span class="user-grid_role-label --first-admin">
					${main_core.Loc.getMessage('INTRANET_JS_CONTROL_BALLOON_FIRST_ADMIN')}
				</span>
			`;
			}
			return main_core.Tag.render`
			<span class="user-grid_role-label --admin">
				${main_core.Loc.getMessage('INTRANET_JS_CONTROL_BALLOON_ADMIN')}
			</span>
		`;
		}
		#getExtranetBalloonContainer() {
			return main_core.Tag.render`
			<span class="user-grid_role-label --extranet">
				${main_core.Loc.getMessage('INTRANET_JS_CONTROL_BALLOON_EXTRANET')}
			</span>
		`;
		}
		#getCollaberBalloonContainer() {
			return main_core.Tag.render`
			<span class="user-grid_role-label --collaber">
				${main_core.Loc.getMessage('INTRANET_JS_CONTROL_BALLOON_COLLABER')}
			</span>
		`;
		}
	}

	class EmployeeField extends BaseField {
		render(params) {
			const photoFieldId = main_core.Text.getRandom(6);
			const fullNameFieldId = main_core.Text.getRandom(6);
			this.appendToFieldNode(main_core.Tag.render`<span id="${photoFieldId}"></span>`);
			this.appendToFieldNode(main_core.Tag.render`<span class="user-grid_full-name-wrapper" id="${fullNameFieldId}"></span>`);
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
					top.BXIM?.openMessenger(params.userId);
				}
			});
			button.renderTo(this.getFieldNode());
		}
	}

	class GridManager {
		static instances = [];
		#grid;
		#firstAdminId = undefined;
		isCloud = false;
		isFirstAdminConfirmationEnabled = false;
		constructor(gridId, isCloud = false, isFirstAdminConfirmationEnabled = false) {
			this.#grid = BX.Main.gridManager.getById(gridId)?.instance;
			this.isCloud = isCloud;
			this.isFirstAdminConfirmationEnabled = isFirstAdminConfirmationEnabled;
		}
		static getInstance(gridId, isCloud = false, isFirstAdminConfirmationEnabled = false) {
			if (!this.instances[gridId]) {
				this.instances[gridId] = new GridManager(gridId, isCloud, isFirstAdminConfirmationEnabled);
			}
			return this.instances[gridId];
		}
		static setSort(options) {
			const grid = BX.Main.gridManager.getById(options.gridId)?.instance;
			if (main_core.Type.isObject(grid)) {
				grid.tableFade();
				grid.getUserOptions().setSort(options.sortBy, options.order, () => {
					grid.reload();
				});
			}
		}
		static setFilter(options) {
			const grid = BX.Main.gridManager.getById(options.gridId)?.instance;
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
						content: `<p>${main_core.Loc.getMessage('INTRANET_USER_LIST_ACTION_REINVITE_SUCCESS')}</p>`,
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
						content: `<p>${main_core.Loc.getMessage('INTRANET_USER_LIST_ACTION_REINVITE_SUCCESS')}</p>`,
						autoHide: true
					});
					InviteAccessPopup.show();
				}
				return response;
			});
		}
		getGrid() {
			return this.#grid;
		}
		confirmAction(params) {
			if (params.userId) {
				this.confirmUser(params.isAccept ? 'confirm' : 'decline', () => {
					const row = this.#grid.getRows().getById(params.userId);
					row?.stateLoad();
					main_core.ajax.runAction('intranet.controller.invite.confirmUserRequest', {
						data: {
							userId: params.userId,
							isAccept: params.isAccept ? 'Y' : 'N'
						}
					}).then(response => {
						if (response.data === true) {
							row?.update();
						} else if (params.isAccept) {
							row?.stateUnload();
						} else {
							this.activityAction({
								userId: params.userId,
								action: 'deleteOrFire'
							});
						}
					}).catch(() => {
						if (params.isAccept) {
							row?.stateUnload();
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
			const userId = params.userId ?? null;
			const action = params.action ?? null;
			if (!userId) {
				return;
			}
			if (action === 'fire' || action === 'deleteOrFire') {
				this.#grid.getLoader().show();
				this.runFireWizard(userId).then(response => {
					this.#grid.getLoader().hide();
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
					this.#grid.getLoader().hide();
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
		executeUserAction(userId, action, options = {}) {
			this.createHandlerByAction(action).call(this, userId, action, options);
		}
		confirmUser(action, callBack) {
			ui_dialogs_messagebox.MessageBox.show({
				title: this.getConfirmTitle(action) ?? '',
				message: this.getConfirmMessage(action) ?? '',
				buttons: ui_dialogs_messagebox.MessageBoxButtons.YES_CANCEL,
				yesCaption: this.getConfirmButtonText(action),
				onYes: messageBox => {
					callBack();
					messageBox.close();
				}
			});
		}
		executeFireAction(userId, action) {
			const row = this.#grid.getRows().getById(userId);
			row?.stateLoad();
			main_core.ajax.runAction(`intranet.v2.User.${action}`, {
				data: {
					userId
				}
			}).then(() => {
				row?.update();
			}).catch(response => {
				row?.stateUnload();
				const errors = response.errors.map(error => error.message);
				ui_formElements_field.ErrorCollection.showSystemError(errors.join('<br>'));
			});
		}
		executeRestoreAction(userId, action) {
			const row = this.#grid.getRows().getById(userId);
			row?.stateLoad();
			main_core.ajax.runAction('intranet.v2.User.restore', {
				data: {
					userId
				}
			}).then(() => {
				row?.update();
			}).catch(response => {
				row?.stateUnload();
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
				throw new TypeError(`Handler is not defined for action ${action}`);
			}
			return handler;
		}
		runFireWizard(userId) {
			return main_core.Runtime.loadExtension('intranet.fire-employee-wizard').then(({
				FireWizardConfigProvider
			}) => {
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
			if (this.#firstAdminId !== undefined) {
				return Promise.resolve(this.#firstAdminId);
			}
			return main_core.ajax.runAction('bitrix24.v2.FirstAdmin.FirstAdminRightsController.getPortalCreator').then(response => {
				this.#firstAdminId = Number(response.data.id);
				return this.#firstAdminId;
			}).catch(() => {
				this.#firstAdminId = null;
				return null;
			});
		}
		checkIfFirstAdmin(userId) {
			return this.getFirstAdminId().then(firstAdminId => {
				return firstAdminId && Number(userId) === Number(firstAdminId);
			});
		}
	}

	class ActivityField extends BaseField {
		render(params) {
			let title = '';
			let color = '';
			switch (params.action ?? 'invite') {
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
			const counter = main_core.Tag.render`
			<div class="ui-counter user-grid_invitation-counter">
				<div class="ui-counter-inner">1</div>
			</div>
		`;
			main_core.Dom.append(counter, this.getFieldNode());
			const button = new BX.UI.Button({
				text: title,
				color,
				noCaps: true,
				size: BX.UI.Button.Size.EXTRA_SMALL,
				tag: BX.UI.Button.Tag.INPUT,
				round: true,
				onclick: () => {
					this.#onClick(params, button);
				}
			});
			button.renderTo(this.getFieldNode());
		}
		#updateData(data) {
			if (!main_core.Type.isStringFilled(data.get('newEmail')) && !main_core.Type.isBoolean(data.get('newPhone'))) {
				top.console.error('Empty new email or phone');
				return;
			}
			const row = GridManager.getInstance(this.gridId).getGrid()?.getRows().getById(this.userId);
			row?.stateLoad();
			GridManager.reinviteCloudAction(data).then(response => {
				row?.update();
				row?.stateUnload();
			});
		}
		#onClick(params, button) {
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
				this.#actionFactory(params.action).call(this, params, button);
			}
		}
		#actionFactory(action) {
			switch (action) {
				case 'accept':
					return this.#acceptAction;
				case 'invite':
					return this.#inviteAction;
				default:
					return this.#inviteAction;
			}
		}
		#inviteAction(params, button) {
			if (params.isCloud === true) {
				const reinvitePopup = new intranet_reinvite.ReinvitePopup({
					userId: params.userId,
					formType: params.email ? intranet_reinvite.FormType.EMAIL : intranet_reinvite.FormType.PHONE,
					bindElement: button.getContainer(),
					inputValue: params.email ?? params.phoneNumber ?? '',
					transport: this.#updateData.bind(params)
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
		#acceptAction(params, button) {
			GridManager.getInstance(params.gridId).confirmAction({
				isAccept: true,
				userId: params.userId
			});
		}
	}

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
					const button = main_core.Tag.render`
					<div
						class="user-grid_department-btn ${isSelected ? '--selected' : ''}"
						onclick="${onclick}"
						>
						<div class="user-grid_department-name-container">
							${department.name}
						</div>
					</div>
				`;
					if (isSelected) {
						main_core.Dom.append(main_core.Tag.render`
						<div class="user-grid_department-btn-remove ui-icon-set --cross-60"></div>
					`, button);
					}
					this.appendToFieldNode(button);
				});
			}
		}
	}

	const StatusDesign = {
		enabled: ui_system_chip.ChipDesign.TintedSuccess,
		update_required: ui_system_chip.ChipDesign.TintedWarning,
		update_recommended: ui_system_chip.ChipDesign.Filled,
		enable_required: ui_system_chip.ChipDesign.TintedAlert,
		disabled: ui_system_chip.ChipDesign.TintedNoAccent
	};
	const otpHint = ui_hint.Hint.createInstance({
		popupParameters: {
			maxWidth: 350,
			offsetLeft: 9,
			offsetTop: 2,
			bindOptions: {
				forceBindPosition: true
			}
		}
	});
	class OtpStatusField extends BaseField {
		render(params) {
			const {
				status,
				label,
				hint
			} = params;
			const design = StatusDesign[status] || StatusDesign.disabled;
			const testId = `intranet-otp-user-list-otp-status-${status ?? 'disabled'}`;
			const chip = new ui_system_chip.Chip({
				text: label,
				design,
				size: ui_system_chip.ChipSize.Sm,
				icon: ui_iconSet_api_core.Outline.QUESTION,
				rounded: true
			});
			const chipElement = chip.render();
			chipElement.setAttribute('data-testid', testId);
			this.appendToFieldNode(chipElement);
			if (hint) {
				const iconElement = chipElement.querySelector('.ui-chip-icon');
				if (iconElement) {
					iconElement.setAttribute('data-hint', hint);
					iconElement.setAttribute('data-hint-no-icon', '');
					main_core.Event.bind(chipElement, 'mouseenter', () => otpHint.show(iconElement, hint, false, true));
					main_core.Event.bind(chipElement, 'mouseleave', () => otpHint.hide(iconElement));
				}
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
			this.grid = params.grid;
			this.userFilter = params.filter;
			this.selectedUsers = params.selectedUsers;
			this.showPopups = params.showPopups ?? true;
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
			this.grid.tableFade();
			const selectedRows = this.selectedUsers ?? this.grid.getRows().getSelectedIds();
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
			const displayedNames = userValues.slice(0, maxDisplayCount);
			const remainingCount = userValues.length - maxDisplayCount;
			const namesString = displayedNames.join(', ');
			if (displayedNames.length < 2 && remainingCount < 1) {
				return main_core.Loc.getMessage(`${messageCode}_SINGLE`, {
					'#USER#': namesString
				});
			}
			if (remainingCount > 0) {
				return main_core.Loc.getMessage(`${messageCode}_REMAINING`, {
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
				const selectedRows = this.selectedUsers ?? this.grid.getRows().getSelectedIds();
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
				const selectedRows = this.selectedUsers ?? this.grid.getRows().getSelectedIds();
				const nonFirstAdminUsers = selectedRows.filter(userId => Number(userId) !== Number(this.firstAdminId));
				if (nonFirstAdminUsers.length > 0) {
					this.selectedUsers = nonFirstAdminUsers;
					this.sendActionRequest();
				} else {
					this.grid.reload();
				}
			}, () => {
				const selectedRows = this.selectedUsers ?? this.grid.getRows().getSelectedIds();
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
			return 'intranet.v2.UserList.fire';
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
			return 'intranet.v2.UserList.delete';
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
			return 'intranet.v2.UserList.restore';
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
			return 'intranet.v2.UserList.deleteOrFire';
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
			return 'intranet.v2.UserList.reInvite';
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
				BX.UI.Notification.Center.notify({
					content: main_core.Loc.getMessage('INTRANET_USER_LIST_GROUP_ACTION_REINVITE_SUCCESS'),
					autoHide: true,
					position: 'bottom-right',
					category: 'menu-self-item-popup',
					autoHideDelay: 3000
				});
				BX.Bitrix24?.EmailConfirmation?.showPopupDispatched();
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
			return 'intranet.v2.UserList.createChat';
		}
		handleSuccess(result) {
			this.grid.tableUnfade();
			const chatId = result.data;
			im_public.Messenger.openChat(`chat${chatId}`);
			this.unselectRows(this.grid);
		}
	}

	class ChangeDepartmentAction extends BaseAction {
		static getActionId() {
			return 'changeDepartment';
		}
		getAjaxMethod() {
			return 'intranet.v2.UserList.changeDepartment';
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
			const footer = main_core.Tag.render`<span></span>`;
			saveButton.renderTo(footer);
			cancelButton.renderTo(footer);
			const dialog = new ui_entitySelector.Dialog({
				dropdownMode: true,
				enableSearch: true,
				compactView: true,
				multiple: true,
				footer,
				entities: [{
					id: 'structure-node',
					options: {
						selectMode: 'departmentsOnly',
						allowSelectRootDepartment: true
					}
				}]
			});
			dialog.show();
		}
		sendChangeDepartmentRequest(departmentIds) {
			this.grid.tableFade();
			const selectedRows = this.selectedUsers ?? this.grid.getRows().getSelectedIds();
			const isSelectedAllRows = this.grid.getRows().isAllSelected() ? 'Y' : 'N';
			BX.ajax.runAction(this.getAjaxMethod(), {
				data: {
					fields: {
						userIds: selectedRows,
						isSelectedAllRows,
						filter: this.userFilter
					},
					departmentIds
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
				throw new Error(`Unknown actionId: ${actionId}`);
			}
			return new ActionClass(params);
		}
	}

	class Panel {
		static executeAction(params) {
			try {
				const grid = BX.Main.gridManager.getById(params.gridId)?.instance;
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
	exports.OtpStatusField = OtpStatusField;
	exports.Panel = Panel;
	exports.PhotoField = PhotoField;

})(this.BX.Intranet.UserList = this.BX.Intranet.UserList || {}, BX, BX.UI, BX.UI, BX.UI.Dialogs, BX.UI.FormElements, BX.Bitrix24, BX.Intranet, BX.UI, BX.Intranet.Reinvite, window, BX.UI.EntitySelector, BX.UI, BX.UI.IconSet, BX.UI.System.Chip, BX.Messenger.v2.Lib);
//# sourceMappingURL=grid.bundle.js.map
