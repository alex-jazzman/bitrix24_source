/**
 * @module biconnector/dashboard-list/src/unified-filters-feature
 */
jn.define('biconnector/dashboard-list/src/unified-filters-feature', (require, exports, module) => {
	const { UnifiedFiltersFeature: FeatureFlag } = require('layout/ui/field-filter/feature');

	/**
	 * BI-side reader of \Bitrix\BIConnectorMobile\Public\Feature\UnifiedFiltersFlag. The module owns
	 * a single list, so one mirrored value covers it whole.
	 *
	 * @type {UnifiedFiltersFeature}
	 */
	const UnifiedFiltersFeature = new FeatureFlag({
		action: 'biconnectormobile.Settings.isUnifiedFiltersEnabled',
		cacheName: 'biconnectorDashboardList',
	});

	module.exports = { UnifiedFiltersFeature };
});
