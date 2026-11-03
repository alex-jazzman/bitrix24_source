// Heading above a group of relation sub-options. It names the CARD the artifacts of the group appear
// in, instead of describing it: "В лиде" and "В „Обработка документов“" instead of "В карточке
// связанной сущности" and "В карточке процесса" (PM, 2026-09-01).
//
// Which card is which is read off the option kind, not guessed:
//   parent-field          — a field in THIS process's element card, holding the CRM element;
//   parent-children-list  — a tab in the CRM entity's card, listing this process's elements;
//   child-field           — a field in the CRM entity's card, holding this process's element;
//   child-children-list   — a tab in THIS process's card, listing CRM entity elements.
// So the "process" group is the process's own card and the "entity" group is the other side's.
//
// A name cannot be declined, and only the fixed CRM core types have a hand-written prepositional
// form. Everything else — smart processes, and the process itself — is quoted in the nominative,
// which is the same trick the mockup uses for "В „Обработка документов“".

export type RelationGroupTitle = {
	// Phrase code; carries #TITLE# when `title` is filled.
	code: string;
	// Value for #TITLE#; empty when the phrase names the entity by itself.
	title: string;
};

// Prepositional form per CRM core entity type id. Contact and company are absent on purpose: they
// are never rows of their own, their options belong to the client row, which carries its own
// heading.
const PREPOSITIONAL_BY_ENTITY_TYPE: Record<number, string> = Object.freeze({
	1: 'CRM_TYPE_DETAIL_HUB_RELATION_GROUP_IN_LEAD',
	2: 'CRM_TYPE_DETAIL_HUB_RELATION_GROUP_IN_DEAL',
	7: 'CRM_TYPE_DETAIL_HUB_RELATION_GROUP_IN_QUOTE',
	14: 'CRM_TYPE_DETAIL_HUB_RELATION_GROUP_IN_ORDER',
	31: 'CRM_TYPE_DETAIL_HUB_RELATION_GROUP_IN_INVOICE',
});

const NAMED = 'CRM_TYPE_DETAIL_HUB_RELATION_GROUP_IN_NAMED';

export function resolveRelationGroupTitle(
	// The group's own key, as produced by groupRelationOptions: the phrase code of the old, generic
	// heading. Only two exist, and they are exactly the two sides of the relation.
	groupKey: string,
	// Title of the row: the CRM entity or the other smart process.
	rowTitle: string,
	// Entity type id of the row; 0 when unknown.
	entityTypeId: number,
	// Name of the process being configured.
	processTitle: string,
): RelationGroupTitle
{
	if (groupKey === 'CRM_TYPE_DETAIL_HUB_RELATION_GROUP_PROCESS')
	{
		return { code: NAMED, title: processTitle };
	}

	const prepositional = PREPOSITIONAL_BY_ENTITY_TYPE[entityTypeId];

	return prepositional
		? { code: prepositional, title: '' }
		: { code: NAMED, title: rowTitle };
}
