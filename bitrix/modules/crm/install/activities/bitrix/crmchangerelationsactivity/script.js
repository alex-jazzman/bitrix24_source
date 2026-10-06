/* eslint-disable */
(function (main_core) {
	'use strict';

	const namespace = main_core.Reflection.namespace('BX.Crm.Activity');
	class CrmChangeRelationsActivity {
		constructor(options) {
			if (main_core.Type.isPlainObject(options)) {
				const form = document.forms[options.formName];
				if (!main_core.Type.isNil(form)) {
					this.actionTypeSelect = this.getFormElement(form, 'action');
					this.parentTypeSelect = this.getFormElement(form, 'parent_type_id');
					this.parentIdInput = this.getFormElement(form, 'parent_id');
					this.parentIdTextInput = this.getFormElement(form, 'parent_id_text');
					this.parentIdPropertyDiv = this.getParentIdPropertyDiv();
				}
				this.onActionTypeChange();
			}
		}
		init() {
			if (main_core.Type.isDomNode(this.actionTypeSelect)) {
				main_core.Event.bind(this.actionTypeSelect, 'change', this.onActionTypeChange.bind(this));
			}
			if (main_core.Type.isDomNode(this.parentTypeSelect)) {
				main_core.Event.bind(this.parentTypeSelect, 'change', this.onParentTypeChange.bind(this));
			}
		}
		onActionTypeChange() {
			if (!main_core.Type.isDomNode(this.actionTypeSelect) || !main_core.Type.isDomNode(this.parentIdPropertyDiv)) {
				return;
			}
			if (this.actionTypeSelect.value === 'remove') {
				main_core.Dom.style(this.parentIdPropertyDiv, 'visibility', 'hidden');
			} else {
				main_core.Dom.style(this.parentIdPropertyDiv, 'visibility', 'visible');
			}
		}
		onParentTypeChange() {
			if (main_core.Type.isDomNode(this.parentIdInput)) {
				this.parentIdInput.value = '';
			}
			if (main_core.Type.isDomNode(this.parentIdTextInput)) {
				this.parentIdTextInput.value = '';
			}
		}
		getFormElement(form, name) {
			const element = form.elements.namedItem(name);
			return main_core.Type.isDomNode(element) ? element : null;
		}
		getParentIdPropertyDiv() {
			if (!main_core.Type.isDomNode(this.parentIdInput)) {
				return null;
			}
			const parentElement = this.parentIdInput.parentElement;
			if (!main_core.Type.isDomNode(parentElement) || !main_core.Type.isDomNode(parentElement.parentElement)) {
				return null;
			}
			return parentElement.parentElement;
		}
	}
	namespace.CrmChangeRelationsActivity = CrmChangeRelationsActivity;

})(BX);
//# sourceMappingURL=script.js.map
