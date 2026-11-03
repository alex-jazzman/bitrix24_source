/* eslint-disable */
this.BX = this.BX || {};
(function (exports, main_core) {
	'use strict';

	function resolveErrorHtml(response, fallbackPhrase) {
		return getServerErrorHtml(response) ?? fallbackPhrase ?? '';
	}
	function getServerErrorHtml(response) {
		const errors = response?.errors;
		if (!main_core.Type.isArray(errors)) {
			return null;
		}
		return errors.map(error => getUserFacingErrorHtml(error)).find(html => html !== null) ?? null;
	}
	function isNetworkError(response) {
		const errors = response?.errors;
		if (!main_core.Type.isArray(errors)) {
			return false;
		}
		return errors.some(error => main_core.Type.isObjectLike(error) && error.code === 'NETWORK_ERROR');
	}
	function getUserFacingErrorHtml(error) {
		if (!main_core.Type.isObjectLike(error)) {
			return null;
		}
		const serverError = error;
		const message = serverError.message ?? '';
		if (serverError.userFacing !== true || !main_core.Type.isStringFilled(message)) {
			return null;
		}
		return main_core.Text.encode(message);
	}

	exports.getServerErrorHtml = getServerErrorHtml;
	exports.getUserFacingErrorHtml = getUserFacingErrorHtml;
	exports.isNetworkError = isNetworkError;
	exports.resolveErrorHtml = resolveErrorHtml;

})(this.BX.BIConnector = this.BX.BIConnector || {}, BX);
//# sourceMappingURL=error-message.bundle.js.map
