import { type RelationRow } from '../relation-rows/relation-rows';

export type DialogItem = {
	id: number | string;
	entityId: string;
	title: string;
	tabs: string;
};

// Item list for the "Другие смарт-процессы" entity-selector dialog (task-9b-brief.md), split the way
// relation-control.ts's buildSelectors splits unselectedTypes/selectedTypes, not the way
// custom-section-control.ts's initSelector builds its single item list: that dialog is multiple: false,
// where one list carrying every row (selected included) is fine, but this dialog is multiple: true —
// a row in both `items` and `selectedItems` there rendered as two rows (one checked, one not), so a row
// belongs in exactly one of the two lists here. No onClick/onToggle here, unlike the BMenu items this
// replaces: relations-section.ts wires the actual (de)selection through the dialog's own
// Item:onSelect/Item:onDeselect events, so this helper only shapes the static item list.
export function buildSmartProcessDialogItems(
	rows: RelationRow[],
): { items: DialogItem[], selectedItems: DialogItem[] }
{
	const items: DialogItem[] = [];
	const selectedItems: DialogItem[] = [];

	rows.forEach((row) => {
		const item: DialogItem = {
			id: row.entityTypeId,
			entityId: 'crmType',
			title: row.title,
			tabs: 'recents',
		};

		(row.checked ? selectedItems : items).push(item);
	});

	return { items, selectedItems };
}
