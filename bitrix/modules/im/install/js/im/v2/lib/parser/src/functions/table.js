import { Dom, Loc } from 'main.core';

import { ParserDate } from './date.js';
import { ParserDisk } from './disk.js';
import { ParserFont } from './font.js';
import { ParserImage } from './image.js';
import { ParserMention } from './mention.js';
import { ParserQuote } from './quote.js';
import { ParserSlashCommand } from './slash-command.js';
import { ParserSmile } from './smile.js';
import { ParserUrl } from './url.js';

const CLASS_TABLE_CONTAINER = 'bx-im-message-content-table';
const CLASS_TABLE = 'bx-im-message-content-table__table';

// Defensive render ceiling, mirroring the converter caps (markdown/rules/table-rules):
// the converter already refuses to emit an over-sized [table], but legacy [table]
// BB-code (migration-IN) reaches decodeTable directly, so cap rows/columns here too
// to bound the materialized DOM grid. Excess rows/columns are dropped.
const MAX_RENDER_ROWS = 200;
const MAX_RENDER_COLUMNS = 24;

// Canonical Bitrix table BB-code (single line), emitted by convertTables:
//   [table][tr][th]cell[/th]…[/tr][tr][td]cell[/td]…[/tr][/table]
// decodeTable runs last in the decode chain (decoder.js), after Text.encode and
// after the table was stashed away from the global font/url decoders
// (cutTableTag). Cell text is therefore already Text.encode'd; the only
// un-decoded things left inside a cell are the inline tags ([b]/[i]/[s]/[url])
// the converter allowed there — decoded here and inserted as innerHTML.
const TABLE_PATTERN = /\[table]([\s\S]*?)\[\/table]/gi;
const ROW_PATTERN = /\[tr]([\s\S]*?)\[\/tr]/gi;
const CELL_PATTERN = /\[(th|td)]([\s\S]*?)\[\/(?:th|td)]/gi;

export const ParserTable = {

	/**
	 * Render canonical [table] BB-code (produced by the Markdown converter, or
	 * arriving as legacy BB-code content) into a native HTML-grid. Runs after
	 * Text.encode / recover, mirroring ParserQuote.decodeCode.
	 *
	 * @param {string} text
	 * @returns {string}
	 */
	decodeTable(text: string, options: Object = {}): string
	{
		if (!/\[table]/i.test(text))
		{
			return text;
		}

		// urlTarget is threaded down to the cell links so they match the rest of the
		// message (e.g. notifications decode with '_self', not always '_blank').
		const { urlTarget = '_blank' } = options;

		return text.replace(TABLE_PATTERN, (whole, inner) => renderTable(inner, urlTarget) || whole);
	},
};

// Stop scanning at the render caps INSIDE the loops: a huge legacy/hand-typed [table]
// must not first run ParserFont/ParserUrl over thousands of cells only to be sliced
// down to MAX_RENDER_ROWS×MAX_RENDER_COLUMNS afterwards (message-render hot path).
function parseRows(inner: string, urlTarget: string): Array<Object>
{
	const rows = [];
	let scannedRows = 0;
	ROW_PATTERN.lastIndex = 0;
	let rowMatch;
	while (scannedRows < MAX_RENDER_ROWS && (rowMatch = ROW_PATTERN.exec(inner)) !== null)
	{
		scannedRows++;
		const cells = [];
		let isHeader = false;
		CELL_PATTERN.lastIndex = 0;
		let cellMatch;
		while (cells.length < MAX_RENDER_COLUMNS && (cellMatch = CELL_PATTERN.exec(rowMatch[1])) !== null)
		{
			if (cellMatch[1].toLowerCase() === 'th')
			{
				isHeader = true;
			}
			cells.push(decodeCell(cellMatch[2], urlTarget));
		}

		if (cells.length > 0)
		{
			rows.push({ isHeader, cells });
		}
	}

	return rows;
}

// Web table cells get the full single-line inline pipeline: smiles, slash-commands,
// links, font BB-code ([b]/[i]/[s]/[u]…), mentions, icons, disk tags, dates and inline
// code. Images are intentionally left out so a cell never grows into a block <img>. The
// content arrives already Text.encode'd (the whole table was stashed by cutTableTag after
// encode), so this step only turns BB-code into HTML — the XSS invariant is preserved.
function decodeCell(content: string, urlTarget: string): string
{
	let html = ParserSmile.decodeSmile(content);
	html = ParserSlashCommand.decode(html);
	html = ParserUrl.decode(html, { urlTarget, removeLinks: false });
	html = ParserFont.decode(html);
	html = ParserMention.decode(html);
	html = ParserImage.decodeIcon(html);
	html = ParserDisk.decode(html);
	html = ParserDate.decode(html);
	html = ParserQuote.decodeInlineCode(html);

	return html.trim();
}

function renderRow(row: Object, columnCount: number): string
{
	const tag = row.isHeader ? 'th' : 'td';
	const attrs = row.isHeader ? ' scope="col" role="columnheader"' : ' role="cell"';
	let cellsHtml = '';
	for (let i = 0; i < columnCount; i++)
	{
		cellsHtml += `<${tag}${attrs}>${row.cells[i] ?? ''}</${tag}>`;
	}

	return `<tr role="row">${cellsHtml}</tr>`;
}

function renderTable(inner: string, urlTarget: string): string
{
	const rows = parseRows(inner, urlTarget);
	if (rows.length === 0)
	{
		return '';
	}

	const columnCount = Math.min(
		MAX_RENDER_COLUMNS,
		rows.reduce((max, row) => Math.max(max, row.cells.length), 0),
	);
	if (columnCount === 0)
	{
		return '';
	}

	const headHtml = rows.filter((row) => row.isHeader).map((row) => renderRow(row, columnCount)).join('');
	const bodyHtml = rows.filter((row) => !row.isHeader).map((row) => renderRow(row, columnCount)).join('');

	const table = Dom.create({
		tag: 'div',
		attrs: {
			className: CLASS_TABLE_CONTAINER,
			style: `--im-message-content-table-cols: ${columnCount};`,
			// String '0', not number 0: Dom.create drops attrs whose value `== ''`,
			// and `0 == ''` is true — a numeric 0 silently removes the attribute, so
			// the scroll container would never become keyboard-focusable.
			tabIndex: '0',
			role: 'group',
			'aria-label': Loc.getMessage('IM_PARSER_MARKDOWN_TABLE_PLACEHOLDER'),
		},
		html: `<table class="${CLASS_TABLE}" role="table">`
			+ (headHtml ? `<thead role="rowgroup">${headHtml}</thead>` : '')
			+ (bodyHtml ? `<tbody role="rowgroup">${bodyHtml}</tbody>` : '')
			+ '</table>',
	});

	return table.outerHTML;
}
