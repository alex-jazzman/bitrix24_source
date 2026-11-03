import { shownRows } from '../feature/hide-rows/hide-rows';
import { type GridRow } from '../model/grid/types';
import { GridRowFacade } from './grid-row-facade';

type RowsRegistry = {
	rows: GridRow[],
	hiddenIds: string[],
	selectedIds: string[],
	selectedRows: GridRow[],
};

type SelectionOwner = {
	clearSelection(): void,
};

/** The rows of the grid as a collection, the shape `getRows()` of the platform grid answers in. */
export class GridRowsFacade
{
	#registry: RowsRegistry;
	#grid: SelectionOwner;
	#container: HTMLElement;

	constructor(registry: RowsRegistry, grid: SelectionOwner, container: HTMLElement)
	{
		this.#registry = registry;
		this.#grid = grid;
		this.#container = container;
	}

	/** Counted the way the grid of the platform counted it: a row that is not shown is not displayed. */
	getCountDisplayed(): number
	{
		return shownRows(this.#registry).length;
	}

	/**
	 * Every row of the table, hidden ones included - the collection the platform grid answered with
	 * (`rows.js:330`), where `isShown()` was the business of whoever asked. The screen walks it to mark
	 * the whole folder read (`list.es6.js:3372`).
	 */
	getBodyChild(): GridRowFacade[]
	{
		return this.#registry.rows.map(
			(row: GridRow): GridRowFacade => new GridRowFacade(row, this.#registry, this.#container),
		);
	}

	getSelectedIds(): string[]
	{
		return [...this.#registry.selectedIds];
	}

	getSelected(): GridRowFacade[]
	{
		return this.#registry.selectedRows.map(
			(row: GridRow): GridRowFacade => new GridRowFacade(row, this.#registry, this.#container),
		);
	}

	/** `null` for a row the list does not hold, the way the platform grid answers for one. */
	getById(id: string): GridRowFacade | null
	{
		const row = this.#registry.rows.find((candidate: GridRow): boolean => candidate.id === id);

		return row ? new GridRowFacade(row, this.#registry, this.#container) : null;
	}

	/**
	 * Drops the selection of this grid without a word about it: the screen says the word itself beside
	 * this call, and for the list of drafts it says nothing at all (`list.es6.js:277`).
	 */
	unselectAll(): void
	{
		this.#grid.clearSelection();
	}
}
