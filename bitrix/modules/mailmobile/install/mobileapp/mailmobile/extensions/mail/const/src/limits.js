/**
 * @module mail/const/src/limits
 */
jn.define('mail/const/src/limits', (require, exports, module) => {
	const { Type } = require('type');

	const DefaultRecipientLimits = Object.freeze({
		total: 10,
		perField: -1,
	});
	const recipientFieldNames = Object.freeze(['to', 'cc', 'bcc']);

	function getRecipientCount(compositeFields, fieldName)
	{
		const fields = compositeFields?.[fieldName]?.fields;

		return Array.isArray(fields)
			? fields.filter((recipient) => Type.isStringFilled(
				recipient?.email?.[recipient.selectedEmailId ?? 0]?.value
				?? recipient?.customData?.email
				?? recipient?.value,
			)).length
			: 0
		;
	}

	function getRemainingRecipientLimit(compositeFields, fieldName, recipientLimits)
	{
		const totalLimit = Type.isInteger(recipientLimits?.total)
			? recipientLimits.total
			: DefaultRecipientLimits.total
		;
		const perFieldLimit = Type.isInteger(recipientLimits?.perField)
			? recipientLimits.perField
			: DefaultRecipientLimits.perField
		;
		const totalRecipientCount = recipientFieldNames.reduce(
			(count, recipientFieldName) => count + getRecipientCount(compositeFields, recipientFieldName),
			0,
		);
		const totalRemaining = totalLimit - totalRecipientCount;
		const fieldRemaining = perFieldLimit === -1
			? totalRemaining
			: perFieldLimit - getRecipientCount(compositeFields, fieldName)
		;

		return Math.max(0, Math.min(totalRemaining, fieldRemaining));
	}

	module.exports = {
		DefaultRecipientLimits,
		getRemainingRecipientLimit,
	};
});
