/* eslint-disable */
this.BX = this.BX || {};
this.BX.Intranet = this.BX.Intranet || {};
(function (exports) {
	'use strict';

	function validatePasswordRequirements(password, policy) {
		if (password === '' || policy === null || policy === undefined) {
			return 'neutral';
		}
		if ([...password].length < policy.minPasswordSize) {
			return 'invalid';
		}
		if (policy.isUpperCaseRequired && !/[A-Z]/.test(password)) {
			return 'invalid';
		}
		if (policy.isLowerCaseRequired && !/[a-z]/.test(password)) {
			return 'invalid';
		}
		if (policy.isDigitRequired && !/\d/.test(password)) {
			return 'invalid';
		}
		if (policy.isSpecialCharsRequired && ![...password].some(character => policy.specialChars.includes(character))) {
			return 'invalid';
		}
		return 'valid';
	}

	exports.validatePasswordRequirements = validatePasswordRequirements;

})(this.BX.Intranet.Login = this.BX.Intranet.Login || {});
//# sourceMappingURL=password-requirements.bundle.js.map
