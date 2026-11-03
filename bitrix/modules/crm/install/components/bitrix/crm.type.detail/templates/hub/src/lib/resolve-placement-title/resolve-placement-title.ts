import { type CustomSectionEntry } from '../../model/type-hub-store';

// Title of the workplace the type is placed in, or null when it is placed nowhere.
// Resolved from customSectionId - what the save payload carries - and not from the isSelected flags of
// the list, which the control recomputes only when its inline editor saves. Ids travel as numbers from
// the server and as `new_<random>` strings from the inline editor, so they are compared as strings.
export function resolvePlacementTitle(
	sections: CustomSectionEntry[],
	customSectionId: number | string | null | undefined,
): string | null
{
	const currentId = String(customSectionId ?? 0);
	if (currentId === '0' || currentId === '')
	{
		return null;
	}

	const selected = sections.find((section) => String(section.id) === currentId);

	return selected?.title ?? null;
}

export type PlacementButtonLabel = {
	// Phrase code shown when `title` is empty; empty when the workplace names itself.
	code: string;
	// Name of the workplace, shown as is; empty when there is none.
	title: string;
};

// Label of the placement button of the passport (wizard mockup 432:99411). The button carries the
// name of the workplace and nothing else — "Отдел выпуска", not "Цифровое рабочее место: Отдел
// выпуска": the passport already says what it is about, and the long form does not fit a button.
//
// The empty case is NOT an empty button. A type in no workplace is not unplaced, it sits in CRM, and
// the button says so (PM, 2026-08-25, confirmed 2026-09-01) — the same model the product already
// uses, since BI reports a type with no CUSTOM_SECTION_ID as "CRM" (DynamicTypeMapping).
//
// Split from the component on purpose: components that import a value from crm.settings-hub cannot
// be unit-tested in this template's harness (D-23), so the decision lives here where it can be.
export function resolvePlacementButtonLabel(placementTitle: string | null): PlacementButtonLabel
{
	return placementTitle === null
		? { code: 'CRM_TYPE_DETAIL_HUB_LOCATION_CRM', title: '' }
		: { code: '', title: placementTitle };
}
