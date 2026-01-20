import { Dom } from 'main.core';
import type { GridColumns, GridRowAction, AddRowOptions } from './types';

export class RowHelper
{
	#grid: BX.Main.grid;

	constructor(grid: ?BX.Main.grid)
	{
		this.#grid = grid;
	}

	setGrid(grid: BX.Main.grid)
	{
		this.#grid = grid;
	}

	static prepareNewRowParams(
		columns: GridColumns,
		rowActions: GridRowAction[],
	): AddRowOptions
	{
		return {
			id: columns?.ID,
			columns,
			actions: rowActions,
			prepend: true,
			animation: true,
		};
	}

	getByTemplateId(templateId: string | number): ?BX.Grid.Row
	{
		const rowsCollectionWrapper: BX.Grid.Rows = this.#grid?.getRows();

		return rowsCollectionWrapper?.getById(templateId);
	}

	markAsLoading(row: BX.Grid.Row): void
	{
		if (!row)
		{
			return;
		}

		row.stateLoad();
	}

	markAsLoaded(row)
	{
		if (!row)
		{
			return;
		}

		row.stateUnload();
	}

	addToGrid(addRowOptions: AddRowOptions): void
	{
		this.#grid?.getRealtime()?.addRow(addRowOptions);
	}

	update(
		row: BX.Grid.Row,
		updateColumns: GridColumns,
	): void
	{
		if (!row)
		{
			return;
		}

		row.setCellsContent(updateColumns);
	}

	highlight(row: BX.Grid.Row): void
	{
		if (!row)
		{
			return;
		}

		Dom.addClass(row.getNode(), 'ai-agents-grid-row-highlighted');
		setTimeout(() => {
			Dom.removeClass(row, 'ai-agents-grid-row-highlighted');
		}, 2500);
	}
}
