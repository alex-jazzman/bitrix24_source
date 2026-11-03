import { type HubSectionDescriptor, type SettingsRecord } from 'crm.settings-hub';

// Form-specific control types for the CRM (automated solution) hub. The kit renders scalar/navigation
// controls itself; these are supplied by the form through the ControlRenderer `controls` map.
// Plain string literals keep this module free of any kit runtime dependency, so it stays importable in
// the bare unit harness (only the types above are imported, and type imports are erased).
export const CrmControlType = Object.freeze({
	Types: 'types',
	Vibe: 'vibe',
});

// Section slugs: main, types, vibe. The prod tab `common` maps to `main`
// (the reload flow uses activeTabId=types), mirrored in template.php and app.ts.
export const CrmSectionId = Object.freeze({
	Main: 'main',
	Types: 'types',
	Vibe: 'vibe',
});

// Menu / section tree of the CRM hub (Main, Smart processes, Home page).
export const CRM_HUB_SECTIONS: HubSectionDescriptor[] = [
	{ id: CrmSectionId.Main, title: 'CRM_AUTOMATED_SOLUTION_DETAILS_TAB_COMMON' },
	{ id: CrmSectionId.Types, title: 'CRM_AUTOMATED_SOLUTION_DETAILS_TAB_TYPES' },
	{ id: CrmSectionId.Vibe, title: 'CRM_AUTOMATED_SOLUTION_DETAILS_HUB_SECTION_VIBE' },
];

// Only the title renders through the shell's #passport slot (CrmHubPassportCard); the app filters it out
// of the shell records. The section address renders as a read-only text control inside the settings
// section; the passport subtitle carries the workplace description instead.
export const PASSPORT_RECORD_IDS: string[] = ['crm-title'];

// CRM hub descriptor: one declarative record per CRM row, keyed to the
// camelCase keys of the Vuex-state snapshot. Description has availableFromStep 2, seeded and hidden.
export const CRM_HUB_RECORDS: SettingsRecord[] = [
	{
		// Title (TITLE). Rendered by the passport card (title input, v-model -> setTitle).
		id: 'crm-title',
		sectionId: CrmSectionId.Main,
		kind: 'scalar',
		controlType: 'field',
		title: 'CRM_AUTOMATED_SOLUTION_DETAILS_FIELD_LABEL_TITLE',
		availableFromStep: 1,
		valueKey: 'title',
		legacyBinding: { name: 'title' },
	},
	{
		// Section address (read-only): declarative row rendered
		// by the kit text control in the settings section. Bound to the same Vuex-state key; kept in the
		// seed as every row is a descriptor entry.
		id: 'crm-section-address',
		sectionId: CrmSectionId.Main,
		kind: 'scalar',
		controlType: 'text',
		title: 'CRM_AUTOMATED_SOLUTION_DETAILS_HUB_SECTION_ADDRESS',
		availableFromStep: 1,
		valueKey: 'intranetCustomSectionId',
		legacyBinding: { name: 'intranetCustomSectionId' },
	},
	{
		// Description - the new DESCRIPTION field. Seeded now, hidden until SUPPLY_STEP rises.
		id: 'crm-description',
		sectionId: CrmSectionId.Main,
		kind: 'scalar',
		controlType: 'field',
		title: 'CRM_AUTOMATED_SOLUTION_DETAILS_HUB_DESCRIPTION',
		availableFromStep: 2,
		valueKey: 'description',
		legacyBinding: { name: 'description' },
	},

	{
		// Smart-process linking (TYPE_IDS): one row per linked process, its switch being the link
		// itself (D-14). Rendered by the form control CrmHubCrmTypesControl, which reads/writes the
		// Vuex store directly.
		id: 'crm-types',
		sectionId: CrmSectionId.Types,
		kind: 'relation',
		controlType: CrmControlType.Types,
		title: 'CRM_AUTOMATED_SOLUTION_DETAILS_HUB_SECTION_TYPES',
		availableFromStep: 1,
		source: { selectedItemsKey: 'automatedSolution.typeIds' },
		selector: { entityType: 'dynamic_type', multiple: true },
		adapterKey: 'types',
		legacyBinding: { name: 'typeIds' },
	},

	{
		// Home page switch (IS_VIBE_ENABLED) with the page settings under it. Rendered by the form control
		// CrmHubCrmVibeSection; its update event carries this valueKey to setIsVibeEnabled.
		id: 'crm-vibe',
		sectionId: CrmSectionId.Vibe,
		kind: 'scalar',
		controlType: CrmControlType.Vibe,
		title: 'CRM_AUTOMATED_SOLUTION_DETAILS_HUB_SECTION_VIBE',
		availableFromStep: 1,
		valueKey: 'isVibeEnabled',
		legacyBinding: { name: 'isVibeEnabled' },
	},
];
