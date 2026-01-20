import { DRAG_ITEM_SLOT_NAMES } from '../constants';

export type GetDragItemSlotName = (itemType: string) => string;

export function getDragItemSlotName(itemType: string): string
{
	return DRAG_ITEM_SLOT_NAMES?.[itemType] ?? DRAG_ITEM_SLOT_NAMES.default;
}
