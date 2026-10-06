/**
 * @module im/messenger/lib/parser/markdown/rules/table-rules
 */
jn.define('im/messenger/lib/parser/markdown/rules/table-rules', (require, exports, module) => {
	const { Loc } = require('im/messenger/loc');
	const { MARKDOWN_TABLE_URL_PREFIX } = require('im/messenger/lib/parser/const');

	// GFM allows one or more dashes per delimiter cell (`| - |` is valid), so accept `-+`
	// rather than `-{3,}`. Only tested as the row directly under a pipe header with matching
	// column count, so no false positives.
	const SEPARATOR_PATTERN = /^\|?\s*:?-+:?\s*(\|\s*:?-+:?\s*)*\|?\s*$/;

	// Hard caps (mirrors the web parser): a table over either limit is left as raw GFM
	// text instead of being converted, so a crafted table cannot inflate the inline URL
	// payload or the WebView grid. dialog.openMarkdownTable enforces the same ceiling
	// defensively on the decoded payload.
	const MAX_TABLE_ROWS = 200;
	const MAX_TABLE_COLUMNS = 24;

	/**
	 * @param {string} line
	 * @returns {string[]}
	 */
	function parseRow(line)
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
	function isSeparatorRow(line)
	{
		return SEPARATOR_PATTERN.test(line.trim());
	}

	/**
	 * Try to parse a GFM table starting at the given line index.
	 * Returns parsed table data and the index of the next line after the table,
	 * or null if no valid table found.
	 *
	 * @param {string[]} lines
	 * @param {number} startIndex
	 * @returns {{ headers: string[], rows: string[][], endIndex: number } | null}
	 */
	function tryParseTable(lines, startIndex)
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

	// Encode a value into a token inert to Markdown and Text.encode: encodeURIComponent
	// already removes < > & " ' and whitespace; the remaining Markdown-significant chars
	// (! ' ( ) * _ ~) are percent-escaped too, so the alphabet is [A-Za-z0-9.%-] and the
	// payload cannot be mangled by the inline rules or break the [URL=…] tag.
	function toInertToken(value)
	{
		return encodeURIComponent(value).replace(/[!'()*_~]/g, (char) => {
			return `%${char.charCodeAt(0).toString(16).toUpperCase()}`;
		});
	}

	/**
	 * Format a parsed table as BB-code output.
	 *
	 * @param {{ headers: string[], rows: string[][] }} tableData
	 * @param {object} options
	 * @param {string} options.mode
	 * @returns {string}
	 */
	function formatTable(tableData, options)
	{
		const { mode } = options;

		if (mode === 'simplify')
		{
			return `[${Loc.getMessage('IMMOBILE_PARSER_MARKDOWN_TABLE_PLACEHOLDER')}]`;
		}

		// Interim (M1): the table data travels inline in the link payload, not an
		// in-memory store — so it survives session reloads. The tap handler
		// (dialog.openMarkdownTable) decodes it back and shows the WebView.
		const payload = toInertToken(JSON.stringify(tableData));
		const linkText = Loc.getMessage('IMMOBILE_PARSER_MARKDOWN_TABLE_SHOW');

		return `[URL=${MARKDOWN_TABLE_URL_PREFIX}${payload}]${linkText}[/URL]`;
	}

	/**
	 * Find and convert GFM tables in text.
	 *
	 * @param {string} text
	 * @param {object} [options]
	 * @param {string} [options.mode] - 'decode' or 'simplify'
	 * @returns {string}
	 */
	function convertTables(text, options = {})
	{
		const { mode = 'decode' } = options;

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
				result.push(formatTable(
					{ headers: table.headers, rows: table.rows },
					{ mode },
				));
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

	module.exports = {
		convertTables,
	};
});
