/**
 * @module im/messenger/lib/parser/markdown/rules/block-rules
 */
jn.define('im/messenger/lib/parser/markdown/rules/block-rules', (require, exports, module) => {
	const { Type } = require('type');
	const {
		MARKDOWN_CODE_PREFIX,
		MARKDOWN_TABLE_PREFIX,
	} = require('im/messenger/lib/parser/const');
	const { defangListTags } = require('im/messenger/lib/parser/markdown/utils/list-tag-protector');

	// BB-code [size=N] values for each heading level.
	const HEADING_SIZES = {
		h1: 22,
		h2: 20,
		h3: 18,
		h4: 16,
		h5: 14,
		h6: 14,
	};

	/**
	 * H1/H2 become a block-level [h1]/[h2] tag in canonical mode (the native renderer draws a
	 * heading with a bottom rule); H3-H6, and every level in fallback, stay inline [size][b].
	 *
	 * @param {string} text
	 * @param {number} level
	 * @param {string} renderMode
	 * @returns {string}
	 */
	function formatHeading(text, level, renderMode)
	{
		if (renderMode === 'canonical' && (level === 1 || level === 2))
		{
			return `[h${level}]${text}[/h${level}]`;
		}

		return `[size=${HEADING_SIZES[`h${level}`]}][b]${text}[/b][/size]`;
	}

	/**
	 * A line that is already an inert block placeholder/token - a fenced-code placeholder
	 * (####MD_CODE_N####) or a canonical table token (####MD_TABLE_<nonce>_...####). Such a line
	 * must pass through untouched: it is neither reflowed nor read as setext content, so a
	 * following `---`/`===` cannot swallow the token into a heading.
	 *
	 * @param {string} line
	 * @returns {boolean}
	 */
	function isBlockPlaceholder(line)
	{
		return line.startsWith(MARKDOWN_CODE_PREFIX) || line.startsWith(MARKDOWN_TABLE_PREFIX);
	}

	// Bitrix quote separators use exactly 54 dashes.
	// Limit Markdown constructs to avoid collisions with them.
	const MAX_MARKDOWN_RULE_LENGTH = 20;

	/**
	 * @param {string} line
	 * @returns {boolean}
	 */
	function isHorizontalRuleLine(line)
	{
		const trimmed = line.trim();
		if (trimmed.length > MAX_MARKDOWN_RULE_LENGTH)
		{
			return false;
		}

		// Pure: ---, ***, ___ (3+ of same char)
		if (/^-{3,}$/.test(trimmed) || /^\*{3,}$/.test(trimmed) || /^_{3,}$/.test(trimmed))
		{
			return true;
		}

		// Spaced variants: - - -, * * *, _ _ _ (3+ of same char with optional spaces)
		return /^(- ?){3,}$/.test(trimmed) || /^(\* ?){3,}$/.test(trimmed) || /^(_ ?){3,}$/.test(trimmed);
	}

	/**
	 * Check if a line could be a setext heading marker
	 * @param {string} line
	 * @returns {'h1'|'h2'|null}
	 */
	function getSetextMarkerType(line)
	{
		const trimmed = line.trim();
		if (trimmed.length > MAX_MARKDOWN_RULE_LENGTH)
		{
			return null;
		}

		if (/^={3,}$/.test(trimmed))
		{
			return 'h1';
		}

		if (/^-{3,}$/.test(trimmed))
		{
			return 'h2';
		}

		return null;
	}

	/**
	 * Check if a line is valid text for a setext heading (non-empty, not a rule/heading/placeholder)
	 * @param {string} line
	 * @returns {boolean}
	 */
	function isValidSetextContent(line)
	{
		if (!line || line.trim() === '')
		{
			return false;
		}

		if (isBlockPlaceholder(line))
		{
			return false;
		}

		if (/^#{1,6}\s/.test(line))
		{
			return false;
		}

		return !isHorizontalRuleLine(line);
	}

	// --- Canonical lists (ALG-01) ---

	// A Markdown list item line: leading indent, an unordered ([*+-]) or ordered (\d+.) marker,
	// at least one space, then the content.
	const LIST_ITEM_PATTERN = /^([ \t]*)([*+-]|\d+\.)[ \t]+(.*)$/;

	// Nesting cap for canonical lists, mirroring parserUtils.recursiveReplace. One stack frame per
	// level, so an input with monotonically growing indent would otherwise reach a RangeError and
	// drop the whole message render; past the cap deeper items fold flat into the current level.
	const LIST_NESTING_LIMIT = 10;

	// Item cap for one [list] block, mirroring the web producer (im/v2 list-rules MAX_LIST_ITEMS):
	// the native renderer draws every [*] of a block at once, with no budget of its own to extend, so
	// the block ENDS at the cap and the lines after it are re-parsed as the next block - no item is
	// dropped, exactly as the web parser handles it.
	const MAX_LIST_ITEMS = 200;

	/**
	 * @param {string} indent
	 * @returns {number}
	 */
	function normalizeIndent(indent)
	{
		return indent.replace(/\t/g, '    ').length;
	}

	/**
	 * @param {string} line
	 * @returns {{ indent: number, ordered: boolean, start: (number|null), content: string } | null}
	 */
	function parseListItem(line)
	{
		// A horizontal rule (`- - -`, `***`, `---`) matches the item pattern too - exclude it so
		// a divider never turns into a single-item list.
		if (isHorizontalRuleLine(line))
		{
			return null;
		}

		const match = line.match(LIST_ITEM_PATTERN);
		if (!match)
		{
			return null;
		}

		const marker = match[2];
		const ordered = /\d/.test(marker);

		return {
			indent: normalizeIndent(match[1]),
			ordered,
			// First item's number seeds [list=1 start=N] (CommonMark: later numbers are ignored).
			start: ordered ? parseInt(marker, 10) : null,
			content: match[3],
		};
	}

	/**
	 * A lazy continuation line (CommonMark): indented plain text that carries on the item above
	 * instead of opening a block of its own. Anything that does open a block - a blank line, a
	 * heading, a rule, a setext marker, a quote, an inert placeholder - ends the item instead. The
	 * indent is what tells a continuation from an ordinary paragraph following the list.
	 *
	 * @param {string} line
	 * @returns {boolean}
	 */
	function isListContinuationLine(line)
	{
		if (!/^[ \t]/.test(line))
		{
			return false;
		}

		// Checked on the trimmed line so an indented heading/rule/quote still closes the item.
		const trimmed = line.trim();

		return isValidSetextContent(trimmed)
			&& getSetextMarkerType(trimmed) === null
			&& !trimmed.startsWith('>');
	}

	/**
	 * Build one nested [list]/[list=1] block from parsed items, grouping by indent. Items deeper
	 * than baseIndent recurse into a nested list attached to the preceding item, up to
	 * LIST_NESTING_LIMIT levels; beyond that they are folded flat into the current level. The block and
	 * structural tags an item must not carry are defanged in its own content as it is emitted, before the
	 * tag protector can mistake one of them for structure of this block (see defangListTags).
	 *
	 * @param {Array<object>} items
	 * @param {number} startIndex
	 * @param {number} baseIndent
	 * @param {number} [depth] - 1 for the outermost list
	 * @returns {[string, number]}
	 */
	function buildList(items, startIndex, baseIndent, depth = 1)
	{
		const first = items[startIndex];
		const { ordered } = first;
		let bbcode = ordered ? '[list=1]' : '[list]';
		// Carry a non-default start (a list beginning at "5.") so the native renderer numbers
		// from it. Only a safe-integer start round-trips as plain digits; anything else stays
		// bare [list=1] (renders from 1) rather than leaking a broken tag.
		if (ordered && Number.isSafeInteger(first.start) && first.start !== 1)
		{
			bbcode = `[list=1 start=${first.start}]`;
		}
		let i = startIndex;

		while (i < items.length && items[i].indent >= baseIndent)
		{
			if (items[i].indent > baseIndent)
			{
				if (depth >= LIST_NESTING_LIMIT)
				{
					// Folded flat, and deliberately without the marker-type check below: returning
					// without consuming the item would make the caller re-enter it forever.
					bbcode += `[*]${defangListTags(items[i].content)}`;
					i++;
					continue;
				}

				const [nested, next] = buildList(items, i, items[i].indent, depth + 1);
				bbcode += nested;
				i = next;
			}
			else
			{
				// A marker-type change at the same level starts a NEW sibling list (CommonMark:
				// an ordered item can't extend a bullet list and vice versa).
				if (items[i].ordered !== ordered)
				{
					break;
				}

				bbcode += `[*]${defangListTags(items[i].content)}`;
				i++;
			}
		}

		bbcode += '[/list]';

		return [bbcode, i];
	}

	/**
	 * Consume a run of consecutive Markdown list lines from startIndex and return the grouped
	 * structure plus the index of the first line after the list. A blank line, any line that
	 * opens a block of its own, or the MAX_LIST_ITEMS cap closes the block. Each [list]/[list=1] block
	 * stays on a single line (so decodeNewLine never splits one); sibling blocks born of a
	 * marker-type change or of the item cap are separated by a single newline.
	 *
	 * @param {string[]} lines
	 * @param {number} startIndex
	 * @returns {{ bbcode: string, endIndex: number } | null}
	 */
	function consumeList(lines, startIndex)
	{
		if (!parseListItem(lines[startIndex]))
		{
			return null;
		}

		const items = [];
		let i = startIndex;
		while (i < lines.length)
		{
			const item = parseListItem(lines[i]);
			if (item)
			{
				// At the cap the item is left unconsumed, so the caller re-enters consumeList on this
				// very line and opens the next block with it (see MAX_LIST_ITEMS).
				if (items.length >= MAX_LIST_ITEMS)
				{
					break;
				}

				items.push(item);
				i++;
				continue;
			}

			if (!isListContinuationLine(lines[i]))
			{
				break;
			}

			// The continuation stays inside its item, joined by a space: a [list] block has to hold
			// one line. `items` is never empty here - startIndex is a list item by the check above.
			const last = items[items.length - 1];
			last.content = `${last.content} ${lines[i].trim()}`;
			i++;
		}

		const blocks = [];
		let j = 0;
		while (j < items.length)
		{
			const [block, next] = buildList(items, j, items[j].indent);
			blocks.push(block);
			j = next;
		}

		return { bbcode: blocks.join('\n'), endIndex: i };
	}

	// --- Canonical block boundaries ---

	// Every canonical block construct occupies a whole line here - a [list] block, a table token, an
	// [h1]/[h2] heading, an [hr] - so a boundary is fully described by the tags touching the run of
	// newlines. Ordinary paragraphs keep their blank lines, and fenced code is still hidden behind a
	// placeholder at this point, so code content is never touched.
	const LIST_BLOCK_END = '\\[/list]';
	const LIST_BLOCK_START = '\\[list\\b';
	// Constructs that space themselves vertically in the native renderer: a heading carries
	// paragraphSpacing, an [hr] draws its own gap, a table leaves the text flow as a separate
	// structural element. [hr] is self-closing, so it stands on both sides of a boundary.
	const SELF_SPACED_BLOCK_END = `\\[/h[12]]|\\[hr]|${MARKDOWN_TABLE_PREFIX}[^\\n]*`;
	const SELF_SPACED_BLOCK_START = `\\[h[12]]|\\[hr]|${MARKDOWN_TABLE_PREFIX}`;
	// Lookbehind is unavailable on older JavaScriptCore, so the construct on the left of the run is
	// consumed by the match (and re-emitted by the replacer) while the one on the right is only
	// looked ahead at. Both sides are optional: their absence is what tells ordinary text apart.
	const BLOCK_BOUNDARY_PATTERN = new RegExp(
		`(?:(${LIST_BLOCK_END})|(${SELF_SPACED_BLOCK_END}))?`
		+ '\\n{2,}'
		+ `(?=(?:(${LIST_BLOCK_START})|(${SELF_SPACED_BLOCK_START}))?)`,
		'gi',
	);

	/**
	 * Normalize one run of newlines between canonical blocks. A list block has no vertical spacing
	 * of its own in the native renderer (only indents), so a blank line typed by the author is its
	 * only separator and survives - clamped to one. Every other construct spaces itself, where a
	 * kept blank line would double the gap. At the very start or end of the message there is
	 * nothing to separate, so one newline is enough there too.
	 *
	 * @param {string} match - the consumed left construct (if any) plus the run of newlines
	 * @param {string} [listEnd]
	 * @param {string} [selfSpacedEnd]
	 * @param {string} [listStart]
	 * @param {string} [selfSpacedStart]
	 * @param {number} offset
	 * @param {string} text
	 * @returns {string}
	 */
	function normalizeBlockBoundary(match, listEnd, selfSpacedEnd, listStart, selfSpacedStart, offset, text)
	{
		const left = listEnd ?? selfSpacedEnd ?? '';

		if (selfSpacedEnd || selfSpacedStart)
		{
			return `${left}\n`;
		}

		// No block construct on either side - an ordinary paragraph break, left as typed.
		if (!listEnd && !listStart)
		{
			return match;
		}

		const startsMessage = offset === 0 && left === '';
		const endsMessage = offset + match.length === text.length;

		return startsMessage || endsMessage ? `${left}\n` : `${left}\n\n`;
	}

	/**
	 * @param {string} text
	 * @returns {string}
	 */
	function normalizeBlockBoundaryNewLines(text)
	{
		return text.replaceAll(BLOCK_BOUNDARY_PATTERN, normalizeBlockBoundary);
	}

	/**
	 * Apply all block-level Markdown rules to text.
	 * Handles multi-line constructs (canonical lists, setext headings) first, then per-line rules.
	 * In canonical mode every block boundary ends up normalized: at most one blank line next to a
	 * list, exactly one newline next to a self-spacing block.
	 *
	 * @param {string} text
	 * @param {object} [options]
	 * @param {string} [options.renderMode] - 'canonical' | 'fallback' (default 'fallback')
	 * @returns {string}
	 */
	function applyBlockRules(text, options = {})
	{
		const { renderMode = 'fallback' } = options;

		if (!Type.isStringFilled(text))
		{
			return '';
		}

		const lines = text.split('\n');
		const result = [];

		let i = 0;
		while (i < lines.length)
		{
			const line = lines[i];

			// Skip inert block placeholders/tokens entirely (fenced code, canonical table)
			if (isBlockPlaceholder(line))
			{
				result.push(line);
				i++;
				continue;
			}

			// Canonical lists are grouped into a single-line [list] block BEFORE setext/hr
			// detection, so a list directly followed by --- is not mis-read as a setext heading
			// (its --- renders as [hr] on its own line).
			if (renderMode === 'canonical')
			{
				const list = consumeList(lines, i);
				if (list)
				{
					result.push(list.bbcode);
					i = list.endIndex;
					continue;
				}
			}

			const nextLine = i + 1 < lines.length ? lines[i + 1] : null;

			// Setext heading has priority over horizontal rule per CommonMark spec:
			// "text\n---" is setext H2, not a paragraph + hr.
			// Only when the preceding line is empty/invalid does --- become hr.
			if (nextLine !== null && !isBlockPlaceholder(nextLine))
			{
				const setextType = getSetextMarkerType(nextLine);
				if (setextType && isValidSetextContent(line))
				{
					const level = setextType === 'h1' ? 1 : 2;
					result.push(formatHeading(line.trim(), level, renderMode));
					i += 2; // skip both lines
					continue;
				}
			}

			result.push(applyLineRules(line, renderMode));
			i++;
		}

		const bbcode = result.join('\n');

		// Fallback emits no block tags at all, so the boundary rule is canonical-only.
		return renderMode === 'canonical' ? normalizeBlockBoundaryNewLines(bbcode) : bbcode;
	}

	/**
	 * Apply per-line block rules to a single line.
	 *
	 * @param {string} line
	 * @param {string} renderMode
	 * @returns {string}
	 */
	function applyLineRules(line, renderMode)
	{
		// ATX headings: # through ######, must have space after #
		const headingMatch = line.match(/^(#{1,6})\s+(.*)$/);
		if (headingMatch)
		{
			const level = headingMatch[1].length;
			const content = headingMatch[2].replace(/\s+#+\s*$/, '').trim(); // remove trailing # markers

			return formatHeading(content, level, renderMode);
		}

		// Horizontal rule: line that is only dashes, asterisks, underscores (3+), with optional spaces
		if (isHorizontalRuleLine(line))
		{
			return renderMode === 'canonical' ? '[hr]' : '____________';
		}

		// Blockquote: > text or >text → >> text (BB-quote).
		// Skip lines already starting with >> (existing BB-quotes).
		if (/^>[^>]/.test(line) || line === '>')
		{
			return `>${line}`;
		}

		// Unordered list (fallback only): canonical lists are grouped by consumeList before this
		// per-line pass, so a raw "- item" line reaches here only in fallback mode.
		const ulMatch = line.match(/^([*+-])\s(.*)$/);
		if (ulMatch)
		{
			return `\u2022 ${ulMatch[2]}`;
		}

		// Ordered list: passthrough (no changes needed)

		return line;
	}

	module.exports = {
		applyBlockRules,
	};
});
