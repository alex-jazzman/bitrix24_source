import { Type } from 'main.core';

export const TABLE_ALIGNMENTS: string[] = ['left', 'center', 'right'];

export function isTableAlignment(value: mixed): boolean
{
	return Type.isString(value) && TABLE_ALIGNMENTS.includes(value);
}

export function normalizeTableAlignment(value: mixed): string
{
	return isTableAlignment(value) ? value : 'left';
}

export function findTableAtSelection(selection: Object | null): ?{ node: Object, pos: number }
{
	const $position = selection?.$anchorCell ?? selection?.$from;
	if (!$position)
	{
		return null;
	}

	let hasTableCell = Boolean(selection?.$anchorCell);
	for (let depth = $position.depth; depth > 0; depth--)
	{
		const node = $position.node(depth);
		if (node.type.name === 'tableCell' || node.type.name === 'tableHeader')
		{
			hasTableCell = true;
		}

		if (hasTableCell && node.type.name === 'table')
		{
			return {
				node,
				pos: $position.before(depth),
			};
		}
	}

	return null;
}
