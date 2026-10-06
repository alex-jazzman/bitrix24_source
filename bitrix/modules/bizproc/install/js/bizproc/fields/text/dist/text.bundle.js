/* eslint-disable */
this.BX = this.BX || {};
this.BX.Bizproc = this.BX.Bizproc || {};
this.BX.Bizproc.Fields = this.BX.Bizproc.Fields || {};
(function (exports, ui_designTokens, ui_iconSet_outline, main_core, bizproc_fields) {
	'use strict';

	class TextField extends bizproc_fields.BaseField {
		getDefaultPlaceholder() {
			return main_core.Loc.getMessage('BIZPROC_FIELDS_TEXT_PLACEHOLDER') ?? '';
		}
		renderControl(value) {
			return this.renderTextControl({
				blockClass: 'bizproc-fields-text',
				value,
				multiline: true
			});
		}
	}
	bizproc_fields.FieldRegistry.register('text', TextField);

	exports.TextField = TextField;

})(this.BX.Bizproc.Fields.Text = this.BX.Bizproc.Fields.Text || {}, window, window, BX, BX.Bizproc.Fields);
//# sourceMappingURL=text.bundle.js.map
