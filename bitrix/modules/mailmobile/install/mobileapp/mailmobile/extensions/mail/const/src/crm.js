/**
 * @module mail/const/src/crm
 */
jn.define('mail/const/src/crm', (require, exports, module) => {
	const CrmOwnerType = Object.freeze({
		DealId: 2,
		DealName: 'DEAL',
	});

	function normalizeIsCrmMessage(value)
	{
		return value === true || Number(value) === 1;
	}

	function isCrmDealEntity({ isCrmMessage, ownerType, ownerId } = {})
	{
		return normalizeIsCrmMessage(isCrmMessage)
			&& Number(ownerId) > 0
			&& (
				String(ownerType).toUpperCase() === CrmOwnerType.DealName
				|| Number(ownerType) === CrmOwnerType.DealId
			)
		;
	}

	module.exports = {
		CrmOwnerType,
		normalizeIsCrmMessage,
		isCrmDealEntity,
	};
});
