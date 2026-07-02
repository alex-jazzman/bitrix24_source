/* eslint-disable */
this.BX = this.BX || {};
(function (exports, main_core, ui_buttons, ui_entitySelector, ui_notification, ui_system_dialog, ui_system_input, humanresources_companyStructure_api) {
	'use strict';

	class DepartmentCreationPopup {
		#dialog = null;
		#content = null;
		#parentDepartmentSelector = null;
		#departmentNameInput = null;
		#parentDepartmentSelectorContainer = null;
		#departmentNameInputContainer = null;
		#parentDepartmentId = null;
		#defaultParentDepartmentId = null;
		#onCreate = null;
		#onCancel = null;
		#createButton = null;
		#cancelButton = null;
		constructor(options = {}) {
			const settings = main_core.Extension.getSettings('humanresources.department-creation-popup');
			this.#defaultParentDepartmentId = this.#normalizeDepartmentId(settings.get('currentUserDepartmentId'));
			this.#onCreate = main_core.Type.isFunction(options.onCreate) ? options.onCreate : null;
			this.#onCancel = main_core.Type.isFunction(options.onCancel) ? options.onCancel : null;
			this.reset(options);
		}
		show(options = {}) {
			this.reset(options);
			this.#getDialog().show();
		}
		hide() {
			this.#dialog?.hide();
		}
		destroy() {
			this.#dialog?.hide();
			this.#dialog = null;
			this.#destroyContent();
		}
		reset(options = {}) {
			const parentDepartmentId = this.#normalizeDepartmentId(options.parentDepartmentId) ?? this.#defaultParentDepartmentId;
			const departmentName = this.#normalizeDepartmentName(options.departmentName);
			if (this.#shouldRebuildContent(parentDepartmentId)) {
				this.#destroyContent();
			}
			this.#parentDepartmentId = parentDepartmentId;
			this.#resetParentDepartmentSelector();
			this.#resetDepartmentNameInput(departmentName);
			this.#toggleCreateState(false);
		}
		#getDialog() {
			if (this.#dialog) {
				return this.#dialog;
			}
			this.#dialog = new ui_system_dialog.Dialog({
				title: main_core.Loc.getMessage('HUMANRESOURCES_DEPARTMENT_CREATION_POPUP_TITLE'),
				content: this.#getContent(),
				leftButtons: this.#getButtons(),
				width: 515,
				hasOverlay: true,
				closeByEsc: true,
				closeByClickOutside: true,
				events: {
					onHide: () => {
						this.#dialog = null;
					}
				}
			});
			return this.#dialog;
		}
		#getContent() {
			if (this.#content) {
				return this.#content;
			}
			this.#parentDepartmentSelectorContainer = main_core.Tag.render`
			<div class="humanresources-department-creation-popup__selector"></div>
		`;
			this.#departmentNameInputContainer = main_core.Tag.render`
			<div class="humanresources-department-creation-popup__input">
				${this.#getDepartmentNameInput().render()}
			</div>
		`;
			this.#content = main_core.Tag.render`
			<div class="humanresources-department-creation-popup__content">
				<div class="humanresources-department-creation-popup__field">
					<div class="humanresources-department-creation-popup__field-label">
						${main_core.Loc.getMessage('HUMANRESOURCES_DEPARTMENT_CREATION_POPUP_PARENT_DEPARTMENT_TITLE')}
					</div>
					${this.#parentDepartmentSelectorContainer}
				</div>
				<div class="humanresources-department-creation-popup__field">
					${this.#departmentNameInputContainer}
				</div>
			</div>
		`;
			this.#getParentDepartmentSelector().renderTo(this.#parentDepartmentSelectorContainer);
			return this.#content;
		}
		#getButtons() {
			this.#createButton = new ui_buttons.Button({
				size: ui_buttons.ButtonSize.LARGE,
				style: ui_buttons.AirButtonStyle.FILLED,
				useAirDesign: true,
				text: main_core.Loc.getMessage('HUMANRESOURCES_DEPARTMENT_CREATION_POPUP_CREATE_BUTTON'),
				onclick: () => {
					void this.#handleCreateClick();
				}
			});
			this.#cancelButton = new ui_buttons.Button({
				size: ui_buttons.ButtonSize.LARGE,
				style: ui_buttons.AirButtonStyle.PLAIN,
				useAirDesign: true,
				text: main_core.Loc.getMessage('HUMANRESOURCES_DEPARTMENT_CREATION_POPUP_CANCEL_BUTTON'),
				onclick: () => {
					this.#handleCancelClick();
				}
			});
			return [this.#createButton, this.#cancelButton];
		}
		#getParentDepartmentSelector() {
			if (this.#parentDepartmentSelector) {
				return this.#parentDepartmentSelector;
			}
			const preselectedItems = this.#parentDepartmentId === null ? [] : [['structure-node', this.#parentDepartmentId]];
			this.#parentDepartmentSelector = new ui_entitySelector.TagSelector({
				multiple: false,
				showCreateButton: false,
				dialogOptions: {
					width: 425,
					height: 350,
					dropdownMode: true,
					hideOnDeselect: true,
					enableSearch: true,
					preselectedItems,
					recentTabOptions: {
						visible: false
					},
					entities: [{
						id: 'structure-node',
						options: {
							selectMode: 'departmentsOnly',
							restricted: 'create',
							allowSelectRootDepartment: true
						}
					}],
					events: {
						onLoad: event => {
							const dialog = event.getTarget();
							const departmentTab = dialog.getTab('structure-departments-tab');
							if (departmentTab) {
								dialog.selectTab('structure-departments-tab');
							}
						}
					}
				}
			});
			return this.#parentDepartmentSelector;
		}
		#getDepartmentNameInput() {
			if (this.#departmentNameInput) {
				return this.#departmentNameInput;
			}
			this.#departmentNameInput = new ui_system_input.Input({
				size: ui_system_input.InputSize.Lg,
				design: ui_system_input.InputDesign.Grey,
				stretched: true,
				label: main_core.Loc.getMessage('HUMANRESOURCES_DEPARTMENT_CREATION_POPUP_DEPARTMENT_NAME_LABEL'),
				onInput: () => {
					this.#departmentNameInput?.setError('');
				}
			});
			return this.#departmentNameInput;
		}
		async #handleCreateClick() {
			const parentDepartmentId = this.#getSelectedParentDepartmentId();
			const departmentName = this.#getDepartmentName();
			if (!this.#validateForm(parentDepartmentId, departmentName)) {
				return;
			}
			this.#toggleCreateState(true);
			try {
				console.log('onbeforecreate');
				const result = await humanresources_companyStructure_api.postData('humanresources.api.Structure.Department.create', {
					name: departmentName,
					parentId: parentDepartmentId,
					description: null,
					userIds: [],
					moveUsersToDepartment: 0,
					createChat: 0,
					bindingChatIds: [],
					createChannel: 0,
					bindingChannelIds: [],
					createCollab: 0,
					bindingCollabIds: [],
					settings: {}
				});
				console.log('oncreate');
				if (this.#onCreate) {
					await this.#onCreate(result);
				}
				this.hide();
			} catch (error) {
				const message = error?.message ?? main_core.Loc.getMessage('HUMANRESOURCES_DEPARTMENT_CREATION_POPUP_CREATE_ERROR');
				ui_notification.UI.Notification.Center.notify({
					content: message,
					autoHideDelay: 4000
				});
			} finally {
				this.#toggleCreateState(false);
			}
		}
		#handleCancelClick() {
			if (this.#onCancel) {
				this.#onCancel();
			}
			this.hide();
		}
		#getSelectedParentDepartmentId() {
			const selectedItem = this.#parentDepartmentSelector?.getDialog()?.getSelectedItems()?.[0];
			return this.#normalizeDepartmentId(selectedItem?.id);
		}
		#getDepartmentName() {
			return this.#departmentNameInput?.getValue().trim() ?? '';
		}
		#resetParentDepartmentSelector() {
			const dialog = this.#getParentDepartmentSelector().getDialog();
			const parentDepartmentId = this.#parentDepartmentId;
			dialog.deselectAll();
			if (parentDepartmentId === null) {
				return;
			}
			const item = dialog.getItem(['structure-node', parentDepartmentId]);
			if (!item) {
				return;
			}
			item.select(true);
		}
		#resetDepartmentNameInput(departmentName = '') {
			this.#getDepartmentNameInput().setValue(departmentName);
			this.#departmentNameInput?.setError('');
		}
		#destroyContent() {
			this.#parentDepartmentSelector?.getDialog()?.destroy();
			this.#parentDepartmentSelector = null;
			this.#departmentNameInput = null;
			this.#createButton = null;
			this.#cancelButton = null;
			this.#parentDepartmentSelectorContainer = null;
			this.#departmentNameInputContainer = null;
			this.#content = null;
		}
		#validateForm(parentDepartmentId, departmentName) {
			let isValid = true;
			if (!main_core.Type.isStringFilled(departmentName)) {
				this.#departmentNameInput?.setError(main_core.Loc.getMessage('HUMANRESOURCES_DEPARTMENT_CREATION_POPUP_DEPARTMENT_NAME_ERROR'));
				isValid = false;
			}
			if (!main_core.Type.isNumber(parentDepartmentId)) {
				ui_notification.UI.Notification.Center.notify({
					content: main_core.Loc.getMessage('HUMANRESOURCES_DEPARTMENT_CREATION_POPUP_PARENT_DEPARTMENT_ERROR'),
					autoHideDelay: 4000
				});
				isValid = false;
			}
			return isValid;
		}
		#toggleCreateState(isLoading) {
			this.#createButton?.setWaiting(isLoading);
			this.#cancelButton?.setDisabled(isLoading);
		}
		#shouldRebuildContent(parentDepartmentId) {
			if (!this.#parentDepartmentSelector) {
				return false;
			}
			if (parentDepartmentId === this.#getSelectedParentDepartmentId()) {
				return false;
			}
			return parentDepartmentId !== null && !this.#parentDepartmentSelector.getDialog().getItem(['structure-node', parentDepartmentId]);
		}
		#normalizeDepartmentId(departmentId) {
			if (main_core.Type.isNumber(departmentId)) {
				return departmentId;
			}
			if (main_core.Type.isStringFilled(departmentId) && /^-?\d+$/.test(departmentId)) {
				return parseInt(departmentId, 10);
			}
			return null;
		}
		#normalizeDepartmentName(departmentName) {
			return main_core.Type.isString(departmentName) ? departmentName.trim() : '';
		}
	}

	exports.DepartmentCreationPopup = DepartmentCreationPopup;

})(this.BX.HumanResources = this.BX.HumanResources || {}, BX, BX.UI, BX.UI.EntitySelector, BX, BX.UI.System, BX.UI.System.Input, BX.Humanresources.CompanyStructure);
//# sourceMappingURL=department-creation-popup.bundle.js.map
