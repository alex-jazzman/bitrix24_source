/**
 * @module im/messenger/lib/parser/markdown/rules/table-rules
 */
jn.define('im/messenger/lib/parser/markdown/rules/table-rules', (require, exports, module) => {
	const { Type } = require('type');
	const { Loc } = require('im/messenger/loc');
	const {
		MARKDOWN_TABLE_URL_PREFIX,
		MARKDOWN_TABLE_PREFIX,
		MARKDOWN_PLACEHOLDER_SUFFIX,
		MARKDOWN_ESCAPE_PREFIX,
	} = require('im/messenger/lib/parser/const');
	const { applyInlineRules } = require('im/messenger/lib/parser/markdown/rules/inline-rules');
	const { applyHtmlRules } = require('im/messenger/lib/parser/markdown/rules/html-rules');

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
	 * Try to parse a GFM table starting at the given line index. The header sets the width: shorter
	 * rows are padded with empty cells and wider rows are truncated to it.
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

	// encodeURIComponent throws URIError on a lone UTF-16 surrogate - half of a pair, e.g. an emoji a
	// sender's editor cut in the middle. Both table producers run inside the message decode, so the
	// throw would cost the whole message and not just its table: an unpaired half is replaced with
	// U+FFFD, which is what it is drawn as anyway, and the table survives. The pair alternative comes
	// first, so a valid pair is consumed whole and only an unpaired half reaches the second one (the
	// target runtime has no lookbehind to exclude the pair from the low half).
	const SURROGATE_PATTERN = /[\uD800-\uDBFF][\uDC00-\uDFFF]|[\uD800-\uDFFF]/g;

	function replaceLoneSurrogates(value)
	{
		return value.replace(SURROGATE_PATTERN, (match) => (match.length === 2 ? match : '\uFFFD'));
	}

	// Encode a value into a token inert to Markdown and Text.encode: encodeURIComponent
	// already removes < > & " ' and whitespace; the remaining Markdown-significant chars
	// (! ' ( ) * _ ~) and '-' are percent-escaped too, so the alphabet is [A-Za-z0-9.%] and the
	// payload cannot be mangled by the inline rules or break the [URL=...] tag. '-' matters
	// specifically because a cell run of >=54 dashes would otherwise be read as a Bitrix quote
	// separator (parserQuote DECODE_QUOTE_CONTENT_PATTERN, /-{54}/) and tear the token apart.
	// Only the caught path pays for the surrogate scan above: a runtime whose JSON.stringify is
	// well-formed (ES2019) escapes a lone half into "\udXXX" before it can ever reach here.
	function toInertToken(value)
	{
		let encoded;
		try
		{
			encoded = encodeURIComponent(value);
		}
		catch
		{
			encoded = encodeURIComponent(replaceLoneSurrogates(value));
		}

		return encoded.replace(/[!'()*_~-]/g, (char) => {
			return `%${char.charCodeAt(0).toString(16).toUpperCase()}`;
		});
	}

	// '[' followed by U+200B ZERO WIDTH SPACE, spelled by code point so the guard is not an
	// invisible byte in the source.
	const INERT_BRACKET = `[${String.fromCodePoint(0x200B)}`;

	// The native renderers run a cell through the same BB-code parser as the message text (only
	// [quote] is dropped there), so a block or structural tag reaching a cell is really drawn: [hr]
	// is a 10000pt tab stop on iOS and inflates the whole grid, [code]/[h1]/[h2]/[list] break the
	// cell out of its row, and [img] loads a remote image the cell contract forbids (skipImage only
	// covers the Markdown form of an image). [size] and [color] are drawn too, and their parameter is
	// the sender's, so a [size=9999] inflates the row and the grid with it - the same effect [hr] is
	// in the set for. They are defanged the way the web parser does it
	// (table-rules.defangCellTableTags): a zero-width space after the '[' keeps the text the sender
	// typed readable and the tag inert. Mention containers ([USER=…], [CHAT=…], [dialog=…],
	// [context=…]) are deliberately absent - iOS, Android and web all draw them and the cell keeps
	// them working. The '[*]' item tag is spelled out because its name is not a word character, so
	// it also has to accept an escape placeholder in place of the ']' (`[*\]` is only restored after
	// the cell is built); in front of that placeholder every named tag is already matched by \b.
	// The converter's own [size=N][b] heading and [color=…][b] inline code can never be caught by
	// this: the block rules do not run on a cell, and a cell runs the inline rules in canonical mode,
	// where inline code is [icode].
	const CELL_DEFANG_PATTERN = new RegExp(
		'\\[(?=/?(?:img|code|list|hr|h[12]|table|tr|th|td|size|color)\\b'
		+ `|\\*(?:]|${MARKDOWN_ESCAPE_PREFIX}\\d+${MARKDOWN_PLACEHOLDER_SUFFIX}))`,
		'gi',
	);

	/**
	 * Neutralize the tags a table cell must not carry as working BB-code. Both ways into a cell -
	 * content the sender typed there and content a protector restores into it - share this one
	 * policy, because the renderer draws the tag either way (contract rev.3.1 6).
	 *
	 * @param {string} value
	 * @returns {string}
	 */
	function defangCellTags(value)
	{
		return value.replace(CELL_DEFANG_PATTERN, INERT_BRACKET);
	}

	// Convert one GFM cell to the inline BB subset allowed inside a table cell: inline formatting
	// ([b] [i] [s] [u] [url] [icode]) and HTML tags, but never an image - skipImage keeps a cell
	// `![alt](url)` from becoming an [img] the native renderer would load (contract rev.3.1).
	// applyInlineRules is self-contained (protects/restores its own inline code), so running it on
	// a single isolated cell is correct. The defang runs last, so it also sees the tags the html
	// pass could have completed (`[hr&#93;`) and covers BB-code the sender typed in the cell
	// himself, which the rules above pass through untouched.
	// The cell is built before the caller's escape restore, so the URL rules get the caller's escape
	// resolver here for the same reason the message-level pass has one (see inline-rules.toFinalUrl):
	// an address the sender wrote with an escaped character (`my\_file.pdf`) would otherwise be read
	// as not final yet and the link dropped from the cell. Only URL values are resolved, so every
	// other escape in the cell still travels as its placeholder and is restored inside the payload.
	function canonicalCell(cell, resolveEscapes)
	{
		const inline = applyInlineRules(cell, { renderMode: 'canonical', skipImage: true, resolveEscapes });
		const html = applyHtmlRules(inline, { renderMode: 'canonical' });

		return defangCellTags(html);
	}

	// createMarkdownNonce emits base-36, and the nonce is both the token id the consumer binds its
	// regex to and part of the fence patterns below, so the shape is checked before it is trusted.
	const NONCE_PATTERN = /^[a-z\d]+$/i;

	function isUsableNonce(value)
	{
		return Type.isStringFilled(value) && NONCE_PATTERN.test(value);
	}

	// A canonical table token is built while the protector placeholders are still in the text: the
	// converter restores escapes/mentions/code blocks only after every rule has run. Percent-encoding
	// a placeholder here would hide it from that restore pass and the marker would reach
	// TableCell.text verbatim (contract rev.3.1 6, AC-21), so the payload keeps each placeholder
	// literal - inert to the rules on its own - and fences it, and sealCellPayloads encodes whatever
	// the restore left between two fences. Which markers those are is nothing this module knows on its
	// own: every protector hands in the shape it emits (protector.placeholderPattern), so a marker
	// built from a private nonce cannot fall out of the fence unnoticed. One capture group only: the
	// split below reads the odd entries as placeholders, so a shape may not bring a group of its own,
	// and the fence flavour is chosen by the placeholder kind.
	function toProtectorPlaceholderPattern(protectorPatterns)
	{
		if (!Type.isArrayFilled(protectorPatterns))
		{
			return null;
		}

		return new RegExp(`(${protectorPatterns.map((pattern) => pattern.source).join('|')})`);
	}

	// The two kinds of restored content are not equally trusted, and canonicalCell has already run by
	// the time either arrives, so each fence flavour carries the check the cell still needs:
	// 'e' - an escape restores a character the sender asked to see as text, so a '[' of it is made
	// inert exactly like a decoded `&#91;` and cannot open a tag together with the cell text;
	// 'v' - a mention/code placeholder restores BB-code that already stood in the message and stays a
	// working tag, minus the block and structural tags a cell must not carry whatever they came
	// wrapped in (defangCellTags - the same set canonicalCell applies to the cell's own content).
	const ESCAPE_FENCE_KIND = 'e';
	const VERBATIM_FENCE_KIND = 'v';

	function toCellFence(tableNonce, kind)
	{
		return `.${tableNonce}${kind}.`;
	}

	// A dot is the one punctuation character encodeURIComponent keeps, so a fence is the only thing in
	// a canonical payload allowed to carry one: cell content that happens to spell a fence is escaped
	// here and cannot forge one. Canonical payload alphabet: [A-Za-z0-9%].
	function toFencedChunk(value)
	{
		return toInertToken(value).replaceAll('.', '%2E');
	}

	// Payload of a canonical token: encoded everywhere except the fenced protector placeholders.
	// A fence is dot-delimited, so it cannot be confused with the '_<nonce>_' of the token header.
	// A caller with no protectors to restore hands in no shapes, and then the payload is encoded whole.
	function toCanonicalPayload(json, tableNonce, protectorPatterns)
	{
		const placeholderPattern = toProtectorPlaceholderPattern(protectorPatterns);

		if (!placeholderPattern)
		{
			return toFencedChunk(json);
		}

		return json
			.split(placeholderPattern)
			.map((part, index) => {
				if (index % 2 === 0)
				{
					return toFencedChunk(part);
				}

				const kind = part.startsWith(MARKDOWN_ESCAPE_PREFIX) ? ESCAPE_FENCE_KIND : VERBATIM_FENCE_KIND;
				const fence = toCellFence(tableNonce, kind);

				return `${fence}${part}${fence}`;
			})
			.join('');
	}

	function sealFencedCells(text, tableNonce, kind, harden)
	{
		const fence = toCellFence(tableNonce, kind);
		if (!text.includes(fence))
		{
			return text;
		}

		// Lazy body, so every fence pair is matched on a single left-to-right scan. The hardened value
		// is JSON-escaped before encoding because it lands inside a JSON string of the payload and may
		// carry quotes or newlines (a restored multiline [code] block does).
		const pattern = new RegExp(`\\.${tableNonce}${kind}\\.([\\S\\s]*?)\\.${tableNonce}${kind}\\.`, 'g');

		return text.replaceAll(pattern, (match, value) => toFencedChunk(JSON.stringify(harden(value)).slice(1, -1)));
	}

	/**
	 * Finish canonical table payloads once the caller has restored the protectors: the restored
	 * cell content sits between two fences as raw text and is put back into the payload alphabet here.
	 *
	 * @param {string} text
	 * @param {string} [tableNonce]
	 * @returns {string}
	 */
	function sealCellPayloads(text, tableNonce)
	{
		if (!isUsableNonce(tableNonce))
		{
			return text;
		}

		const escaped = sealFencedCells(
			text,
			tableNonce,
			ESCAPE_FENCE_KIND,
			(value) => value.replaceAll('[', INERT_BRACKET),
		);

		return sealFencedCells(
			escaped,
			tableNonce,
			VERBATIM_FENCE_KIND,
			defangCellTags,
		);
	}

	/**
	 * Format a parsed table as output for the current render mode (ALG-02).
	 *
	 * @param {{ headers: string[], rows: string[][] }} tableData
	 * @param {object} options
	 * @param {string} options.mode - 'decode' | 'simplify'
	 * @param {string} [options.renderMode] - 'canonical' | 'fallback'
	 * @param {string} [options.tableNonce] - per-render nonce for the canonical table token
	 * @param {RegExp[]} [options.protectorPatterns] - placeholder shapes of the caller's protectors
	 * @param {function(string): string} [options.resolveEscapes] - the caller's escape resolver, for the
	 *   URL rules inside a cell (see canonicalCell)
	 * @returns {string}
	 */
	function formatTable(tableData, options)
	{
		const { mode, renderMode, tableNonce, protectorPatterns, resolveEscapes } = options;

		if (mode === 'simplify')
		{
			return `[${Loc.getMessage('IMMOBILE_PARSER_MARKDOWN_TABLE_PLACEHOLDER')}]`;
		}

		// Without a well-formed nonce the token would carry an id decodeTable is bound never to match
		// (its own guard rejects an empty nonce), so the user would see the raw token. Degrade to the
		// M1 link below instead - markdownConverter.decode is public and the nonce is its caller's.
		if (renderMode === 'canonical' && isUsableNonce(tableNonce))
		{
			// Canonical: the table becomes a structural message element (type: table). Cells are run
			// through the inline/html rules here, then the {header, rows} object is inlined into a
			// single-line token the parser layer (parserTable.decodeTable) turns into a Table element.
			// The per-render nonce makes the token unguessable, so a sender cannot type a literal copy
			// and have a spoofed table materialized on restore (anti-spoof; mirrors web TableMarkerProtector).
			const header = tableData.headers.map((cell) => ({ text: canonicalCell(cell, resolveEscapes) }));
			const rows = tableData.rows.map((row) => row.map((cell) => ({ text: canonicalCell(cell, resolveEscapes) })));
			const payload = toCanonicalPayload(JSON.stringify({ header, rows }), tableNonce, protectorPatterns);

			return `${MARKDOWN_TABLE_PREFIX}${tableNonce}_${payload}${MARKDOWN_PLACEHOLDER_SUFFIX}`;
		}

		// Interim (M1): the table data travels inline in the link payload, not an
		// in-memory store — so it survives session reloads. The tap handler
		// (dialog.openMarkdownTable) decodes it back and shows the WebView.
		const payload = toInertToken(JSON.stringify(tableData));
		const linkText = Loc.getMessage('IMMOBILE_PARSER_MARKDOWN_TABLE_SHOW');

		return `[URL=${MARKDOWN_TABLE_URL_PREFIX}${payload}]${linkText}[/URL]`;
	}

	/**
	 * Find and convert GFM tables in text. In canonical mode the token this returns is not finished
	 * yet: the payload still carries fenced protector placeholders, so a caller that has protectors
	 * to restore can reach inside it. Only finishTables below returns a token the consumer may read.
	 *
	 * @param {string} text
	 * @param {object} [options]
	 * @param {string} [options.mode] - 'decode' or 'simplify'
	 * @param {string} [options.renderMode] - 'canonical' | 'fallback'
	 * @param {string} [options.tableNonce] - per-render nonce for the canonical table token
	 * @param {RegExp[]} [options.protectorPatterns] - placeholder shapes of the caller's protectors
	 * @param {function(string): string} [options.resolveEscapes] - the caller's escape resolver, for the
	 *   URL rules inside a cell (see canonicalCell)
	 * @returns {string}
	 */
	function convertTables(text, options = {})
	{
		const { mode = 'decode', renderMode, tableNonce, protectorPatterns, resolveEscapes } = options;

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
					{ mode, renderMode, tableNonce, protectorPatterns, resolveEscapes },
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

	/**
	 * The canonical table producer end to end - the only call that returns a finished table token.
	 * Its two phases can be neither reordered nor split: sealing ahead of the caller's protector
	 * restores would encode the placeholders out of their reach, and skipping it leaves the cell
	 * fences, render nonce included, standing in the payload. So both phases and the nonce they share
	 * stay here and the caller's remaining passes run in between; without them the phases simply
	 * follow each other, which is what a text carrying no protector placeholder needs.
	 *
	 * @param {string} text
	 * @param {object} [options]
	 * @param {string} [options.mode] - 'decode' or 'simplify'
	 * @param {string} [options.renderMode] - 'canonical' | 'fallback'
	 * @param {string} [options.tableNonce] - per-render nonce for the canonical table token
	 * @param {RegExp[]} [options.protectorPatterns] - placeholder shapes of the caller's protectors
	 * @param {function(string): string} [options.resolveEscapes] - the caller's escape resolver, for the
	 *   URL rules inside a cell (see canonicalCell)
	 * @param {function(string): string} [applyPendingPasses] - the caller's passes between the phases
	 * @returns {string}
	 */
	function finishTables(text, options = {}, applyPendingPasses = (value) => value)
	{
		const pending = applyPendingPasses(convertTables(text, options));

		if (options.renderMode !== 'canonical')
		{
			return pending;
		}

		return sealCellPayloads(pending, options.tableNonce);
	}

	module.exports = {
		convertTables,
		finishTables,
	};
});
