/**
 * @module crm/onboarding/src/const
 */
jn.define('crm/onboarding/src/const', (require, exports, module) => {
	const CaseName = {
		ON_NO_CRM_DEALS: 'crm.tabs:onEmptyCrm',
		ON_ACTIVE_TAB_COUNTER: 'crm.tabs:onActiveTabCounter',
		ON_DEALS_AT_DIFFERENT_STAGES: 'crm.tabs:onDealsAtDifferentStages',
		ON_MORE_THAN_TWO_TUNNELS: 'crm.tabs:onMoreThanTwoTunnels',
		ON_DEAL_CONTACT_FILLED: 'crm.tabs:onContactInDealFilled',
		ON_CUSTOM_PRESET_APPEARED: 'crm.tabs:onCustomPresetAppeared',
		ON_PAYMENT_ON_DEAL: 'crm.entity.detail:onPaymentEnabled',
	};

	module.exports = {
		CaseName,
	};
});
