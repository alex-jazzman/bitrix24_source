/* eslint-disable */
this.BX = this.BX || {};
this.BX.Bizproc = this.BX.Bizproc || {};
this.BX.Bizproc.Fields = this.BX.Bizproc.Fields || {};
(function (exports, ui_designTokens, ui_iconSet_outline, main_core, bizproc_fields) {
	'use strict';

	const VALUE_INPUT_SELECTOR = '.bizproc-fields-double__input';
	function sanitizeDecimal(raw) {
		const negative = raw.startsWith('-');
		const rest = negative ? raw.slice(1) : raw;
		let digits = '';
		let separatorUsed = false;
		for (const char of rest) {
			if (char >= '0' && char <= '9') {
				digits += char;
			} else if ((char === '.' || char === ',') && !separatorUsed) {
				digits += char;
				separatorUsed = true;
			}
		}
		return (negative ? '-' : '') + digits;
	}
	class DoubleField extends bizproc_fields.BaseField {
		getDefaultPlaceholder() {
			return main_core.Loc.getMessage('BIZPROC_FIELDS_DOUBLE_PLACEHOLDER') ?? '';
		}
		splitsScalarValue() {
			return false;
		}
		renderControl(value) {
			const control = this.renderTextControl({
				blockClass: 'bizproc-fields-double',
				value,
				inputMode: 'decimal'
			});
			this.bindInputFilter(control.root, VALUE_INPUT_SELECTOR, sanitizeDecimal);
			return control;
		}
	}
	bizproc_fields.FieldRegistry.register('double', DoubleField);

	exports.DoubleField = DoubleField;

})(this.BX.Bizproc.Fields.Double = this.BX.Bizproc.Fields.Double || {}, window, window, BX, BX.Bizproc.Fields);
//# sourceMappingURL=double.bundle.js.map
