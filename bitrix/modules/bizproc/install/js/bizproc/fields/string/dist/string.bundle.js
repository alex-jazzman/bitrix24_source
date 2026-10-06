/* eslint-disable */
this.BX = this.BX || {};
this.BX.Bizproc = this.BX.Bizproc || {};
this.BX.Bizproc.Fields = this.BX.Bizproc.Fields || {};
(function (exports, ui_designTokens, ui_iconSet_outline, main_core, bizproc_fields) {
	'use strict';

	class StringField extends bizproc_fields.BaseField {
		getDefaultPlaceholder() {
			return main_core.Loc.getMessage('BIZPROC_FIELDS_STRING_PLACEHOLDER') ?? '';
		}
		renderControl(value) {
			return this.renderTextControl({
				blockClass: 'bizproc-fields-string',
				value,
				rowTestId: false
			});
		}
	}
	bizproc_fields.FieldRegistry.register('string', StringField);

	exports.StringField = StringField;

})(this.BX.Bizproc.Fields.String = this.BX.Bizproc.Fields.String || {}, window, window, BX, BX.Bizproc.Fields);
//# sourceMappingURL=string.bundle.js.map
