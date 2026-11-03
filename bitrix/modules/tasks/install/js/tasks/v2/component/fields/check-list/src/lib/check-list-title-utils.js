import { Type } from 'main.core';

import { type CheckListModel } from 'tasks.v2.model.check-list';

/**
 * Splits text into checklist item titles by line break, trimming and dropping empty lines.
 */
export function splitTitles(text: string): string[]
{
	if (!Type.isString(text) || text === '')
	{
		return [];
	}

	return text
		.split(/\r\n|\r|\n/g)
		.map((line: string) => line.trim())
		.filter((line: string) => line !== '');
}

/**
 * Titles not already present, deduped by exact trimmed text (case-sensitive), including within the input.
 */
export function selectFreshTitles(titles: string[], existingTitles: string[]): string[]
{
	const existing = new Set(existingTitles.map((title: string) => title.trim()));

	return titles.filter((title: string) => {
		const normalizedTitle = title.trim();
		if (existing.has(normalizedTitle))
		{
			return false;
		}

		existing.add(normalizedTitle);

		return true;
	});
}

/**
 * sortIndexes to append `count` items after the current max (a missing index counts as 0).
 */
export function computeAppendSortIndexes(existingSortIndexes: Array<?number>, count: number): number[]
{
	const maxSortIndex = existingSortIndexes.reduce(
		(max: number, sortIndex: ?number) => Math.max(max, sortIndex ?? 0),
		-1,
	);

	return Array.from({ length: count }, (unused, index: number) => maxSortIndex + 1 + index);
}

/**
 * Titles across the whole subtree of rootId (nested items included); an excluded item is skipped with its subtree.
 */
export function collectSubtreeTitles(
	checkLists: CheckListModel[],
	rootId: number | string,
	excludedIds: Set<number | string> = new Set(),
): string[]
{
	const titles = [];
	const queue = [rootId];
	const visitedIds = new Set(queue);

	while (queue.length > 0)
	{
		const parentId = queue.shift();

		checkLists.forEach((item: CheckListModel) => {
			if (item.parentId !== parentId || visitedIds.has(item.id) || excludedIds.has(item.id))
			{
				return;
			}

			visitedIds.add(item.id);
			queue.push(item.id);
			titles.push(item.title ?? '');
		});
	}

	return titles;
}
