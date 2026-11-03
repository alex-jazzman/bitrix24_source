/* eslint-disable */
this.BX = this.BX || {};
this.BX.Tasks = this.BX.Tasks || {};
this.BX.Tasks.V2 = this.BX.Tasks.V2 || {};
(function (exports, main_core) {
	'use strict';

	const fallbackForm = 1;
	function toSuffix(forms) {
		return forms.map(form => `_PLURAL_${form}`).join('');
	}
	function toCandidateSuffixes(forms) {
		const countFallbacks = candidate => candidate.filter((form, axis) => form !== forms[axis]).length;
		return forms.reduce((candidates, form) => candidates.flatMap(candidate => form === fallbackForm ? [[...candidate, form]] : [[...candidate, form], [...candidate, fallbackForm]]), [[]]).sort((first, second) => countFallbacks(first) - countFallbacks(second)).map(candidate => toSuffix(candidate));
	}
	function formatPluralPhrase(baseCode, values, replacements = null) {
		const forms = values.map(value => main_core.Loc.getPluralForm(value));
		for (const suffix of toCandidateSuffixes(forms)) {
			const code = `${baseCode}${suffix}`;
			if (main_core.Loc.hasMessage(code)) {
				const phrase = main_core.Loc.getMessage(code, replacements);
				if (main_core.Type.isStringFilled(phrase)) {
					return phrase;
				}
			}
		}
		return null;
	}

	exports.formatPluralPhrase = formatPluralPhrase;

})(this.BX.Tasks.V2.Lib = this.BX.Tasks.V2.Lib || {}, BX);
//# sourceMappingURL=plural-phrase.bundle.js.map
