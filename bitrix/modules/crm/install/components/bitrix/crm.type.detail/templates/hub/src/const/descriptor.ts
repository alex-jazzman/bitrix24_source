import { type HubSectionDescriptor, type SettingsRecord } from 'crm.settings-hub';

import { PERMISSIONS_ACTION } from './action-keys';

// Form-specific control types. The kit renders scalar/navigation controls itself; these three are
// supplied by the SP form through the ControlRenderer `controls` map. Kept as plain string
// literals so this module carries no runtime dependency on the kit and stays importable in the bare
// unit harness (only the types above are imported, and type imports are erased at build).
export const SpControlType = Object.freeze({
	Relation: 'relation',
	CustomSection: 'custom-section',
	LinkedUserFields: 'linked-user-fields',
});

// Live boolean field names (16): the single source of truth shared by the store, the descriptor
// and the save payload. The dead field isCrmTrackingEnabled is intentionally absent:
// prod keeps it in getBooleanFieldNames() but skips it via if(fieldNode); the hub never seeds it.
export const LIVE_BOOLEAN_FIELD_NAMES: string[] = [
	'isCategoriesEnabled',
	'isStagesEnabled',
	'isBeginCloseDatesEnabled',
	'isClientEnabled',
	'isLinkWithProductsEnabled',
	'isMycompanyEnabled',
	'isDocumentsEnabled',
	'isSourceEnabled',
	'isUseInUserfieldEnabled',
	'isObserversEnabled',
	'isRecurringEnabled',
	'isRecyclebinEnabled',
	'isAutomationEnabled',
	'isBizProcEnabled',
	'isSetOpenPermissions',
	'isCountersEnabled',
];

// Bounds of the days-before-close field, mirroring Bitrix\Crm\Field\CloseDate::MIN_DAYS_BEFORE_CLOSE
// and ::MAX_DAYS_BEFORE_CLOSE, the same PHP constants .default renders into the min/max attributes.
// They are compile-time constants, not arResult params, so they are declared here and shared with the
// payload normalization.
export const DAYS_BEFORE_CLOSE_MIN = 0;
export const DAYS_BEFORE_CLOSE_MAX = 365;

export const SpSectionId = Object.freeze({
	Main: 'main',
	Features: 'features',
	Relations: 'relations',
	Products: 'products',
	Permissions: 'permissions',
});

// Section tree of the SP hub. Order follows the sp-wizard-quick-start-v2 prototype.
export const SP_HUB_SECTIONS: HubSectionDescriptor[] = [
	{ id: SpSectionId.Main, title: 'CRM_TYPE_DETAIL_HUB_SECTION_MAIN', hideTitle: true },
	{ id: SpSectionId.Features, title: 'CRM_TYPE_DETAIL_HUB_SECTION_FEATURES', hideTitle: true },
	{ id: SpSectionId.Relations, title: 'CRM_TYPE_DETAIL_HUB_SECTION_RELATIONS', hideTitle: true },
	{ id: SpSectionId.Products, title: 'CRM_TYPE_DETAIL_HUB_SECTION_PRODUCTS', hideTitle: true },
	{ id: SpSectionId.Permissions, title: 'CRM_TYPE_DETAIL_HUB_SECTION_PERMISSIONS', hideTitle: true },
];

// SP hub descriptor: a declarative record per row, keyed to camelCase
// keys of arResult['type']. Dead fields are not represented. The later-step
// rows carry availableFromStep: 2 and are hidden until SUPPLY_STEP rises (kit filters them out).
export const SP_HUB_RECORDS: SettingsRecord[] = [
	{
		id: 'sp-title',
		sectionId: SpSectionId.Main,
		kind: 'scalar',
		controlType: 'field',
		title: 'CRM_TYPE_DETAIL_FIELD_TITLE',
		availableFromStep: 1,
		valueKey: 'title',
		legacyBinding: { name: 'title' },
	},
	{
		id: 'sp-description',
		sectionId: SpSectionId.Main,
		kind: 'scalar',
		controlType: 'field',
		title: 'CRM_TYPE_DETAIL_HUB_DESCRIPTION',
		availableFromStep: 2,
		valueKey: 'description',
		legacyBinding: { name: 'description' },
	},
	{
		id: 'sp-custom-section',
		sectionId: SpSectionId.Main,
		kind: 'scalar',
		controlType: SpControlType.CustomSection,
		title: 'CRM_TYPE_DETAIL_TAB_CUSTOM_SECTION_MSGVER_1',
		availableFromStep: 1,
		valueKey: 'customSectionId',
		legacyBinding: {
			switcherId: 'crm-type-custom-section-switcher',
			dataRole: 'crm-type-custom-section-container',
		},
	},
	{
		id: 'sp-source',
		sectionId: SpSectionId.Main,
		kind: 'scalar',
		controlType: 'toggle',
		title: 'CRM_TYPE_DETAIL_FIELD_SOURCE',
		description: 'CRM_TYPE_DETAIL_HUB_FEATURE_SOURCE_DESCRIPTION',
		availableFromStep: 1,
		valueKey: 'isSourceEnabled',
		legacyBinding: { name: 'isSourceEnabled', dataName: 'isSourceEnabled' },
	},
	{
		id: 'sp-begin-close-dates',
		sectionId: SpSectionId.Main,
		kind: 'scalar',
		controlType: 'toggle',
		title: 'CRM_TYPE_DETAIL_FIELD_DATES',
		description: 'CRM_TYPE_DETAIL_HUB_FEATURE_DATES_DESCRIPTION',
		availableFromStep: 1,
		valueKey: 'isBeginCloseDatesEnabled',
		legacyBinding: { name: 'isBeginCloseDatesEnabled', dataName: 'isBeginCloseDatesEnabled' },
	},
	{
		id: 'sp-observers',
		sectionId: SpSectionId.Main,
		kind: 'scalar',
		controlType: 'toggle',
		title: 'CRM_TYPE_DETAIL_FIELD_OBSERVERS',
		description: 'CRM_TYPE_DETAIL_HUB_FEATURE_OBSERVERS_DESCRIPTION',
		availableFromStep: 1,
		valueKey: 'isObserversEnabled',
		legacyBinding: { name: 'isObserversEnabled', dataName: 'isObserversEnabled' },
	},
	{
		id: 'sp-recurring',
		sectionId: SpSectionId.Main,
		kind: 'scalar',
		controlType: 'toggle',
		title: 'CRM_TYPE_DETAIL_FIELD_RECURRING',
		description: 'CRM_TYPE_DETAIL_HUB_FEATURE_RECURRING_DESCRIPTION',
		availableFromStep: 1,
		valueKey: 'isRecurringEnabled',
		legacyBinding: { name: 'isRecurringEnabled', dataName: 'isRecurringEnabled' },
	},
	{
		id: 'sp-days-before-close',
		sectionId: SpSectionId.Main,
		kind: 'scalar',
		controlType: 'field',
		title: 'CRM_TYPE_DETAIL_FIELD_DAYS_BEFORE_CLOSE',
		availableFromStep: 1,
		valueKey: 'daysBeforeClose',
		legacyBinding: { name: 'daysBeforeClose' },
		field: { inputType: 'number', min: DAYS_BEFORE_CLOSE_MIN, max: DAYS_BEFORE_CLOSE_MAX },
	},
	{
		id: 'sp-card-view',
		sectionId: SpSectionId.Main,
		kind: 'navigation',
		controlType: 'navigation',
		title: 'CRM_TYPE_DETAIL_TAB_FIELDS_MSGVER_1',
		availableFromStep: 2,
		actionKey: 'cardView',
	},

	{
		id: 'sp-categories',
		sectionId: SpSectionId.Features,
		kind: 'scalar',
		controlType: 'toggle',
		title: 'CRM_TYPE_TYPE_IS_CATEGORIES_ENABLED_TITLE',
		availableFromStep: 1,
		valueKey: 'isCategoriesEnabled',
		legacyBinding: { name: 'isCategoriesEnabled', dataName: 'isCategoriesEnabled' },
		disabled: {
			condition: 'isCategoriesControlDisabled',
			reasonSource: 'CRM_TYPE_DETAIL_CATEGORIES_DISABLED_HINT',
		},
		description: 'CRM_TYPE_DETAIL_CATEGORIES_CARD_DESCRIPTION',
	},
	{
		id: 'sp-stages',
		sectionId: SpSectionId.Features,
		kind: 'scalar',
		controlType: 'toggle',
		title: 'CRM_TYPE_TYPE_IS_STAGES_ENABLED_TITLE',
		availableFromStep: 1,
		valueKey: 'isStagesEnabled',
		legacyBinding: { name: 'isStagesEnabled', dataName: 'isStagesEnabled' },
		description: 'CRM_TYPE_DETAIL_STAGES_CARD_DESCRIPTION',
	},
	{
		id: 'sp-automation',
		sectionId: SpSectionId.Features,
		kind: 'scalar',
		controlType: 'toggle',
		title: 'CRM_TYPE_TYPE_IS_AUTOMATION_ENABLED_TITLE',
		availableFromStep: 1,
		valueKey: 'isAutomationEnabled',
		legacyBinding: { name: 'isAutomationEnabled', dataName: 'isAutomationEnabled' },
		description: 'CRM_TYPE_DETAIL_AUTOMATION_CARD_DESCRIPTION',
	},
	{
		id: 'sp-biz-proc',
		sectionId: SpSectionId.Features,
		kind: 'scalar',
		controlType: 'toggle',
		title: 'CRM_TYPE_TYPE_IS_BIZ_PROC_ENABLED_TITLE',
		availableFromStep: 1,
		valueKey: 'isBizProcEnabled',
		legacyBinding: { name: 'isBizProcEnabled', dataName: 'isBizProcEnabled' },
		description: 'CRM_TYPE_DETAIL_BIZ_PROC_CARD_DESCRIPTION',
	},
	{
		id: 'sp-counters',
		sectionId: SpSectionId.Features,
		kind: 'scalar',
		controlType: 'toggle',
		title: 'CRM_TYPE_TYPE_IS_COUNTERS_ENABLED_TITLE_MSGVER_1',
		availableFromStep: 1,
		valueKey: 'isCountersEnabled',
		legacyBinding: { name: 'isCountersEnabled', dataName: 'isCountersEnabled' },
	},
	{
		id: 'sp-recyclebin',
		sectionId: SpSectionId.Features,
		kind: 'scalar',
		controlType: 'toggle',
		title: 'CRM_TYPE_TYPE_IS_RECYCLEBIN_ENABLED_TITLE',
		availableFromStep: 1,
		valueKey: 'isRecyclebinEnabled',
		legacyBinding: { name: 'isRecyclebinEnabled', dataName: 'isRecyclebinEnabled' },
		disabled: {
			condition: 'isRecyclebinControlDisabled',
			reasonSource: 'CRM_TYPE_DETAIL_RECYCLE_DISABLED_HINT',
		},
	},
	{
		id: 'sp-set-open-permissions',
		sectionId: SpSectionId.Features,
		kind: 'scalar',
		controlType: 'toggle',
		title: 'CRM_TYPE_TYPE_IS_SET_OPEN_PERMISSIONS_TITLE',
		availableFromStep: 1,
		valueKey: 'isSetOpenPermissions',
		legacyBinding: { name: 'isSetOpenPermissions', dataName: 'isSetOpenPermissions' },
		description: 'CRM_TYPE_DETAIL_IS_SET_OPEN_PERMISSIONS_DESCRIPTION',
	},

	{
		id: 'sp-client',
		sectionId: SpSectionId.Relations,
		kind: 'scalar',
		controlType: 'toggle',
		title: 'CRM_TYPE_DETAIL_FIELD_CLIENT',
		availableFromStep: 1,
		valueKey: 'isClientEnabled',
		legacyBinding: { name: 'isClientEnabled', dataName: 'isClientEnabled' },
	},
	{
		id: 'sp-relation-parent',
		sectionId: SpSectionId.Relations,
		kind: 'relation',
		controlType: SpControlType.Relation,
		title: 'CRM_TYPE_DETAIL_RELATION_PARENT',
		availableFromStep: 1,
		direction: 'parent',
		source: { availableItemsKey: 'relationsCatalog.parent', selectedItemsKey: 'relations.parent' },
		selector: { entityType: 'crmType', multiple: true },
		adapterKey: 'parentRelation',
		legacyBinding: {
			switcherId: 'crm-type-relation-parent-switcher',
			dataName: 'isRelationParentShowChildrenEnabled',
			dataRole: 'crm-type-relation-parent-items',
		},
	},
	{
		id: 'sp-relation-child',
		sectionId: SpSectionId.Relations,
		kind: 'relation',
		controlType: SpControlType.Relation,
		title: 'CRM_TYPE_DETAIL_RELATION_CHILD',
		availableFromStep: 1,
		direction: 'child',
		source: { availableItemsKey: 'relationsCatalog.child', selectedItemsKey: 'relations.child' },
		selector: { entityType: 'crmType', multiple: true },
		adapterKey: 'childRelation',
		legacyBinding: {
			switcherId: 'crm-type-relation-child-switcher',
			dataName: 'isRelationChildShowChildrenEnabled',
			dataRole: 'crm-type-relation-child-items',
		},
	},
	{
		id: 'sp-use-in-userfield',
		sectionId: SpSectionId.Relations,
		kind: 'scalar',
		controlType: 'toggle',
		title: 'CRM_TYPE_DETAIL_IS_USE_IN_USERFIELD_ENABLED_TITLE',
		availableFromStep: 1,
		valueKey: 'isUseInUserfieldEnabled',
		legacyBinding: { name: 'isUseInUserfieldEnabled', dataName: 'isUseInUserfieldEnabled' },
	},
	{
		id: 'sp-linked-user-fields',
		sectionId: SpSectionId.Relations,
		kind: 'array',
		controlType: SpControlType.LinkedUserFields,
		title: 'CRM_TYPE_DETAIL_TAB_USER_FIELDS_TITLE',
		availableFromStep: 1,
		itemsKey: 'linkedUserFields',
		itemIdKey: 'name',
		itemTitleKey: 'title',
		itemValueKey: 'isEnabled',
	},

	{
		id: 'sp-link-with-products',
		sectionId: SpSectionId.Products,
		kind: 'scalar',
		controlType: 'toggle',
		title: 'CRM_TYPE_TYPE_IS_LINK_WITH_PRODUCTS_ENABLED_TITLE',
		availableFromStep: 1,
		valueKey: 'isLinkWithProductsEnabled',
		legacyBinding: { name: 'isLinkWithProductsEnabled', dataName: 'isLinkWithProductsEnabled' },
	},
	{
		id: 'sp-documents',
		sectionId: SpSectionId.Products,
		kind: 'scalar',
		controlType: 'toggle',
		title: 'CRM_TYPE_TYPE_IS_DOCUMENTS_ENABLED_TITLE',
		availableFromStep: 1,
		valueKey: 'isDocumentsEnabled',
		legacyBinding: { name: 'isDocumentsEnabled', dataName: 'isDocumentsEnabled' },
	},
	{
		id: 'sp-mycompany',
		sectionId: SpSectionId.Products,
		kind: 'scalar',
		controlType: 'toggle',
		title: 'CRM_TYPE_DETAIL_FIELD_MY_COMPANY',
		availableFromStep: 1,
		valueKey: 'isMycompanyEnabled',
		legacyBinding: { name: 'isMycompanyEnabled', dataName: 'isMycompanyEnabled' },
	},

	{
		id: 'sp-permissions',
		sectionId: SpSectionId.Permissions,
		kind: 'navigation',
		controlType: 'navigation',
		title: 'CRM_TYPE_DETAIL_HUB_SECTION_PERMISSIONS',
		availableFromStep: 1,
		actionKey: PERMISSIONS_ACTION,
	},
];
