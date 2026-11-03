/**
 * @module im/messenger/lib/parser/markdown/utils/list-tag-protector
 */
jn.define('im/messenger/lib/parser/markdown/utils/list-tag-protector', (require, exports, module) => {
	const { MARKDOWN_PLACEHOLDER_SUFFIX } = require('im/messenger/lib/parser/const');
	const { createMarkdownNonce } = require('im/messenger/lib/parser/markdown/utils/nonce');

	// Structural list tags ([list]/[list=1]/[/list]/[*]) are hidden behind inert placeholders
	// across the inline/html passes, so the '*' in '[*]' is not eaten by the italic rule; restore
	// brings them back afterwards. Item CONTENT stays exposed and picks up normal inline formatting.
	const MARKDOWN_LIST_TAG_PREFIX = '####MDLISTTAG';
	const LIST_TAG_PATTERN = /\[\/?list(?:=1)?(?:\s+start=\d+)?]|\[\*]/gi;
	// The tags an item's content must not carry as working BB-code, as a lookahead so only the bracket is
	// consumed and the tag text is left as the sender wrote it. One policy with a table cell, on the same
	// reading of the native renderer (table-rules.CELL_DEFANG_PATTERN): every tag here is really drawn in an
	// item, and an item is a single-line structure it breaks - the structural tags close the block early or
	// open an item of their own, [code] leaves the block for a Code element of its own
	// (parserQuote.decodeCode) and takes the rest of the line with it, [hr] is a 10000pt tab stop on iOS and
	// inflates the layout, and a sender's own [size=9999] has the same effect.
	// The set differs from the cell's by [img] alone, and this is why: the producer emits [img] into an item
	// itself, from a Markdown `![alt](url)` (a cell runs the inline rules with skipImage, so it has no such
	// route). Nothing else in the set can collide with the producer's own output - its structural tags are
	// still placeholders at both points this runs, and item content never reaches the block rules, where an
	// [h1]/[h2] heading and the interim [size=N][b] of an H3-H6 one are per-line constructs a list line is
	// consumed before. Canonical inline code is [icode], not the interim [color=...][b]. Mention containers
	// ([USER=…], [CHAT=…], [dialog=…], [context=…]) are deliberately absent, exactly as in a cell: all
	// three platforms draw them and an item keeps them working.
	const ITEM_DEFANG_PATTERN = new RegExp(
		'\\[(?=/?(?:list|code|hr|h[12]|table|tr|th|td|size|color)\\b|\\*])',
		'gi',
	);
	// '[' followed by U+200B ZERO WIDTH SPACE, spelled by code point so the guard is not an invisible
	// byte in the source.
	const INERT_BRACKET = `[${String.fromCodePoint(0x200B)}`;

	/**
	 * Neutralize a tag standing in item content that is not this converter's own - one the sender typed,
	 * one an escape or a mention/[code] restore brought back. Inside a [list] block a structural tag is
	 * indistinguishable from the emitted structure, and a block tag breaks the single-line block whatever
	 * it came wrapped in; a zero-width space after the '[' keeps the text readable and the tag inert, the
	 * way the web parser does it for a list item (im/v2 list-rules.defangListTags) and this parser does it
	 * for a table cell (table-rules.defangCellTags). See ITEM_DEFANG_PATTERN for the set.
	 *
	 * @param {string} text
	 * @returns {string}
	 */
	function defangListTags(text)
	{
		return text.replace(ITEM_DEFANG_PATTERN, INERT_BRACKET);
	}

	/**
	 * How a restored structural tag moves the [list] nesting depth. The item marker opens no block.
	 *
	 * @param {string} tag
	 * @returns {number}
	 */
	function toDepthShift(tag)
	{
		if (tag.startsWith('[/'))
		{
			return -1;
		}

		return tag.startsWith('[*') ? 0 : 1;
	}

	/**
	 * @class ListTagProtector
	 */
	class ListTagProtector
	{
		#tags = [];
		#nonce = '';
		#pattern;

		constructor()
		{
			// Per-instance (a fresh protector is built per render): without an unpredictable nonce a
			// sender could type a literal copy of the marker and have a stored structural tag
			// substituted into it on restore, exactly the risk nonce.js describes. The index follows
			// the nonce with no '_' between them (unlike the table token, whose payload is not
			// exposed to the inline pass): a '_' right before a digit would give the italic rule a
			// delimiter to pair with an author's own '_', tearing the marker apart. The nonce is
			// base-36, so the pattern below still parses the index unambiguously.
			this.#nonce = createMarkdownNonce();
			this.#pattern = new RegExp(
				`${MARKDOWN_LIST_TAG_PREFIX}${this.#nonce}(\\d+)${MARKDOWN_PLACEHOLDER_SUFFIX}`,
				'g',
			);
		}

		protect(text)
		{
			this.#tags = [];

			if (!text.includes('[list') && !text.includes('[*]'))
			{
				return text;
			}

			return text.replaceAll(LIST_TAG_PATTERN, (tag) => {
				const index = this.#tags.length;
				this.#tags.push(tag);

				return `${MARKDOWN_LIST_TAG_PREFIX}${this.#nonce}${index}${MARKDOWN_PLACEHOLDER_SUFFIX}`;
			});
		}

		/**
		 * Put the structural tags back, and defang the tags an item must not carry on the way: the
		 * converter restores its protectors before this runs, so what is left between two markers is item
		 * content - the sender's text plus whatever an escape, a mention or a [code] block restored into
		 * it - and a tag of that set there tears the single-line block apart (see defangListTags).
		 * Text outside a block is left alone, code blocks of their own included.
		 *
		 * @param {string} text
		 * @returns {string}
		 */
		restore(text)
		{
			if (this.#tags.length === 0)
			{
				return text;
			}

			const tags = this.#tags;
			let result = '';
			let cursor = 0;
			let depth = 0;

			this.#pattern.lastIndex = 0;
			let marker = this.#pattern.exec(text);
			while (marker)
			{
				const between = text.slice(cursor, marker.index);
				result += depth > 0 ? defangListTags(between) : between;

				// A user-typed literal copy of the marker (or an out-of-range index) has no stored tag -
				// leave it as it is, and let it move no depth either.
				const tag = tags[Number(marker[1])];
				if (tag === undefined)
				{
					result += marker[0];
				}
				else
				{
					result += tag;
					depth = Math.max(0, depth + toDepthShift(tag));
				}

				cursor = marker.index + marker[0].length;
				marker = this.#pattern.exec(text);
			}

			const tail = text.slice(cursor);
			result += depth > 0 ? defangListTags(tail) : tail;
			this.#tags = [];

			return result;
		}
	}

	module.exports = {
		ListTagProtector,
		defangListTags,
	};
});
