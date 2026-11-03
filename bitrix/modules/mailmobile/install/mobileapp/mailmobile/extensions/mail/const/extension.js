/**
 * @module mail/const
 */
jn.define('mail/const', (require, exports, module) => {
	const { AjaxMethod } = require('mail/const/src/ajax');
	const { CrmOwnerType, normalizeIsCrmMessage, isCrmDealEntity } = require('mail/const/src/crm');
	const { DefaultRecipientLimits, getRemainingRecipientLimit } = require('mail/const/src/limits');

	module.exports = {
		AjaxMethod,
		CrmOwnerType,
		DefaultRecipientLimits,
		getRemainingRecipientLimit,
		normalizeIsCrmMessage,
		isCrmDealEntity,
	};
});
