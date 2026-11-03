/**
 * @module crm/entity-tab/unified-filter
 */
jn.define('crm/entity-tab/unified-filter', (require, exports, module) => {
	const { Loc } = require('loc');
	const { Icon } = require('assets/icons');
	const { requireLazy } = require('require-lazy');
	const { TypeName } = require('crm/type');
	const { TypeSort } = require('crm/entity-tab/sort');
	const { CRM_FIELD_ICONS } = require('crm/entity-tab/unified-filter/field-icons');
	const { getSectionIcons } = require('crm/entity-tab/unified-filter/section-icons');
	const { CRM_ENTITY_SELECTORS } = require('crm/entity-tab/unified-filter/entity-selectors');

	const FILTER_ACTION_PREFIX = 'crmmobile.Filter';

	/**
	 * The filter button ref: the native navigation bar exposes a button by its badge code.
	 * @type {string}
	 */
	const FILTER_BUTTON_REF = 'crm_entity_tab_filter';

	/**
	 * The two orders a CRM list supports. The wordings are the ones of the "---" menu the
	 * section replaces, only stated as a choice of two instead of a switch.
	 *
	 * @return {SortingTypeMap}
	 */
	const getSortTypes = () => ({
		[TypeSort.LastActivityTime]: {
			label: Loc.getMessage('M_CRM_ENTITY_TAB_FILTER_SORT_LAST_ACTIVITY'),
			icon: Icon.PULSE,
		},
		[TypeSort.Id]: {
			label: Loc.getMessage('M_CRM_ENTITY_TAB_FILTER_SORT_ID'),
			icon: Icon.CALENDAR,
		},
	});

	/**
	 * Codes of the markup for the orders the drawer of a CRM list offers, by sort type.
	 *
	 * @type {Readonly<Record<string, string>>}
	 */
	const CRM_SORT_ANALYTICS_CODES = Object.freeze({
		[TypeSort.LastActivityTime]: 'sort_lastactivity',
		[TypeSort.Id]: 'sort_createddate',
	});

	/**
	 * The order of a CRM list that offers no choice of it: by id, the order of creation.
	 */
	const CRM_DEFAULT_SORT_ANALYTICS_CODE = CRM_SORT_ANALYTICS_CODES[TypeSort.Id];

	/**
	 * Only deals are marked up for now; any other list of CRM gives no context. The mode is read for
	 * the event that carries `p1` alone.
	 *
	 * @param {CrmUnifiedFilterParams} params
	 * @param {FilterAnalyticsRequest} request
	 * @return {Promise<FilterAnalyticsContext|null>}
	 */
	const getCrmFilterAnalytics = async (params, request) => {
		if (params.getEntityTypeName() !== TypeName.Deal)
		{
			return null;
		}

		const crmMode = request.withParameters ? await params.getCrmMode() : '';

		return {
			tool: 'crm',
			section: 'deal_section',
			subSection: params.getView(),
			p1: crmMode ? `crmMode_${crmMode.toLowerCase()}` : null,
			sortCodes: CRM_SORT_ANALYTICS_CODES,
			sortCode: CRM_DEFAULT_SORT_ANALYTICS_CODE,
		};
	};

	/**
	 * Everything the unified filter needs to know about a CRM list: the CRM field icons, the CRM
	 * pickers and the two orders a CRM list knows. The funnel is part of the address of the list, so
	 * a switch goes through `setContext()` - its grid id, its presets and its stage items all change
	 * with it.
	 *
	 * A configuration and not a subclass of `ListFilter`: the tab starts with the stand-in
	 * (`ListFilterEntry`) and the same configuration is handed to the filter itself once the drawer
	 * graph is loaded. A subclass here would have pulled that graph into the bundle of the tab.
	 *
	 * @param {CrmUnifiedFilterParams} params
	 * @return {ListFilterConfig}
	 */
	const getUnifiedFilterConfig = (params) => ({
		actionPrefix: FILTER_ACTION_PREFIX,
		context: {
			entityTypeName: params.entityTypeName,
			categoryId: Number(params.categoryId ?? 0),
		},
		fieldIcons: CRM_FIELD_ICONS,
		// the group of the list itself is named by that list: a smart process names its section by
		// the id of its type, and no static map can hold such a key
		sectionIcons: getSectionIcons(params.entityTypeName),
		entitySelectors: CRM_ENTITY_SELECTORS,
		buttonRef: FILTER_BUTTON_REF,
		sortTypes: getSortTypes(),
		// the drawer lives in `mobile` and arrives when the user opens the filter, so the bundle of
		// the tab holds the stand-in alone
		loadListFilter: () => requireLazy('layout/ui/field-filter/list'),
		onApply: params.onApply,
		onResolve: params.onResolve,
		analytics: (request) => getCrmFilterAnalytics(params, request),
	});

	module.exports = { getUnifiedFilterConfig, CRM_SORT_ANALYTICS_CODES };
});
