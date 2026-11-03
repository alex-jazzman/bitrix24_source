import { OrderType } from '../order-type/order-type';

type SortValue = number | string | null;

type SortableItem = {
	id: number | string;
	data: { sort_value?: SortValue };
}

/**
 * Place of a card among the loaded ones of a column in the field sort mode.
 * Mirrors the order of the selection: by the value of the active axis,
 * empty values last, equal values by id ascending.
 */
export class KanbanSortComparator
{
	// the locale of the user is the closest client side match of the collation the selection is ordered by
	static #collator = new Intl.Collator();

	/**
	 * Returns id of the item the card must be placed before, null to the end of the loaded part.
	 * @param {SortableItem[]} items Loaded items of the column.
	 * @param {SortableItem} item Card to place.
	 * @param {?string} direction Sort direction, ascending unless desc is given.
	 * @returns {number | string | null}
	 */
	static findTargetId(items: SortableItem[], item: SortableItem, direction: ?string): number | string | null
	{
		const value = item.data.sort_value;
		if (KanbanSortComparator.#isEmpty(value))
		{
			return null;
		}

		const order = (direction === OrderType.DESC ? -1 : 1);

		for (const candidate of items)
		{
			if (candidate.id === item.id)
			{
				continue;
			}

			const candidateValue = candidate.data.sort_value;
			if (KanbanSortComparator.#isEmpty(candidateValue))
			{
				return candidate.id;
			}

			const compared = KanbanSortComparator.#compare(value, candidateValue) * order;
			if (compared < 0 || (compared === 0 && Number(item.id) < Number(candidate.id)))
			{
				return candidate.id;
			}
		}

		return null;
	}

	static #isEmpty(value: SortValue): boolean
	{
		return (value === null || typeof value === 'undefined');
	}

	static #compare(value: SortValue, candidateValue: SortValue): number
	{
		if (typeof value === 'number' && typeof candidateValue === 'number')
		{
			return value - candidateValue;
		}

		return KanbanSortComparator.#collator.compare(String(value), String(candidateValue));
	}
}
