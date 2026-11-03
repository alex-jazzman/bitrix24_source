import { applyCellInlineRules } from './inline-rules.js';
import { MARKDOWN_LIST_TAG_PREFIX, MARKDOWN_PLACEHOLDER_SUFFIX } from '../const.js';
import { type BbTagProtector } from '../utils/bb-tag-protector.js';
import { type UrlProtector } from '../utils/url-protector.js';

type ConvertListsOptions = {
	mode?: string,
	urlProtector?: ?UrlProtector,
	bbTagProtector?: ?BbTagProtector,
};

// A line opening with a long number ("255502. test") is an order id, a phone or a
// contract number, not a list: turning it into <ol start=...> moves the number into the
// marker, which then does not fit the list indent and looks truncated. Real chat lists
// start small, so a marker that OPENS a list is capped at three digits ("1." to "999.").
// The cap applies to the start of a list only - the lines startsNewList() answers yes for.
// Inside an already open list a marker of any length is just the next item ("998./999./1000."
// is one list), because only the first number is kept: the browser numbers the rest itself
// from <ol start>. The <ol> indent (parser.css) is therefore sized for "999.", the widest
// marker accepted as the START of a list; a long list started near the cap ("999." plus
// MAX_LIST_ITEMS items reaches "1198.") can still outgrow that indent - an accepted
// limitation, not a guarantee.
// Exported because that indent is the other half of the cap and lives in a file this one
// cannot see: the stylesheet declares the digit count it was measured for, and
// test/functions/markdown-list-indent.test.js holds the two against each other.
export const MAX_ORDERED_MARKER_DIGITS = 3;
// The capped source answers "can a list START here?" - it backs the opening-marker test, the
// "is there any list line?" probe and the pipeline fast-path (MARKDOWN_TRIGGER in
// ../converter.js), which can therefore never disagree on where a list may begin. The
// per-line parse is deliberately uncapped: it also has to see continuation markers.
export const ORDERED_MARKER_SOURCE = `\\d{1,${MAX_ORDERED_MARKER_DIGITS}}\\.`;
const LIST_ITEM_PATTERN = /^([\t ]*)([*+-]|\d+\.)[\t ]+(.*)$/;
const OPENING_ORDERED_MARKER_PATTERN = new RegExp(`^${ORDERED_MARKER_SOURCE}$`);
const HAS_LIST_ITEM_PATTERN = new RegExp(`^[ \\t]*(?:[*+-]|${ORDERED_MARKER_SOURCE})[ \\t]+`, 'm');
const MAX_RULE_LENGTH = 20;
// Largest number of items one emitted [list] may carry, symmetric to the render cap
// (functions/list.js MAX_LIST_ITEMS): a longer run is split into sibling [list] blocks, so
// every parsed item lands in a list ParserList.decodeList actually draws. The split is done
// on OUTPUT (convertLists), after the whole run of list lines is parsed as one list - a
// technical chunk must not look like a place where the user started a new list, or the item
// behind it would be re-tested against the opening digit cap and fall out as plain text.
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
 * Read one line as a list item. Its marker is reported in three parts, because the callers
 * need different ones: `ordered` is the list type the item belongs to (tryParseList places it
 * by that and `indent`), `canOpen` says whether such a marker may begin a list at all, and
 * `start` is the number buildList puts on <ol start> when the item is the first of one.
 *
 * @param {string} line
 * @param {?UrlProtector} [urlProtector] - UrlProtector of the current render; null lets
 *   applyCellInlineRules protect and restore the URLs of the item on its own
 * @param {?BbTagProtector} [bbTagProtector] - BbTagProtector of the current render, consulted by
 *   the label acceptor of the item link rule (createLinkLabelAcceptor)
 * @returns {{
 *     indent: number, ordered: boolean, canOpen: boolean, start: number | null, content: string
 * } | null}
 */
function parseListItem(
	line: string,
	urlProtector: ?UrlProtector = null,
	bbTagProtector: ?BbTagProtector = null,
): ?Object
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
		// Whether this marker may START a list; a bullet always may (see the digit cap above).
		canOpen: !ordered || OPENING_ORDERED_MARKER_PATTERN.test(marker),
		// First item's number seeds <ol start> (CommonMark: later item numbers are ignored).
		start: ordered ? parseInt(marker, 10) : null,
		content: defangListTags(applyCellInlineRules(match[3], { urlProtector, bbTagProtector })),
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
	// The MAX_LIST_ITEMS split (convertLists) hands the next chunk a continuation item, whose
	// number is not capped, so `first` is not always an opening marker. Only carry a start we
	// can round-trip as plain digits: Number.isSafeInteger rejects values >= 2^53 whose String()
	// form is either imprecise or exponential ("1e+21"), which would leak as raw BB (no
	// `start=\d+` regex matches it). Such an absurd start degrades to bare [list=1] rather than
	// breaking the list.
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
 * Whether this item STARTS a list instead of continuing an open one - which is exactly where
 * the opening digit cap has to be paid. Three cases, and buildList splits the output at the
 * same three: nothing is open yet, the item is deeper than every open level, or its marker
 * type differs from the level it lands on (CommonMark: an ordered item cannot extend a bullet
 * list and vice versa, so the type change begins a new list of its own).
 *
 * @param {Array<Object>} openLevels
 * @param {Object} item
 * @returns {boolean}
 */
function startsNewList(openLevels: Array<Object>, item: Object): boolean
{
	const level = openLevels.at(-1);

	return !level || item.indent > level.indent || item.ordered !== level.ordered;
}

/**
 * Close every level the item is too shallow to belong to.
 *
 * @param {Array<Object>} openLevels
 * @param {Object} item
 */
function closeDeeperLevels(openLevels: Array<Object>, item: Object): void
{
	while (openLevels.length > 0 && openLevels.at(-1).indent > item.indent)
	{
		openLevels.pop();
	}
}

/**
 * Put the level this item opens on the stack. A deeper item nests one inside the open levels;
 * a type change replaces the level it happens on, since the list open there has just ended.
 *
 * @param {Array<Object>} openLevels
 * @param {Object} item
 */
function openLevel(openLevels: Array<Object>, item: Object): void
{
	if (openLevels.length > 0 && openLevels.at(-1).indent === item.indent)
	{
		openLevels.pop();
	}

	openLevels.push({ indent: item.indent, ordered: item.ordered });
}

/**
 * Parse one uninterrupted run of list lines. The run is bounded by the text only: item
 * count is capped when the output is built (MAX_LIST_ITEMS in convertLists), so the list
 * stays open here for as long as the user kept writing it.
 *
 * Line by line: an item that only continues an open level is taken as is, while an item that
 * starts a list (startsNewList) is taken only if its marker may open one - otherwise the run
 * ends there and the line stays plain text.
 *
 * @param {string[]} lines
 * @param {number} startIndex
 * @param {?UrlProtector} [urlProtector] - UrlProtector of the current render, forwarded to every
 *   item the run parses
 * @param {?BbTagProtector} [bbTagProtector] - BbTagProtector of the current render, forwarded the
 *   same way
 * @returns {{ items: Array<Object>, endIndex: number } | null}
 */
function tryParseList(
	lines: string[],
	startIndex: number,
	urlProtector: ?UrlProtector = null,
	bbTagProtector: ?BbTagProtector = null,
): ?Object
{
	const items = [];
	// The list levels open at this point, innermost last: indent and marker type of each.
	const openLevels = [];
	let i = startIndex;
	while (i < lines.length)
	{
		const item = parseListItem(lines[i], urlProtector, bbTagProtector);
		if (!item)
		{
			break;
		}

		closeDeeperLevels(openLevels, item);
		if (startsNewList(openLevels, item))
		{
			if (!item.canOpen)
			{
				break;
			}

			openLevel(openLevels, item);
		}

		items.push(item);
		i++;
	}

	if (items.length === 0)
	{
		return null;
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
 * @param {ConvertListsOptions} [options]
 * @param {string} [options.mode] - 'decode' or 'simplify'
 * @param {?UrlProtector} [options.urlProtector] - UrlProtector of the current render, forwarded to
 *   every item; null lets each item protect and restore its own URLs
 * @param {?BbTagProtector} [options.bbTagProtector] - BbTagProtector of the current render,
 *   forwarded the same way
 * @returns {string}
 */
export function convertLists(text: string, options: ConvertListsOptions = {}): string
{
	const { mode = 'decode', urlProtector = null, bbTagProtector = null } = options;

	if (!HAS_LIST_ITEM_PATTERN.test(text))
	{
		return text;
	}

	const lines = text.split('\n');
	const result = [];
	let i = 0;

	while (i < lines.length)
	{
		const list = tryParseList(lines, i, urlProtector, bbTagProtector);
		if (list)
		{
			// One entry per chunk: the entries are joined by '\n' below, so a split run reads
			// as consecutive list blocks, exactly as a run of separate lists would.
			for (let start = 0; start < list.items.length; start += MAX_LIST_ITEMS)
			{
				result.push(formatList(list.items.slice(start, start + MAX_LIST_ITEMS), mode));
			}
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
