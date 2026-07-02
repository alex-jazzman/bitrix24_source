/* eslint-disable */
(function (main_core) {
	'use strict';

	const namespace = main_core.Reflection.namespace('BX.Crm.Activity');
	class CrmChangeRelationsActivity {
		constructor(options) {
			if (main_core.Type.isPlainObject(options)) {
				const form = document.forms[options.formName];
				if (!main_core.Type.isNil(form)) {
					this.actionTypeSelect = form.action;
					this.parentIdPropertyDiv = form.parent_id.parentElement.parentElement;
				}
				this.onActionTypeChange();
			}
		}
		init() {
			main_core.Event.bind(this.actionTypeSelect, 'change', this.onActionTypeChange.bind(this));
		}
		onActionTypeChange() {
			if (this.actionTypeSelect.value === 'remove') {
				main_core.Dom.style(this.parentIdPropertyDiv, 'visibility', 'hidden');
			} else {
				main_core.Dom.style(this.parentIdPropertyDiv, 'visibility', 'visible');
			}
		}
	}
	namespace.CrmChangeRelationsActivity = CrmChangeRelationsActivity;

})(BX);
//# sourceMappingURL=script.js.map
