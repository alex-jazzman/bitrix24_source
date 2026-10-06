import { applyCellInlineRules } from './inline-rules.js';
import { MARKDOWN_LIST_TAG_PREFIX, MARKDOWN_PLACEHOLDER_SUFFIX } from '../const.js';

const LIST_ITEM_PATTERN = /^([ \t]*)([*+-]|\d+\.)[ \t]+(.*)$/;
const HAS_LIST_ITEM_PATTERN = /^[ \t]*(?:[*+-]|\d+\.)[ \t]+/m;
const MAX_RULE_LENGTH = 20;
// Cap parsed items symmetric to the render cap (functions/list.js MAX_LIST_ITEMS) so a
// crafted [list] with thousands of [*] doesn't burn applyCellInlineRules on items that
// ParserList.decodeList will never render.
const MAX_LIST_ITEMS = 200;

// Structural list tags ([list]/[list=1]/[/list]/[*]) are hidden behind inert
// placeholders during the inline/block/html rules, so the `*` in `[*]` is not
// eaten by the bold/italic rules; restore() brings them back afterwards. The
// item CONTENT stays exposed, so it still picks up the normal inline formatting.
const LIST_TAG_PATTERN = /\[\/?list(?:=1)?(?:\s+start=\d+)?]|\[\*]/gi;
const LIST_TAG_GUARD_PATTERN = new RegExp(`${MARKDOWN_LIST_TAG_PREFIX}(\\d+)${MARKDOWN_PLACEHOLDER_SUFFIX}`, 'g');

export class ListTagProtector
{
	#tags = [];

	protect(text: string): string
	{
		this.#tags = [];

		if (!text.includes('[list') && !text.includes('[*]'))
		{
			return text;
		}

		return text.replaceAll(LIST_TAG_PATTERN, (tag) => {
			const index = this.#tags.length;
			this.#tags.push(tag);

			return `${MARKDOWN_LIST_TAG_PREFIX}${index}${MARKDOWN_PLACEHOLDER_SUFFIX}`;
		});
	}

	restore(text: string): string
	{
		if (this.#tags.length === 0)
		{
			return text;
		}

		const tags = this.#tags;
		const result = text.replaceAll(LIST_TAG_GUARD_PATTERN, (match, index) => tags[Number(index)] ?? match);
		this.#tags = [];

		return result;
	}
}

/**
 * A horizontal rule (`* * *`, `- - -`, `---`, …) would otherwise match the list
 * item pattern (`- ` / `* ` with content) — exclude it so a divider never turns
 * into a single-item list.
 *
 * @param {string} line
 * @returns {boolean}
 */
function isHorizontalRule(line: string): boolean
{
	const trimmed = line.trim();
	if (trimmed.length > MAX_RULE_LENGTH)
	{
		return false;
	}

	return /^-{3,}$/.test(trimmed) || /^\*{3,}$/.test(trimmed) || /^_{3,}$/.test(trimmed)
		|| /^(- ?){3,}$/.test(trimmed) || /^(\* ?){3,}$/.test(trimmed) || /^(_ ?){3,}$/.test(trimmed);
}

function normalizeIndent(indent: string): number
{
	return indent.replace(/\t/g, '    ').length;
}

// Defang literal list-structure BB tags ([list]/[list=1]/[/list]/[*]) in an item's
// own content so they cannot be confused with the structural tags this converter
// emits. A zero-width space after '[' breaks the tag match; the text still reads as
// the literal tag the user typed.
function defangListTags(text: string): string
{
	// Second pass defangs an ESCAPED structural tag (\\[*] becomes
	// ####MD_ESC_N####*] before convertLists, since EscapeHandler.protect runs
	// first) so escapeHandler.restore cannot re-form a real [*] and split the item.
	return text
		.replace(/\[(\/?list(?:=1)?(?:\s+start=\d+)?|\*)]/gi, (match, tag) => `[\u200B${tag}]`)
		.replace(/(####MD_ESC_\d+####)(\/?list(?:=1)?(?:\s+start=\d+)?|\*)]/gi, (match, esc, tag) => `${esc}\u200B${tag}]`);
}

/**
 * @param {string} line
 * @returns {{ indent: number, ordered: boolean, content: string } | null}
 */
function parseListItem(line: string): ?Object
{
	if (isHorizontalRule(line))
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
		// First item's number seeds <ol start> (CommonMark: later item numbers are ignored).
		start: ordered ? parseInt(marker, 10) : null,
		content: defangListTags(applyCellInlineRules(match[3])),
	};
}

/**
 * Build nested [list] BB-code from a flat list of items with indent levels.
 * Items deeper than baseIndent are recursed into a nested [list] attached to the
 * preceding item; the list type ([list] vs [list=1]) follows the first item.
 *
 * @param {Array<Object>} items
 * @param {number} startIndex
 * @param {number} baseIndent
 * @returns {[string, number]}
 */
function buildList(items: Array<Object>, startIndex: number, baseIndent: number): Array<any>
{
	const first = items[startIndex];
	const ordered = first.ordered;
	// Carry a non-default start (e.g. a list beginning at "5.") on the list tag so the
	// decoder can emit <ol start="5">. A start of 1 stays the canonical bare [list=1].
	let bbcode = ordered ? '[list=1]' : '[list]';
	// Only carry a start we can round-trip as plain digits: Number.isSafeInteger rejects
	// values >= 2^53 whose String() form is either imprecise or exponential ("1e+21"),
	// which would leak as raw BB (no `start=\d+` regex matches it). Such an absurd start
	// degrades to bare [list=1] (renders from 1) rather than breaking the list.
	if (ordered && Number.isSafeInteger(first.start) && first.start !== 1)
	{
		bbcode = `[list=1 start=${first.start}]`;
	}
	let i = startIndex;

	while (i < items.length && items[i].indent >= baseIndent)
	{
		if (items[i].indent > baseIndent)
		{
			const [nested, next] = buildList(items, i, items[i].indent);
			bbcode += nested;
			i = next;
		}
		else
		{
			// A marker-type change at the same level starts a NEW list (CommonMark: an
			// ordered item can't extend a bullet list and vice versa). Stop here so the
			// caller emits the remaining items as the next sibling [list] instead of
			// renumbering "- item" into the ordered run.
			if (items[i].ordered !== ordered)
			{
				break;
			}

			bbcode += `[*]${items[i].content}`;
			i++;
		}
	}

	bbcode += '[/list]';

	return [bbcode, i];
}

/**
 * @param {string[]} lines
 * @param {number} startIndex
 * @returns {{ bbcode: string, endIndex: number } | null}
 */
function tryParseList(lines: string[], startIndex: number): ?Object
{
	if (!parseListItem(lines[startIndex]))
	{
		return null;
	}

	// Stop at MAX_LIST_ITEMS so the list ENDS here: convertLists then re-parses any further
	// list lines as the next [list] block. This caps the size of a single list without
	// dropping items — an earlier "consume the rest but skip them" cap silently lost every
	// item past the limit.
	const items = [];
	let i = startIndex;
	while (i < lines.length && items.length < MAX_LIST_ITEMS)
	{
		const item = parseListItem(lines[i]);
		if (!item)
		{
			break;
		}

		items.push(item);
		i++;
	}

	return { items, endIndex: i };
}

/**
 * Format parsed list items for the current mode.
 * - decode: canonical nested [list]/[list=1] BB-code.
 * - simplify: plain `• item` lines for preview/notification surfaces.
 *
 * @param {Array<Object>} items
 * @param {string} mode
 * @returns {string}
 */
function formatList(items: Array<Object>, mode: string): string
{
	if (mode === 'simplify')
	{
		return items.map((item) => `• ${item.content}`).join('\n');
	}

	// buildList stops as soon as it meets an item shallower than its base indent and returns
	// how many items it consumed. When the FIRST item is deeper than a later one (e.g. a
	// pasted list whose first line has stray leading spaces), that leaves items unconsumed —
	// emit them as the next sibling [list] instead of dropping them. Looping to items.length
	// guarantees every parsed item reaches the output (no silent data loss); a well-formed
	// list whose first item is the shallowest is consumed in a single pass, unchanged.
	let bbcode = '';
	let i = 0;
	while (i < items.length)
	{
		const [chunk, next] = buildList(items, i, items[i].indent);
		bbcode += chunk;
		i = next;
	}

	return bbcode;
}

/**
 * Group consecutive Markdown list lines into canonical [list]/[list=1] BB-code,
 * one single-line block per list (so decodeNewLine never splits it). Nesting is
 * derived from indentation. Item content is converted to inline BB here, then
 * protected with the rest of the structure by ListTagProtector.
 *
 * @param {string} text
 * @param {object} [options]
 * @param {string} [options.mode] - 'decode' or 'simplify'
 * @returns {string}
 */
export function convertLists(text: string, options: Object = {}): string
{
	const { mode = 'decode' } = options;

	if (!HAS_LIST_ITEM_PATTERN.test(text))
	{
		return text;
	}

	const lines = text.split('\n');
	const result = [];
	let i = 0;

	while (i < lines.length)
	{
		const list = tryParseList(lines, i);
		if (list)
		{
			result.push(formatList(list.items, mode));
			i = list.endIndex;
		}
		else
		{
			result.push(lines[i]);
			i++;
		}
	}

	return result.join('\n');
}
