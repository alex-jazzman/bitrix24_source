/* eslint-disable */
this.BX = this.BX || {};
(function (exports, main_core, ui_dialogs_messagebox) {
	'use strict';

	const EntityId = Object.freeze({
		User: 'user',
		Department: 'department',
		SiteGroups: 'site-groups',
		StructureRole: 'structure-role',
		UserGroups: 'user-groups',
		ProjectAccessCodes: 'project-access-codes'
	});
	const USER_CODE = /^I?U(\d+)$/;
	const RECURSIVE_DEPARTMENT_CODE = /^DR(\d+)$/;
	const DEPARTMENT_CODE = /^D(\d+)$/;
	const SITE_GROUP_CODE = /^G(\d+)$/;
	const PROJECT_ACCESS_CODE = /^SG\d+(?:_[AEK])?$/;
	const NODE_ROLE_CODE = /^(?:AD|AT)[1-9]\d*$/;
	const COMPANY_ROLE_CODE = /^(?:AD|AT)0$/;
	const FLAT_DEPARTMENT_ITEM = /^(\d+):F$/;
	const ROLE_ITEM_ID = /^(?:AD|AE|AT|ATD|ATE|ATT)\d+$/;
	const SELECTABLE_ROLE_ITEM_ID = /^(?:AD|AT)(?:0|[1-9]\d*)$/;
	function toAccessCode(item) {
		const itemId = String(item.getId());
		switch (item.getEntityId()) {
			case EntityId.User:
				return `IU${itemId}`;
			case EntityId.Department:
				{
					const departmentOnly = itemId.match(FLAT_DEPARTMENT_ITEM);
					return departmentOnly ? `D${departmentOnly[1]}` : `DR${itemId}`;
				}
			case EntityId.SiteGroups:
				return `G${itemId}`;
			case EntityId.StructureRole:
			case EntityId.UserGroups:
			case EntityId.ProjectAccessCodes:
				return itemId;
			default:
				return '';
		}
	}
	function toItemId(accessCode) {
		const user = accessCode.match(USER_CODE);
		if (user) {
			return [EntityId.User, user[1]];
		}
		const departmentWithChildren = accessCode.match(RECURSIVE_DEPARTMENT_CODE);
		if (departmentWithChildren) {
			return [EntityId.Department, departmentWithChildren[1]];
		}
		const department = accessCode.match(DEPARTMENT_CODE);
		if (department) {
			return [EntityId.Department, `${department[1]}:F`];
		}
		const siteGroup = accessCode.match(SITE_GROUP_CODE);
		if (siteGroup) {
			return [EntityId.SiteGroups, siteGroup[1]];
		}
		if (NODE_ROLE_CODE.test(accessCode)) {
			return [EntityId.StructureRole, accessCode];
		}
		if (COMPANY_ROLE_CODE.test(accessCode)) {
			return [EntityId.UserGroups, accessCode];
		}
		if (PROJECT_ACCESS_CODE.test(accessCode)) {
			return [EntityId.ProjectAccessCodes, accessCode];
		}
		return null;
	}
	function normalizeAccessCode(accessCode) {
		const user = accessCode.match(USER_CODE);
		return user ? `person:${user[1]}` : `code:${accessCode}`;
	}
	function isRoleOutOfScope(entityId, itemId) {
		if (entityId !== EntityId.UserGroups && entityId !== EntityId.StructureRole) {
			return false;
		}
		if (!ROLE_ITEM_ID.test(itemId)) {
			return false;
		}
		return !SELECTABLE_ROLE_ITEM_ID.test(itemId);
	}

	function createScopedDialog(BaseDialog) {
		return class ScopedDialog extends BaseDialog {
			addItem(options) {
				const item = super.addItem(options);
				if (isRoleOutOfScope(item.getEntityId(), String(item.getId()))) {
					item.setHidden(true);
				}
				return item;
			}
		};
	}

	let scopedDialogPromise = null;
	function loadScopedDialog() {
		scopedDialogPromise ??= main_core.Runtime.loadExtension('ui.entity-selector').then(exports => createScopedDialog(exports.Dialog));
		return scopedDialogPromise;
	}

	function buildDialogEntities(useStructureRoles) {
		const entities = [{
			id: EntityId.User,
			options: {
				intranetUsersOnly: true,
				emailUsers: false,
				inviteEmployeeLink: false,
				inviteGuestLink: false
			}
		}, {
			id: EntityId.Department,
			options: {
				selectMode: 'usersAndDepartments',
				allowSelectRootDepartment: true,
				allowFlatDepartments: true
			}
		}, {
			id: EntityId.SiteGroups,
			dynamicLoad: true,
			dynamicSearch: true
		}, {
			id: EntityId.ProjectAccessCodes
		}];
		if (useStructureRoles) {
			entities.push({
				id: EntityId.StructureRole,
				options: {
					includedNodeEntityTypes: ['department']
				},
				dynamicLoad: true,
				dynamicSearch: true
			}, {
				id: EntityId.UserGroups,
				dynamicLoad: true
			});
		}
		return entities;
	}

	const ROW_TEMPLATE_ID = 'bx-vi-new-access-row';
	class PermissionsSelector {
		#options;
		#accessTable;
		#lastRow;
		#dialogPending = false;
		constructor(options) {
			this.#options = options;
			this.#accessTable = options.container.querySelector('table.bx-vi-js-role-access-table');
			this.#lastRow = options.container.querySelector('tr.bx-vi-js-access-table-last-row');
			main_core.Event.bind(options.container, 'click', this.#handleClick);
			main_core.Event.bind(options.container, 'change', this.#handleChange);
		}
		#handleClick = event => {
			const target = event.target;
			const addAccess = target.closest('.bx-vi-js-add-access');
			if (addAccess) {
				event.preventDefault();
				this.#showDialog(addAccess).catch(error => {
					console.error('voximplant.permissions-selector: the selection dialog could not be loaded', error);
				});
				return;
			}
			const deleteAccess = target.closest('.bx-vi-js-delete-access');
			if (deleteAccess) {
				event.preventDefault();
				this.#removeOwnRow(deleteAccess);
				return;
			}
			const deleteRole = target.closest('.bx-vi-js-delete-role');
			if (deleteRole) {
				event.preventDefault();
				this.#confirmRoleDelete(deleteRole.dataset.roleId);
			}
		};
		#handleChange = event => {
			const target = event.target;
			const select = target.closest('.bx-vi-js-select-role');
			if (!select) {
				return;
			}
			const row = select.closest('tr');
			if (row) {
				main_core.Dom.attr(row, 'data-role-id', select.value);
			}
		};
		async #showDialog(targetNode) {
			if (this.#dialogPending) {
				return;
			}
			this.#dialogPending = true;
			try {
				const ScopedDialog = await loadScopedDialog();
				const dialog = new ScopedDialog({
					targetNode,
					multiple: true,
					cacheable: false,
					enableSearch: true,
					entities: buildDialogEntities(this.#options.useStructureRoles),
					preselectedItems: this.#getPreselectedItems(),
					events: {
						'Item:onSelect': event => this.#addRow(event.getData().item),
						'Item:onDeselect': event => this.#removeRowsOf(toAccessCode(event.getData().item)),
						onHide: () => dialog.destroy()
					}
				});
				dialog.show();
			} finally {
				this.#dialogPending = false;
			}
		}
		#getPreselectedItems() {
			const preselected = [];
			this.#getRows().forEach(row => {
				const itemId = toItemId(String(row.dataset.accessCode));
				if (!main_core.Type.isNull(itemId)) {
					preselected.push(itemId);
				}
			});
			return preselected;
		}
		#addRow(item) {
			const accessCode = toAccessCode(item);
			if (!main_core.Type.isStringFilled(accessCode) || this.#hasRow(accessCode)) {
				return;
			}
			const row = main_core.Tag.render`<tr>${this.#renderCells(item, accessCode)}</tr>`;
			const select = row.querySelector('select');
			main_core.Dom.attr(row, 'data-access-code', accessCode);
			main_core.Dom.attr(row, 'data-role-id', select ? select.value : '');
			main_core.Dom.attr(row, 'data-testid', `vox-perms-access-row-${accessCode}`);
			main_core.Dom.insertBefore(row, this.#lastRow);
		}
		#renderCells(item, accessCode) {
			const template = document.getElementById(ROW_TEMPLATE_ID);
			if (!template) {
				return '';
			}
			return template.innerHTML.replaceAll('#PROVIDER#', main_core.Text.encode(this.#options.providerNames[item.getEntityId()] ?? '')).replaceAll('#NAME#', main_core.Text.encode(item.getTitle())).replaceAll('#ACCESS_CODE#', main_core.Text.encode(accessCode));
		}
		#removeOwnRow(node) {
			const row = node.closest('tr');
			if (row) {
				main_core.Dom.remove(row);
			}
		}
		#removeRowsOf(accessCode) {
			if (!main_core.Type.isStringFilled(accessCode)) {
				return;
			}
			const key = normalizeAccessCode(accessCode);
			this.#getRows().filter(row => normalizeAccessCode(String(row.dataset.accessCode)) === key).forEach(row => main_core.Dom.remove(row));
		}
		#hasRow(accessCode) {
			const key = normalizeAccessCode(accessCode);
			return this.#getRows().some(row => {
				return normalizeAccessCode(String(row.dataset.accessCode)) === key;
			});
		}
		#getRows() {
			return [...this.#accessTable.rows].filter(row => {
				return main_core.Type.isStringFilled(row.dataset.accessCode);
			});
		}
		#confirmRoleDelete(roleId) {
			if (!main_core.Type.isStringFilled(roleId)) {
				return;
			}
			ui_dialogs_messagebox.MessageBox.confirm(main_core.Loc.getMessage('VOXIMPLANT_PERM_ROLE_DELETE_CONFIRM') ?? '', main_core.Loc.getMessage('VOXIMPLANT_PERM_ROLE_DELETE') ?? '', messageBox => {
				messageBox.close();
				this.#deleteRole(roleId);
			});
		}
		#deleteRole(roleId) {
			main_core.ajax({
				url: this.#options.ajaxUrl,
				method: 'POST',
				dataType: 'json',
				data: {
					action: 'deleteRole',
					roleId,
					sessid: this.#options.sessid
				},
				onsuccess: response => {
					if (!response || response.ERROR) {
						this.#showDeleteRoleError();
						return;
					}
					this.#removeRoleNodes(roleId);
				},
				onfailure: () => this.#showDeleteRoleError()
			});
		}
		#removeRoleNodes(roleId) {
			this.#options.container.querySelectorAll(`[data-role-id="${CSS.escape(roleId)}"]`).forEach(node => main_core.Dom.remove(node));
		}
		#showDeleteRoleError() {
			ui_dialogs_messagebox.MessageBox.alert(main_core.Loc.getMessage('VOXIMPLANT_PERM_ROLE_DELETE_ERROR') ?? '', main_core.Loc.getMessage('VOXIMPLANT_PERM_ERROR') ?? '');
		}
	}

	exports.PermissionsSelector = PermissionsSelector;

})(this.BX.Voximplant = this.BX.Voximplant || {}, BX, BX.UI.Dialogs);
//# sourceMappingURL=permissions-selector.bundle.js.map
