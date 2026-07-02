/* eslint-disable */
(function (main_core) {
	'use strict';

	const namespace = main_core.Reflection.namespace('BX.Crm.Activity');
	class CrmCopyDynamicActivity {
		constructor(options) {
			if (main_core.Type.isPlainObject(options)) {
				const form = document.forms[options.formName];
				if (!main_core.Type.isNil(form)) {
					this.categorySelect = form['category_id'];
					this.stageSelect = form['stage_id'];
				}
			}
		}
		init() {
			if (!this.categorySelect || !this.stageSelect) {
				return false;
			}
			main_core.Event.bind(this.categorySelect, 'change', this.filter.bind(this));
			this.filter(this.categorySelect.value);
		}
		filter() {
			const categoryId = this.categorySelect.value;
			const prefix = `C${categoryId}:`;
			for (let opt of this.stageSelect.options) {
				if (opt.value === '') {
					continue;
				}
				opt.disabled = opt.value.indexOf(prefix) < 0;
				if (opt.disabled === main_core.Dom.isShown(opt)) {
					main_core.Dom.toggle(opt);
				}
				if (opt.disabled && opt.value === this.stageSelect.value) {
					opt.selected = false;
				}
			}
		}
	}
	namespace.CrmCopyDynamicActivity = CrmCopyDynamicActivity;

})(BX);
//# sourceMappingURL=script.js.map
