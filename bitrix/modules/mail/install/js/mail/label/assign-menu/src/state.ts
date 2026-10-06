import { type LabelDto } from 'mail.label.core';

export const LABEL_ENTITY_ID = 'mail-label';
export const LABEL_TAB_ID = 'labels';

export type SelectorItem = {
	id: number,
	entityId: string,
	title: string,
	tabs: string[],
	selected: boolean,
};

export function buildSelectorItems(labels: LabelDto[], selectedLabelIds: Set<number>): SelectorItem[]
{
	return labels.map((label: LabelDto): SelectorItem => ({
		id: label.id,
		entityId: LABEL_ENTITY_ID,
		title: label.name,
		tabs: [LABEL_TAB_ID],
		selected: selectedLabelIds.has(label.id),
	}));
}
