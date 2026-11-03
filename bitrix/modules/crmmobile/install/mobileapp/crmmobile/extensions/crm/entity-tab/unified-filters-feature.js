/**
 * @module crm/entity-tab/unified-filters-feature
 */
jn.define('crm/entity-tab/unified-filters-feature', (require, exports, module) => {
	const { UnifiedFiltersFeature: FeatureFlag } = require('layout/ui/field-filter/feature');

	/**
	 * CRM-side reader of \Bitrix\CrmMobile\Public\Feature\UnifiedFiltersFlag. One mirrored value for
	 * every CRM list: all the entity tabs switch modes together.
	 *
	 * @type {UnifiedFiltersFeature}
	 */
	const UnifiedFiltersFeature = new FeatureFlag({
		action: 'crmmobile.Settings.isUnifiedFiltersEnabled',
		cacheName: 'crmEntityTab',
	});

	module.exports = { UnifiedFiltersFeature };
});
