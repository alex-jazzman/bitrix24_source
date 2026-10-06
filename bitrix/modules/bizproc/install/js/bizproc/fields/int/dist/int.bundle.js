/* eslint-disable */
this.BX = this.BX || {};
this.BX.Bizproc = this.BX.Bizproc || {};
this.BX.Bizproc.Fields = this.BX.Bizproc.Fields || {};
(function (exports, ui_designTokens, ui_iconSet_outline, main_core, bizproc_fields) {
	'use strict';

	const VALUE_INPUT_SELECTOR = '.bizproc-fields-int__input';
	function sanitizeInteger(raw) {
		const negative = raw.startsWith('-');
		const digits = raw.replace(/\D/g, '');
		return (negative ? '-' : '') + digits;
	}
	class IntField extends bizproc_fields.BaseField {
		getDefaultPlaceholder() {
			return main_core.Loc.getMessage('BIZPROC_FIELDS_INT_PLACEHOLDER') ?? '';
		}
		renderControl(value) {
			const control = this.renderTextControl({
				blockClass: 'bizproc-fields-int',
				value,
				inputMode: 'numeric'
			});
			this.bindInputFilter(control.root, VALUE_INPUT_SELECTOR, sanitizeInteger);
			return control;
		}
	}
	bizproc_fields.FieldRegistry.register('int', IntField);

	exports.IntField = IntField;

})(this.BX.Bizproc.Fields.Int = this.BX.Bizproc.Fields.Int || {}, window, window, BX, BX.Bizproc.Fields);
//# sourceMappingURL=int.bundle.js.map
