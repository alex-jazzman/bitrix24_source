import { Dom, Tag, Text, Type } from 'main.core';
import { type BaseEvent } from 'main.core.events';
import { type PopupOptions } from 'main.popup';

import { getAriaMessage } from '../../helpers/aria-message';
import { centerPopupOnTarget } from '../../helpers/center-popup-on-target';
import { BaseDialog } from '../base-dialog';
import './table-dialog.css';

const GRID_ROWS = 10;
const GRID_COLUMNS = 10;
const BOX_SELECTOR = '.ui-text-editor-table-dialog-box';

export type TableDialogOptions = {
	targetNode?: HTMLElement;
	events?: Record<string, (event: BaseEvent) => void>;
};

export class TableDialog extends BaseDialog
{
	#targetNode: HTMLElement | null = null;
	#targetNodeWidth: number = 0;
	#lastSelectedBox: HTMLElement | null = null;
	// the cell reachable with Tab: movement inside the grid goes through the arrow keys
	#rovingBox: HTMLElement | null = null;

	constructor(dialogOptions: TableDialogOptions)
	{
		super('BX.UI.TextEditor.TableDialog', dialogOptions);

		const options: TableDialogOptions = Type.isPlainObject(dialogOptions) ? dialogOptions : {};

		this.setTargetNode(options.targetNode);

		this.subscribe('onShow', (): void => {
			// the grid is sized by its content, so the popup width is only known now
			const popup = this.getPopup();
			centerPopupOnTarget(popup, this.#targetNodeWidth, popup.getPopupContainer().offsetWidth);

			this.#lastSelectedBox = null;
			this.#highlightBoxes(1, 1);
			this.#setRovingBox(this.#getBox(1, 1));
		});

		// onAfterShow runs before the trap activates, and the trap leaves the focus alone once it
		// is already inside — without this the caret would land on the popup itself: nothing is
		// tabbable yet while it is still animating open
		this.subscribe('onAfterShow', (): void => {
			this.#rovingBox?.focus();
		});
	}

	setTargetNode(container?: HTMLElement): void
	{
		if (Type.isElementNode(container))
		{
			this.#targetNode = container;
		}
	}

	getTargetNode(): HTMLElement | null
	{
		return this.#targetNode;
	}

	getPopupOptions(): PopupOptions
	{
		// measured while the popup is being built, the way the centering below expects it: the
		// target is the toolbar button that opened the dialog and it keeps its width
		this.#targetNodeWidth = this.getTargetNode()!.getBoundingClientRect().width;

		return {
			ariaLabel: getAriaMessage('TEXT_EDITOR_DIALOG_TABLE_ARIA') ?? undefined,
			bindElement: this.getTargetNode() ?? undefined,
			content: Tag.render`
				<div class="ui-text-editor-table-dialog" onclick="${this.#handleClick.bind(this)}">
					${this.getGridContainer()}
					${this.getCaptionContainer()}
				</div>
			`,
		};
	}

	/**
	 * The size picker is a WAI-ARIA grid: cells are laid out in rows, the arrow keys move between
	 * them and exactly one of them takes part in the tab order (roving tabindex). Insertion runs on
	 * the button's native click, so Enter and Space work on their own.
	 *
	 * The cell role goes on a wrapper rather than on the button: `gridcell` is not among the roles
	 * HTML-ARIA allows on `button`, and the wrapper keeps the button a button.
	 */
	getGridContainer(): HTMLElement
	{
		return this.getRefs().remember('grid', () => {
			const rows = [];
			for (let row = 1; row <= GRID_ROWS; row++)
			{
				const cells = [];
				for (let column = 1; column <= GRID_COLUMNS; column++)
				{
					const isFirst = row === 1 && column === 1;

					const box: HTMLElement = Tag.render`
						<button
							type="button"
							class="ui-text-editor-table-dialog-box"
							tabindex="${isFirst ? '0' : '-1'}"
							data-column="${column}"
							data-row="${row}"
						></button>
					`;

					Dom.attr(box, 'aria-label', this.#getBoxLabel(row, column));

					cells.push(Tag.render`
						<div class="ui-text-editor-table-dialog-cell" role="gridcell" aria-selected="false">
							${box}
						</div>
					`);
				}

				rows.push(Tag.render`
					<div class="ui-text-editor-table-dialog-row" role="row">${cells}</div>
				`);
			}

			const grid: HTMLElement = Tag.render`
				<div
					class="ui-text-editor-table-dialog-grid"
					role="grid"
					onmousemove="${this.#handleMouseMove.bind(this)}"
					onkeydown="${this.#handleKeyDown.bind(this)}"
				>${rows}</div>
			`;

			Dom.attr(grid, 'aria-label', getAriaMessage('TEXT_EDITOR_DIALOG_TABLE_ARIA'));

			return grid;
		});
	}

	/**
	 * The caption shows the current size ("3 x 4") and changes as the pointer or the caret moves.
	 * For a screen reader it is the only feedback there is, hence the live region.
	 */
	getCaptionContainer(): HTMLElement
	{
		return this.getRefs().remember('caption', () => {
			return Tag.render`<div class="ui-text-editor-table-dialog-caption" role="status"></div>`;
		});
	}

	#handleMouseMove(event: MouseEvent)
	{
		if (Dom.hasClass(event.target, 'ui-text-editor-table-dialog-box'))
		{
			this.#selectBox(event.target as HTMLElement);
		}
	}

	#handleKeyDown(event: KeyboardEvent)
	{
		const box = (event.target as HTMLElement).closest(BOX_SELECTOR) as HTMLElement | null;
		if (box === null)
		{
			return;
		}

		const row = Text.toNumber(box.dataset.row);
		const column = Text.toNumber(box.dataset.column);
		let nextRow = row;
		let nextColumn = column;

		switch (event.key)
		{
			case 'ArrowRight':
				nextColumn = Math.min(column + 1, GRID_COLUMNS);
				break;
			case 'ArrowLeft':
				nextColumn = Math.max(column - 1, 1);
				break;
			case 'ArrowDown':
				nextRow = Math.min(row + 1, GRID_ROWS);
				break;
			case 'ArrowUp':
				nextRow = Math.max(row - 1, 1);
				break;
			case 'Home':
				nextColumn = 1;
				nextRow = event.ctrlKey ? 1 : row;
				break;
			case 'End':
				nextColumn = GRID_COLUMNS;
				nextRow = event.ctrlKey ? GRID_ROWS : row;
				break;
			default:
				return;
		}

		event.preventDefault();
		this.#focusBox(nextRow, nextColumn);
	}

	#handleClick(event: MouseEvent)
	{
		// a click can arrive with no mousemove before it (touch, Enter on a cell), so the target of
		// the click outranks the last highlighted cell
		const clickedBox = (event.target as HTMLElement).closest(BOX_SELECTOR) as HTMLElement | null;
		const selectedBox = clickedBox ?? this.#lastSelectedBox;
		if (selectedBox)
		{
			const { row, column } = selectedBox.dataset;
			this.emit('onSelect', { rows: row, columns: column });
		}
	}

	#getBoxes(): HTMLElement[]
	{
		return [...this.getGridContainer().querySelectorAll(BOX_SELECTOR)] as HTMLElement[];
	}

	#getBox(row: number, column: number): HTMLElement | null
	{
		return this.getGridContainer().querySelector(`[data-row="${row}"][data-column="${column}"]`);
	}

	#getBoxLabel(rows: number, columns: number): string | null
	{
		return getAriaMessage('TEXT_EDITOR_TABLE_SIZE_ARIA', {
			'#ROWS#': String(rows),
			'#COLUMNS#': String(columns),
		});
	}

	#focusBox(row: number, column: number): void
	{
		const box = this.#getBox(row, column);
		if (box === null)
		{
			return;
		}

		this.#setRovingBox(box);
		this.#selectBox(box);
		box.focus();
	}

	#setRovingBox(box: HTMLElement | null): void
	{
		if (box === null || this.#rovingBox === box)
		{
			return;
		}

		if (this.#rovingBox !== null)
		{
			Dom.attr(this.#rovingBox, 'tabindex', '-1');
		}

		Dom.attr(box, 'tabindex', '0');
		this.#rovingBox = box;
	}

	#selectBox(box: HTMLElement): void
	{
		if (this.#lastSelectedBox === box)
		{
			return;
		}

		this.#lastSelectedBox = box;
		this.#highlightBoxes(Text.toNumber(box.dataset.row), Text.toNumber(box.dataset.column));
	}

	#highlightBoxes(rows: number, columns: number)
	{
		let index = 0;
		for (const box of this.#getBoxes())
		{
			const boxRow = Math.floor(index / GRID_COLUMNS);
			const boxColumn = index % GRID_COLUMNS;
			const selected = boxRow < rows && boxColumn < columns;
			if (selected)
			{
				Dom.addClass(box, '--selected');
			}
			else
			{
				Dom.removeClass(box, '--selected');
			}

			// aria-selected belongs to the cell, the button only carries the name
			Dom.attr(box.parentElement, 'aria-selected', selected ? 'true' : 'false');

			index++;
		}

		this.getCaptionContainer().textContent = rows && columns ? `${rows} x ${columns}` : '';
	}
}
