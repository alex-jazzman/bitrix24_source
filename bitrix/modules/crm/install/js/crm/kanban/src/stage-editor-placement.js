import { Type } from 'main.core';

function getStageType(stage): string
{
	return stage?.type ?? stage?.TYPE ?? '';
}

export function getStageRealSort(stage): ?number
{
	const sort = parseInt(stage?.real_sort ?? stage?.sort, 10);

	return Type.isNumber(sort) ? sort : null;
}

function getColumnRealSort(columnData): ?number
{
	const sort = parseInt(columnData?.real_sort, 10);

	return Type.isNumber(sort) ? sort : null;
}

export function normalizeStageRealSorts(columns): void
{
	let previousRealSort = null;
	let hasRealSortInversion = false;
	for (const column of columns)
	{
		const data = column.getData();
		if (!Type.isStringFilled(getStageType(data)) || getStageType(data) === 'WIN')
		{
			continue;
		}

		const currentRealSort = getStageRealSort(data);
		if (currentRealSort === null)
		{
			continue;
		}

		if (previousRealSort !== null && currentRealSort < previousRealSort)
		{
			hasRealSortInversion = true;

			break;
		}

		previousRealSort = currentRealSort;
	}

	let realSort = 0;
	for (const column of columns)
	{
		const data = column.getData();
		if (!Type.isStringFilled(getStageType(data)))
		{
			continue;
		}

		const lowerBound = hasRealSortInversion ? 0 : getStageRealSort(data) ?? 0;
		realSort = Math.max(realSort + 10, lowerBound);
		column.setData({
			...data,
			real_sort: realSort,
		});
	}
}

export function getStageTargetColumn(stage, columns, ignoredColumn = null)
{
	if (getStageType(stage) === 'WIN')
	{
		return null;
	}

	const stageSort = getStageRealSort(stage);
	let winColumn = null;
	for (const column of columns)
	{
		if (column === ignoredColumn)
		{
			continue;
		}

		const columnData = column.getData();
		if (getStageType(columnData) === 'WIN')
		{
			winColumn ??= column;

			continue;
		}

		const columnSort = getColumnRealSort(columnData);
		if (stageSort !== null && columnSort !== null && columnSort > stageSort)
		{
			return column;
		}
	}

	return winColumn;
}

export function getStageTargetColumnId(stage, columns, ignoredColumn = null): string | number | undefined
{
	return getStageTargetColumn(stage, columns, ignoredColumn)?.getId();
}
