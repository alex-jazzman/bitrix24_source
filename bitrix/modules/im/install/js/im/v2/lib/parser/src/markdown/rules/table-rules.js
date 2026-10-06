import { Loc } from 'main.core';

import { applyCellInlineRules } from './inline-rules.js';
import { MARKDOWN_TABLE_PATTERN, MARKDOWN_TABLE_GUARD_PREFIX, MARKDOWN_PLACEHOLDER_SUFFIX } from '../const.js';

// GFM allows one or more dashes per delimiter cell (`| - |` is valid), so accept `-+`
// rather than `-{3,}`. Safe against false positives: this is only tested as the row
// directly under a pipe header, with matching column count.
const SEPARATOR_PATTERN = /^\|?\s*:?-+:?\s*(\|\s*:?-+:?\s*)*\|?\s*$/;

// Hard caps so a single crafted table cannot materialize an unbounded DOM grid on
// the web (or an unbounded URL payload on mobile). A table that exceeds either cap
// is NOT converted — its raw GFM lines pass through as plain text (visible but
// cheap) instead of becoming [table] BB-code. ParserTable.decodeTable applies the
// same row/column ceiling defensively for legacy [table] BB-code (migration-IN).
const MAX_TABLE_ROWS = 200;
const MAX_TABLE_COLUMNS = 24;

// Genuine [table] blocks (emitted below, or arriving as legacy BB-code) are
// stashed behind this inert placeholder before the inline/block/html rules run,
// so those rules cannot reparse the cell content or break the BB structure;
// restore() brings them back afterwards. Per-call instance — no shared state.
export class TableMarkerProtector
{
	#tables = [];
	#nonce = '';
	#pattern: RegExp;

	// The per-render nonce makes the placeholder (####MD_TABLEGUARD_<nonce>_N####)
	// unguessable, so restore() never expands a literal copy the sender typed — only the
	// tables this instance actually stored (amplification-DoS defense; see utils/nonce.js).
	constructor(nonce: string = '')
	{
		this.#nonce = nonce;
		this.#pattern = new RegExp(`${MARKDOWN_TABLE_GUARD_PREFIX}${nonce}_(\\d+)${MARKDOWN_PLACEHOLDER_SUFFIX}`, 'g');
	}

	protect(text: string): string
	{
		this.#tables = [];

		if (!text.includes('[table]'))
		{
			return text;
		}

		return text.replaceAll(MARKDOWN_TABLE_PATTERN, (whole) => {
			const index = this.#tables.length;
			this.#tables.push(whole);

			return `${MARKDOWN_TABLE_GUARD_PREFIX}${this.#nonce}_${index}${MARKDOWN_PLACEHOLDER_SUFFIX}`;
		});
	}

	restore(text: string): string
	{
		if (this.#tables.length === 0)
		{
			return text;
		}

		const tables = this.#tables;
		const result = text.replaceAll(this.#pattern, (match, index) => tables[Number(index)] ?? match);
		this.#tables = [];

		return result;
	}
}

/**
 * @param {string} line
 * @returns {string[]}
 */
function parseRow(line: string): string[]
{
	let trimmed = line.trim();

	if (trimmed.startsWith('|'))
	{
		trimmed = trimmed.slice(1);
	}

	if (trimmed.endsWith('|'))
	{
		trimmed = trimmed.slice(0, -1);
	}

	return trimmed.split('|').map((cell) => cell.trim());
}

/**
 * @param {string} line
 * @returns {boolean}
 */
function isSeparatorRow(line: string): boolean
{
	return SEPARATOR_PATTERN.test(line.trim());
}

/**
 * Try to parse a GFM table starting at the given line index. Short rows are
 * padded and long rows truncated to the header width.
 *
 * @param {string[]} lines
 * @param {number} startIndex
 * @returns {{ headers: string[], rows: string[][], endIndex: number } | null}
 */
function tryParseTable(lines: string[], startIndex: number): ?Object
{
	if (startIndex + 1 >= lines.length)
	{
		return null;
	}

	if (!lines[startIndex].includes('|') || !isSeparatorRow(lines[startIndex + 1]))
	{
		return null;
	}

	const headers = parseRow(lines[startIndex]);
	const separatorCells = parseRow(lines[startIndex + 1]);

	if (headers.length !== separatorCells.length)
	{
		return null;
	}

	// Over-wide table: bail to raw text rather than convert (see MAX_TABLE_COLUMNS).
	if (headers.length > MAX_TABLE_COLUMNS)
	{
		return null;
	}

	const rows = [];
	let i = startIndex + 2;
	while (i < lines.length && lines[i].includes('|'))
	{
		const cells = parseRow(lines[i]);

		while (cells.length < headers.length)
		{
			cells.push('');
		}

		rows.push(cells.slice(0, headers.length));
		i++;

		// Over-tall table: bail to raw text rather than convert (see MAX_TABLE_ROWS).
		if (rows.length > MAX_TABLE_ROWS)
		{
			return null;
		}
	}

	return { headers, rows, endIndex: i };
}

// Defang literal table-structure BB tags ([table]/[tr]/[th]/[td] + closings) in a
// cell's own content so a user-typed closer can't prematurely end the cell/row/
// table on decode (Text.encode does not escape [ ]). A zero-width space after '['
// breaks the tag match; the text still reads as the literal tag the user typed.
function defangCellTableTags(text: string): string
{
	// Two passes: the bare regex defangs a literal [/td]; the second defangs an
	// ESCAPED structural tag (\\[/td] becomes ####MD_ESC_N####/td] because
	// EscapeHandler.protect runs before convertTables) — otherwise
	// escapeHandler.restore would later re-form a real [/td] and break the cell.
	return text
		.replace(/\[(\/?(?:table|tr|th|td))]/gi, (match, tag) => `[\u200B${tag}]`)
		.replace(/(####MD_ESC_\d+####)(\/?(?:table|tr|th|td))]/gi, (match, esc, tag) => `${esc}\u200B${tag}]`);
}

function encodeCell(cell: string): string
{
	return defangCellTableTags(applyCellInlineRules(cell));
}

/**
 * Build canonical Bitrix [table] BB-code from parsed GFM data. Header cells
 * become [th], body cells [td]; each cell's inline Markdown (inline code, bold/
 * italic/strikethrough, links, autolinks) is converted to BB inside the cell.
 * Emitted on a single line so decodeNewLine never injects <br> between the
 * structural tags, and so the whole block survives Text.encode (the tags carry
 * no encodable chars).
 *
 * @param {{ headers: string[], rows: string[][] }} tableData
 * @returns {string}
 */
function encodeTableBb(tableData: Object): string
{
	const { headers, rows } = tableData;

	const head = `[tr]${headers.map((cell) => `[th]${encodeCell(cell)}[/th]`).join('')}[/tr]`;
	const body = rows
		.map((cells) => `[tr]${cells.map((cell) => `[td]${encodeCell(cell)}[/td]`).join('')}[/tr]`)
		.join('');

	return `[table]${head}${body}[/table]`;
}

/**
 * - decode: a canonical [table] BB-code block (rendered later by
 *   ParserTable.decodeTable as an HTML-grid).
 * - simplify: a localized plain placeholder for preview surfaces.
 *
 * @param {{ headers: string[], rows: string[][] }} tableData
 * @param {object} options
 * @param {string} options.mode
 * @returns {string}
 */
function formatTable(tableData: Object, options: Object): string
{
	if (options.mode === 'simplify')
	{
		return `[${Loc.getMessage('IM_PARSER_MARKDOWN_TABLE_PLACEHOLDER')}]`;
	}

	return encodeTableBb(tableData);
}

/**
 * Find and convert GFM tables in text to canonical [table] BB-code.
 *
 * @param {string} text
 * @param {object} [options]
 * @param {string} [options.mode] - 'decode' or 'simplify'
 * @returns {string}
 */
export function convertTables(text: string, options: Object = {}): string
{
	const { mode = 'decode' } = options;

	// A GFM table is impossible without a pipe — skip the per-line scan otherwise.
	if (!text.includes('|'))
	{
		return text;
	}

	const lines = text.split('\n');
	const result = [];
	let i = 0;

	while (i < lines.length)
	{
		const table = tryParseTable(lines, i);
		if (table)
		{
			result.push(formatTable({ headers: table.headers, rows: table.rows }, { mode }));
			i = table.endIndex;
		}
		else
		{
			result.push(lines[i]);
			i++;
		}
	}

	return result.join('\n');
}
