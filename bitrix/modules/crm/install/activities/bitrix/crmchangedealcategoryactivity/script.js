/* eslint-disable */
(function (main_core) {
	'use strict';

	const namespace = main_core.Reflection.namespace('BX.Crm.Activity');
	class CrmChangeDealCategoryActivity {
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
			if (this.categorySelect && this.stageSelect) {
				main_core.Event.bind(this.categorySelect, 'change', this.filter.bind(this));
				this.filter();
			}
		}
		filter() {
			const categoryId = this.categorySelect.value;
			const prefix = categoryId !== '0' ? `C${categoryId}:` : '';
			for (const opt of this.stageSelect.options) {
				if (opt.value === '') {
					continue;
				}
				if (opt.selected && opt.getAttribute('data-role') === 'expression') {
					continue;
				}
				opt.disabled = prefix && opt.value.indexOf(prefix) < 0 || !prefix && opt.value.indexOf(':') > -1;
				if (opt.disabled === main_core.Dom.isShown(opt)) {
					main_core.Dom.toggle(opt);
				}
				if (opt.disabled && opt.value === this.stageSelect.value) {
					opt.selected = false;
				}
			}
		}
	}
	namespace.CrmChangeDealCategoryActivity = CrmChangeDealCategoryActivity;

})(BX);
//# sourceMappingURL=script.js.map
