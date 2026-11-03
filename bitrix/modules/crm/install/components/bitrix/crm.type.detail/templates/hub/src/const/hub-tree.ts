import { type HubSectionDescriptor } from 'crm.settings-hub';

// Section ids of the recomposed tree (spec 2026-08-31). The old ids stay in descriptor.ts
// (SpSectionId), untouched: the module option picks between the two lists at runtime, so both have
// to exist side by side and neither may be edited into the other.
export const HubTreeSectionId = Object.freeze({
	// Not a menu item: the three passport records are lifted into the shell header and are shown
	// above every section, including the two the recomposition does not touch.
	Passport: 'passport',
	Card: 'card',
	Process: 'process',
	Automation: 'automation',
	Products: 'products',
	Relations: 'relations',
	Permissions: 'permissions',
});

// The header records. No section renders them — CrmTypeHubPassport does, from the full record list,
// which is why "no section holds them" is not a leak (see hub-tree.test.ts).
//
// sp-custom-section is one of them again: the mockup of 2026-09-01 removes the "Расположение" card
// and puts the placement back into the passport as a dropdown button. The card was read off the
// earlier mockup, which showed the passport without it on the second screen — that reading was right
// about the card and is now simply obsolete.
export const PASSPORT_RECORD_IDS: string[] = ['sp-title', 'sp-description', 'sp-custom-section'];

// New sectionId per record id. A record absent from the map keeps the sectionId of the descriptor:
// that is exactly "Связи", "Права доступа" and "Товары и документы", left alone by the PM.
export const HUB_TREE_SECTION_BY_RECORD: Record<string, string> = {
	'sp-title': HubTreeSectionId.Passport,
	'sp-description': HubTreeSectionId.Passport,
	'sp-custom-section': HubTreeSectionId.Passport,

	'sp-card-view': HubTreeSectionId.Card,
	'sp-begin-close-dates': HubTreeSectionId.Card,
	'sp-days-before-close': HubTreeSectionId.Card,
	'sp-observers': HubTreeSectionId.Card,
	'sp-source': HubTreeSectionId.Card,
	// Moves out of "Возможности": counters are a column of the item list and of its card.
	'sp-counters': HubTreeSectionId.Card,
	// Уезжает из «Связей» (?-04, D-59): sp-client — это скаляр isClientEnabled, то есть поле
	// «Клиент» в карточке элемента, а не связь. Связи с контактом и компанией остались в разделе
	// «Связи» и стоят там отдельными строками дерева.
	'sp-client': HubTreeSectionId.Card,

	'sp-stages': HubTreeSectionId.Process,
	'sp-categories': HubTreeSectionId.Process,
	// Not a permission of the process but the behaviour of CREATING a funnel ("Права доступа при
	// создании воронки"), so it belongs next to the funnels — and the "Права доступа" section itself
	// stays untouched, exactly as the PM required.
	'sp-set-open-permissions': HubTreeSectionId.Process,
	'sp-recyclebin': HubTreeSectionId.Process,

	'sp-automation': HubTreeSectionId.Automation,
	'sp-biz-proc': HubTreeSectionId.Automation,
	// Not a field of the card: the process creates copies of an item on a schedule. That is a robot,
	// and in the old tree it sat among the card fields, which is what misled the reader.
	'sp-recurring': HubTreeSectionId.Automation,
};

// Menu of the recomposed tree: four sections in scope plus the two left alone. Order and labels come
// from the Figma of the wizard, mirrored in template.php — "Связи" sit third and "Автоматизация"
// fifth, which is NOT the order D-26 shipped. "Связи по порталу" carries its own phrase code so the
// legacy tree keeps saying "Связи".
export const HUB_TREE_SECTIONS: HubSectionDescriptor[] = [
	{ id: HubTreeSectionId.Card, title: 'CRM_TYPE_DETAIL_HUB_SECTION_CARD', hideTitle: true },
	{ id: HubTreeSectionId.Process, title: 'CRM_TYPE_DETAIL_HUB_SECTION_PROCESS', hideTitle: true },
	{ id: HubTreeSectionId.Relations, title: 'CRM_TYPE_DETAIL_HUB_SECTION_RELATIONS_V2', hideTitle: true },
	{ id: HubTreeSectionId.Products, title: 'CRM_TYPE_DETAIL_HUB_SECTION_PRODUCTS', hideTitle: true },
	{ id: HubTreeSectionId.Automation, title: 'CRM_TYPE_DETAIL_HUB_SECTION_AUTOMATION', hideTitle: true },
	{ id: HubTreeSectionId.Permissions, title: 'CRM_TYPE_DETAIL_HUB_SECTION_PERMISSIONS', hideTitle: true },
];

// activeTabId -> section of the new tree, mirrored in template.php. Recomputed from the TAB, never
// translated from the old section: the prod "fields" tab used to open "Возможности", and its content
// now lives in "Карточка процесса" — translating section to section would send it to "Процесс".
export const HUB_TREE_SECTION_BY_TAB: Record<string, string> = {
	common: HubTreeSectionId.Card,
	fields: HubTreeSectionId.Card,
	'custom-section': HubTreeSectionId.Card,
	relation: HubTreeSectionId.Relations,
	'user-fields': HubTreeSectionId.Relations,
};

export const HUB_TREE_DEFAULT_SECTION_ID: string = HubTreeSectionId.Card;
