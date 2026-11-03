/* eslint-disable */
this.BX = this.BX || {};
this.BX.Landing = this.BX.Landing || {};
this.BX.Landing.Ui = this.BX.Landing.Ui || {};
(function (exports, main_core, landing_ui_field_basefield, landing_ui_form_menuform) {
	'use strict';

	/**
	 * @memberOf BX.Landing.UI.Field
	 */
	class MenuItemField extends landing_ui_field_basefield.BaseField {
		constructor(options = {}) {
			super(options);
			this.depth = options.depth;
			this.fields = options.fields;
			if (this.depth > 0) {
				const levelPadding = 20;
				main_core.Dom.style(this.layout, 'margin-left', `${levelPadding * this.depth}px`);
			}
			this.form = new landing_ui_form_menuform.MenuForm({
				fields: this.fields
			});
			main_core.Dom.append(this.form.layout, this.layout);
		}
	}

	exports.MenuItemField = MenuItemField;

})(this.BX.Landing.Ui.Field = this.BX.Landing.Ui.Field || {}, BX, BX.Landing.UI.Field, BX.Landing.UI.Form);
//# sourceMappingURL=menuitemfield.bundle.js.map
