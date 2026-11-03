import { Dom } from 'main.core';
import { type Menu } from 'main.popup';

import { getRowActionsMenu } from '../feature/row-actions-menu/row-actions-menu';
import { type GridRow } from '../model/grid/types';

/**
 * The class the checkbox of a row carries on its own input, inherited from the grid of the platform
 * (`row-checkbox.ts:21`, `main.ui.grid/templates/.default/template.php:407`).
 */
const CheckboxClass = 'main-grid-row-checkbox';

type RowRegistry = {
	selectedIds: string[],
};

/** One row of the grid, in the shape the screen takes a row of the platform grid in. */
export class GridRowFacade
{
	#row: GridRow;
	#registry: RowRegistry;
	#container: HTMLElement;

	constructor(row: GridRow, registry: RowRegistry, container: HTMLElement)
	{
		this.#row = row;
		this.#registry = registry;
		this.#container = container;
	}

	/** The screen reads the node both ways, as a field and through the getter (`list.es6.js:1987`). */
	get node(): HTMLElement | null
	{
		return this.#container.querySelector(`tr[data-id="${this.#row.id}"]`);
	}

	getNode(): HTMLElement | null
	{
		return this.node;
	}

	getId(): string
	{
		return this.#row.id;
	}

	/**
	 * The screen reaches for it right after it has added a row of its own, to take the marking of that
	 * row away (`list.es6.js:274`). A row drawn by the application is in the document on the tick
	 * after and answers `null` here, losing nothing by it.
	 */
	getCheckbox(): HTMLInputElement | null
	{
		return this.node?.querySelector(`.${CheckboxClass}`) ?? null;
	}

	/** A row the screen has hidden while it waits for the server is drawn but not shown. */
	isShown(): boolean
	{
		const node = this.node;

		return node !== null && Dom.style(node, 'display') !== 'none';
	}

	/**
	 * The record of the row, in the shape the row of the platform answers it in. Only the mailbox is
	 * ever asked for: the screen refuses by it the actions a move of a mailbox forbids
	 * (`list.es6.js:3592`, `:497`).
	 *
	 * Answered off the record and not off the node the platform reads it off (`row.js:529`): the screen
	 * asks right after it has acted on a row, and a row drawn on the tick after would answer for a
	 * mailbox of none.
	 */
	getDataset(): Record<string, string>
	{
		const row = this.#row;

		return 'mailboxId' in row ? { mailboxId: String(row.mailboxId) } : {};
	}

	isSelected(): boolean
	{
		return this.#registry.selectedIds.includes(this.#row.id);
	}

	/**
	 * The screen asks a row for its menu while that menu is shown, to make sure it exists before it
	 * hides the extra item of an exclusive pair (`user-interface-manager.js:279`). A row whose menu was
	 * never opened answers `null`, the way the platform answers for a row without a button.
	 */
	getActionsMenu(): Menu | null
	{
		return getRowActionsMenu(this.#row.id);
	}
}
