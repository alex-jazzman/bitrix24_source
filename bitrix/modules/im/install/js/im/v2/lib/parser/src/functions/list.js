const CLASS_LIST = 'bx-im-message-content-list';
const CLASS_LI = 'bx-im-message-content-list-item';

// Defensive cap on rendered list items per [list], mirroring the table render caps:
// a huge legacy/hand-typed [list] must not materialize thousands of <li> in the feed.
const MAX_LIST_ITEMS = 200;

// Canonical Bitrix list BB-code: [list] / [list=1] with [*] items, optionally
// nested. decodeList runs last in the decode chain; an item's inline content has
// already been turned into HTML by the global font/url/icode decoders, so here we
// only build the <ul>/<ol> structure.
//
// Nesting is resolved innermost-first: this pattern only matches a [list] whose
// body carries no further [list] (negative lookahead), so each pass renders the
// deepest lists to <ul>/<ol> HTML — which makes their parent the innermost list
// on the next pass. The loop repeats until no [list] remains.
//
// Global flag: one decodeList pass rebuilds EVERY innermost list at the current
// depth (siblings included) instead of just the first, so a message with many
// adjacent lists converges in O(depth) passes rather than O(list count) — and
// cannot leave a literal BB-code tail once the 100-pass guard trips. The pattern
// is used only with String.replace (lastIndex is reset by replace), and the loop
// guard uses a separate non-global .test() regex, so there is no shared-state hazard.
const INNERMOST_LIST_PATTERN = /\[(list(?:=1)?(?:\s+start=\d+)?)]((?:(?!\[list)[\s\S])*?)\[\/list]/gi;

export const ParserList = {

	/**
	 * Render canonical [list]/[list=1] BB-code (produced by the Markdown
	 * converter, or arriving as legacy BB-code content) into native HTML lists.
	 *
	 * @param {string} text
	 * @returns {string}
	 */
	decodeList(text: string): string
	{
		if (!/\[list(?:=1)?(?:\s+start=\d+)?]/i.test(text))
		{
			return text;
		}

		let previous = null;
		let guard = 0;
		while (text !== previous && /\[list(?:=1)?(?:\s+start=\d+)?]/i.test(text) && guard < 100)
		{
			previous = text;
			text = text.replace(INNERMOST_LIST_PATTERN, (whole, tag, body) => renderList(tag, body) || whole);
			guard++;
		}

		return text;
	},
};

function renderList(tag: string, body: string): string
{
	const ordered = tag.toLowerCase().startsWith('list=1');

	// Each [*] starts one item (its already-decoded inline/nested-list content runs up to
	// the next [*] or the end). A bounded exec loop stops at MAX_LIST_ITEMS WITHOUT first
	// materializing every segment, so a crafted [list] with thousands of [*] can't turn
	// into a long task / memory spike before the cap is applied.
	const items = [];
	const itemPattern = /\[\*]([\s\S]*?)(?=\[\*]|$)/gi;
	let itemMatch;
	while (items.length < MAX_LIST_ITEMS && (itemMatch = itemPattern.exec(body)) !== null)
	{
		items.push(itemMatch[1].trim());
	}

	if (items.length === 0)
	{
		return '';
	}

	const listItems = items
		.map((item) => `<li class="${CLASS_LI}">${item}</li>`)
		.join('');

	const listTag = ordered ? 'ol' : 'ul';
	const listClass = CLASS_LIST;

	// A start offset ("[list=1 start=N]") renders as <ol start="N"> so a list that begins
	// at, say, 5 shows 5, 6, 7 instead of restarting at 1. A start of 1 needs no attribute.
	let startAttr = '';
	if (ordered)
	{
		const startMatch = tag.match(/start=(\d+)/i);
		const startNum = startMatch ? parseInt(startMatch[1], 10) : 1;
		// Emit for any non-default start, incl. 0 (CommonMark: "0." → <ol start="0">).
		if (startNum !== 1)
		{
			startAttr = ` start="${startNum}"`;
		}
	}

	return `<${listTag} class="${listClass}"${startAttr}>${listItems}</${listTag}>`;
}
