/* eslint-disable */
this.BX = this.BX || {};
this.BX.Humanresources = this.BX.Humanresources || {};
(function (exports, humanresources_companyStructure_utils, main_core, ui_entitySelector, main_popup, humanresources_companyStructure_chartStore, humanresources_companyStructure_api, ui_notification) {
	'use strict';

	const UserManagementDialogActions = {
		getDepartmentName: nodeId => {
			const {
				departments
			} = humanresources_companyStructure_chartStore.useChartStore();
			const targetDepartment = departments.get(nodeId);
			if (!targetDepartment) {
				return '';
			}
			return targetDepartment.name;
		}
	};

	const UserManagementDialogAPI = {
		moveUsersToDepartment: (nodeId, userIds) => {
			return humanresources_companyStructure_api.postData('humanresources.api.Structure.Node.Member.moveUserListToDepartment', {
				nodeId,
				userIds
			});
		},
		addUsersToDepartment: (nodeId, userIds, role) => {
			return humanresources_companyStructure_api.postData('humanresources.api.Structure.Node.Member.addUserMember', {
				nodeId,
				userIds,
				roleXmlId: role
			});
		}
	};

	const allowedDialogTypes = ['add', 'move'];

	const disabledButtonClass = 'ui-btn-disabled';
	class BaseUserManagementDialogFooter extends ui_entitySelector.BaseFooter {
		constructor(tab, options) {
			super(tab, options);
			this.nodeId = this.getOption('nodeId');
			if (!main_core.Type.isInteger(this.nodeId)) {
				throw new TypeError("Invalid argument 'nodeId'. An integer value was expected.");
			}
			this.entityType = this.getOption('entityType') ?? humanresources_companyStructure_utils.EntityTypes.team;
			this.memberRoles = humanresources_companyStructure_api.getMemberRoles(this.entityType);
			this.role = this.getOption('role') ?? this.memberRoles.employee;
			const type = this.getOption('type') ?? '';
			if (main_core.Type.isString(type) && allowedDialogTypes.includes(type)) {
				this.type = type;
			} else {
				throw new TypeError(`Invalid argument 'type'. Expected one of: ${allowedDialogTypes.join(', ')}`);
			}
			this.#setConfirmButtonText();
			const selectedItems = this.getDialog().getSelectedItems();
			this.userCount = selectedItems.length;
			this.users = [];
			selectedItems.forEach(item => {
				this.#onUserToggle(item);
			});
			this.getDialog().subscribe('Item:onSelect', this.#handleOnTagAdd.bind(this));
			this.getDialog().subscribe('Item:onDeselect', this.#handleOnTagRemove.bind(this));
		}
		render() {
			const {
				footer,
				footerAddButton,
				footerCloseButton
			} = main_core.Tag.render`
			<div ref="footer" class="hr-user-management-dialog__footer">
				<button ref="footerAddButton" class="ui-btn ui-btn ui-btn-sm ui-btn-primary ${this.users.length === 0 ? disabledButtonClass : ''} ui-btn-round hr-user-management-dialog__footer-btn-width">
					${this.confirmButtonText ?? ''}
				</button>
				<button ref="footerCloseButton" class="ui-btn ui-btn ui-btn-sm ui-btn-light-border ui-btn-round hr-user-management-dialog__footer-btn-width">
					${main_core.Loc.getMessage('HUMANRESOURCES_COMPANY_STRUCTURE_USER_MANAGEMENT_DIALOG_CANCEL_BUTTON')}
				</button>
			</div>
		`;
			this.footerAddButton = footerAddButton;
			main_core.Event.bind(footerCloseButton, 'click', event => {
				this.dialog.hide();
			});
			main_core.Event.bind(footerAddButton, 'click', event => {
				const users = this.dialog.getSelectedItems();
				const userIds = users.map(item => item.getId());
				if (userIds.length > 0) {
					main_core.Dom.addClass(footerAddButton, 'ui-btn-wait');
					this.action(userIds);
				}
			});
			return footer;
		}
		destroyDialog() {
			this.isInProcess = false;
			this.getDialog().destroy();
		}
		#handleOnTagAdd(event) {
			const {
				item
			} = event.getData();
			this.#onUserToggle(item);
		}
		#handleOnTagRemove(event) {
			const {
				item
			} = event.getData();
			this.#onUserToggle(item, false);
		}
		#onUserToggle(item, isSelected = true) {
			if (!isSelected) {
				this.users = this.users.filter(user => user.id !== item.id);
				this.userCount -= 1;
				this.#toggleAddButton();
				return;
			}
			const userData = humanresources_companyStructure_utils.getUserDataBySelectorItem(item, this.role);
			this.users = [...this.users, userData];
			this.userCount += 1;
			this.#toggleAddButton();
		}
		#toggleAddButton() {
			if (this.userCount === 0) {
				main_core.Dom.addClass(this.footerAddButton, disabledButtonClass);
				return;
			}
			main_core.Dom.removeClass(this.footerAddButton, disabledButtonClass);
		}
		#setConfirmButtonText() {
			if (this.type === 'move') {
				this.confirmButtonText = main_core.Loc.getMessage('HUMANRESOURCES_COMPANY_STRUCTURE_USER_MANAGEMENT_DIALOG_MOVE_USER_FROM_CONFIRM_BUTTON');
				return;
			}
			if (this.type === 'add') {
				this.confirmButtonText = main_core.Loc.getMessage('HUMANRESOURCES_COMPANY_STRUCTURE_USER_MANAGEMENT_DIALOG_ADD_USER_CONFIRM_BUTTON');
				return;
			}
			this.confirmButtonText = '';
		}
		async action(userIds) {
			if (!this.userCount || this.isInProcess) {
				return;
			}
			this.isInProcess = true;
			const departmentUserIds = this.type === 'move' ? {
				[this.memberRoles.employee]: userIds
			} : userIds;
			const data = await this.#saveUsers(departmentUserIds).catch(() => {});
			if (!data) {
				this.destroyDialog();
				return;
			}
			if (this.type === 'add') {
				humanresources_companyStructure_chartStore.UserService.addUsersToEntity(this.nodeId, this.users, data.userCount ?? 0, this.role ?? this.memberRoles.employee);
			}
			if (this.type === 'move') {
				humanresources_companyStructure_chartStore.UserService.moveUsersToEntity(this.nodeId, this.users, data.userCount ?? 0, data.updatedDepartmentIds ?? []);
			}
			const notificationCode = this.getNotificationMessageCode();
			if (notificationCode) {
				this.showNotification(notificationCode);
			}
			this.destroyDialog();
		}
		#saveUsers(departmentUserIds) {
			if (this.type === 'move') {
				return UserManagementDialogAPI.moveUsersToDepartment(this.nodeId, departmentUserIds);
			}
			return UserManagementDialogAPI.addUsersToDepartment(this.nodeId, departmentUserIds, this.role);
		}
		showNotification(messageCode) {
			const departmentName = UserManagementDialogActions.getDepartmentName(this.nodeId);
			ui_notification.UI.Notification.Center.notify({
				content: main_core.Text.encode(main_core.Loc.getMessage(messageCode, {
					'#DEPARTMENT#': departmentName
				})),
				autoHideDelay: 2000
			});
		}

		// eslint-disable-next-line sonarjs/cognitive-complexity
		getNotificationMessageCode() {
			if (this.type === 'add') {
				if (this.users.length > 1) {
					if (this.entityType === humanresources_companyStructure_utils.EntityTypes.team) {
						this.showNotification('HUMANRESOURCES_COMPANY_STRUCTURE_USER_MANAGEMENT_DIALOG_ADD_TEAM_USER_ADD_EMPLOYEES_MESSAGE');
					} else {
						this.showNotification('HUMANRESOURCES_COMPANY_STRUCTURE_USER_MANAGEMENT_DIALOG_ADD_USER_ADD_EMPLOYEES_MESSAGE');
					}
				}
				if (this.users.length === 1) {
					if (this.entityType === humanresources_companyStructure_utils.EntityTypes.team) {
						this.showNotification('HUMANRESOURCES_COMPANY_STRUCTURE_USER_MANAGEMENT_DIALOG_ADD_TEAM_USER_ADD_EMPLOYEE_MESSAGE');
					} else {
						this.showNotification('HUMANRESOURCES_COMPANY_STRUCTURE_USER_MANAGEMENT_DIALOG_ADD_USER_ADD_EMPLOYEE_MESSAGE');
					}
				}
			}
			if (this.type === 'move') {
				if (this.users.length > 1) {
					this.showNotification('HUMANRESOURCES_COMPANY_STRUCTURE_USER_MANAGEMENT_DIALOG_MOVE_USER_FROM_MOVE_EMPLOYEES_MESSAGE');
				}
				if (this.users.length === 1) {
					this.showNotification('HUMANRESOURCES_COMPANY_STRUCTURE_USER_MANAGEMENT_DIALOG_MOVE_USER_FROM_MOVE_EMPLOYEE_MESSAGE');
				}
			}
			return null;
		}
	}

	class BaseUserManagementDialogHeader extends ui_entitySelector.BaseHeader {
		constructor(context, options) {
			super(context, options);
			this.tiltle = main_core.Text.encode(this.getOption('title') ?? '');
			this.description = main_core.Text.encode(this.getOption('description') ?? '');
			this.memberRoles = this.getOption('memberRoles') ?? humanresources_companyStructure_api.memberRoles;
			this.role = this.getOption('role') ?? this.memberRoles.employee;
			this.entityType = this.getOption('entityType') ?? humanresources_companyStructure_utils.EntityTypes.department;
		}
		render() {
			const {
				header,
				headerCloseButton
			} = main_core.Tag.render`
			<div ref="header" class="hr-user-management-dialog__header">
				<div ref="headerCloseButton" class="hr-user-management-dialog__header-close_button"></div>
				<span class="hr-user-management-dialog__header-title">
					${this.tiltle}
				</span>
			</div>
		`;
			main_core.Event.bind(headerCloseButton, 'click', () => {
				this.getDialog().hide();
			});
			this.header = header;
			if (this.role === this.memberRoles.employee) {
				const employeeAddSubtitle = main_core.Tag.render`
				<span class="hr-user-management-dialog__header-description">
					${this.description}
				</span>
			`;
				main_core.Dom.append(employeeAddSubtitle, this.header);
			} else {
				this.#addRoleSwitcher();
			}
			return header;
		}
		#addRoleSwitcher() {
			const {
				roleSwitcherContainer,
				roleSwitcher
			} = main_core.Tag.render`
			<div ref="roleSwitcherContainer" class="hr-user-management-dialog__role_switcher-container">
				<span class="hr-user-management-dialog__role_switcher_title">
					${main_core.Loc.getMessage('HUMANRESOURCES_COMPANY_STRUCTURE_USER_MANAGEMENT_DIALOG_ROLE_PICKER_TEXT')}
					</span>
				<div ref="roleSwitcher" class="hr-user-management-dialog__role_switcher">
					${this.#getHeadRoleText()}
				</div>
			</div>
		`;
			main_core.Dom.append(roleSwitcherContainer, this.header);
			this.roleSwitcher = roleSwitcher;
			main_core.Event.bind(this.roleSwitcher, 'click', () => {
				this.#toggleRoleSwitcherMenu();
			});
		}
		#toggleRoleSwitcherMenu() {
			const roleSwitcherId = `${this.getDialog().id}-role-switcher`;
			const oldRoleSwitcherMenu = main_popup.PopupManager.getPopupById(roleSwitcherId);
			if (oldRoleSwitcherMenu) {
				oldRoleSwitcherMenu.destroy();
				return;
			}
			const roleSwitcherMenu = new main_popup.Menu({
				id: roleSwitcherId,
				bindElement: this.roleSwitcher,
				autoHide: true,
				closeByEsc: true,
				maxWidth: 263,
				events: {
					onPopupDestroy: () => {
						main_core.Dom.removeClass(this.roleSwitcher, '--focused');
					}
				}
			});
			const menuItems = [{
				html: main_core.Tag.render`
					<div 
						data-test-id="hr-company-structure_user-management-dialog__role-switcher-head"
					>
						${this.#getHeadRoleText()}
					</div>
				`,
				onclick: () => {
					this.roleSwitcher.innerText = this.#getHeadRoleText();
					this.#changeRole(this.memberRoles.head);
					roleSwitcherMenu.destroy();
				}
			}, {
				html: main_core.Tag.render`
					<div 
						data-test-id="hr-company-structure_user-management-dialog__role-switcher-deputy"
					>
						${this.#getDeputyRoleText()}
					</div>
				`,
				onclick: () => {
					this.roleSwitcher.innerText = this.#getDeputyRoleText();
					this.#changeRole(this.memberRoles.deputyHead);
					roleSwitcherMenu.destroy();
				}
			}];
			menuItems.forEach(menuItem => roleSwitcherMenu.addMenuItem(menuItem));
			roleSwitcherMenu.show();
			main_core.Dom.addClass(this.roleSwitcher, '--focused');
		}
		#changeRole(role) {
			const currentFooterOptions = this.getDialog().getFooter().getOptions();
			currentFooterOptions.role = role;
			this.getDialog().setFooter(BaseUserManagementDialogFooter, currentFooterOptions);
		}
		#getHeadRoleText() {
			return this.entityType === humanresources_companyStructure_utils.EntityTypes.team ? main_core.Loc.getMessage('HUMANRESOURCES_COMPANY_STRUCTURE_USER_MANAGEMENT_DIALOG_TEAM_HEAD_ROLE_TITLE') : main_core.Loc.getMessage('HUMANRESOURCES_COMPANY_STRUCTURE_USER_MANAGEMENT_DIALOG_HEAD_ROLE_TITLE');
		}
		#getDeputyRoleText() {
			return this.entityType === humanresources_companyStructure_utils.EntityTypes.team ? main_core.Loc.getMessage('HUMANRESOURCES_COMPANY_STRUCTURE_USER_MANAGEMENT_DIALOG_TEAM_DEPUTY_ROLE_TITLE') : main_core.Loc.getMessage('HUMANRESOURCES_COMPANY_STRUCTURE_USER_MANAGEMENT_DIALOG_DEPUTY_ROLE_TITLE');
		}
	}

	const dialogId = 'hr-user-management-dialog';
	class UserManagementDialog {
		#dialog;
		#nodeId;
		#type;
		#role;
		#entityType;
		#memberRoles;
		constructor(options) {
			if (main_core.Type.isInteger(options.nodeId)) {
				this.#nodeId = options.nodeId;
			} else {
				throw new TypeError("Invalid argument 'nodeId'. An integer value was expected.");
			}
			if (main_core.Type.isString(options.type) && allowedDialogTypes.includes(options.type)) {
				this.#type = options.type;
			} else {
				throw new TypeError(`Invalid argument 'type'. Expected one of: ${allowedDialogTypes.join(', ')}`);
			}
			if (main_core.Type.isString(options.entityType) && Object.values(humanresources_companyStructure_utils.EntityTypes).includes(options.entityType)) {
				this.#entityType = options.entityType;
				if (this.#entityType === humanresources_companyStructure_utils.EntityTypes.team) {
					this.#type = 'add';
				}
			} else {
				this.#entityType = humanresources_companyStructure_utils.EntityTypes.department;
			}
			this.#memberRoles = humanresources_companyStructure_api.getMemberRoles(this.#entityType);
			if (Object.values(this.#memberRoles).includes(options.role)) {
				this.#role = options.role;
			} else {
				this.#role = this.#memberRoles.employee;
			}
			this.id = `${dialogId}-${this.#type}`;
			this.title = this.#getTitleByTypeAndRoleAndEntity(this.#type, this.#role, this.#entityType);
			this.description = this.#getDescriptionByTypeRoleAndEntity(this.#type, this.#role, this.#entityType);
			this.#createDialog();
		}
		static openDialog(options) {
			const instance = new UserManagementDialog(options);
			instance.show();
		}
		show() {
			this.#dialog.show();
		}
		#createDialog() {
			this.#dialog = new ui_entitySelector.Dialog({
				id: this.id,
				width: 400,
				height: 511,
				multiple: true,
				cacheable: false,
				dropdownMode: true,
				compactView: false,
				enableSearch: true,
				showAvatars: true,
				autoHide: false,
				header: BaseUserManagementDialogHeader,
				headerOptions: {
					title: this.title,
					role: this.#role,
					description: this.description,
					memberRoles: this.#memberRoles,
					entityType: this.#entityType
				},
				footer: BaseUserManagementDialogFooter,
				footerOptions: {
					nodeId: this.#nodeId,
					role: this.#role,
					type: this.#type,
					entityType: this.#entityType
				},
				popupOptions: {
					overlay: {
						opacity: 40
					}
				},
				entities: [{
					id: 'user',
					options: {
						intranetUsersOnly: true,
						inviteEmployeeLink: false
					}
				}]
			});
		}
		#getTitleByTypeAndRoleAndEntity(type, role, entityType) {
			if (type === 'add' && role === this.#memberRoles.employee && entityType === humanresources_companyStructure_utils.EntityTypes.team) {
				return main_core.Loc.getMessage('HUMANRESOURCES_COMPANY_STRUCTURE_USER_MANAGEMENT_DIALOG_ADD_TEAM_EMPLOYEE_TITLE');
			}
			if (type === 'move' && role === this.#memberRoles.employee) {
				return main_core.Loc.getMessage('HUMANRESOURCES_COMPANY_STRUCTURE_USER_MANAGEMENT_DIALOG_MOVE_USER_FROM_TITLE');
			}
			if (type === 'add' && role === this.#memberRoles.employee) {
				return main_core.Loc.getMessage('HUMANRESOURCES_COMPANY_STRUCTURE_USER_MANAGEMENT_DIALOG_ADD_EMPLOYEE_TITLE');
			}
			if (type === 'add' && role === this.#memberRoles.head && entityType === humanresources_companyStructure_utils.EntityTypes.team) {
				return main_core.Loc.getMessage('HUMANRESOURCES_COMPANY_STRUCTURE_USER_MANAGEMENT_DIALOG_ADD_TEAM_HEAD_TITLE');
			}
			if (type === 'add' && role === this.#memberRoles.head) {
				return main_core.Loc.getMessage('HUMANRESOURCES_COMPANY_STRUCTURE_USER_MANAGEMENT_DIALOG_ADD_HEAD_TITLE');
			}
			return '';
		}
		#getDescriptionByTypeRoleAndEntity(type, role, entityType) {
			if (type === 'add' && entityType === humanresources_companyStructure_utils.EntityTypes.team) {
				return main_core.Loc.getMessage('HUMANRESOURCES_COMPANY_STRUCTURE_USER_MANAGEMENT_DIALOG_ADD_TEAM_EMPLOYEE_DESCRIPTION');
			}
			if (type === 'move' && role === this.#memberRoles.employee) {
				return main_core.Loc.getMessage('HUMANRESOURCES_COMPANY_STRUCTURE_USER_MANAGEMENT_DIALOG_MOVE_USER_FROM_DESCRIPTION');
			}
			if (type === 'add' && role === this.#memberRoles.employee) {
				return main_core.Loc.getMessage('HUMANRESOURCES_COMPANY_STRUCTURE_USER_MANAGEMENT_DIALOG_ADD_EMPLOYEE_DESCRIPTION');
			}
			return '';
		}
	}

	exports.UserManagementDialog = UserManagementDialog;
	exports.UserManagementDialogAPI = UserManagementDialogAPI;

})(this.BX.Humanresources.CompanyStructure = this.BX.Humanresources.CompanyStructure || {}, BX.Humanresources.CompanyStructure, BX, BX.UI.EntitySelector, BX.Main, BX.Humanresources.CompanyStructure, BX.Humanresources.CompanyStructure, BX.UI.Notification);
//# sourceMappingURL=user-management-dialog.bundle.js.map
