/* eslint-disable */
this.BX = this.BX || {};
this.BX.Mail = this.BX.Mail || {};
(function (exports, main_core, ui_avatar, ui_system_chip, main_date, ui_notification, ui_dialogs_messagebox) {
	'use strict';

	class BaseField {
		fieldId;
		gridId;
		constructor(params) {
			this.fieldId = params.fieldId;
			this.gridId = params.gridId ?? null;
		}
		getGridId() {
			return this.gridId;
		}
		getFieldId() {
			return this.fieldId;
		}
		getGrid() {
			let grid = null;
			if (this.gridId) {
				grid = BX.Main.gridManager.getById(this.gridId);
			}
			return grid?.instance ?? null;
		}
		getFieldNode() {
			return document.getElementById(this.getFieldId());
		}
		appendToFieldNode(element) {
			main_core.Dom.append(element, this.getFieldNode());
		}
	}

	class EmployeeField extends BaseField {
		render(params) {
			const employeeFieldContainer = main_core.Tag.render`
			<div class="passwordless-grid_employee-card-container"></div>
		`;
			const avatar = this.#renderAvatar(params.avatar?.src);
			main_core.Dom.append(avatar, employeeFieldContainer);
			const fullName = this.#renderFullName(params);
			main_core.Dom.append(fullName, employeeFieldContainer);
			this.appendToFieldNode(employeeFieldContainer);
		}
		#renderAvatar(avatarPath) {
			const avatarOptions = {
				size: 28
			};
			if (avatarPath) {
				avatarOptions.userpicPath = encodeURI(avatarPath);
			}
			const avatar = new ui_avatar.AvatarRound(avatarOptions);
			const avatarNode = avatar.getContainer();
			main_core.Dom.addClass(avatarNode, 'passwordless-grid_owner-photo');
			return avatarNode;
		}
		#renderFullName(params) {
			const fullNameContainer = main_core.Tag.render`
			<div class="passwordless-grid_full-name-container">${this.#getFullNameLink(params.name, params.pathToProfile)}</div>
		`;
			if (params.position !== '') {
				main_core.Dom.append(this.#getPositionLabelContainer(main_core.Text.encode(params.position)), fullNameContainer);
			}
			return fullNameContainer;
		}
		#getFullNameLink(fullName, profileLink) {
			return main_core.Tag.render`
			<a class="passwordless-grid_full-name-label" href="${encodeURI(profileLink)}">
				${main_core.Text.encode(fullName)}
			</a>
		`;
		}
		#getPositionLabelContainer(position) {
			return main_core.Tag.render`
			<div class="passwordless-grid_position-label">
				${main_core.Text.encode(position)}
			</div>
		`;
		}
	}

	const statusConfig = {
		P: {
			getMessage: () => main_core.Loc.getMessage('MAIL_PASSWORDLESS_GRID_STATUS_PENDING'),
			design: ui_system_chip.ChipDesign.OutlineSuccess
		},
		C: {
			getMessage: () => main_core.Loc.getMessage('MAIL_PASSWORDLESS_GRID_STATUS_CANCELED'),
			design: ui_system_chip.ChipDesign.OutlineAlert
		}
	};
	class StatusField extends BaseField {
		render(params) {
			const config = statusConfig[params.status];
			if (!config) {
				return;
			}
			const container = main_core.Tag.render`
			<div class="passwordless-grid_status-field-container"></div>
		`;
			const chip = new ui_system_chip.Chip({
				size: ui_system_chip.ChipSize.Sm,
				text: config.getMessage() ?? '',
				design: config.design,
				rounded: true
			});
			main_core.Dom.append(chip.render(), container);
			this.appendToFieldNode(container);
		}
	}

	class DateSentField extends BaseField {
		render(params) {
			if (!params.timestamp) {
				return;
			}
			const formattedDate = main_date.DateTimeFormat.formatLastActivityDate(params.timestamp);
			const container = main_core.Tag.render`
			<div class="passwordless-grid_date-sent-container">${main_core.Text.encode(formattedDate)}</div>
		`;
			this.appendToFieldNode(container);
		}
	}

	class BaseAction {
		grid;
		static getActionId() {
			throw new Error('not implemented');
		}
		constructor(params) {
			this.grid = params.grid;
		}
		setActionParams(_params) {}
	}

	class EditAction extends BaseAction {
		mailboxId;
		static getActionId() {
			return 'editRequestAction';
		}
		setActionParams(params) {
			this.mailboxId = params.mailboxId;
		}
		async execute() {
			const url = `/mail/config/edit?id=${this.mailboxId}`;
			BX.SidePanel.Instance.open(url);
		}
	}

	class AjaxAction extends BaseAction {
		getActionData() {
			return {};
		}
		async execute() {
			this.onBeforeActionRequest();
			await this.sendActionRequest();
			this.onAfterActionRequest();
		}
		onBeforeActionRequest() {}
		async sendActionRequest() {
			try {
				const result = await new Promise((resolve, reject) => {
					const actionConfig = this.getActionConfig();
					const actionData = this.getActionData();
					const ajaxOptions = {
						...actionConfig.options,
						data: actionData
					};
					let ajaxPromise = null;
					switch (actionConfig.type) {
						case 'controller':
							ajaxPromise = BX.ajax.runAction(actionConfig.name, ajaxOptions);
							break;
						case 'component':
							ajaxPromise = BX.ajax.runComponentAction(actionConfig.component, actionConfig.name, ajaxOptions);
							break;
						default:
							{
								reject(new Error(`Unknown action type: ${actionConfig}`));
								return;
							}
					}
					ajaxPromise.then(resolve, reject);
				});
				this.handleSuccess(result);
			} catch (result) {
				this.handleError(result);
			}
		}
		onAfterActionRequest() {}
		handleSuccess(_result) {}
		handleError(_result) {}
	}

	class RevokeAction extends AjaxAction {
		mailboxId;
		static getActionId() {
			return 'revokeRequestAction';
		}
		getActionConfig() {
			return {
				type: 'controller',
				name: 'mail.mailboxconnecting.cancelPasswordlessRequest'
			};
		}
		getActionData() {
			return {
				mailboxId: this.mailboxId
			};
		}
		setActionParams(params) {
			this.mailboxId = params.mailboxId;
		}
		onBeforeActionRequest() {
			this.grid?.tableFade();
		}
		handleSuccess(_result) {
			BX.UI.Notification.Center.notify({
				content: main_core.Loc.getMessage('MAIL_PASSWORDLESS_GRID_ACTION_REVOKE_SUCCESS'),
				position: 'top-right',
				autoHideDelay: 3000
			});
		}
		handleError(_result) {
			BX.UI.Notification.Center.notify({
				content: main_core.Loc.getMessage('MAIL_PASSWORDLESS_GRID_ACTION_REVOKE_ERROR'),
				position: 'top-right',
				autoHideDelay: 3000
			});
		}
		onAfterActionRequest() {
			this.grid?.reload(() => {
				this.grid?.tableUnfade();
			});
		}
	}

	class ResendAction extends AjaxAction {
		mailboxId;
		static getActionId() {
			return 'resendRequestAction';
		}
		getActionConfig() {
			return {
				type: 'controller',
				name: 'mail.mailboxconnecting.resendPasswordlessRequest'
			};
		}
		getActionData() {
			return {
				mailboxId: this.mailboxId
			};
		}
		setActionParams(params) {
			this.mailboxId = params.mailboxId;
		}
		onBeforeActionRequest() {
			this.grid?.tableFade();
		}
		handleSuccess(_result) {
			BX.UI.Notification.Center.notify({
				content: main_core.Loc.getMessage('MAIL_PASSWORDLESS_GRID_ACTION_RESEND_SUCCESS'),
				position: 'top-right',
				autoHideDelay: 3000
			});
		}
		handleError(_result) {
			BX.UI.Notification.Center.notify({
				content: main_core.Loc.getMessage('MAIL_PASSWORDLESS_GRID_ACTION_RESEND_ERROR'),
				position: 'top-right',
				autoHideDelay: 3000
			});
		}
		onAfterActionRequest() {
			this.grid?.reload(() => {
				this.grid?.tableUnfade();
			});
		}
	}

	class DeleteAction extends AjaxAction {
		mailboxId;
		static getActionId() {
			return 'deleteRequestAction';
		}
		getActionConfig() {
			return {
				type: 'controller',
				name: 'mail.mailboxconnecting.deletePasswordlessRequest'
			};
		}
		getActionData() {
			return {
				mailboxId: this.mailboxId
			};
		}
		setActionParams(params) {
			this.mailboxId = params.mailboxId;
		}
		async execute() {
			ui_dialogs_messagebox.MessageBox.show({
				title: main_core.Loc.getMessage('MAIL_PASSWORDLESS_GRID_ACTION_DELETE_CONFIRM_TITLE'),
				buttons: ui_dialogs_messagebox.MessageBoxButtons.OK_CANCEL,
				useAirDesign: true,
				onOk: messageBox => {
					messageBox.close();
					this.onBeforeActionRequest();
					this.sendActionRequest().then(() => {
						this.onAfterActionRequest();
					});
				},
				onCancel: messageBox => {
					messageBox.close();
				}
			});
		}
		onBeforeActionRequest() {
			this.grid?.tableFade();
		}
		handleSuccess(_result) {
			BX.UI.Notification.Center.notify({
				content: main_core.Loc.getMessage('MAIL_PASSWORDLESS_GRID_ACTION_DELETE_SUCCESS'),
				position: 'top-right',
				autoHideDelay: 3000
			});
		}
		handleError(_result) {
			BX.UI.Notification.Center.notify({
				content: main_core.Loc.getMessage('MAIL_PASSWORDLESS_GRID_ACTION_DELETE_ERROR'),
				position: 'top-right',
				autoHideDelay: 3000
			});
		}
		onAfterActionRequest() {
			this.grid?.reload(() => {
				this.grid?.tableUnfade();
			});
		}
	}

	const actionMap = new Map([[EditAction.getActionId(), EditAction], [RevokeAction.getActionId(), RevokeAction], [ResendAction.getActionId(), ResendAction], [DeleteAction.getActionId(), DeleteAction]]);
	class ActionFactory {
		static create(actionId, options) {
			const ActionClass = actionMap.get(actionId);
			if (ActionClass) {
				return new ActionClass(options);
			}
			return null;
		}
	}

	class GridManager {
		static instances = {};
		grid;
		constructor(gridId) {
			this.grid = BX.Main.gridManager.getById(gridId)?.instance;
		}
		static getInstance(gridId) {
			if (!this.instances[gridId]) {
				this.instances[gridId] = new GridManager(gridId);
			}
			return this.instances[gridId];
		}
		getGrid() {
			return this.grid;
		}
		runAction(config) {
			const actionId = config.actionId;
			const action = ActionFactory.create(actionId, {
				grid: this.grid
			});
			if (action) {
				const params = config.params ?? {};
				action.setActionParams(params);
				action.execute();
			}
		}
	}

	exports.BaseField = BaseField;
	exports.DateSentField = DateSentField;
	exports.EmployeeField = EmployeeField;
	exports.GridManager = GridManager;
	exports.StatusField = StatusField;

})(this.BX.Mail.PasswordlessRequestsGrid = this.BX.Mail.PasswordlessRequestsGrid || {}, BX, BX.UI, BX.UI.System.Chip, BX.Main, BX, BX.UI.Dialogs);
//# sourceMappingURL=grid.bundle.js.map
