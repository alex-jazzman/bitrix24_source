/* eslint-disable */
this.BX = this.BX || {};
this.BX.HumanResources = this.BX.HumanResources || {};
(function (exports, ui_entitySelector, main_core, humanresources_departmentCreationPopup) {
	'use strict';

	class DepartmentCreationFooter extends ui_entitySelector.DefaultFooter {
		constructor(dialog, options) {
			super(dialog, options);
			this.departmentCreationPopup = null;
			this.handleDialogDestroy = this.handleDialogDestroy.bind(this);
			this.getDialog().subscribe('onDestroy', this.handleDialogDestroy);
		}
		getContent() {
			return this.cache.remember('content', () => {
				this.footerLink = main_core.Tag.render`
				<span
					class="ui-selector-footer-link ui-selector-footer-link-add"
					onclick="${this.handleFooterClick.bind(this)}"
				>
					${main_core.Loc.getMessage('HUMANRESOURCES_ENTITY_SELECTOR_CREATE_DEPARTMENT_FOOTER')}
				</span>
			`;
				return this.footerLink;
			});
		}
		handleFooterClick() {
			this.departmentCreationPopup ??= new humanresources_departmentCreationPopup.DepartmentCreationPopup({
				onCreate: async result => {
					this.handleDepartmentCreated(result?.node);
				}
			});
			this.departmentCreationPopup.show({
				parentDepartmentId: this.getSelectedDepartmentId(),
				departmentName: this.getDepartmentNameFromSearchQuery()
			});
		}
		handleDepartmentCreated(node) {
			if (!node?.id) {
				return;
			}
			const dialog = this.getDialog();
			let item = dialog.getItem(['structure-node', node.id]);
			if (!item) {
				item = dialog.addItem({
					id: node.id,
					entityId: 'structure-node',
					entityType: 'department',
					title: node.name,
					avatar: '/bitrix/js/humanresources/entity-selector/src/images/department.svg',
					tagOptions: {
						avatar: '/bitrix/js/humanresources/entity-selector/src/images/department.svg',
						fontWeight: '700',
						bgColor: '#ade7e4',
						textColor: '#207976'
					},
					customData: {
						accessCode: node.accessCode,
						nodeEntityType: 'department'
					}
				});
			}
			if (!item.isSelected()) {
				item.select();
			}
		}
		getSelectedDepartmentId() {
			const selectedDepartment = this.getDialog().getSelectedItems().find(item => item.entityId === 'structure-node');
			return selectedDepartment?.id ?? null;
		}
		getDepartmentNameFromSearchQuery() {
			const query = this.getDialog().getTagSelectorQuery();
			return main_core.Type.isString(query) ? query.trim() : '';
		}
		handleDialogDestroy() {
			this.getDialog().unsubscribe('onDestroy', this.handleDialogDestroy);
			this.departmentCreationPopup?.destroy();
			this.departmentCreationPopup = null;
		}
	}

	Object.defineProperty(exports, "Dialog", {
		enumerable: true,
		get: function () { return ui_entitySelector.Dialog; }
	});
	exports.DepartmentCreationFooter = DepartmentCreationFooter;

})(this.BX.HumanResources.EntitySelector = this.BX.HumanResources.EntitySelector || {}, BX.UI.EntitySelector, BX, BX.HumanResources);
//# sourceMappingURL=entity-selector.bundle.js.map
