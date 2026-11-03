import { Type } from 'main.core';

import { GridColumn, UndoSendRowIdPrefix } from '../../const';
import { type ProjectionRow } from '../../model/grid/types';

/**
 * The registry arrives as an argument for the same reason the rest of the scenarios take one: two
 * grids share the screen, and the one that started last owns the global resolution.
 */
export type ProjectionRegistry = {
	projections: ProjectionRow[],
	addProjection(row: ProjectionRow, prepend: boolean): void,
	dropProjection(id: string): void,
};

/**
 * A row the screen hands over ready, in the shape the grid of the platform took one
 * (`realtime.js:45`). The screen names the row, gives the contents of three cells and always puts
 * it in front of the loaded ones (`list.es6.js:264`).
 */
export type RealtimeRowOptions = {
	id?: unknown,
	columns?: Record<string, HTMLElement | string>,
	prepend?: boolean,
	append?: boolean,
};

/** The word about a send called off, in the shape the notification says it (`undo-send-notification.ts:308`). */
export type UndoSendCancelledData = {
	operation?: { operationId?: unknown },
};

/** Classes of the cells the screen builds, where the words of the row are (`list.es6.js:243`). */
const ScreenCellClass = Object.freeze({
	Sender: '.mail-msg-from-title',
	Subject: '.mail-msg-list-subject',
	Status: '.mail-undo-send-pending-status',
} as const);

/** Marks the screen hangs on the cell of the subject, and reads the row back by (`list.es6.js:256`). */
const ScreenMarker = Object.freeze({
	OperationId: '[data-undo-send-id]',
	RefreshAt: '[data-undo-send-refresh-at]',
} as const);

/**
 * The screen writes the word of the status after a dash of its own (`list.es6.js:250`), while the
 * record keeps the word alone - the row draws the dash itself.
 */
const LeadingSeparator = /^[\s\u00A0]*[\u2014\u2013-]?[\s\u00A0]*/u;

function textOf(cell: HTMLElement | string | undefined, selector: string = ''): string
{
	if (!Type.isDomNode(cell))
	{
		return Type.isString(cell) ? cell.trim() : '';
	}

	const inner = selector === '' ? null : cell.querySelector(selector);

	return (inner?.textContent ?? cell.textContent ?? '').trim();
}

function numberOf(cell: HTMLElement | string | undefined, marker: string, attribute: string): number
{
	if (!Type.isDomNode(cell))
	{
		return 0;
	}

	const marked = cell.matches(marker) ? cell : cell.querySelector(marker);
	const value = Number(marked?.getAttribute(attribute));

	return Number.isFinite(value) ? value : 0;
}

/**
 * The row the screen built, read into the record the page brings for the same send. The screen hands
 * over nodes rather than data (`list.es6.js:264`), so the words of the row are taken out of the cells
 * it named - including, on the cell of the subject, the number of the send and the moment the screen
 * comes back for the list at.
 */
function fromScreenCells(id: string, columns: Record<string, HTMLElement | string>): ProjectionRow
{
	const subjectCell = columns[GridColumn.Subject];
	const operationId = numberOf(subjectCell, ScreenMarker.OperationId, 'data-undo-send-id');

	return {
		id,
		operationId: operationId > 0 ? operationId : Number(id.slice(UndoSendRowIdPrefix.length)) || 0,
		sender: textOf(columns[GridColumn.From], ScreenCellClass.Sender),
		subject: textOf(subjectCell, ScreenCellClass.Subject),
		status: textOf(subjectCell, ScreenCellClass.Status).replace(LeadingSeparator, ''),
		date: { short: textOf(columns[GridColumn.Date]), title: '' },
		refreshAt: numberOf(subjectCell, ScreenMarker.RefreshAt, 'data-undo-send-refresh-at'),
	};
}

/**
 * The old grid built such a row out of the template row of its table (`realtime.js:45`); this grid
 * keeps the record and draws the row itself. The identifier is demanded the way the platform
 * demanded it - the screen looks the row up the moment it is added.
 */
export function addProjectionRow(registry: ProjectionRegistry, options: RealtimeRowOptions): void
{
	const id = options.id;
	if (!Type.isStringFilled(id) && !Type.isNumber(id))
	{
		throw new ReferenceError('id is not number or string');
	}

	registry.addProjection(
		fromScreenCells(String(id), { ...options.columns }),
		options.append !== true,
	);
}

/**
 * The reader called the send off: the screen takes the node out of the document (`list.es6.js:305`)
 * and the record has to go the same way, or the grid would keep drawing a letter that is back in the
 * drafts. Answered by the grid because the rows are the grid's own.
 */
export function dropCancelledProjection(registry: ProjectionRegistry, data: UndoSendCancelledData): void
{
	const operationId = Number(data?.operation?.operationId);

	if (Number.isInteger(operationId) && operationId > 0)
	{
		registry.dropProjection(`${UndoSendRowIdPrefix}${operationId}`);
	}
}
