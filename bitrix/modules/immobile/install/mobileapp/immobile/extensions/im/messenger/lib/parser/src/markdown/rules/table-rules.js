/**
 * @module im/messenger/lib/parser/markdown/rules/table-rules
 */
jn.define('im/messenger/lib/parser/markdown/rules/table-rules', (require, exports, module) => {
	const { Loc } = require('im/messenger/loc');
	const { MARKDOWN_TABLE_URL_PREFIX } = require('im/messenger/lib/parser/const');

	const SEPARATOR_PATTERN = /^\|?\s*:?-{3,}:?\s*(\|\s*:?-{3,}:?\s*)*\|?\s*$/;

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

		const rows = [];
		let i = startIndex + 2;
		while (i < lines.length && lines[i].includes('|'))
		{
			const cells = parseRow(lines[i]);
			if (cells.length === 1 && headers.length > 1)
			{
				break;
			}

			while (cells.length < headers.length)
			{
				cells.push('');
			}

			rows.push(cells.slice(0, headers.length));
			i++;
		}

		return { headers, rows, endIndex: i };
	}

	/**
	 * Format a parsed table as BB-code output.
	 *
	 * @param {{ headers: string[], rows: string[][] }} tableData
	 * @param {object} options
	 * @param {string} options.mode
	 * @param {number|string} options.messageId
	 * @param {number} options.tableIndex
	 * @param {function|null} options.storeTableData
	 * @returns {string}
	 */
	function formatTable(tableData, options)
	{
		const { mode, storeTableData, messageId, tableIndex } = options;

		if (mode === 'simplify' || !storeTableData)
		{
			return `[${Loc.getMessage('IMMOBILE_PARSER_MARKDOWN_TABLE_PLACEHOLDER')}]`;
		}

		const key = storeTableData(messageId, tableIndex, tableData);
		const linkText = Loc.getMessage('IMMOBILE_PARSER_MARKDOWN_TABLE_SHOW');

		return `[URL=${MARKDOWN_TABLE_URL_PREFIX}${key}]${linkText}[/URL]`;
	}

	/**
	 * Find and convert GFM tables in text.
	 *
	 * @param {string} text
	 * @param {object} options
	 * @param {string} options.mode - 'decode' or 'simplify'
	 * @param {number|string} options.messageId - message ID for key generation
	 * @param {function} options.storeTableData - function(messageId, tableIndex, data) => key
	 * @returns {string}
	 */
	function convertTables(text, options = {})
	{
		const {
			mode = 'decode',
			messageId = 0,
			storeTableData = null,
		} = options;

		const lines = text.split('\n');
		const result = [];
		let tableIndex = 0;
		let i = 0;

		while (i < lines.length)
		{
			const table = tryParseTable(lines, i);
			if (table)
			{
				result.push(formatTable(
					{ headers: table.headers, rows: table.rows },
					{ mode, storeTableData, messageId, tableIndex },
				));
				tableIndex++;
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
