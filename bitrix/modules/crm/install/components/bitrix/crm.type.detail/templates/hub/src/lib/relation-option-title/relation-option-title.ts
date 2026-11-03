import { type RelationOption } from '../relation-rows/relation-rows';
import { RELATION_OPTION_PHRASE, RELATION_PARENT_FIELD_TITLE } from '../../const/relations-layout';

export type RelationOptionTitle = {
	// Phrase code; carries #TITLE# when `title` is filled.
	code: string;
	// Value for #TITLE#; empty when the phrase names the entity by itself.
	title: string;
};

// Caption of one sub-option chip.
//
// Every chip names what its artifact holds. Parent-field and child-children-list hold the OTHER side,
// so they name the row's entity; the remaining kinds hold THIS process, so they name the process.
// Calling either side "связанный элемент" or "элемент процесса"
// made the chip refuse to say which entity it meant — while the row header right above it said so
// plainly (PM; asked for in D-28, deferred there).
//
// Shaped exactly like resolveRelationGroupTitle, and for the same reason: a hand-written form exists
// only for the fixed CRM core types, and everything else — other smart processes — cannot be
// declined at all, so it is quoted in the nominative instead.
export function resolveRelationOptionTitle(
	option: RelationOption,
	rowTitle: string,
	processTitle: string,
): RelationOptionTitle
{
	if (option.direction === 'parent' && option.kind === 'field')
	{
		const instrumental = RELATION_PARENT_FIELD_TITLE[option.entityTypeId];

		return instrumental
			? { code: instrumental, title: '' }
			: { code: RELATION_OPTION_PHRASE['parent-field'], title: rowTitle };
	}

	if (option.direction === 'child' && option.kind === 'children-list')
	{
		return {
			code: RELATION_OPTION_PHRASE['parent-children-list'],
			title: rowTitle,
		};
	}

	// The remaining two kinds sit in the CRM entity's card and both hold THIS process, so both name it,
	// and the row's entity must never leak in — a "Вкладка со сделкой" would be plainly false, the tab
	// lists process elements. A process name cannot be declined, so it is quoted, which is the same
	// fallback the parent-field branch above takes for the same reason.
	return {
		code: RELATION_OPTION_PHRASE[`${option.direction}-${option.kind}`] ?? '',
		title: processTitle,
	};
}
