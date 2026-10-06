import { Item } from './item';

export function isItem(item: unknown): item is Item
{
	return item instanceof Item;
}
