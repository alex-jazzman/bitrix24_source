/* eslint-disable */
this.BX = this.BX || {};
this.BX.Crm = this.BX.Crm || {};
(function (exports, main_core) {
	'use strict';

	const FIXED_ENTITY_TYPE_NAMES = new Set(['DEAL', 'LEAD', 'QUOTE', 'SMART_INVOICE']);
	function getEntityMessageCodeCandidates(baseCode, context = {}) {
		const entityTypeName = main_core.Type.isStringFilled(context.entityTypeName) ? context.entityTypeName.toUpperCase() : '';
		if (FIXED_ENTITY_TYPE_NAMES.has(entityTypeName)) {
			return [`${baseCode}_${entityTypeName}`, baseCode];
		}
		if (entityTypeName.startsWith('DYNAMIC_')) {
			return [`${baseCode}_DYNAMIC`, baseCode];
		}
		return [baseCode];
	}
	function getEntityMessage(baseCode, context = {}, replacements = {}) {
		for (const code of getEntityMessageCodeCandidates(baseCode, context)) {
			const message = main_core.Loc.getMessage(code, replacements);
			if (main_core.Type.isStringFilled(message)) {
				return message;
			}
		}
		return '';
	}

	exports.getEntityMessage = getEntityMessage;
	exports.getEntityMessageCodeCandidates = getEntityMessageCodeCandidates;

})(this.BX.Crm.Stage = this.BX.Crm.Stage || {}, BX);
//# sourceMappingURL=entity-text.bundle.js.map
