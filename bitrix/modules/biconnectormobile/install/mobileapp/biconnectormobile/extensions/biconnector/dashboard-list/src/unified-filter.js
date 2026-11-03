/**
 * @module biconnector/dashboard-list/src/unified-filter
 */
jn.define('biconnector/dashboard-list/src/unified-filter', (require, exports, module) => {
	const { requireLazy } = require('require-lazy');

	const FILTER_ACTION_PREFIX = 'biconnectormobile.Filter';

	/**
	 * The filter button ref: the native navigation bar exposes a button by its badge code.
	 * @type {string}
	 */
	const FILTER_BUTTON_REF = 'biconnector_dashboard_list_filter';

	/**
	 * Only the author field has a mobile picker; the four BI selectors stay locked.
	 * @type {EntitySelectorMap}
	 */
	const BIC_ENTITY_SELECTORS = {
		user: 'user',
	};

	/**
	 * Everything the unified filter needs to know about the report list. The context is empty on
	 * purpose: the module has a single list, there is nothing to address.
	 *
	 * A configuration and not a subclass of `ListFilter`: the list starts with the stand-in
	 * (`ListFilterEntry`) and the same configuration is handed to the filter itself once the drawer
	 * graph is loaded.
	 *
	 * @param {{onApply: Function, onResolve: Function}} params
	 * @return {ListFilterConfig}
	 */
	const getUnifiedFilterConfig = ({ onApply, onResolve }) => ({
		actionPrefix: FILTER_ACTION_PREFIX,
		context: {},
		entitySelectors: BIC_ENTITY_SELECTORS,
		buttonRef: FILTER_BUTTON_REF,
		// the drawer lives in `mobile` and arrives when the user opens the filter, so the bundle of
		// the list holds the stand-in alone
		loadListFilter: () => requireLazy('layout/ui/field-filter/list'),
		onApply,
		onResolve,
	});

	module.exports = { getUnifiedFilterConfig };
});
