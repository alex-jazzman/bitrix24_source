import { Type, Text } from 'main.core';
import { type ItemNode } from './item-node';

export class ItemNodeComparator
{
	static makeMultipleComparator(order: { [key: string]: 'asc' | 'desc' })
	{
		const props = Object.keys(order).map((property) => `get${Text.capitalize(property)}`);

		/*
		asc *
		asc nulls last *
		asc nulls first

		desc *
		desc nulls first *
		desc nulls last
		*/

		const directions: Array<{ ascOrdering: boolean, nullsOrdering: boolean }> = [];

		Object.values(order).forEach((element) => {
			const direction = element.toLowerCase().trim();

			// Default sorting: 'asc' || 'asc nulls last'
			let ascOrdering = true;
			let nullsOrdering = true;

			switch (direction)
			{
				case 'desc':
				case 'desc nulls first':
				{
					ascOrdering = false;

					break;
				}

				case 'asc nulls first':
				{
					nullsOrdering = false;

					break;
				}

				case 'desc nulls last':
				{
					ascOrdering = false;
					nullsOrdering = false;

					break;
				}

				default:
					// No default
			}

			directions.push({ ascOrdering, nullsOrdering });
		});

		const numberOfProperties = props.length;

		return (nodeA: ItemNode, nodeB: ItemNode) => {
			let i = 0;
			let result = 0;

			while (result === 0 && i < numberOfProperties)
			{
				const propertyGetter = props[i];
				const direction = directions[i];

				result = this.compareItemNodes(
					nodeA,
					nodeB,
					propertyGetter,
					direction.ascOrdering,
					direction.nullsOrdering,
				);

				i += 1;
			}

			return result;
		};
	}

	static compareItemNodes(
		nodeA: ItemNode,
		nodeB: ItemNode,
		propertyGetter: string,
		ascOrdering: boolean,
		nullsOrdering: boolean,
	)
	{
		const itemA = nodeA.getItem();
		const itemB = nodeB.getItem();

		const valueA = (itemA as unknown as Record<string, () => string | number | null>)[propertyGetter]();
		const valueB = (itemB as unknown as Record<string, () => string | number | null>)[propertyGetter]();

		let result = 0;

		if (valueA !== null && valueB === null)
		{
			result = nullsOrdering ? -1 : 1;
		}
		else if (valueA === null && valueB !== null)
		{
			result = nullsOrdering ? 1 : -1;
		}
		else if (valueA === null && valueB === null)
		{
			result = ascOrdering ? -1 : 1;
		}
		else if (Type.isString(valueA))
		{
			result = (valueA as string).localeCompare(valueB as string);
		}
		else
		{
			result = (valueA as number) - (valueB as number);
		}

		const sortOrder = ascOrdering ? 1 : -1;

		return result * sortOrder;
	}
}
