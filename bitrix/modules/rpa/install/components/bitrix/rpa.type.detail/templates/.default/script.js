/* eslint-disable */
(function (main_core, rpa_component, rpa_fieldscontroller) {
	'use strict';

	const namespace = main_core.Reflection.namespace('BX.Rpa');
	class TypeComponent extends rpa_component.Component {
		setFieldsController(fieldsController) {
			if (fieldsController instanceof rpa_fieldscontroller.FieldsController) {
				this.fieldsController = fieldsController;
			}
			return this;
		}
		init() {
			super.init();
			if (main_core.Type.isPlainObject(this.params.type)) {
				this.addDataToSlider('type', this.params.type);
			}
		}
		static getIconsNode() {
			return document.querySelector('[data-role="icon-selector"]');
		}
		static getIcons() {
			const iconsNode = TypeComponent.getIconsNode();
			if (!iconsNode) {
				return null;
			}
			const nodeList = iconsNode.querySelectorAll('.rpa-automation-options-item');
			if (nodeList.length > 0) {
				return Array.from(nodeList);
			}
			return null;
		}
		static onIconClick(icon) {
			const icons = TypeComponent.getIcons();
			if (!icons) {
				return;
			}
			icons.forEach(node => {
				node.classList.remove('rpa-automation-options-item-selected');
			});
			icon.classList.add('rpa-automation-options-item-selected');
		}
		static getSelectedIcon() {
			const iconsNode = TypeComponent.getIconsNode();
			if (!iconsNode) {
				return null;
			}
			return iconsNode.querySelector('.rpa-automation-options-item-selected');
		}
		prepareData() {
			const data = {
				fields: {}
			};
			const fields = Array.from(this.form.querySelectorAll('[data-type="field"]'));
			fields.forEach(field => {
				if (field.name === 'id') {
					if (main_core.Text.toInteger(field.value) > 0) {
						data.id = field.value;
					}
				} else {
					data.fields[field.name] = field.value;
				}
			});
			data.fields.permissions = this.getPermissions();
			data.fields.settings = this.getSettings();
			const selectedIcon = TypeComponent.getSelectedIcon();
			if (selectedIcon) {
				data.fields.image = selectedIcon.dataset.icon;
			}
			return data;
		}
		getSettings() {
			const settings = {
				scenarios: []
			};
			const nodes = Array.from(this.form.querySelectorAll('[data-type="scenario"]'));
			nodes.forEach(node => {
				if (node.checked) {
					settings.scenarios.push(node.value);
				}
			});
			return settings;
		}
		getPermissionSelectors() {
			return [{
				action: 'ITEMS_CREATE',
				selector: '[data-role="permission-setting-items_create"]'
			}, {
				action: 'MODIFY',
				selector: '[data-role="permission-setting-modify"]'
			}, {
				action: 'VIEW',
				selector: '[data-role="permission-setting-view"]'
			}];
		}
		afterSave(response) {
			super.afterSave(response);
			const exit = () => {
				if (!this.getSlider()) {
					Manager.Instance.openKanban(response.type.id);
				} else {
					const slider = this.getSlider();
					if (slider) {
						slider.close();
					}
				}
			};
			if (this.fieldsController) {
				const fieldNames = [];
				this.fieldsController.getFields().forEach(field => {
					fieldNames.push(field.getName());
				});
				main_core.ajax.runAction('rpa.Fields.setVisibilitySettings', {
					data: {
						typeId: this.params.type.typeId,
						fields: fieldNames,
						visibility: 'create'
					}
				}).then(exit).catch(exit);
			} else {
				exit();
			}
		}
		showErrors(errors) {
			super.showErrors(errors);
			this.errorsContainer.parentNode.style.display = 'block';
		}
		hideErrors() {
			super.hideErrors();
			this.errorsContainer.parentNode.style.display = 'none';
		}
	}
	namespace.TypeComponent = TypeComponent;

})(BX, BX.Rpa, BX.Rpa);
//# sourceMappingURL=script.js.map
